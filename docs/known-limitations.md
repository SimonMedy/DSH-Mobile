# Known limitations — v0.1

DSH Mobile intentionally keeps the native shell small. These limitations are explicit rather than hidden behind DSH-private integrations.

## Upstream mobile layout

The main application surface is the official DeepSeek Harness Web UI. If an upstream DSH screen is not responsive on a given phone size, DSH Mobile will not patch its DOM or CSS to compensate. Compatibility fixes should stay at the browser/platform boundary whenever possible.

## Downloads

Android WebView provides native download handling for normal downloadable responses. On iOS, `react-native-webview` notifies the app about downloads but leaves the actual downloader implementation to the host application. The v0.1 shell currently delegates an iOS download URL to the system rather than introducing a credential-aware native download stack. Downloads that require WebView-only cookies may therefore need follow-up work after device testing.

## Cleartext HTTP

HTTP is supported for explicitly configured local/private deployments because Tailscale/LAN users may intentionally run DSH without TLS inside a trusted network. Public HTTP triggers a high-visibility warning and explicit confirmation. HTTPS remains the recommended default.

## No background service

There is no push-notification service, background polling daemon, DSH companion plugin, or project-operated relay in v0.1. The app only communicates with servers the user configures.

## No QR pairing yet

QR/deep-link server import is a planned convenience feature. Manual server configuration remains the v0.1 path.
