# Known limitations — v0.1

DSH Mobile intentionally keeps the native shell small and hardened. These limitations reflect upstream DeepSeek Harness security boundaries and platform properties.

## Upstream Gated Settings & File Picker

By design, upstream DeepSeek Harness gates privileged methods (`PRIVILEGED_METHODS`) strictly to loopback (`127.0.0.1` / `localhost`) to defend against unauthenticated remote secret inspection and unauthorized system changes:

- **Settings & API Keys (`settings.describe`, `credentials.*`):** Opening the Settings modal from a remote connection returns `HTTP 403` by design because DeepSeek Harness does not yet include a user login/password system. Configure your model API keys once on the host machine at `http://localhost:3080`.
- **Directory Picker (`host.pickDirectory`):** The "Choose workspace" native folder picker opens the host operating system's file explorer dialog on the host PC. Open or select your workspace on the host machine first (or start DSH within your project directory); it will then appear in the workspace list in DSH Mobile.

All conversation sessions, agent executions, model interactions, and workspace tasks run without restriction from DSH Mobile.

## Upstream mobile layout

The main application surface is the official DeepSeek Harness Web UI. If an upstream DSH screen is not responsive on a given phone size, DSH Mobile will not patch its DOM or CSS to compensate. Compatibility fixes stay at the browser/platform boundary.

## Downloads

Android WebView provides native download handling for normal downloadable responses. On iOS, `react-native-webview` notifies the app about downloads but leaves the actual downloader implementation to the host application. The v0.1 shell currently delegates an iOS download URL to the system rather than introducing a credential-aware native download stack.

## Cleartext HTTP

HTTP is supported for explicitly configured local/private deployments because Tailscale/LAN users may intentionally run DSH without TLS inside a trusted network. Public HTTP triggers a high-visibility warning and explicit confirmation. HTTPS remains the recommended default.

## No background service

There is no push-notification service, background polling daemon, DSH companion plugin, or project-operated relay in v0.1. The app only communicates with servers the user configures.

## No QR pairing yet

QR/deep-link server import is a planned convenience feature. Manual server configuration remains the v0.1 path.
