<p align="center">
  <strong>nano-zyrkel</strong><br>
  <em>Autonomous micro-agents that live in GitHub repos and run on Actions — no server required.</em>
</p>

<p align="center">
  <a href="https://github.com/schlein-lab/nano-zyrkel/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/schlein-lab/nano-zyrkel/releases"><img src="https://img.shields.io/github/v/release/schlein-lab/nano-zyrkel?sort=semver" alt="Release"></a>
  <img src="https://img.shields.io/badge/lang-Rust-orange.svg" alt="Rust">
  <img src="https://img.shields.io/badge/runtime-GitHub%20Actions-2088FF.svg" alt="GitHub Actions">
</p>

---

**One repo = one agent. GitHub Actions = the runtime. Git commits = the audit trail.**

A nano-zyrkel is a small, config-driven agent that lives in a GitHub repository
and does one thing well — monitor a feed, track a dataset, watch a website,
process incoming email, render a dashboard. The Rust binary that runs the
pipeline and the WebAssembly library that powers in-browser logic both live in
**this** central repo, behind stable, semver-versioned APIs. Your nano-zyrkel
repo pulls them in, pins a version, and ships.

---

## Architecture at a glance

```
┌──────────────────────────────────────────────────────────────────┐
│  CENTRAL — schlein-lab/nano-zyrkel (this repo, versioned)        │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐     │
│  │ crates/core  │   │ crates/cli   │   │ crates/wasm-core │     │
│  │              │   │              │   │                  │     │
│  │  Library:    │   │ Thin binary  │   │  Browser         │     │
│  │  Config,     │──▶│ that calls   │   │  building blocks │     │
│  │  Fetch,      │   │ Runtime      │   │  (DataLoader,    │     │
│  │  Condition,  │   │              │   │   Filter,        │     │
│  │  Notify,     │   └──────┬───────┘   │   Stats, Charts, │     │
│  │  Action,     │          │           │   ConfigReader)  │     │
│  │  Runtime,    │          │           │                  │     │
│  │  Plugin      │          │           └────────┬─────────┘     │
│  └──────────────┘          │                    │                │
│                            │                    │                │
│   bin-vX.Y.Z release       │     wasm-vX.Y.Z release             │
│   (Linux/macOS/Windows)    │     (4 feature profiles)            │
│                            │                    │                │
└────────────────────────────┼────────────────────┼────────────────┘
                             │                    │
        ┌────────────────────┴──────┐  ┌──────────┴──────────┐
        ▼                           ▼  ▼                     │
┌────────────────────┐   ┌────────────────────┐   ┌──────────────────┐
│  YOUR data agent   │   │  YOUR full app     │   │  YOUR browser    │
│  Cron pulls binary │   │  Binary on cron    │   │  app             │
│  Commits results   │   │  + WASM dashboard  │   │  WASM only       │
└────────────────────┘   └────────────────────┘   └──────────────────┘
```

There are **two cores**, both released from this repo independently:

1. **Binary core** (`bin-vX.Y.Z`) — pre-built executables that run on a
   GitHub Actions cron, fetch data, evaluate conditions, send notifications.
2. **WASM core** (`wasm-vX.Y.Z`) — a Rust → WebAssembly library with generic
   browser-side primitives: data loading, filtering, aggregation, statistics,
   caching, and a chart kit.

Your nano-zyrkel repo picks **one or both** and pins the version.

---

## Which core do you need?

| You want to…                                                 | Use      | Recommended scaffold              |
| ------------------------------------------------------------ | -------- | --------------------------------- |
| Watch a website / API on a schedule and send a Telegram ping | binary   | `scaffold-data-pipeline`          |
| Run a literature alert from your inbox                       | binary   | `scaffold-data-pipeline`          |
| Track a dataset and serve an interactive dashboard           | both     | `scaffold-interactive-app`        |
| Build a portal / showcase / single-page WASM experience      | WASM     | `scaffold-showcase`               |
| Embed a chart inside an existing website                     | WASM     | copy from `templates/examples/`   |

If you are not sure, **start with `scaffold-interactive-app`** — it covers the
common case (cron-driven data + browser dashboard) and you can drop the parts
you do not need.

---

## Quick start: which audience are you?

### A. You only need the binary (data pipelines, watchers, trackers)

