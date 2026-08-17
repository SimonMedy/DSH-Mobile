# DSH Mobile — Community Project Plan

## 1. Context

[DeepSeek Harness](https://deepseek.com/harness/en/) is an open-source agent harness developed by DeepSeek AI. Its official repository is available at:

https://github.com/deepseek-ai/deepseek-harness

DeepSeek Harness can run a browser-based interface through `dsh web`. The Harness runtime, tools, filesystem access, shell access, sessions, plugins, models, and workspaces all run on the machine hosting DSH.

This makes remote usage a natural fit: a user can run DeepSeek Harness on a workstation, home server, NAS, VPS, or other always-on machine, then access the Web UI from another device.

Desktop browsers already work well for this purpose. Mobile browsers work too, but the experience is less convenient for frequent use: browser chrome takes space, server URLs must be managed manually, navigation feels less app-like, and mobile-specific integrations such as file handling, connection management, and notifications are harder to provide cleanly.

**DSH Mobile** is intended to solve that problem with the smallest reasonable amount of software.

The project is **not** a mobile port of DeepSeek Harness. It is a lightweight mobile client for the official DSH Web UI.

---

## 2. Project goal

The goal is to provide a dedicated mobile application that connects to an existing user-operated DeepSeek Harness Web instance and displays the official DSH interface inside a mobile WebView.

The mobile application should provide a clean native shell around that Web UI, including server management and mobile-specific behavior.

The project should remain intentionally thin:

- no fork of DeepSeek Harness;
- no copied or reimplemented DSH frontend;
- no bundled Node.js runtime;
- no local Harness execution on the phone;
- no mandatory DSH plugin;
- no custom backend service operated by this project;
- no dependency on private or internal DSH APIs unless a future feature truly requires it.

The application should behave primarily as a specialized client for one or more user-configured DSH servers.

This keeps the project small, easier to audit, and relatively resilient to internal changes in DeepSeek Harness.

---

## 3. Product concept

DSH Mobile should open to a simple server manager rather than immediately exposing a raw URL field or behaving like a generic browser.

Example:

```text
DSH Mobile

My Servers

┌──────────────────────────────┐
│ Home Server                  │
│ https://dsh-home.example     │
│ Online                       │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Work                         │
│ https://dsh-work.example     │
│ Unreachable                  │
└──────────────────────────────┘

[ + Add server ]
```

Users should be able to:

- add multiple DSH servers;
- assign a friendly name to each server;
- configure protocol, hostname or IP address, and port;
- edit existing server entries;
- delete servers;
- test whether a server is reachable;
- see a clear connection status for each server;
- remember the last successful connection time;
- choose a favorite/default server;
- optionally open the default server automatically at launch;
- open a selected DSH server in a full-screen WebView.

A server editor could expose either a complete URL or structured fields such as:

```text
Name
Home Server

Protocol
HTTPS

Host
dsh-home.example

Port
443
```

The app stores these settings locally on the device.

No central DSH Mobile account or project-operated cloud service is required.

---

## 4. High-level architecture

```text
                    Remote host
        ┌───────────────────────────────┐
        │                               │
        │  Repositories / workspaces    │
        │  Shell / tools / filesystem   │
        │             │                 │
        │             ▼                 │
        │     DeepSeek Harness          │
        │         dsh web               │
        │      127.0.0.1:3080           │
        │             │                 │
        │             ▼                 │
        │   Secure remote access layer  │
        │  Tailscale / reverse proxy    │
        └─────────────┬─────────────────┘
                      │
                      │ HTTPS / private network
                      │
             ┌────────┴─────────┐
             │                  │
             ▼                  ▼
        Desktop client      Mobile client
        Web browser         DSH Mobile
                            React Native
                                 │
                                 ▼
                          react-native-webview
                                 │
                                 ▼
                          official DSH Web UI
```

The machine running DSH remains the **server**.

Desktop browsers and DSH Mobile are only **clients**.

All agent execution, shell access, filesystem access, repositories, model calls, plugins, sessions, workspaces, and other Harness functionality remain on the remote machine.

---

## 5. Remote access model

DeepSeek Harness serves its Web UI locally by default. The upstream project also supports deliberate non-loopback binding, but its web server does not itself provide a complete deployment security layer such as TLS and authentication.

For that reason, DSH Mobile should not encourage users to expose a raw DSH port directly to the public Internet.

A preferred deployment model is:

```text
DeepSeek Harness
127.0.0.1:3080
      │
      ▼
secure remote access layer
      │
      ▼
mobile / desktop clients
```

### Tailscale

Tailscale is a strong option for this use case because it creates a private WireGuard-based network between authorized devices without requiring users to expose ports publicly.

A typical setup can keep DSH bound to localhost while exposing it only through a private Tailnet, optionally using Tailscale Serve for convenient HTTPS access.

Tailscale is **not a hard dependency** of DSH Mobile. It is simply a recommended robust option.

Other valid setups may include:

- WireGuard;
- another private VPN;
- an authenticated reverse proxy;
- Cloudflare Tunnel with suitable access controls;
- a trusted local LAN;
- another secure networking solution chosen by the user.

The application itself only needs a reachable DSH server URL.

---

## 6. What a WebView is

A WebView is a component that displays web content inside a mobile application.

Instead of using a normal browser:

```text
Chrome / Safari
┌──────────────────────────────┐
│ browser controls             │
├──────────────────────────────┤
│                              │
│ DeepSeek Harness Web UI      │
│                              │
└──────────────────────────────┘
```

DSH Mobile provides an application-focused experience:

```text
DSH Mobile
┌──────────────────────────────┐
│                              │
│ DeepSeek Harness Web UI      │
│                              │
│                              │
└──────────────────────────────┘
```

With React Native, the project uses `react-native-webview`.

Under the hood, the WebView still relies on the platform web engine:

- Android uses the Android WebView implementation;
- iOS uses Apple's WebKit/WKWebView implementation.

The phone therefore does **not** run DeepSeek Harness itself. It only renders the official web application served by the remote DSH instance.

---

## 7. Technology choices

### React Native + TypeScript

DSH Mobile should use a **single React Native codebase** for Android and iOS.

The application-owned UI includes:

- server list;
- add/edit server screens;
- settings;
- connection status and errors;
- onboarding;
- navigation around the WebView;
- future mobile-native integrations.

Using React Native allows this UI and most application logic to be shared across Android and iOS.

### `react-native-webview`

The official DeepSeek Harness Web UI should be displayed through `react-native-webview`.

The project should not recreate the DSH frontend in React Native.

The relationship is:

```text
React Native app
      │
      ├── server manager
      ├── settings
      ├── native mobile behavior
      │
      ▼
react-native-webview
      │
      ▼
official DeepSeek Harness Web UI
```

### NativeWind

NativeWind is a good optional styling choice for the project.

It provides a Tailwind-like workflow for React Native and can make it easy to maintain a consistent design language across Android and iOS.

The server manager UI should feel visually compatible with DeepSeek Harness without depending on DSH's private CSS, DOM structure, or frontend implementation.

The project can define its own small design system covering:

- colors;
- typography;
- spacing;
- border radius;
- cards;
- buttons;
- inputs;
- status indicators;
- light/dark appearance.

### Android-first, iOS supported from the same codebase

Android should be the primary target and receive the most testing initially.

However, the architecture should remain cross-platform from the beginning so that iOS can use the same React Native application codebase with platform-specific adjustments only where required.

---

## 8. Why not Capacitor or Flutter?

### Why not Capacitor?

Capacitor is particularly useful when a team owns a web application and wants to package that application for mobile platforms.

That is not the architecture of DSH Mobile.

The official DSH Web UI already exists remotely, while DSH Mobile needs a small amount of application-owned UI around it: server management, settings, navigation, connection handling, and later mobile-native features.

React Native is a better fit for that application shell while `react-native-webview` remains responsible for displaying the official DSH interface.

### Why not Flutter?

Flutter could also build the mobile shell, but it would introduce a separate UI ecosystem and language without providing a clear benefit for this project's needs.

React Native offers:

- a single Android/iOS codebase;
- TypeScript;
- a familiar React component model;
- good integration with `react-native-webview`;
- easy construction of the small amount of native UI this project owns.

The goal is not to choose the most powerful framework possible. It is to choose a sufficiently capable stack with low conceptual overhead for this specific project.

---

## 9. Relationship with DeepSeek Harness plugins

The core application does **not** require a DeepSeek Harness plugin.

The relationship is simply:

```text
DeepSeek Harness
      │
      │ HTTP / WebSocket
      ▼
DSH Mobile
react-native-webview
```

DSH Mobile should ideally behave like a normal browser client.

This is intentional because DeepSeek Harness is still evolving quickly. Depending on internal plugin APIs or private RPC contracts would tightly couple the mobile client to specific Harness internals.

By remaining at the browser boundary, the mobile client should benefit automatically from most DSH updates.

For example:

```text
DSH update changes the UI
          │
          ▼
remote server serves new UI
          │
          ▼
DSH Mobile displays new UI
```

No DSH Mobile release should be required simply because the official DSH frontend changes its visual design or adds normal browser-side functionality.

### Possible future optional plugin

A DSH plugin may become useful later for features that cannot be implemented reliably from the WebView alone, such as:

- push notifications when a task finishes;
- notifications when Harness requires user approval;
- native quick actions;
- widgets showing server or session status;
- richer share-to-DSH workflows;
- background event subscriptions.

If such a plugin is developed, it should remain optional.

The desired compatibility model is:

```text
DSH Mobile + vanilla DSH               works

DSH Mobile + optional mobile plugin    extra features
```

not:

```text
DSH Mobile requires a custom DSH plugin
```

---

## 10. Compatibility philosophy

The application should minimize coupling to DeepSeek Harness internals.

In particular, it should avoid:

- injecting custom JavaScript into the DSH interface unless absolutely necessary;
- querying or modifying private DOM elements;
- depending on internal CSS selectors;
- modifying DSH frontend assets;
- patching the Harness package;
- relying on undocumented private APIs when normal browser behavior is sufficient.

This makes DSH Mobile more resilient to changes in the official application.

A future DSH update could still require a mobile update if it introduces browser capabilities unsupported by a platform WebView, substantially changes upload/download behavior, or requires new browser permissions.

Those should be treated as compatibility adjustments in the mobile shell rather than reasons to patch DeepSeek Harness.

---

## 11. Server management UX

Server management is one of the main pieces of UI owned by DSH Mobile.

### Server model

A server entry may contain:

```text
id
display name
scheme / protocol
host
port
optional path
last connection status
last successful connection time
default / favorite state
optional user preference for auto-open
```

Internally, the app can normalize this into a complete URL.

Examples:

```text
https://dsh.example.com
https://machine-name.tailnet.ts.net
http://100.x.y.z:3080
http://192.168.1.50:3080
```

HTTPS should be recommended wherever practical.

### First launch

On first launch:

```text
DSH Mobile

No servers configured yet.

[ Add server ]
```

The app should guide the user through entering an address and optionally testing it before saving.

### Multiple servers

Users should be able to save multiple instances, for example:

```text
Home
Work
Development VPS
Lab
```

This is useful for community users who operate more than one Harness instance.

### Editing and deletion

Each saved server should be editable and removable.

Destructive actions should require an explicit confirmation.

### Connection testing

The app should provide a lightweight way to test whether a configured server is reachable.

The test should validate connectivity without depending unnecessarily on private DSH APIs.

### Connection status

Each server card should expose a simple, understandable status such as:

```text
Online
Offline
Unknown
Last connected 12 min ago
```

The app should avoid aggressive background polling. Status checks should happen on explicit user action, app launch, server selection, or another lightweight event that provides clear value.

### Default server and launch behavior

Users should be able to mark one server as the default.

A preference may allow either:

```text
Open server list on launch
```

or:

```text
Open default server automatically
```

Even when auto-open is enabled, returning to the server manager should remain easy.

### Settings and About

DSH Mobile should include a small native Settings/About area for app-owned preferences and project information.

Appropriate items include:

- launch behavior;
- theme preference where useful;
- default server;
- external-link behavior if it becomes configurable;
- app version;
- link to the DSH Mobile repository;
- link to the official DeepSeek Harness website;
- link to the official DeepSeek Harness GitHub repository;
- clear unofficial/community-project wording.

This screen should not duplicate settings that already belong to DeepSeek Harness.

---

## 12. WebView behavior

Once a user selects a server, DSH Mobile opens the official DSH interface in a full-screen `react-native-webview`.

The application should handle:

- JavaScript required by DSH;
- browser storage and cookies;
- long-lived HTTP connections;
- WebSocket behavior;
- internal navigation;
- external links;
- file selection;
- uploads;
- downloads;
- copy/paste;
- mobile keyboard behavior;
- app background/resume lifecycle;
- reconnect and reload behavior;
- a clear way to return to the server manager.

### Navigation

URLs belonging to the configured DSH origin should normally stay inside the WebView.

External HTTPS links should normally open in the user's default browser rather than replacing DSH inside the app.

### File handling

When DSH requests a file upload, the app should integrate cleanly with the platform file picker.

Download behavior should use appropriate Android/iOS mechanisms where practical.

### Connection errors

A failed connection should not leave the user staring at a generic browser error page.

The app should provide a clean error state with actions such as:

```text
Could not reach Home Server

[ Retry ]
[ Edit server ]
[ Back to servers ]
```

### Reload and reconnect

The DSH view should expose a simple reload/reconnect action without turning the app into a browser.

The control can live in a minimal overflow menu, top bar, gesture, or another unobtrusive native affordance.

The goal is to make recovery from network interruptions easy while keeping the official DSH interface visually dominant.

### External links

Navigation that belongs to the configured DSH origin should remain inside the WebView.

External HTTPS destinations such as documentation, GitHub, or provider websites should normally open in the user's default browser.

This protects the dedicated-app experience and reduces the risk of arbitrary third-party content gaining access to app-specific behavior.

---

## 13. Initial v0.1 scope

The first useful public version should remain focused.

### Required

- React Native + TypeScript project;
- Android build working;
- iOS project structure kept compatible where practical;
- server list;
- add server;
- edit server;
- delete server;
- custom server names;
- URL / host / port configuration;
- local persistence;
- connection test;
- per-server connection status;
- last successful connection indicator;
- default/favorite server;
- configurable launch behavior;
- server selection;
- full-screen `react-native-webview`;
- internal vs external link handling;
- Android back gesture/button behavior;
- file chooser support;
- basic download handling;
- copy/paste;
- connection error UI;
- retry/reload/reconnect;
- easy return to server manager;
- Settings/About screen;
- app background/resume handling;
- basic light/dark visual support;
- clean design consistent across the app-owned screens.

### Explicitly out of scope for v0.1

- custom native dashboards for DSH sessions;
- a native recreation of the DSH chat/composer;
- native plugin management;
- a separate native terminal replacing DSH's own UI;
- running DSH locally on the phone;
- bundling Node.js;
- recreating the DSH chat/session UI;
- modifying DeepSeek Harness;
- mandatory server plugin;
- project-operated authentication service;
- project-operated proxy or relay;
- push notifications;
- widgets;
- complex background services.

---

## 14. Future features

Only after the core client is stable should the project consider:

- favorite/default servers;
- server sorting;
- QR-code based server setup for quickly importing a server URL/configuration;
- deep links for adding a server;
- improved gallery/camera integration;
- richer download management;
- share-to-DSH;
- biometric app lock;
- native shortcuts;
- keep-screen-awake option;
- push notifications;
- Android widgets;
- iOS widgets;
- optional DSH companion plugin for advanced events.

A useful principle is:

> Do not add a server-side dependency unless the desired feature cannot be implemented cleanly at the browser/mobile boundary.

---

## 15. Security principles

DSH is a powerful development agent with access to repositories, commands, tools, and potentially sensitive credentials.

Remote access should therefore be treated as access to a development machine, not as access to a harmless static website.

The project should recommend:

- keeping DSH bound to loopback when possible;
- exposing it through a trusted secure networking layer;
- preferring HTTPS for remote access;
- showing a clear warning when a user configures an obviously insecure remote HTTP endpoint;
- using Tailscale or another authenticated private network;
- never disabling TLS validation inside DSH Mobile;
- never shipping a universal hard-coded server;
- never sending users' server addresses through a project-operated cloud service;
- keeping server configuration local to the device;
- avoiding dangerous native JavaScript bridges exposed to arbitrary remote content;
- restricting trusted in-app navigation to the configured DSH origin where practical.

External origins should normally be opened outside the WebView.

---

## 16. Suggested repository structure

A React Native community repository could look like:

```text
dsh-mobile/
├── README.md
├── LICENSE
├── SECURITY.md
├── CONTRIBUTING.md
├── package.json
├── tsconfig.json
│
├── src/
│   ├── components/
│   ├── screens/
│   │   ├── ServerListScreen.tsx
│   │   ├── ServerEditorScreen.tsx
│   │   ├── DshWebViewScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/
│   ├── storage/
│   ├── networking/
│   ├── theme/
│   └── types/
│
├── android/
├── ios/
│
└── docs/
    ├── architecture.md
    ├── remote-access.md
    ├── security.md
    └── development.md
```

Avoid unnecessary monorepo tooling or backend infrastructure.

---

## 17. Public project positioning

The project should be clearly described as an unofficial community client.

Suggested positioning:

> DSH Mobile is an unofficial lightweight mobile client for the DeepSeek Harness Web UI. It connects to existing user-operated DeepSeek Harness instances and does not bundle, fork, modify, or host the Harness runtime.

The README should make it clear that:

- DeepSeek Harness is a separate upstream project;
- users operate their own Harness server;
- DSH Mobile does not provide a hosted DSH service;
- the app does not include DeepSeek Harness;
- Tailscale is recommended but optional;
- no DSH plugin is required for core functionality;
- the project is not affiliated with or endorsed by DeepSeek unless that changes officially.

A permissive license such as MIT or Apache-2.0 would fit the nature of the project, subject to the maintainers' preference.

---

## 18. Development roadmap

### Phase 1 — minimal proof of concept

Build the smallest React Native application that:

1. accepts a DSH server;
2. stores it locally;
3. opens it in `react-native-webview`;
4. successfully loads the official DSH Web UI over a remote connection.

The purpose is to validate WebView compatibility before adding product polish.

### Phase 2 — DSH compatibility validation

Test important workflows:

- opening existing sessions;
- creating sessions;
- response streaming;
- approval prompts;
- settings;
- workspace selection;
- WebSockets or other long-lived connections;
- copy/paste;
- file upload;
- file download;
- external links;
- reconnecting after network interruption;
- backgrounding and restoring the app.

Any incompatibility should first be solved in the mobile shell rather than by modifying DSH.

### Phase 3 — server manager and UX

Build the polished app-owned experience:

- multiple servers;
- custom names;
- add/edit/delete;
- connection status;
- connection testing;
- navigation;
- settings;
- consistent design system;
- error/retry screens.

### Phase 4 — Android public release

Prepare:

- Android release builds;
- app icon and branding;
- README;
- security documentation;
- build instructions;
- screenshots;
- CI;
- signed APK/AAB release process;
- issue templates;
- contribution guidelines.

### Phase 5 — iOS validation and release

Use the same React Native codebase to validate and polish:

- WebView behavior on iOS;
- file uploads/downloads;
- navigation;
- keyboard behavior;
- lifecycle;
- App Store packaging requirements.

Platform-specific code should be introduced only where needed.

### Phase 6 — advanced mobile features

Only after real usage demonstrates a need, consider:

- QR-code pairing;
- share-sheet integration;
- biometric lock;
- native shortcuts;
- widgets;
- push notifications;
- optional DSH mobile companion plugin.

---

## 19. Design rule: stay thin

A useful rule for future development is:

> If a feature already works correctly in the official DSH Web UI, DSH Mobile should display it rather than reimplement it.

DSH Mobile should focus on the boundary between the web application and the mobile operating system.

The project's responsibility is mainly:

```text
server management
network connection
WebView
navigation
files
downloads
permissions
lifecycle
native mobile integration
```

DeepSeek Harness remains responsible for:

```text
agents
sessions
models
plugins
tools
workspaces
shell
filesystem
permissions
official DSH user interface
```

This separation is what keeps the project maintainable.

---

## 20. Final architecture decision

The proposed technical direction is:

```text
Server side
-----------
Official DeepSeek Harness
`dsh web`
+
secure remote access
(Tailscale recommended, not required)


Mobile app
----------
React Native
+
TypeScript
+
react-native-webview
+
NativeWind (recommended for app-owned UI styling)


Platforms
---------
Android: primary target
iOS: same React Native codebase, supported as practical
```

The project intentionally has:

- no Capacitor;
- no Flutter;
- no mandatory DSH plugin;
- no fork or patch of DeepSeek Harness;
- no custom mobile recreation of the DSH Web UI.

The objective is to turn the official DeepSeek Harness Web experience into a clean, dedicated mobile application for users who run Harness remotely.

---

## 21. Official sources and verification

This project plan is based on the public upstream DeepSeek Harness project.

Because DeepSeek Harness is under active development, contributors should verify implementation details against the official sources before relying on them.

Primary references:

- Official DeepSeek Harness page: https://deepseek.com/harness/en/
- Official DeepSeek Harness GitHub repository: https://github.com/deepseek-ai/deepseek-harness

The GitHub repository should be treated as the primary technical reference for implementation details such as:

- `dsh web`;
- HTTP server behavior;
- WebSocket behavior;
- configuration;
- plugins;
- compatibility changes.

The official product page is useful for current product-level documentation and positioning.

When DSH Mobile documents a specific upstream behavior, contributors should prefer linking directly to the relevant official documentation or source file rather than duplicating internal implementation details that may become stale.
