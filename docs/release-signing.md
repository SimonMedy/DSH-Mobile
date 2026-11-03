# Android release signing

Android release builds are intentionally fail-closed. The public `android/app/debug.keystore` is for development only and must never sign a distributed APK.

## Required GitHub Actions secrets

Configure these repository secrets before publishing the next Android release:

- `ANDROID_RELEASE_KEYSTORE_BASE64` — base64-encoded private release keystore;
- `ANDROID_RELEASE_STORE_PASSWORD` — keystore password;
- `ANDROID_RELEASE_KEY_ALIAS` — signing key alias;
- `ANDROID_RELEASE_KEY_PASSWORD` — signing key password.

Do not commit the release keystore, passwords, aliases used as secrets, or decoded key material to the repository.

The release workflow decodes the keystore into the ephemeral GitHub-hosted runner, builds the release APK, verifies its signer, rejects the known public debug certificate, generates SHA-256 checksums, and only then hands the artifact to the publish job.

## v0.1.0 migration

The public `v0.1.0` release was built while the project still allowed a release build to fall back to the repository debug keystore. Treat that signing identity as public and unsuitable for future releases.

Before the next release:

1. generate and securely back up a permanent private Android release key;
2. configure the four GitHub Actions secrets above;
3. publish future releases only with that key;
4. tell users of `v0.1.0` that a one-time uninstall/reinstall may be required because the signer changes.

Never reuse the repository debug keystore as the permanent release key.
