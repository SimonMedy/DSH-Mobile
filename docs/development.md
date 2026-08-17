# Development

## Workflows

### 1. Containerized Workflow (Docker / Make — Zero Config)

The repository provides a self-contained container environment (`Dockerfile`, `compose.yaml`, and `Makefile`) that includes OpenJDK 17, Node.js 24 LTS, and Android SDK command-line tools without requiring host machine configuration:

```sh
make help       # List all available make commands
make check      # Run lint, typecheck, tests, and policy verification
make build      # Build Android Debug APK (outputs to ./dist/dsh-mobile-debug.apk)
make release    # Build Android Release APK (outputs to ./dist/)
make dev        # Start the Metro development server
make clean      # Clean local build outputs
```

Direct Docker Compose equivalents:

- `docker compose run --rm check`
- `docker compose run --rm build-apk`
- `docker compose run --rm build-release`
- `docker compose up dev`

### 2. Local / Native Toolchain

#### Prerequisites

- Node.js 24.19.0 (pinned current LTS for this snapshot).
- npm 11.17.0 (pinned through `packageManager`).
- Android Studio / Android SDK 36 and JDK 17 for Android.
- macOS + Xcode + CocoaPods for iOS.

The repository intentionally uses React Native Community CLI rather than Expo/Capacitor.

## Install JavaScript dependencies

```sh
npm install
```

The first networked maintainer checkout should commit the generated `package-lock.json` after verifying the dependency graph. A committed lockfile is a release blocker for v0.1; this source snapshot was produced in an environment that could verify registries/documents but could not reach the npm registry from the local build sandbox.

## Verify dependency policy

```sh
npm run deps:verify
```

Every direct dependency must be an exact, non-prerelease version. Compatibility is reviewed as a set rather than upgrading one native package in isolation.

## Android

The standard Gradle wrapper JAR is not hand-authored. If it is absent, bootstrap the pinned official Gradle 9.3.1 wrapper with checksum verification:

```sh
npm run native:bootstrap:android
npm run android
```

The portable Node bootstrap downloads the official Gradle 9.3.1 wrapper JAR from `services.gradle.org` and verifies the SHA-256 published by Gradle before installing it. The Gradle distribution ZIP is independently pinned with `distributionSha256Sum`. `gradlew`/`gradlew.bat` invoke the same bootstrap automatically when the JAR is absent.

## iOS

```sh
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

## Quality gate

```sh
npm run check
```

For platform changes, also build the affected native target. WebView changes require the manual smoke suite in `docs/release-checklist.md`.

## NativeWind

The NativeWind setup for the bare React Native project uses:

- `nativewind/preset` in `tailwind.config.js`;
- `nativewind/babel` in Babel presets;
- `withNativeWind(...)` in Metro;
- `react-native-worklets/plugin` last in Babel plugins, as required by Reanimated/Worklets;
- `nativewind-env.d.ts` for TypeScript declaration merging.

## Project conventions

Read `AGENTS.md` before changing architecture or security-sensitive behavior. Pure URL/state/navigation logic should remain outside components and covered by unit tests.
