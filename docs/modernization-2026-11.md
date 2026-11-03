# DSH Mobile — November 2026 compatibility and security plan

Status: working plan, **not** a claim that the app already supports the features below. Review date: 2026-11-03. Repository baseline: `main` at `31e0a9879e0fa870c33ca7f6dd80f27eedd2aa50`.

## Product contract

Keep DSH Mobile an independent, small React Native shell around the unmodified upstream DeepSeek Harness Web UI. Preserve current saved server profiles and their IDs during upgrades. Prefer upstream UI fixes over injected DOM/CSS patches. Keep exact-origin navigation and the no-JavaScript-to-native-bridge boundary. Performance, accessibility, reliability and clear error messages matter as much as feature count.

## Upstream facts reviewed

- Official Web UI documentation: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/README.md
- Browser auth and Host/Origin trust: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/connection/README.md
- Models and provider configuration: https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md
- Upstream remains a developer preview; do not assume stable private APIs.

The current Web profile prints a launch link with `?token=...`. Its root exchanges that token for a signed, authority-bound, HttpOnly browser cookie and redirects to a clean URL. Requests without a valid cookie return 401; failed Host/Origin validation returns 403. The mobile app currently stores only clean server URLs and does not implement this initial exchange. This is a compatibility gap, not permission to bypass server-side authorization.

The official Models settings page now supports model/provider configuration with secrets handled by the server. Some operations remain subject to server role/authority, provider type and version; a mobile wrapper cannot legitimately turn a server-side 403 into success. Workspace selection may vary by upstream release and remote deployment; test real mobile flows rather than assuming the August 2026 limitation is universal.

## Prioritized work and acceptance gates

### P0 — Protect existing users and the release channel

1. Finish reviewing the already-open release-signing security PR #22; avoid duplicating it in this branch. Never distribute a public-key-signed release APK. Before the next release, configure a permanent private signing identity, verify its certificate, and document the `v0.1.0` install migration. Users on the old signer may need a one-time uninstall/reinstall; Android signing continuity cannot be guaranteed after a key change.
2. Verify every release asset is non-debuggable, signed by the intended private key, reproducible enough to identify its source, and accompanied by a checksum. Require successful Android, iOS and quality CI before publication.
3. Keep the old published release available only with clear risk/migration guidance until its distribution policy is explicitly decided; do not silently replace published binaries.
4. No secrets, full launch links, API keys or session cookies in AsyncStorage, logs, analytics, crash breadcrumbs, or screenshots intentionally captured by the app.

### P1 — Compatible and intuitive login / connection

1. Introduce an explicitly temporary launch-link pairing flow. `parseHarnessLaunchLink` is the first pure parser and regression test, **not yet hooked up to the UI**. Require HTTPS for remote public launches and allow explicitly trusted private/local HTTP endpoints. Treat the full link as a bearer secret in memory; persist only the normalized non-secret server address.
2. WebView must load the original temporary URL for the authorized same-origin root exchange, follow the clean redirect, preserve the server cookie in platform site data, and then discard the temporary URL from React state/history on exit. Never accept arbitrary external redirects as trusted WebView navigation. Test expired/reused tokens, 401, 403, wrong authority, prefix proxy, restart, and offline/reconnect.
3. Display separate actionable messages for: unreachable host, TLS error, 401 unauthenticated, 403 untrusted Host/Origin or forbidden operation, and server version mismatch. Do not expose private paths/credentials in error text.
4. Add an explicit user-triggered **Clear browser sessions / site data** control with platform-appropriate tests. Do not equate AsyncStorage reset with cookie logout.

### P1 — Restore functionality without bypassing upstream boundaries

1. Test Settings → Models, changing API key, provider selection and model picker against a current Harness Web profile after authenticating. Record precise upstream version, client build, platform, request status and reproduction steps.
2. Test workspace chooser, host file dialogs, streaming, WebSocket reconnect, external links, downloads, software keyboard, rotation, safe areas, and Cloudflare/Tailscale reverse proxies.
3. Keep server-side permissions enforced. For host-local-only functionality, present an honest explanatory state and link to the official upstream workaround instead of shadow APIs or injected code.

### P2 — Runtime and maintainability

1. Upgrade React Native, WebView, navigation and native dependencies in isolated compatibility batches; do not merge a failing Dependabot update. Require clean installation, lint, typecheck, Jest, Android build, iOS build and device-level WebView E2E for changed flows.
2. Remove insecure random UUID fallback, type WebView refs, tighten session cleanup and lifecycle memory handling, and check WebView cache/performance behavior after upgrading.
3. Update `docs/known-limitations.md` only after each restriction has been validated against a pinned upstream release. Add a supported-version matrix in release notes rather than making evergreen claims.
4. Add an opt-in diagnostics screen without logging token-bearing URLs; keep default telemetry minimal.

### P3 — Optional enhancements after P0/P1

QR/deep-link pairing, richer download flows, background notifications and Superagent-related status are candidates, not commitments. No unattended agent access to the user's Harness is added to the mobile app by default.

## Test matrix before shipping

| Scenario | Android | iOS | Expected |
| --- | --- | --- | --- |
| Existing v0.1.0 local profiles migrate | Required | Required | No profile loss |
| HTTPS launch-token first sign-in and clean redirect | Required | Required | No token persisted |
| Reopen and expire session | Required | Required | Re-pair guidance |
| Invalid token / 401 | Required | Required | Clear retry/pairing action |
| Host/Origin mismatch / 403 | Required | Required | No unsafe fallback |
| Settings and Models management | Required | Required | Upstream-permitted operations work |
| Workspace selection and session streaming | Required | Required | No broken navigation/WebSocket |
| Cloudflare/Tailscale HTTPS proxy | Required | Required | Secure connection, no bypass |
| External link, file download, keyboard, background/restore | Required | Required | Predictable native behavior |
| APK signature / upgrade from 0.1.0 | Required | N/A | Migration instructions match reality |

## Delivery policy

Use work branches and reviewable PRs. Reuse PR #22 as the release-hardening dependency. Never merge, publish a release, alter GitHub secrets or delete published artifacts without explicit user authorization. This document is a work plan: any untested runtime behavior must remain marked unverified until CI plus device testing prove it.
