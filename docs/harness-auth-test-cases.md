# Harness Web authentication: mobile compatibility cases

Reviewed on 2026-11-03. This is a test specification, **not** a claim that these scenarios already pass in DSH Mobile.

## Verified upstream contract

The [official Web profile documentation](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/README.md) describes a root launch URL with `?token=...`, a signed browser cookie, and a redirect to the clean server URL. The server enforces session authentication on its API and WebSocket connections, as well as Host/Origin trust for remote deployments. Treat both the launch URL and its token as bearer credentials until exchanged; do not persist or log them.

## Required mobile tests before enabling pairing

| Scenario | Expected client behavior |
| --- | --- |
| Fresh HTTPS launch link | WebView exchanges token at the allowed root, preserves the HttpOnly session cookie and navigates to the clean URL |
| Previously saved v0.1.0 profile | No profile data or ID lost; ordinary URL continues to work with already authorized sessions |
| Missing or expired cookie | Explain 401 and offer secure re-pairing, without injecting or overriding a session |
| Invalid Host/Origin trust | Explain 403 and show server-side configuration guidance; never suppress the validation |
| Invalid or reused token | No secret logging; clear retry guidance; no persistent token state |
| Redirect outside configured origin | Do not follow an external URL inside the trusted WebView |
| Cloudflare Tunnel and Tailscale | HTTPS reverse proxy with a trusted advertised hostname, correct cookie and WebSocket behavior |
| Background, process restart and logout | Session remains subject to server expiry; explicit user action can clear site data |
| Settings, Models and workspace chooser | Authorized upstream flows work without undocumented native bridges |
| Repeated launches with changing localhost ports | Watch for cookie accumulation and HTTP 431; do not automatically erase unrelated users' sessions |

Upstream user reports describe a potential HTTP 431 caused by many `dsh-auth-*` cookies when a desktop client repeatedly launches against changing `127.0.0.1` ports. This is not yet reproduced on DSH Mobile and must not be presented as an app bug without tests. See the [upstream report](https://github.com/deepseek-ai/deepseek-harness/discussions/11758).

## Device verification record

For every supported Harness release tested, record its exact version/commit, DSH Mobile build, Android/iOS platform version, deployment URL class (never secret URLs), HTTP status, WebSocket reconnection result, steps and screenshots with tokens removed. Run these tests on both platforms before publishing an app release that advertises pairing compatibility.
