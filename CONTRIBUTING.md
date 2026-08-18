# Contributing

Thanks for helping improve DSH Mobile.

1. Read `AGENTS.md` first.
2. Keep changes scoped and explain the product reason.
3. Do not introduce DSH-private API/DOM coupling for convenience.
4. Add or update tests for pure logic.
5. Run `npm run check` before opening a pull request.
6. For native/WebView changes, include platform(s) tested and the manual scenarios exercised.

## Commit style

Prefer small, reviewable commits with imperative subjects, for example:

- `feat(servers): add private-network security hint`
- `fix(browser): keep external origins out of WebView`
- `test(state): cover default-server deletion`
- `docs(security): document Tailscale deployment model`

## Dependency changes

Dependency PRs must explain version/tag verification and cross-library compatibility. Preview/nightly dependencies are not accepted on mainline without an explicit design decision.
