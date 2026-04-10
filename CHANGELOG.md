# Changelog

All notable changes to the nano-zyrkel SDK are recorded here. The project
follows [Semantic Versioning](https://semver.org/) — the binary core, the
WASM core and the CLI all share the same workspace version.

The bin- and wasm-tagged releases (`bin-v*`, `wasm-v*`) on GitHub are the
canonical distribution points; this file just narrates what changed between
them.

## [Unreleased]

### Added
- **Live Builder** at `docs/builder/` — single-page browser app that fetches
  the template manifest from GitHub raw, renders a form for any scaffold,
  theme or example, and lets you download the materialised repo as a zip.
  Hosted automatically via the new `pages.yml` workflow.
- **`nano-zyrkel demo`** subcommand — runs a self-contained pipeline against
  the public GitHub API, no config or secrets needed. The fastest way to
  confirm a fresh `cargo install` works end to end.
- **Template-validation CI** (`scripts/validate_templates.py` +
  `validate-templates.yml`) — checks every shipped template against the v1
  contract on every PR. Backs the "templates" status badge.
- **CI workflow** (`.github/workflows/ci.yml`) — builds + tests both cores
  on Linux, macOS and Windows; runs clippy on every PR. Backs the "ci"
  status badge.
- **crates.io publish workflow** (`publish-crates.yml`) — manual dispatch
  with dry-run mode, publishes the three crates in dependency order.
- **Smoke test suite** for `nano-zyrkel-core` covering the introspect schema
  and config round-tripping.
- `CONTRIBUTING.md`, this `CHANGELOG.md`, and a devcontainer config so
  external contributors can spin up an identical toolchain in one click.

### Changed
- Workspace version bumped from `0.1.0` to `0.2.0` to match the v0.2 release
  artifacts already shipped on GitHub.
- Both `Cargo.toml` files now carry full crates.io metadata: keywords,
  categories, homepage, documentation, readme, rust-version.

## [0.2.0] — 2026-04-10

### Added
- **`introspect` modules** in both cores. The binary CLI gains an
  `introspect` subcommand that prints the SDK schema as JSON; the WASM core
  exports `wasmSdkSchema()` returning the equivalent for browser primitives.
- **New fetchers**: RSS / Atom (`quick-xml`), sitemap.xml (with sitemap
  index recursion), iCalendar (RFC 5545 with line unfolding and
  RRULE/RDATE/EXDATE).
- **New conditions**: `Threshold` (with `json:`/`css:`/`regex:` extractors),
  `Stale` (timestamp walker), `JsonSchema` (via `jsonschema`),
  `Diff` (with persisted prior state).
- **New notifiers**: Discord webhook, Slack webhook.
- **New actions**: `GithubComment`, `GithubRelease`.
- **WASM data primitives**: `Csv`, `DateTime`, `UrlState`, `Router`,
  `WebSocketClient`.
- **WASM viz-ui layer**: `Toast`, `Modal`, `Tabs`, `Accordion`, `Icons`,
  form controls, sortable lists, Markdown rendering, animation tweens.
- **Five new templates**: `scaffold-monitor`, `scaffold-newsletter`,
  `theme-multipage`, `theme-report`, `theme-card-grid`, plus seven new
  examples (dashboard grid, form controls, csv export, multi tab,
  comparison, survival, plugin walkthrough).
- **Builder-ready metadata**: every template now ships a typed `template.json`
  describing its slots and files; a master `manifest.json` indexes the
  whole catalog.
- **Four new docs**: `secrets-cookbook.md`, `deploying.md`, `i18n-guide.md`,
  `builder-guide.md`.

### Changed
- Workspace split into `nano-zyrkel-core` (library) + `nano-zyrkel` (CLI) +
  `nano-zyrkel-wasm-core`. Two user repos (`vusTracker`, `helix`) migrated
  to the new layout.
- README rebranded around the "nano-zyrkel SDK" framing with audience-
  targeted recommendations and a roadmap section.

## [0.1.0] — initial release

- First public version. Single binary, no library split, four templates,
  one user repo (`literature-alert`).
