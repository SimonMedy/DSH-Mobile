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

Before a public repository is created, maintainers should configure a private GitHub Security Advisory reporting channel and replace this section with the repository-specific reporting instructions. Do not report exploitable security issues in public Discussions or Issues.
