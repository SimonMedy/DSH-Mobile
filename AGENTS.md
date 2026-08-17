# AGENTS.md — DSH Mobile engineering contract

This file defines non-negotiable rules for humans and coding agents working in this repository.

## Product boundary

DSH Mobile is an **unofficial community client** for the official DeepSeek Harness Web UI.

- Do not fork, patch, bundle, or silently modify DeepSeek Harness.
- Do not reimplement working DSH UI in React Native without a documented product reason.
- Do not depend on private DSH DOM structure, CSS selectors, or undocumented RPC endpoints.
- Do not inject JavaScript into Harness pages unless an explicit design/security review approves it.
- A vanilla upstream `dsh web` instance must remain usable without a DSH Mobile plugin.

## Security invariants

- Never disable TLS/certificate verification.
- Never accept `file:`, `data:`, `javascript:`, or arbitrary custom schemes in the WebView. Keep the native WebView `originWhitelist` broad enough that every navigation reaches our explicit policy callback instead of falling through to the library's automatic `Linking` behavior.
- Keep trusted in-app navigation scoped to the configured server **origin**. Same-origin `blob:` URLs may be allowed for browser-native content/download flows.
- Open ordinary external HTTP(S) links in the system browser.
- Do not expose a native `onMessage` bridge to arbitrary WebView content.
- Do not store passwords, API keys, cookies, access tokens, or private keys in AsyncStorage.
- Server profiles may contain only non-secret connection metadata.
- Do not enable Android backups for app state by default.
- Do not add broad native permissions without a concrete feature and security justification.
- Treat cleartext HTTP as safe only in contexts where the user intentionally relies on a trusted local/private network.

## Dependency policy

- Production dependencies are pinned to exact versions.
- Use stable releases only. No RC, beta, preview, nightly, canary, or `next` tag in mainline code without a documented RFC.
- “Newest” means newest **stable compatible set**, not the largest version number in isolation.
- Before upgrading React Native, validate NativeWind, Reanimated/Worklets, WebView, navigation, Android, and iOS compatibility together.
- New dependencies require a clear reason, active maintenance, acceptable license, and a smaller-alternative check.

## Architecture

Feature code lives under `src/features/<feature>`. Shared components/utilities live under `src/shared`. App-wide state and theme live under `src/app`.

Keep pure logic outside React components when possible. URL parsing, navigation policy, migrations, reducers, and connection logic should remain directly unit-testable.

Avoid global mutable state except for narrowly scoped serialization helpers (for example persistence write ordering).

## React / TypeScript

- TypeScript strict mode is required.
- Avoid `any`; use `unknown` and narrow it.
- Prefer small named components and pure functions over large screens with hidden behavior.
- Keep effects idempotent and unsubscribe listeners on cleanup.
- Never suppress hook dependency warnings to “make it work”.
- Treat errors explicitly; do not use empty `catch` blocks for security- or persistence-relevant operations.
- Favor accessibility labels/roles for interactive controls.

## UI principles

- DSH Mobile should feel visually related to upstream Harness, using its public design language as inspiration, while remaining clearly unofficial.
- Do not copy trademark assets or imply endorsement.
- Prefer calm hierarchy, generous spacing, restrained animation, and obvious recovery actions.
- Dark and light modes must both remain usable.
- Avoid browser chrome: the WebView is a dedicated Harness surface, not a general browser.

## Required checks before merge

Run the complete repository gate:

```sh
npm run check
```

This includes dependency-policy verification, native/project consistency checks, formatting, linting, full TypeScript typechecking, and unit tests.

For changes touching platform/native integration, also build the affected platform(s). For WebView/security changes, manually test navigation to same-origin, external HTTPS, blocked schemes, offline recovery, file input, and session persistence.

## Review checklist

A change should answer “yes” to all applicable questions:

1. Is the behavior necessary in the mobile shell rather than already provided by DSH?
2. Is the code in the narrowest appropriate feature/shared layer?
3. Are error and offline states explicit?
4. Is there a test for pure logic or a documented reason why not?
5. Does this preserve the WebView origin boundary?
6. Does this avoid storing secrets?
7. Does it work in both light and dark themes?
8. Does Android behavior remain correct, and has iOS impact been considered?
9. Has dependency/API usage been checked against stable upstream documentation?
