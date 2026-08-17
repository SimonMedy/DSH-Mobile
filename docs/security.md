# Security design notes

## Server URL handling

Only HTTP and HTTPS base URLs are accepted. Embedded credentials, query parameters, and URL fragments are rejected from server profiles. This keeps profiles non-secret and avoids ambiguous origin/path semantics.

## HTTP classifications

- **HTTPS:** recommended for every remote deployment.
- **Loopback HTTP:** useful for development.
- **Private HTTP:** allowed with a visible warning; appropriate only when the user intentionally relies on a trusted private layer such as Tailscale, WireGuard, or a trusted LAN.
- **Public remote HTTP:** high-visibility warning plus a second explicit destructive confirmation before the profile can be saved; users should configure HTTPS or a private access layer first.

The app never disables TLS certificate validation.

## Platform cleartext policy

Supporting user-operated DSH instances means the WebView must be able to open a consciously configured private `http://` endpoint.

### Android

The Android manifest permits cleartext WebView traffic because network-security XML cannot enumerate arbitrary user-entered private hosts. This is an OS capability, **not** an automatic trust decision: the app still accepts only explicit HTTP/HTTPS server profiles, classifies cleartext endpoints, warns the user, and restricts in-app web navigation to the configured origin.

`WRITE_EXTERNAL_STORAGE` is declared only through Android 9 (`maxSdkVersion=28`) to support the WebView download manager on legacy supported devices. Newer Android versions do not receive that storage permission.

### iOS

`NSAllowsArbitraryLoads` remains disabled. `NSAllowsArbitraryLoadsInWebContent` is enabled so WKWebView can open a user-selected private HTTP server, while native networking remains subject to App Transport Security. `NSAllowsLocalNetworking` is also enabled for local/private server access.

Because Apple may require justification for App Transport Security exceptions, this setting must be reviewed again before App Store submission. The reason is narrowly scoped to user-configured, self-hosted Harness Web endpoints; DSH Mobile never bypasses certificate validation for HTTPS.

Native connection preflight intentionally skips cleartext HTTP on iOS. Opening the configured WebView is the authoritative reachability test for that case.

## WebView trust boundary

- the exact configured server **origin** remains in-app;
- external HTTP(S) destinations open in the system browser;
- `javascript:`, `file:`, `data:`, `intent:`, and arbitrary custom schemes are blocked;
- file/universal file URL access is disabled;
- mixed-content mode is `never`;
- third-party cookies are disabled;
- no JavaScript/native `onMessage` bridge is exposed;
- no DOM/CSS injection is used;
- popup / `target="_blank"` navigation is intercepted instead of disabling Android multi-window support: same-origin DSH destinations are kept in-app, external HTTP(S) destinations go to the system browser, and unsupported schemes are dropped;
- WebView debugging is enabled only in development builds (`__DEV__`) and disabled in production bundles;
- no TLS bypass exists.

Keeping the origin as the boundary (rather than a fragile DOM or route allowlist) allows normal DSH navigation, WebSockets, streaming, and reverse-proxy paths without coupling the mobile client to private Harness internals.

## Authentication redirects

A reverse proxy that redirects authentication to a different web origin will be opened in the system browser by the current security policy. Cross-origin in-WebView authentication is intentionally not enabled by default. If a future SSO flow requires it, it should use an explicit, user-visible allowlist and receive a dedicated security review.

## Persistence

AsyncStorage contains server names/URLs, non-secret status timestamps, and app preferences only. It is not approved for passwords, access tokens, cookies, API keys, or private keys.

App-state writes are serialized. If stored state is invalid or local storage cannot be read, DSH Mobile does not silently overwrite it; persistence is disabled for that session and the user is shown an error.

## Native backups

Android application backups and device-to-device transfer of application data are disabled by default. iOS storage behavior should be reviewed before any future feature starts persisting sensitive material; the current design deliberately avoids secrets in app-owned storage.

## Corrupt local state

If the versioned local snapshot cannot be parsed safely, DSH Mobile leaves it untouched and disables further persistence rather than silently overwriting it. The server-list recovery banner offers an explicit destructive reset; the user must confirm before local profiles/preferences are removed.

## WebView routing vs trust

The WebView's native `originWhitelist` is intentionally set to `['*']` so that the library does not automatically dispatch rejected custom schemes to the operating system. This does **not** make arbitrary origins trusted. DSH Mobile's own `decideNavigation` policy is the trust boundary and runs for every top-level navigation.

## Native build supply chain

The Android Gradle wrapper bootstrap is pinned to Gradle 9.3.1 and verifies the wrapper JAR against Gradle's published SHA-256 before moving it into place. The Gradle distribution URL is also pinned with the official `distributionSha256Sum`. A checksum mismatch fails closed; the bootstrap does not keep or execute the downloaded file.

JavaScript dependencies are pinned to exact, non-prerelease versions. A committed npm lockfile is required before a public release, and CI must use that lockfile for reproducible dependency resolution.
