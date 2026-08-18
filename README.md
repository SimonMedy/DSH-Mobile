# DSH Mobile

<p align="left">
  <a href="https://github.com/SimonMedy/DSH-Mobile/releases"><img src="https://img.shields.io/github/v/release/SimonMedy/DSH-Mobile?color=4D6BFE&style=flat-square" alt="GitHub Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-6799FE?style=flat-square" alt="License" /></a>
  <a href="https://github.com/SimonMedy/DSH-Mobile/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/SimonMedy/DSH-Mobile/ci.yml?branch=main&label=CI&style=flat-square" alt="CI Status" /></a>
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20iOS-1A1D24?style=flat-square" alt="Platform" />
</p>

A focused, unofficial community mobile client for the official **[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)** Web UI.

DSH Mobile does not run Harness on your phone. It connects to user-operated remote DeepSeek Harness instances and displays the official Web UI inside a hardened, isolated mobile WebView shell.

<p align="center">
  <img src="docs/assets/demo.webp" alt="DSH Mobile Demo" width="300" />
</p>

---

## Quick Start: Connecting to DeepSeek Harness

### 1. Start your DeepSeek Harness server

On your machine or remote workstation:

```sh
# Start the official DSH Web UI (listens on 127.0.0.1:3080)
# Pass --trusted-host with your Tailscale hostname/IP to allow remote API calls
npx @deepseek-ai/dsh web --trusted-host my-pc.tailnet.ts.net --trusted-host 100.x.y.z
```

### 2. Expose it securely to your mobile devices

By design, DeepSeek Harness binds to `127.0.0.1` to prevent unauthenticated remote code execution. To access it securely from your phone, use **[Tailscale](https://tailscale.com)** (recommended) or an authenticated reverse proxy:

```sh
# Option A — Automatic HTTPS (recommended):
tailscale serve --https=443 127.0.0.1:3080

# Option B — Direct HTTP over private Tailnet IP:
tailscale serve --tcp=3080 tcp://127.0.0.1:3080
```

### 3. Connect from DSH Mobile

1. Open **DSH Mobile** on your device ([Download latest APK](https://github.com/SimonMedy/DSH-Mobile/releases)).
2. Tap **`+ Add server`**.
3. Fill in your server details:
   - **With Option A (HTTPS):** Protocol `HTTPS`, Host `my-pc.tailnet.ts.net`, Port `443`
   - **With Option B (HTTP):** Protocol `HTTP`, Host `100.x.y.z` (your Tailscale IPv4), Port `3080`
4. Tap **Test Connection** to verify reachability, then **Save**.

> [!NOTE]
> **API Keys & Workspaces**: Upstream DeepSeek Harness intentionally restricts host settings, API key configuration, and the native folder picker dialog (`PRIVILEGED_METHODS`) to `localhost` (`127.0.0.1`) for cybersecurity. Set up your model API keys and select your workspaces once on your host machine.

---

## Architecture

```text
Remote Machine / VPS
  DeepSeek Harness (`dsh web`)
          │
          │ Secure connection (LAN, Tailscale, or HTTPS reverse-proxy)
          ▼
DSH Mobile Client
  React Native Server Manager & Shell
          │
          ▼
  react-native-webview
          │
          ▼
  Official DeepSeek Harness Web UI
```

- **No Harness fork:** Runs against vanilla upstream DeepSeek Harness.
- **Zero local overhead:** All AI models, agents, shells, and workspace tools run on your host machine.
- **Isolated navigation:** Same-origin policy keeps internal links in-app and routes external links to the system browser.

---

## Features

- **Multi-Server Management:** Save and organize multiple named server instances (Home, Work, Cloud VPS).
- **DeepSeek Design Alignment:** Tailored dark/light theme, DeepSeek pill button system, and cosmic ambient glow.
- **Android Adaptive Icons:** Native squircle/circle launcher icon with Material You monochrome support.
- **Live Health Checks:** Real-time connectivity status pill, latency feedback, and last-connected history.
- **Launch Preferences:** Open directly to your default server or the server list.
- **Security & Privacy:** Local-only credential-free persistence, unsaved edit protection, and explicit confirmation for unencrypted public HTTP endpoints.
- **Offline Recovery:** Built-in reconnect and error handling without exposing raw browser crash screens.

---

## Known Limitations

- **Upstream Host Settings & API Keys:** DeepSeek Harness intentionally locks settings mutation (`settings.*`, `credentials.*`) to `localhost` (`127.0.0.1`) because it does not yet feature user authentication. Configure model provider API keys once on your host machine.
- **Native Folder Picker:** The "Choose workspace" button triggers a native host OS file explorer (`host.pickDirectory`) on the physical PC. Select or open your project workspace on the host machine first (or launch `dsh web` inside your workspace directory); it will then appear in your mobile workspace picker.
- **Upstream Web Layout:** DSH Mobile displays the official upstream Web UI. Desktop-specific layout elements within the Harness web frontend remain managed upstream.

---

## Development

### Quick Start (Docker / Make — Recommended)

No manual Android SDK or Java installation required on your host machine:

```sh
# Run the complete test & quality check suite
make check      # or: docker compose run --rm check

# Build the standalone Android Release APK (saved to ./dist/dsh-mobile.apk)
make build      # or: docker compose run --rm build-apk

# Start the Metro development server
make dev        # or: docker compose up dev
```

### Local Toolchain

Prerequisites: Node.js `24.19.0` with npm `11.17.0`, plus standard Android Studio / Xcode SDKs.

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

Quality check:

```sh
npm run check
```

---

## Upstream & Disclaimer

- **Official DeepSeek Harness:** https://deepseek.com/harness/en/
- **Upstream Repository:** https://github.com/deepseek-ai/deepseek-harness

_DeepSeek Harness is an independent project created by DeepSeek AI. DSH Mobile is an unofficial community client and is not affiliated with or endorsed by DeepSeek._

---

## Security

Read [`SECURITY.md`](SECURITY.md) before exposing a Harness instance remotely. DSH provides full developer-level agent and tool execution on your host machine; never expose an unauthenticated raw DSH port to the public Internet.

---

## License

[MIT](LICENSE). DeepSeek Harness remains governed by its own upstream license.
