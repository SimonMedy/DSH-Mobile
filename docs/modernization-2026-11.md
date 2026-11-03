# DSH Mobile — November 2026 compatibility and security plan

Status: working plan, not a claim that the app already supports every feature below.

Review date: 2026-11-03. Repository baseline: `main` at `31e0a9879e0fa870c33ca7f6dd80f27eedd2aa50`.

## Product contract

Keep DSH Mobile a small React Native shell around the unmodified upstream DeepSeek Harness Web UI. Preserve existing server profiles and IDs. Prefer upstream UI fixes over injected DOM or CSS patches. Preserve exact-origin navigation, the absence of a JavaScript-to-native bridge, and minimal telemetry. Reliability, performance, accessibility and clear errors are first-class requirements.

## Upstream sources and findings

- [Official Web app](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/README.md)
- [Browser authentication and trust](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/connection/README.md)
- [Model and provider configuration](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md)

The current Web profile prints a launch link containing `?token=...`. A request to the Web root exchanges that process credential for a signed, authority-bound, HttpOnly session cookie and redirects to a clean URL. Missing or invalid authentication can yield 401; invalid Host or Origin trust yields 403. DSH Mobile currently stores clean server URLs and lacks an initial pairing flow. Never bypass these server-side protections.

The official Models settings page supports providers, model selection and server-managed credentials. Whether a particular operation works remotely depends on the upstream version, provider and security policy. Test the real mobile flow instead of assuming that the August 2026 restrictions are still universal.

## P0 — Release safety and existing users

1. Review and finish the separate release-signing PR #22 before publishing any new APK. Never distribute a release signed with the public debug keystore.
2. Configure a permanent private Android signing key outside the repository. Verify the release certificate, non-debuggable APK and checksums. Do not commit secrets.
3. Document how installations of `v0.1.0` move to the private key. A one-time uninstall and reinstall may be necessary due to Android signature incompatibility.
4. Require successful quality, Android and iOS CI before releasing. Do not silently overwrite or remove previously published artifacts.

## P1 — Secure, intuitive connection

1. Add temporary startup-link pairing. The pure `parseHarnessLaunchLink` helper and its regression tests are only a first step; the UI does **not** use them yet.
2. Accept a DSH Web launch link only for its expected root token exchange. Never store or log a full launch URL, bearer token or session cookie in AsyncStorage, analytics, crash reports or persistent logs. Persist only the normalized server endpoint.
3. Load the temporary link in the same-origin WebView, follow the clean redirect, let the platform retain its HttpOnly cookie, and discard the temporary link from app state as soon as practical. Do not trust external redirects in WebView.
4. Test expired/reused tokens, 401 authentication failures, 403 Host/Origin rejection, remote HTTPS proxies, reconnects and process restarts.
5. Provide a user-triggered **Clear browser sessions and website data** action on both platforms. AsyncStorage reset alone is not WebView logout.
6. Explain TLS, offline, authentication and permission failures separately with actionable messages that never reveal secrets.

## P1 — Settings, models and workspaces

1. After successful authentication, exercise Settings → Models, adding providers, API-key changes and model selection on Android and iOS.
2. Check workspace selection, remote directory chooser, streams, WebSocket reconnect, external links, downloads, keyboard focus, safe areas, rotation and app background/restore.
3. Test local, Tailscale and Cloudflare Tunnel HTTPS deployments. Do not defeat access controls, CORS, Host/Origin validation or certificate checks to make a screen appear to work.
4. For any upstream host-only operation, show a clear limitation rather than using undocumented private APIs. Record the exact Harness version and reproduction steps.

## P2 — Maintenance, performance and quality

1. Upgrade React Native, WebView and native dependencies in separate compatible batches, not one speculative major upgrade. Require clean install, lint, types, unit tests, Android build, iOS build and device E2E for affected UI flows.
2. Eliminate weak UUID randomness, type the WebView ref, and measure cold start, memory, WebView navigation and reconnect behavior before and after changes.
3. Update `docs/known-limitations.md` and published compatibility notes only after validating a specific upstream release. Do not assert that every recent Harness version behaves identically.
4. Keep telemetry minimal and opt-in where possible; redact token-bearing URLs from diagnostic output.

## P3 — Optional UX work

Consider QR/deep-link pairing, improved downloads, background notifications and Superagent status only after secure basic login and browsing work. Never grant an unattended agent access to a user's Harness by default.

## Release acceptance matrix

Every affected flow needs testing on Android and iOS unless explicitly platform-specific:

- Existing v0.1.0 server profiles survive the app update without losing configuration.
- HTTPS token pairing redirects to the clean URL without storing the token.
- Missing/expired credentials result in safe re-pairing guidance.
- A 403 never triggers an unsafe Host/Origin bypass.
- Models, settings, workspace chooser and session streaming work when permitted by Harness.
- Reverse proxies, back navigation, external links, downloads, keyboard and resume behave predictably.
- Android APK identity is verified against the intended protected release certificate, with a documented migration path from v0.1.0.

## Delivery policy

Use work branches and reviewable PRs. Treat PR #22 as the separate release-security prerequisite. No merges, releases, secret management or deletion of published assets without explicit owner authorization. Mark untested runtime behavior as unverified until CI and device validation are complete.
