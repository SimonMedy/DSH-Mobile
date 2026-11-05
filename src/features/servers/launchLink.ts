import {classifyEndpointSecurity, normalizeServerUrl} from './serverUrl';

/**
 * Parse a DSH Web startup link without persisting its process credential.
 * The launch URL is sensitive: keep it in memory only, never log or store it.
 */
export function parseHarnessLaunchLink(input: string): {
  serverUrl: string;
  launchUrl: string;
} {
  const value = input.trim();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Enter a complete DSH Web launch link.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The launch link must use HTTPS or HTTP.');
  }
  if (url.username || url.password || url.hash) {
    throw new Error('The launch link contains unsupported URL components.');
  }
  // The upstream exchange is a GET of the application root, including the
  // trailing slash of any reverse-proxy mount prefix.
  if (!url.pathname.endsWith('/')) {
    throw new Error('Use the DSH Web root launch link.');
  }
  if (
    [...url.searchParams.keys()].length !== 1 ||
    !url.searchParams.has('token') ||
    url.searchParams.getAll('token').length !== 1
  ) {
    throw new Error('Use a DSH Web launch link containing only one token.');
  }
  const token = url.searchParams.get('token');
  if (!token || token.length > 4096 || /\s/.test(token)) {
    throw new Error('The DSH Web launch token is invalid.');
  }
  const launchUrl = url.toString();
  url.search = '';
  const serverUrl = normalizeServerUrl(url.toString());
  if (classifyEndpointSecurity(serverUrl).kind === 'public-http') {
    throw new Error('A remote launch token requires HTTPS.');
  }
  return {serverUrl, launchUrl};
}
