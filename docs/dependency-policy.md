# Dependency policy

## Rule

Use the newest **stable compatible set**, not simply the newest version number of every package.

Production dependencies are pinned exactly. Preview, alpha, beta, RC, nightly, canary, and packages published only under npm `next` are excluded from mainline.

## Baseline selected for v0.1

- Node.js 24.19.0 LTS
- npm 11.17.0
- React Native 0.86.2
- React 19.2.3
- NativeWind 4.2.6
- React Native Reanimated 4.5.3
- React Native Worklets 0.11.3
- React Native WebView 14.0.1
- AsyncStorage 3.1.1
- React Navigation 7.3.14 / native-stack 7.18.6
- React Native Screens 4.26.2
- Safe Area Context 5.8.0
- React Native SVG 15.15.5
- Lucide React Native 1.27.0
- Tailwind CSS 3.4.19 (stable v3 line used by NativeWind v4)
- Prettier 3.9.6 + prettier-plugin-tailwindcss 0.8.1

Verification snapshot: **2026-08-17**. Node.js 24.19.0 is the current Latest LTS line release, while Node 26 is still Current; the repository therefore pins Node 24 rather than chasing the non-LTS Current channel. Node 24.19.0 ships npm 11.17.0, which is pinned through `packageManager`.

React Native dependency snapshot: React Native 0.87.0 is now the npm `latest` release, but the current stable Reanimated 4.5.x compatibility table supports React Native through 0.86 only. Reanimated support for RN 0.87 is in the 4.6 line, which is still published as nightly rather than npm `latest`. Because stable NativeWind 4.2.6 uses the Reanimated/Worklets stack, React Native **0.86.2** is therefore the newest all-stable compatible baseline for this project today.

Reanimated 4.5.3 and Worklets 0.11.3 are their npm `latest` stable versions and are mutually compatible. React Native WebView 14.0.1 is also npm `latest`; 15/16 are published under `next`, so they are intentionally excluded even though GitHub release tags exist.

For React-Native-coupled toolchain packages such as TypeScript, Babel, Jest, ESLint, and the React Native Community CLI, the project follows the versions pinned by the React Native 0.86.2 official template unless a newer version has been explicitly proven compatible. This prevents an individually newer compiler/linter from silently moving the native baseline away from what React Native itself tests. Independent tooling may move ahead when compatibility is straightforward; Prettier 3.9.6 and the Tailwind class-order plugin 0.8.1 are pinned independently for repository formatting.

## Upgrade gate

A dependency upgrade is mergeable only after:

1. stable tag/version verification against the maintainer's primary source;
2. compatibility matrix review for React Native/native dependencies;
3. install succeeds with a clean dependency tree;
4. format/lint/typecheck/unit tests pass;
5. Android debug build succeeds;
6. iOS build succeeds for changes affecting shared/native code where CI is available;
7. WebView smoke tests cover streaming, WebSockets, links, file input, downloads, reconnect, background/resume, and persisted sessions.