```bash
# 1. Create your repo from the data-pipeline scaffold
gh repo create my-tracker \
  --template schlein-lab/nano-zyrkel-scaffold-data-pipeline

# 2. Edit hats/config.json — what to fetch, when, who to notify
$EDITOR my-tracker/hats/config.json

# 3. Set the secrets the workflow needs
gh secret set TELEGRAM_BOT_TOKEN -R my-tracker
gh secret set TELEGRAM_CHAT_ID   -R my-tracker

# 4. Push and you are live
cd my-tracker && git push
```

The bundled `update-core.yml` workflow opens a PR every Monday with the latest
compatible binary release. You merge the PR — that is your upgrade.

### B. You only need WASM (browser apps, showcases, dashboards)

```bash
# 1. Create your repo from the showcase scaffold
gh repo create my-portal \
  --template schlein-lab/nano-zyrkel-scaffold-showcase

# 2. List your widgets in hats/config.json
$EDITOR my-portal/hats/config.json

# 3. (Optional) Pick one of the bundled themes for the look
cp -r templates/themes/theme-cinematic/docs/* my-portal/docs/

# 4. Push — GitHub Actions builds the WASM and deploys docs/ to Pages
cd my-portal && git push
```

If your portal needs domain-specific WASM logic on top of the central core
(your own particle system, your own custom chart, your own visualization),
add a `crates/app/` to your repo, depend on `nano-zyrkel-wasm-core` from this
repo via Cargo, and import `init` for both bundles in your `docs/app.js`.
The [showcase repo](https://github.com/schlein-lab/nano-zyrkel-showcase) is
the reference implementation of this pattern.

### C. You need both (the typical case)

```bash
# 1. Create your repo from the interactive-app scaffold
gh repo create my-app \
  --template schlein-lab/nano-zyrkel-scaffold-interactive-app

# 2. Edit hats/config.json — read by both binary and WASM
$EDITOR my-app/hats/config.json

# 3. Pick a theme for the dashboard
cp -r templates/themes/theme-clinical/docs/* my-app/docs/

# 4. (Optional) Add your domain logic as a Plugin
mkdir -p my-app/crates/plugin/src
$EDITOR my-app/crates/plugin/src/lib.rs

# 5. Push
cd my-app && git push
```

Three workflows kick in automatically:

- `data-update.yml` — runs the binary on cron, commits `staging/`.
- `deploy.yml` — publishes `docs/` to GitHub Pages.
- `update-core.yml` — opens auto-PRs for binary + WASM upgrades.

---

## Templates

Everything in [`templates/`](templates) is **forkable, never linked code**.
Once you copy a template into your repo, the update workflow will not touch
it — the central core can ship updates without overwriting your branding,
your charts, or your custom logic.

Three families:

### Scaffolds — complete starter repos

| Scaffold                              | Use it for                                  |
| ------------------------------------- | ------------------------------------------- |
| [`scaffold-data-pipeline`][sd]        | Cron binary, no browser, no WASM            |
| [`scaffold-interactive-app`][si]      | Binary + WASM dashboard (the typical case)  |
| [`scaffold-showcase`][ss]             | Pure browser app, no binary, no cron        |

### Themes — drop-in HTML+CSS designs

| Theme              | When to use it                                 |
| ------------------ | ---------------------------------------------- |
| [`theme-clinical`][tc] | Medical / scientific dashboards            |
| [`theme-dashboard`][td]| Monitoring, status pages, watcher boards   |
| [`theme-magazine`][tm] | Newsletters and curation outputs           |
| [`theme-minimal`][tn]  | Status pages and short briefs              |
| [`theme-cinematic`][tcin]| Showcase portals and demo pages          |

Copy a theme's `docs/` into your repo and edit it freely. The CSS variables at
the top of every theme stylesheet are the easiest way to re-skin without
touching layout.

### Examples — copy-paste chart cookbook

| Example                          | What it shows                                |
| -------------------------------- | -------------------------------------------- |
| [`example-time-series`][et]      | LineChart with grid, axis, tooltip           |
| [`example-overview-cards`][eo]   | Stat cards with mini Donut + Format          |
| [`example-data-table`][ed]       | SearchIndex + Filter + sortable table        |
| [`example-geographic`][eg]       | WorldMap choropleth + Legend                 |
| [`example-genome-track`][egt]    | LinearTrack with zoom controls               |
| [`example-network-graph`][en]    | NetworkGraph with force layout               |

Each example is a single, runnable HTML file that imports `wasm-core` and
draws one chart end-to-end. Copy what you need into your repo's `docs/`.

[sd]: templates/scaffolds/scaffold-data-pipeline
[si]: templates/scaffolds/scaffold-interactive-app
[ss]: templates/scaffolds/scaffold-showcase
[tc]: templates/themes/theme-clinical
[td]: templates/themes/theme-dashboard
[tm]: templates/themes/theme-magazine
[tn]: templates/themes/theme-minimal
[tcin]: templates/themes/theme-cinematic
[et]: templates/examples/example-time-series
[eo]: templates/examples/example-overview-cards
[ed]: templates/examples/example-data-table
[eg]: templates/examples/example-geographic
[egt]: templates/examples/example-genome-track
[en]: templates/examples/example-network-graph

---

## Stable APIs and versioning

Both cores follow strict semver. Items at the crate roots form the **v1
contract**: breaking changes only happen on a major bump and are listed in
[`compatibility.json`](compatibility.json).

**Binary CLI** (always works the same way):

```bash
nano-zyrkel run --config hats/config.json [--lang de|en] [--dry-run] [--verbose]
nano-zyrkel validate --config hats/config.json
nano-zyrkel --version
```

**Library** (for user repos that ship a custom plugin):

```rust
use nano_zyrkel_core::{HatConfig, HatType, Runtime, RunOptions, Plugin, PluginContext};
```

**WASM** (for browser-side glue code):

```js
import init, {
  DataLoader, ConfigReader, Filter, Aggregator, Stats, Cache, I18n,
  ChartCanvas, Padding, Scale, draw_y_grid, draw_x_axis,
  LineChart, BarChart, Donut, Tooltip,
  ScatterPlot, Histogram, Heatmap, SortedBar, Legend, EmptyState,
  LinearTrack, NetworkGraph, WorldMap,
} from './wasm/core/nano_zyrkel_wasm_core.js';
```

Your nano-zyrkel repo pins both versions in `.nano-zyrkel-versions.json`:

```json
{
  "binary": "v0.1.0",
  "wasm": "v0.1.0",
  "pinning": { "binary": "minor", "wasm": "minor" }
}
```

`pinning` accepts `exact`, `patch`, `minor` or `latest`. The
[`update-core` reusable workflow][update] reads this file every week,
asks the central repo for the latest matching releases and opens a pull
request — you merge to apply the upgrade. Breaking changes are skipped and
posted as an issue with a migration guide instead.

[update]: .github/workflows/update-core.yml

---

## How a run works

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions (cron)                                  │
│                                                         │
│  ┌──────┐   ┌──────────┐   ┌────────┐   ┌───────────┐   │
│  │ Fetch│──▶│ Evaluate │──▶│ Output │──▶│  Notify   │   │
│  │  URL │   │ Condition│   │staging/│   │ Telegram  │   │
│  └──────┘   └──────────┘   └────────┘   └───────────┘   │
│                  │                            │         │
│                  ▼                            ▼         │
│           ┌──────────┐                ┌────────────┐    │
│           │  Action  │                │ Git Commit │    │
│           │(optional)│                │   (auto)   │    │
│           └──────────┘                └────────────┘    │
└─────────────────────────────────────────────────────────┘
```

1. **Cron triggers** the workflow on schedule.
2. **Fetch** — pull content from any URL (HTTP, API, RSS, JSONPath, IMAP, headless browser).
3. **Evaluate** — check a condition (text match, regex, CSS selector, change detection, LLM).
4. **Output** — write results to `staging/` (versioned via git commits).
5. **Notify** — send Telegram or email alerts on match.
6. **Action** — optionally fire webhooks, create GitHub issues, trigger other agents.

### Repository layout for a typical user repo

```
my-nano-zyrkel/
├── hats/config.json             # Mission config (the only file you edit)
├── .nano-zyrkel-versions.json   # Pinned core versions
├── core/
│   ├── bin/nano-zyrkel          # Pulled in by update-core.yml
│   └── wasm/                    # Pulled in by update-core.yml
├── docs/                        # Theme + chart glue (for browser apps)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── crates/plugin/               # Optional Rust plugin for domain logic
│   ├── Cargo.toml
│   └── src/lib.rs
├── staging/                     # Auto-committed run output
└── .github/workflows/
    ├── data-update.yml          # Cron call to the binary
    ├── deploy.yml               # Pages publish
    └── update-core.yml          # Weekly auto-PR for upgrades
```

---

## Plugins (optional)

If `hats/config.json` cannot express what your nano-zyrkel needs, write a
plugin instead of forking the core. Add a Rust crate under `crates/plugin/`
in your repo, depend on `nano-zyrkel-core` and implement the [`Plugin`]
trait. See [`docs/plugin-guide.md`][pg] for the full walkthrough — most
nano-zyrkels never need a plugin at all.

[`Plugin`]: crates/core/src/plugin.rs
[pg]: docs/plugin-guide.md

```rust
use nano_zyrkel_core::{Plugin, PluginContext};
use serde_json::Value;

#[derive(Default)]
pub struct DomainFilter;

impl Plugin for DomainFilter {
    fn name(&self) -> &str { "domain-filter" }
    fn on_record(&self, _ctx: &mut PluginContext, record: &mut Value) -> bool {
        // mutate `record` in place to enrich, return false to drop it
        true
    }
}
```

---

## Live examples

| Repo                                         | Pattern                  | What it does                              |
| -------------------------------------------- | ------------------------ | ----------------------------------------- |
| [`nano-zyrkel-vusTracker`][vt]               | binary + own WASM        | ClinVar VUS reclassification tracker      |
| [`nano-zyrkel-helix`][hx]                    | WASM (+ optional binary) | Interactive human genetics teaching suite |
| [`nano-zyrkel-showcase`][sc]                 | WASM only                | Cinematic portal for the ecosystem        |

Each repo is a real, running deployment of the patterns described above —
read their `Cargo.toml`, `.nano-zyrkel-versions.json` and
`.github/workflows/` to see how the pieces fit together.

[vt]: https://github.com/schlein-lab/nano-zyrkel-vusTracker
[hx]: https://github.com/schlein-lab/nano-zyrkel-helix
[sc]: https://github.com/schlein-lab/nano-zyrkel-showcase

---

## Documentation map

| File                              | Read it when…                                       |
| --------------------------------- | --------------------------------------------------- |
| [`docs/architecture.md`][da]      | …you want the layered design in detail              |
| [`docs/getting-started.md`][dg]   | …you are about to create your first nano-zyrkel    |
| [`docs/theming.md`][dt]           | …you want to customize the look of a dashboard      |
| [`docs/chart-cookbook.md`][dc]    | …you are wiring a chart and need a recipe           |
| [`docs/plugin-guide.md`][dp]      | …you outgrew config and need custom Rust            |
| [`compatibility.json`][cj]        | …you need the version matrix and breaking-change log|

[da]: docs/architecture.md
[dg]: docs/getting-started.md
[dt]: docs/theming.md
[dc]: docs/chart-cookbook.md
[dp]: docs/plugin-guide.md
[cj]: compatibility.json

---

## Build from source

This repo is a Cargo workspace with three crates:

- **`crates/core`** — `nano-zyrkel-core` library: config, fetchers,
  conditions, notifiers, actions, runtime, the `Plugin` trait.
- **`crates/cli`** — `nano-zyrkel` binary: a thin wrapper that parses CLI
  arguments and calls `Runtime::run()` from the core library.
- **`crates/wasm-core`** — `nano-zyrkel-wasm-core` library: browser-side
  data + visualization primitives, compiled to WebAssembly via `wasm-pack`.

```bash
# Build everything natively
cargo build --release

# Build the binary only
cargo build --release -p nano-zyrkel

# Build the WASM bundle (requires wasm-pack)
wasm-pack build crates/wasm-core --release --target web --features all
```

For most users, **you do not need to build anything**. The bundled releases
already give you everything you need:

- Binary releases for Linux, Windows and macOS (Intel + Apple Silicon)
  on every `bin-vX.Y.Z` tag.
- WASM bundles in four feature profiles (`data`, `viz-basic`, `viz-advanced`,
  `all`) on every `wasm-vX.Y.Z` tag.

---

## Recipes & patterns

### Cron patterns

```yaml
'*/15 * * * *'      # Every 15 minutes
'0 */2 * * *'       # Every 2 hours
'0 7 * * 1,5'       # Monday + Friday at 07:00 UTC
'0 6 * * *'         # Daily at 06:00 UTC
```

> GitHub deactivates cron workflows after 60 days of repo inactivity. Any
> push reactivates them.

### Test locally before deploying

```bash
NANO_SOURCE_FILE=local.html ./nano-zyrkel \
  --config hats/config.json \
  --dry-run --verbose
```

`--dry-run` skips notifications and writes nothing to `staging/`.
`NANO_SOURCE_FILE` short-circuits the fetch step so you can iterate against a
local snapshot.

### Force clean LLM output

LLMs tend to add explanations. Be explicit:

```
Respond with ONLY a JSON object: {"match": true/false, "summary": "..."}.
No explanation, no footnotes, no commentary.
```

### TTL — self-terminating agents

Set a `ttl` date in `hats/config.json` and the agent will refuse to run after
that date:

```json
{ "ttl": "2026-12-31" }
```

### Strip HTML before LLM analysis

```bash
sed 's/<[^>]*>//g; /^[[:space:]]*$/d' rendered.html > text-only.txt
```

### Git push from a workflow

The default `GITHUB_TOKEN` has no write permissions. Add this to your workflow:

```yaml
permissions:
  contents: write
```

…and use `git diff --staged --quiet ||` before `git commit` to avoid empty
commits.

---

## Troubleshooting

| Problem                                       | Cause                                                | Fix                                                              |
| --------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `line 1: Not: command not found`              | Binary is HTML (private repo, `curl` got a redirect) | Use `gh release download` instead of `curl`                      |
| `exit code 127`                               | Binary not executable                                | `chmod +x core/bin/nano-zyrkel`                                  |
| `git push` 403                                | No write permission                                  | Add `permissions: contents: write` to the workflow               |
| "No match" every run                          | Wrong condition, selector, or missing browser        | Use `--dry-run --verbose` and check with `NANO_SOURCE_FILE`      |
| SPA page is empty                             | JavaScript not rendered                              | Set `needs_browser: true` or use the headless browser            |
| Cron stopped running                          | Repo inactive for 60+ days                           | Push any commit to reactivate                                    |
| LLM returns prose instead of JSON             | Prompt not strict enough                             | Add "respond with ONLY JSON, no explanation"                     |
| `consecutive_errors` > 5                      | URL down, page changed, or rate limited              | Check the source URL manually, verify selectors                  |
| WASM 404 in browser                           | `update-core.yml` never ran                          | Trigger it once by hand: `gh workflow run update-core.yml`       |

---

## Security

- **Never put secrets in config files.** Use GitHub Secrets and pass them as
  environment variables in the workflow.
- **Use one API key per agent.** If one is compromised, others are unaffected.
- **Rotate `GH_TOKEN` and other long-lived tokens periodically.**
- **Use `"approval": "ask_first"` for any action that mutates external state.**
  The agent will send a Telegram message with approve / reject buttons and
  wait for your decision.
- **Restrict shell actions to a safe allow-list** if your nano-zyrkel runs
  generated commands. `bash`, `curl`, `jq`, `grep`, `sed`, `awk` are usually
  safe. Block `rm`, `mv`, `git push --force`, `ssh`, `sudo` and package
  installs unless you explicitly need them.
- **Set `permissions:` on every workflow to the minimum required.**

```yaml
permissions:
  contents: write   # Only if you commit staging/ results
```

---

## Lessons learned

Hard-won patterns from running nano-zyrkels in production.

### Configuration

- **One condition per agent.** Two simple nano-zyrkels are better than one
  complex config.
- **Prefer `contains` / `regex` over `llm`.** LLM conditions cost money per
  invocation; use them only when pattern matching cannot solve it.
- **`negate: true` is useful more often than you think.** "Notify me when X
  disappears" is the canonical case.
- **Test locally first** with `--dry-run --verbose` and `NANO_SOURCE_FILE`.

### Timing & scheduling

- **Stagger cron times** across your nano-zyrkels — running them all at minute
  zero hammers the same APIs at the same time.
- **Don't go below `*/5`** unless you really need to. GitHub rate-limits
  workflow scheduling, and target APIs do too.
- **Use absolute UTC** in cron expressions. GitHub Actions does not honor
  daylight saving.

### Output & data

- **`staging/` is your audit trail.** Don't `.gitignore` it — that is the
  whole point of the "GitHub repo as runtime" model.
- **Snapshot before parsing.** Save the raw fetch alongside the parsed result
  so you can replay the parser later if you change it.

### Error handling

- **Set `consecutive_errors` thresholds.** A nano-zyrkel that has failed five
  runs in a row is almost certainly broken upstream — don't keep notifying.
- **Always wrap actions with `dry_run`.** Test the action logic before the
  side effects ship.

---

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Part of the [nano-zyrkel](https://github.com/schlein-lab) ecosystem —
autonomous agents for computational biology and beyond. Built by
[Schlein Lab](https://zyrkel.com).</sub>
