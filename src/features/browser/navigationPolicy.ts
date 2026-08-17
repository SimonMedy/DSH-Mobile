import {serverOrigin} from '../servers/serverUrl';

export type NavigationDecision = 'allow' | 'external' | 'block';
export type PopupNavigationDecision = NavigationDecision | 'ignore';

export function decideNavigation(
  serverUrl: string,
  targetUrl: string,
): NavigationDecision {
  if (targetUrl === 'about:blank') {
    return 'allow';
  }

  let target: URL;
  try {
    target = new URL(targetUrl);
  } catch {
    return 'block';
  }

  const trustedOrigin = serverOrigin(serverUrl);
  if (target.protocol === 'blob:') {
    return target.origin === trustedOrigin ? 'allow' : 'block';
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return 'block';
  }

  return target.origin === trustedOrigin ? 'allow' : 'external';
}

export function decidePopupNavigation(
  serverUrl: string,
  targetUrl: string,
): PopupNavigationDecision {
  // Web pages can create an empty popup first and navigate it later. DSH Mobile does
  // not own a second browser window, so replacing the active Harness page with this
  // placeholder would only blank the session.
  if (!targetUrl || targetUrl === 'about:blank') {
    return 'ignore';
  }
  return decideNavigation(serverUrl, targetUrl);
}

export function canOpenExternally(targetUrl: string): boolean {
  try {
    const target = new URL(targetUrl);
    return target.protocol === 'https:' || target.protocol === 'http:';
  } catch {
    return false;
  }
}
