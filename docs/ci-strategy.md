# CI strategy: fast iteration without removing release gates

The previous workflow executed quality, then Android and iOS builds **sequentially** on every commit, including work-in-progress drafts. A formatting fix could therefore trigger 30–45 minutes of unnecessary native compilation.

## What runs when

- **Draft pull requests:** dependency-policy verification, formatting, lint, TypeScript and Jest. Native builds are skipped, not counted as tested.
- **Ready-for-review pull requests:** full quality, Android and iOS CI on every revision, launched in parallel. Marking a draft ready triggers the full checks even when its last commit did not change.
- **Pushes to main or manual runs:** full quality, Android and iOS validation.
- **Security/release checks:** separate release-policy guard remains enabled. A ready PR must also pass any specialized E2E applicable to its changed flows.
- **Android WebView E2E:** separate emulator workflow, so the pairing flow cannot be approved merely because a JS or native build succeeds.

`actions/setup-node` caches npm's download cache, not `node_modules`. Native steps have no access to Android signing secrets. The Gradle build cache is enabled; Gradle's GitHub Actions setup handles build cache state. GitHub-hosted runners remain the only build execution environment.

**Merge rule:** never merge a draft. Before merging, verify checks on the exact current head SHA, especially both native builds for UI/code changes. Skipped native jobs on a draft are intentionally **not** evidence of compatibility. Public APK releases still require the separate protected signing identity verification and authenticated WebView E2E.
