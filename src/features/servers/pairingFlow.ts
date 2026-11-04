import {normalizeServerUrl} from './serverUrl';

/**
 * The token exchange redirects to the exact application root, including the
 * trailing slash of an optional reverse-proxy mount. Do not accept a sibling
 * path, another origin, or any remaining query/fragment as proof of exchange.
 */
export function cleanHarnessRoot(serverUrl: string): string {
  const url = new URL(normalizeServerUrl(serverUrl));
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function isCleanHarnessRoot(
  serverUrl: string,
  candidateUrl: string,
): boolean {
  try {
    return new URL(candidateUrl).href === cleanHarnessRoot(serverUrl);
  } catch {
    return false;
  }
}

export type PairingPhase = 'exchange' | 'verify';
export type PairingLoadDecision = 'ignore' | 'verify' | 'ready';

/**
 * A clean redirect alone is not enough: the WebView must perform a second
 * uncredentialed request to the exact root using the browser cookie before
 * the user can save the profile. HTTP failures separately invalidate pairing.
 */
export function decidePairingLoad(
  phase: PairingPhase,
  serverUrl: string,
  loadedUrl: string,
): PairingLoadDecision {
  if (!isCleanHarnessRoot(serverUrl, loadedUrl)) return 'ignore';
  return phase === 'exchange' ? 'verify' : 'ready';
}
