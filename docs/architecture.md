# nano-zyrkel — Architecture

> Stable, layered, adaptable. The same binary core runs in every nano-zyrkel
> agent. Domain-specific behavior plugs in via the `Plugin` trait without
> touching the core.

## Layers

```
┌──────────────────────────────────────────────────────────────┐
│  CENTRAL — versioned via GitHub Releases                     │
│                                                              │
│  schlein-lab/nano-zyrkel                                     │
│  ├── crates/core      ← Library: Config, Fetch, Condition,   │
│  │                      Notify, Action, Runtime, Plugin      │
│  ├── crates/cli       ← Thin binary: parses args, calls      │
│  │                      Runtime::run()                       │
│  ├── templates/       ← Themes, examples, scaffolds          │
│  │                      (NOT linked code, just skeletons)    │
│  └── compatibility.json                                      │
└──────────────────────────────────────────────────────────────┘
                         │
                         │ pre-built binaries via Releases
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  USER REPOS — scalable across many independent agents       │
│                                                              │
│  user/nano-zyrkel-myapp/                                     │
│  ├── hats/config.json          ← User edits ONLY this        │
│  ├── .nano-zyrkel-versions.json                              │
│  ├── core/bin/nano-zyrkel      ← downloaded from release     │
│  ├── crates/plugin/            ← optional: domain logic      │
│  │                               implementing Plugin trait   │
│  └── .github/workflows/                                      │
│      ├── data-update.yml       ← cron, calls binary          │
│      └── update-core.yml       ← reusable workflow           │
└──────────────────────────────────────────────────────────────┘
```

## Responsibility split — what lives where, always

| Concern                                | Layer                          |
| -------------------------------------- | ------------------------------ |
| Parse `hats/config.json`               | `crates/core` (`config`)       |
| HTTP / HTML / JSONPath / IMAP fetching | `crates/core` (`fetch`)        |
| Match a fetched record against rules   | `crates/core` (`condition`)    |
| Send Telegram / Email / Webhook        | `crates/core` (`notify`)       |
| Execute an action                      | `crates/core` (`action`)       |
| Write `staging/latest.json`            | `crates/core` (`output`)       |
| Dispatch the right pipeline per type   | `crates/core` (`runtime`)      |
| Parse CLI args, configure logging      | `crates/cli`                   |
| Cron scheduling                        | GitHub Action in user repo     |
| Domain-specific filtering or scoring   | User-repo plugin               |
| Branding, HTML, custom visualization   | User-repo `docs/`              |

The core never imports anything from a user repo. User repos depend on
`nano-zyrkel-core` via Cargo. Plugins are linked at compile time.

## Stable API surface

These items form the **v1 contract**. Breaking changes only happen on a
major version bump and are listed in `compatibility.json`.

- `nano_zyrkel_core::Runtime`
- `nano_zyrkel_core::RunOptions`
- `nano_zyrkel_core::HatConfig`
- `nano_zyrkel_core::HatType`
- `nano_zyrkel_core::Plugin` and `PluginContext`

The CLI surface is also stable:

```text
nano-zyrkel --config <PATH> [--lang de|en] [--dry-run] [--verbose] [--backfill <PATH>]
```

## Plugin lifecycle

A user-repo plugin can hook into four points of one run:

1. `on_init` — once at startup, after config is loaded.
2. `on_record` — for every record produced by the fetcher; return `false`
   to drop the record from the pipeline, or mutate it in place.
3. `on_pre_action` — once before any notification/action is dispatched.
4. `on_finish` — once at the very end, regardless of success.

All hooks have default no-op implementations so a plugin only overrides what
it cares about. See `crates/core/src/plugin.rs` for the full trait.

## Versioning

The binary release line is tagged `bin-vX.Y.Z`. The companion WASM core
(separate repo, see the project plan) is tagged independently as
`wasm-vX.Y.Z`. User repos pin both versions in
`.nano-zyrkel-versions.json` and the update-core reusable workflow uses the
matrices in each `compatibility.json` to decide when an upgrade is safe to
apply automatically.
