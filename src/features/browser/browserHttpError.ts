import {normalizeServerUrl} from '../servers/serverUrl';

/** Only treat failures on the configured Web root as document errors.
 * A subresource or a model-provider API may legitimately return its own 401.
 */
export function browserDocumentError(
  serverUrl: string,
  requestUrl: string,
  statusCode: number,
): string | undefined {
  try {
    const root = `${normalizeServerUrl(serverUrl).replace(/\/+$/, '')}/`;
    if (new URL(requestUrl).href !== root) return undefined;
  } catch {
    return undefined;
  }

  if (statusCode === 401) {
    return 'This Harness session is not authorized. Open a fresh launch link from your server to sign in again.';
  }
  if (statusCode === 403) {
    return 'Harness rejected this hostname or origin. Check the server trusted-host and reverse-proxy settings.';
  }
  if (statusCode === 431) {
    return 'Harness rejected the browser request headers. Clearing this server session may help; check the server setup.';
  }
  if (statusCode >= 400 && statusCode <= 599) {
    return `The server returned HTTP ${statusCode}. Check the server and retry.`;
  }
  return undefined;
}
