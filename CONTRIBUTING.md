# Contributing to nano-zyrkel SDK

Thanks for considering a contribution. The SDK is small and opinionated, so
the bar for changes is "does this make existing nano-zyrkels more useful
without forcing every consumer to migrate". Anything that pulls in that
direction is welcome.

## What this repo is

Two cores plus a templates library:

```
crates/core/        nano-zyrkel-core      Rust library — fetch, condition, action, notify, runtime
crates/cli/         nano-zyrkel           Thin CLI binary that drives the library
crates/wasm-core/   nano-zyrkel-wasm-core Browser-side counterpart compiled to WebAssembly
templates/          scaffolds, themes, examples — consumed by the live builder
docs/               markdown guides + the live builder app
```

User repos (`schlein-lab/nano-zyrkel-*`) depend on these via versioned
GitHub releases. Anything that changes the public API needs a corresponding
entry in `compatibility.json` and the `CHANGELOG.md`.

## Getting set up

```bash
git clone https://github.com/schlein-lab/nano-zyrkel
cd nano-zyrkel

# Build everything
cargo build --workspace

# Run the smoke tests
cargo test --workspace

# Run a self-contained pipeline against the public GitHub API
cargo run -p nano-zyrkel -- demo
```

A devcontainer is included (`.devcontainer/devcontainer.json`) so you can
open the repo in GitHub Codespaces or VS Code Dev Containers and skip the
local toolchain setup entirely.

## What kind of changes are easy to merge

- **New fetchers, conditions, actions, notifiers** — add the variant in
  `crates/core/src/{fetch,condition,action,notify}.rs`, register an entry in
  `crates/core/src/introspect.rs`, add a smoke test in
  `crates/core/tests/smoke.rs`. Done.
- **New WASM primitives** — add the module under `crates/wasm-core/src/`,
  feature-gate it appropriately, register it in
  `crates/wasm-core/src/introspect.rs`.
- **New templates** — drop a directory under
  `templates/{scaffolds,themes,examples}/`, add a `template.json`, list it
  in `templates/manifest.json`. The template-validation CI will check the
  rest.
- **Doc additions** — guides, recipes, secret cookbooks, deployment notes
  are always welcome.

## What kind of changes are harder to merge

- **Breaking API changes** to the published cores. They need a coordinated
  release across both cores plus migrations for the existing user repos.
- **New direct dependencies** in `crates/core` — every dep is one more
  thing every nano-zyrkel inherits. Pull in lightweight, well-maintained
  crates only.
- **Domain-specific business logic in core** — that belongs in a user repo,
  not the SDK. The Plugin trait exists for exactly this case.

## Pull request checklist

Before opening a PR:

```bash
cargo fmt --all
cargo clippy --workspace --all-targets
cargo test --workspace --all-targets
python scripts/validate_templates.py
```

Then:

- [ ] CHANGELOG.md entry under `## [Unreleased]`
- [ ] If you touched the public API: a note in `compatibility.json`
- [ ] If you touched a template: ran `validate_templates.py` locally
- [ ] If you added a new env var: documented it in `docs/secrets-cookbook.md`

## Release process

Releases are cut from `main` by maintainers using the existing workflows:

1. Bump `version` in `Cargo.toml` (workspace) and tag commit `bin-vX.Y.Z`
2. `release.yml` builds cross-platform binaries + `schema.json`
3. `release-wasm.yml` builds the WASM bundles for every feature profile
4. `publish-crates.yml` (manual dispatch) pushes to crates.io
5. `pages.yml` redeploys the docs site automatically on push

User repos pin to a specific tag in `.nano-zyrkel-versions.json` and update
on their own schedule.

## Code of conduct

Be kind, give people the benefit of the doubt, focus on the code rather
than the person. We don't have a formal CoC document — if a situation comes
up that needs one, it's a sign something already went wrong.

## License

By contributing you agree your work will be released under the MIT license
that covers the rest of the repository.
