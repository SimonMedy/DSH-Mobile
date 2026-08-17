# Architecture

## Boundaries

DSH Mobile owns only the mobile shell: server profiles, app preferences, navigation, connection UX, WebView policy, and mobile-native integration.

DeepSeek Harness owns agents, sessions, models, plugins, tools, workspaces, shell/filesystem behavior, permissions, and the official Harness UI.

## Layers

- `src/app`: versioned application state, persistence coordination, theme.
- `src/navigation`: route contract and root native stack.
- `src/features/servers`: server domain, connection checks, profile editor/list.
- `src/features/browser`: hardened WebView and navigation security policy.
- `src/features/settings`: app-only preferences and About information.
- `src/shared`: reusable presentational components and pure utilities.

## State

The app uses a reducer + context rather than an external global-state dependency. The state surface is small, deterministic, serializable, and easy to migrate.

AsyncStorage writes are serialized to prevent an older async write from overtaking a newer state snapshot. Network reachability is transient: online/offline/checking state is not restored after an app restart; only useful history such as the last successful connection timestamp persists.

## WebView trust boundary

The configured DSH origin is the only web origin allowed to remain inside the WebView. Other ordinary HTTP(S) origins are delegated to the system browser; dangerous/custom schemes are blocked. Same-origin `blob:` URLs are the narrow exception for browser-native content/download flows.

No JavaScript message bridge is exposed. No DOM/CSS selectors or private DSH APIs are required. New-window requests are routed through the same origin policy instead of creating a second embedded browser surface.

### Why the native `originWhitelist` is intentionally broad

`react-native-webview` handles URLs that fail its `originWhitelist` before the app's `onShouldStartLoadWithRequest` callback and may delegate them to React Native `Linking`. DSH Mobile therefore uses `originWhitelist={['*']}` as a routing mechanism, **not** as its trust decision. Every top-level navigation reaches `decideNavigation`, which allows only the configured HTTP(S) origin plus same-origin `blob:` URLs, opens other HTTP(S) URLs externally, and blocks all other schemes.
