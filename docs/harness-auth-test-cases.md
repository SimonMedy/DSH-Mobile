# Harness Web authentication: mobile acceptance tests

Reviewed on 2026-11-03. This is a test plan, **not** proof of mobile compatibility.

## Upstream contract

The [official Web app documentation](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/README.md) describes a `?token=...` launch URL exchanged at the application root for an HttpOnly browser cookie, then a redirect to a clean URL. The server enforces session authentication and Host/Origin validation. A token-bearing URL is a credential: never log, persist or share it.

## Required validation on Android and iOS

- Fresh HTTPS token: load the allowed root, establish the session and follow the clean redirect without persisting the token.
- Existing v0.1.0 server profile: retain its ID, name, URL and prior settings.
- Missing or expired session (401): offer a safe re-pairing path without bypassing authentication.
- Rejected Host/Origin (403): explain the server-side fix, never disable trust checks.
- Invalid or reused token: fail safely and erase the temporary URL from client state.
- Cross-origin redirect: never load an untrusted destination in the privileged WebView.
- Cloudflare Tunnel and Tailscale: confirm HTTPS, trusted hostnames, cookies and WebSocket streaming.
- Background and restart: respect session expiration, allow explicit logout/site-data clearing.
- Models, Settings and workspaces: test actions authorized by the server without using private native bridges.
- Repeated changing localhost ports: check for cookie accumulation and HTTP 431 without silently erasing unrelated sessions.

A [desktop-client upstream report](https://github.com/deepseek-ai/deepseek-harness/discussions/11758) describes potential HTTP 431 from accumulated `dsh-auth-*` cookies. It has **not** been reproduced in DSH Mobile.

## Record evidence

For every tested Harness release, record its exact version, the DSH Mobile build, Android/iOS version, deployment type, HTTP status, WebSocket behavior, and redacted screenshots. Do not collect full launch links, tokens, cookies or private server addresses in public reports.
