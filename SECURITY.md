# Security policy

## Scope

DSH Mobile is a client for user-operated DeepSeek Harness servers. A configured Harness can have powerful access to source code, shells, files, tools, models, and credentials on its host. Treat access to DSH as access to a development environment.

## Deployment guidance

Prefer keeping `dsh web` on loopback and exposing it through a trusted access layer such as Tailscale or an authenticated reverse proxy. Prefer HTTPS whenever practical. Do not expose an unauthenticated raw Harness port to the public Internet.

## Client guarantees

The mobile client is designed to:

- persist only non-secret server profile metadata in AsyncStorage;
- never disable TLS certificate validation;
- constrain in-app WebView navigation to the configured server origin;
- open other HTTP(S) origins in the system browser;
- block dangerous/custom URL schemes by default;
- avoid a JavaScript-to-native message bridge;
- disable Android application backup in the default manifest;
- avoid unnecessary native permissions.

## Reporting vulnerabilities

Please report security vulnerabilities privately using GitHub's **Report a vulnerability** feature in the repository Security tab when available. Do not disclose exploitable vulnerabilities in public Issues or Discussions.

If private vulnerability reporting is unavailable, contact the repository maintainer privately before publishing technical details. Do not include secrets, credentials, private server URLs, or user data in a report.

## Release integrity

Official Android release builds must be signed with the maintainer-controlled release key. Release builds intentionally fail when signing credentials are unavailable; the repository's public debug keystore must never be used to sign distributed releases.
