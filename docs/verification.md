# Verification snapshot

This document records what was verified while preparing the initial v0.1 source snapshot on **2026-08-17**.

## Verified against upstream sources

- DeepSeek Harness remains an external upstream project and exposes its Web UI through `dsh web`.
- Node.js 24.19.0 is the current production LTS selection for the repository and ships npm 11.17.0.
- React Native native-project values are based on the official React Native Community template for the selected `0.86.2` baseline.
- NativeWind/Reanimated/Worklets configuration follows their stable compatibility requirements.
- `react-native-webview` props used by the browser shell are present in the pinned stable v14 API, including process-termination hooks and iOS file-download notification.
- Android `react-native-screens` activity restoration setup follows the library's documented recommendation.
- Gradle wrapper and distribution checksums match the official Gradle 9.3.1 checksum reference.

See `docs/dependency-policy.md` for the version-selection rationale.

## Local static verification performed

The source snapshot was checked for:

- JSON validity;
- XML/plist/storyboard/scheme well-formedness;
- JavaScript configuration/script syntax;
- TypeScript/TSX syntax using the available compiler;
- resolution of all relative TypeScript imports;
- strict semantic compilation plus executable runtime assertions for the pure URL, navigation-policy, and state-reducer modules;
- exact, non-prerelease declared JavaScript dependency versions;
- absence of obvious secret files, generated build output, and dependency directories;
- consistency of the documented architecture/security boundaries.

## Not executed in the source-generation environment

The sandbox used to prepare this snapshot could not reach the npm package registry or native package download endpoints reliably. Therefore this snapshot must **not** be represented as having passed a real dependency install, Prettier/ESLint/Jest, a full application-wide TypeScript semantic check with installed React Native typings, Android build, CocoaPods install, or Xcode build in that environment.

Those are explicit first-networked-checkout gates:

1. run `npm install` and commit the generated `package-lock.json`;
2. run `npm run check`;
3. run the Android debug build;
4. on macOS, install Pods and run the iOS simulator build;
5. complete the manual WebView/DSH smoke checklist in `docs/release-checklist.md`.

CI is configured to perform the quality and native build checks once the repository is hosted in an environment with normal network access.
