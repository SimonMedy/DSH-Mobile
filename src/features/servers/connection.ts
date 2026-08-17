import {Platform} from 'react-native';
import type {ConnectionCheckResult} from './types';
import {normalizeServerUrl} from './serverUrl';

const DEFAULT_TIMEOUT_MS = 6000;
type FetchLike = typeof fetch;
type SupportedPlatform = 'android' | 'ios' | 'windows' | 'macos' | 'web';

export function canPreflightConnection(
  rawUrl: string,
  platform: SupportedPlatform = Platform.OS as SupportedPlatform,
): boolean {
  const url = new URL(normalizeServerUrl(rawUrl));
  // iOS App Transport Security intentionally remains strict for native networking.
  // WKWebView may still load a consciously configured cleartext endpoint; see docs/security.md.
  return !(platform === 'ios' && url.protocol === 'http:');
}

export async function checkServerConnection(
  rawUrl: string,
  options: {
    timeoutMs?: number;
    fetchImpl?: FetchLike;
    platform?: SupportedPlatform;
  } = {},
): Promise<ConnectionCheckResult> {
  const url = normalizeServerUrl(rawUrl);
  const platform = options.platform ?? (Platform.OS as SupportedPlatform);
  const checkedAt = new Date().toISOString();

  if (!canPreflightConnection(url, platform)) {
    return {
      reachable: false,
      skipped: true,
      checkedAt,
      latencyMs: 0,
      error:
        'Native HTTP preflight is intentionally unavailable on iOS. Open the server to verify this cleartext endpoint in the WebView.',
    };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const startedAt = Date.now();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      credentials: 'omit',
      signal: controller.signal,
      headers: {Accept: 'text/html,application/xhtml+xml'},
    });

    // Any HTTP response proves network reachability. A reverse proxy may validly return 401/403.
    return {
      reachable: true,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      httpStatus: response.status,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Connection failed';
    return {
      reachable: false,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      error: controller.signal.aborted ? 'Connection timed out.' : message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
