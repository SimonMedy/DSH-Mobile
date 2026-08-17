# DSH Mobile

A focused, unofficial community mobile client for the official **DeepSeek Harness** Web UI.

DSH Mobile does not run Harness on your phone. It manages connections to user-operated remote DSH servers and displays the official Web UI inside a hardened mobile WebView.

> **Status:** early v0.1 development. Android is the primary target; iOS shares the same React Native codebase.

## Architecture

```text
Remote machine
  DeepSeek Harness (`dsh web`)
          │
          │ secure/private access
          │ (Tailscale recommended, optional)
          ▼
DSH Mobile
  React Native server manager
          │
          ▼
  react-native-webview
          │
          ▼
  official DSH Web UI
```

No Harness fork. No mobile recreation of the conversation UI. No mandatory DSH plugin.

## Current v0.1 surface

- multiple named server profiles;
- protocol / host / port / optional reverse-proxy path editor;
- default server plus configurable launch behavior;
- connection tests, online/offline state, and last-connected history;
- unsaved-edit protection and explicit confirmation for unencrypted public HTTP endpoints;
- dedicated Harness WebView with same-origin isolation;
- hardened popup / external-link routing to the system browser;
- clean offline/retry/edit recovery UI;
- local persistence with a versioned schema, legacy migration, and explicit corruption recovery;
- system/light/dark theme plus a small native Settings/About surface;
- explicit local-data reset that never touches remote Harness data;
- DSH-inspired design tokens and restrained native shell UI;
- Android hardware-back behavior;
- public-repo engineering/security rules in `AGENTS.md` and `SECURITY.md`;
- Android and iOS native project foundations from the same React Native codebase.

## Upstream

- DeepSeek Harness: https://deepseek.com/harness/en/
- Source: https://github.com/deepseek-ai/deepseek-harness

DeepSeek Harness is a separate upstream project. DSH Mobile is not affiliated with or endorsed by DeepSeek.

## Toolchain policy

The repository pins an all-stable, mutually compatible dependency set. See `docs/dependency-policy.md` for the exact rationale and upgrade gates.

## Development

### Quick Start (Docker / Make — Recommended)

No manual Android SDK or Java installation required:

```sh
# Run the complete test & quality check suite
make check      # or: docker compose run --rm check

# Build the Android Debug APK (saved to ./dist/dsh-mobile-debug.apk)
make build      # or: docker compose run --rm build-apk

# Start the Metro development server
make dev        # or: docker compose up dev
```

### Local Toolchain

Prerequisites use the pinned production LTS toolchain: Node.js 24.19.0 with npm 11.17.0, plus standard Android/iOS SDKs.

```sh
npm install
npm run deps:verify
npm run native:bootstrap:android
npm run android
```

On macOS for iOS:

```sh
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```

Quality gate:

```sh
npm run check
```

See `docs/development.md` for the reproducible native bootstrap, lockfile policy, and platform details. The design rules live in `docs/design.md`; the current verification boundary is recorded in `docs/verification.md`.

## Security

Read `SECURITY.md` before exposing a Harness instance remotely. DSH is powerful development software; do not publish an unauthenticated raw DSH port to the Internet.

## License

MIT. DeepSeek Harness remains governed by its own upstream license and project terms.
