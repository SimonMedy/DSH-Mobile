# Release checklist

## Dependency / supply chain

- [ ] `package-lock.json` is committed and generated from a clean install
- [ ] declared dependencies pass `npm run deps:verify`
- [ ] dependency licenses/security advisories reviewed
- [ ] React Native/native package compatibility matrices reviewed

## Automated

- [ ] format check
- [ ] lint
- [ ] TypeScript strict check
- [ ] unit tests
- [ ] Android debug build
- [ ] Android release build
- [ ] iOS build on supported macOS runner

## Manual mobile smoke

- [ ] add/edit/delete multiple servers
- [ ] unsaved editor changes prompt before leaving
- [ ] public HTTP endpoint requires explicit second confirmation
- [ ] default-server invariant
- [ ] launch-default behavior
- [ ] Tailscale/MagicDNS server
- [ ] HTTPS reverse proxy
- [ ] same-origin navigation remains in WebView
- [ ] same-origin `target=_blank` / `window.open` stays safely in-app
- [ ] external HTTP(S), including popup targets, opens system browser
- [ ] `about:blank` popup placeholders do not replace the active DSH page
- [ ] blocked dangerous schemes do not navigate
- [ ] DSH streaming response
- [ ] DSH WebSocket/long-lived communication
- [ ] approval/user-question surfaces
- [ ] file input from Files/gallery
- [ ] download behavior
- [ ] copy/paste
- [ ] keyboard + safe areas
- [ ] Android hardware back
- [ ] network interruption + reconnect
- [ ] app background/resume
- [ ] cookies/session persistence
- [ ] light/dark/system themes
- [ ] reset-local-data flow requires confirmation and leaves Harness servers untouched

## Store/security review

- [ ] iOS ATS WebView exception justification reviewed for App Store submission
- [ ] Android cleartext capability and HTTP warnings reviewed
- [ ] privacy manifest matches actual shipped behavior
- [ ] release signing credentials are external to the repository
- [ ] unofficial/community positioning is visible in store metadata and About screen
