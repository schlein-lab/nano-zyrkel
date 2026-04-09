<p align="center">
  <strong>nano-zyrkel</strong><br>
  <em>Autonomous micro-agents that live in GitHub repos and run 24/7 on Actions — no server required.</em>
</p>

<p align="center">
  <a href="https://github.com/schlein-lab/nano-zyrkel/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/schlein-lab/nano-zyrkel/actions"><img src="https://img.shields.io/github/actions/workflow/status/schlein-lab/nano-zyrkel/run.yml?label=build" alt="Build"></a>
  <img src="https://img.shields.io/badge/lang-Rust-orange.svg" alt="Rust">
  <img src="https://img.shields.io/badge/runtime-GitHub%20Actions-2088FF.svg" alt="GitHub Actions">
</p>

---

A **nano-zyrkel** is a lightweight, config-driven agent that monitors websites, tracks data, enforces deadlines, and takes autonomous action — all from a single GitHub repository. One repo = one agent. GitHub Actions = free 24/7 runtime. Git commits = built-in audit trail.

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions (cron)                                  │
│                                                         │
│  ┌──────┐   ┌──────────┐   ┌────────┐   ┌───────────┐  │
│  │ Fetch │──▶│ Evaluate │──▶│ Output │──▶│  Notify   │  │
│  │  URL  │   │Condition │   │staging/│   │ Telegram  │  │
│  └──────┘   └──────────┘   └────────┘   └───────────┘  │
│                  │                            │          │
│                  ▼                            ▼          │
│           ┌──────────┐                ┌────────────┐    │
│           │  Action  │                │ Git Commit  │    │
│           │(optional)│                │   (auto)    │    │
│           └──────────┘                └────────────┘    │
└─────────────────────────────────────────────────────────┘
```

1. **Cron triggers** the workflow on schedule
2. **Fetch** — pull content from any URL (HTTP, API, RSS, headless browser)
3. **Evaluate** — check a condition (text match, regex, CSS selector, JSONPath, LLM, change detection)
4. **Output** — write results to `staging/` (versioned as git commits)
5. **Notify** — send Telegram/email alerts on match
6. **Action** — optionally fire webhooks, create GitHub issues, trigger other agents

## Repository Structure

```
my-nano-zyrkel/
├── .github/workflows/run.yml    # Cron schedule
├── hats/config.json             # Mission config (what to watch, how to react)
├── staging/                     # Results (auto-committed each run)
│   └── my-task/
│       ├── latest.json          # Most recent result
│       ├── history.jsonl        # Full time series
│       └── state.json           # Runtime state (hashes, counters)
└── README.md
```

## Quick Start

### 1. Create a GitHub repo

Create a new repo (or fork an existing nano-zyrkel).

### 2. Add secrets

Under **Settings → Secrets → Actions**:

| Secret | Purpose | Required |
|--------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token (via [@BotFather](https://t.me/BotFather)) | Yes |
| `TELEGRAM_CHAT_ID` | Target chat for notifications | Yes |
| `GH_TOKEN` | GitHub PAT (for issue/PR actions) | Optional |
| `ANTHROPIC_API_KEY` | Anthropic API key (for LLM conditions) | Optional |

### 3. Create a hat config

A "hat" defines the agent's mission. Save as `hats/config.json`:

```json
{
  "id": "my-watcher",
  "description": "Watch a page for changes",
  "type": "watcher",
  "source": {
    "url": "https://example.com/status",
    "method": "GET"
  },
  "condition": {
    "type": "contains",
    "value": "available"
  },
  "notify": { "telegram": true },
  "output_dir": "staging",
  "lang": "en"
}
```

### 4. Add the workflow

Save as `.github/workflows/run.yml`:

```yaml
name: nano-zyrkel
on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download nano-zyrkel
        run: |
          curl -sL https://github.com/schlein-lab/nano-zyrkel/releases/latest/download/nano-zyrkel-linux-x64 -o nano-zyrkel
          chmod +x nano-zyrkel

      - name: Run
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
        run: ./nano-zyrkel --config hats/config.json

      - name: Commit results
        run: |
          git config user.name "nano-zyrkel[bot]"
          git config user.email "bot@nano-zyrkel.dev"
          git add staging/
          git diff --staged --quiet || git commit -m "run $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push
```

### 5. Push

```bash
git add . && git commit -m "init nano-zyrkel" && git push
```

Your agent is now running every 15 minutes on GitHub Actions.

---

## Hat Types

| Type | Purpose | Use Case |
|------|---------|----------|
| `watcher` | Alert when a condition is met | "Notify me when this page says *available*" |
| `tracker` | Extract a value, build a time series | "Track this product's price daily" |
| `deadline` | Countdown with staged reminders | "Remind me 30, 14, 7, 3, 1 days before" |
| `crawler` | Collect data from multiple sources | Aggregate feeds, APIs, pages |
| `guardian` | Detect changes against a baseline | "Alert if this page changes significantly" |

## Condition Types

| Condition | LLM? | Description |
|-----------|-------|-------------|
| `contains` | No | Text substring match (supports `negate`) |
| `regex` | No | Rust regex pattern match |
| `css_selector` | No | HTML element lookup, optional attribute extraction |
| `json_path` | No | JSONPath query against API responses |
| `rss_new_entry` | No | New RSS/Atom feed entry (stateful) |
| `changed` | No | SHA-256 content diff with optional threshold |
| `extract_value` | No | Numeric value extraction via CSS selector |
| `deadline_date` | No | Days-until-deadline countdown |
| `llm` | Yes | Natural language question answered by an LLM |

## Action Types

Actions are optional — without one, the agent only notifies.

| Action | Description |
|--------|-------------|
| `http_request` | Fire a webhook (POST, PUT, PATCH, DELETE) |
| `github_issue` | Create a GitHub issue on match |
| `github_pr` | Create a pull request with file changes |
| `trigger_hat` | Trigger another nano-zyrkel's workflow |
| `publish_api` | Copy results to `api/` for GitHub Pages |
| `shell` | Run a shell command on the Actions runner |
| `cloud_bus` | Post to the Zyrkel message bus |
| `chain` | Execute multiple actions sequentially |

All templates support placeholders: `{id}`, `{description}`, `{summary}`, `{url}`, `{value}`.

## Approval Levels

Control whether actions require confirmation before execution.

| Level | Behavior |
|-------|----------|
| `none` | Execute immediately |
| `log_only` | Execute and log — **default** |
| `ask_first` | Ask via Telegram before executing (5 min timeout, inline buttons) |
| `within_budget` | Execute only within a configured cost budget |

## LLM Integration

For `llm` conditions, nano-zyrkel tries these backends in order:

| Priority | Backend | Mode | Requirement |
|----------|---------|------|-------------|
| 1 | Codex CLI | Sync | `codex` installed |
| 2 | Email relay | Async | SMTP/IMAP + Zyrkel Headless |
| 3 | Cloudflare Bus | Async | `ZYRKEL_BUS_URL` |
| 4 | Anthropic API | Sync | `ANTHROPIC_API_KEY` |

The LLM returns `{"match": true, "summary": "..."}`. Use `"model": "haiku"` for cheap/fast evaluations.

## CLI Reference

```
nano-zyrkel [OPTIONS]

Options:
  -c, --config <PATH>    Path to hat config JSON (required)
  -l, --lang <LANG>      Language: en, de (default: de)
      --dry-run           Test mode — no notifications, no commits
      --backfill          Bulk import historical data
  -v, --verbose           Verbose logging
  -h, --help              Show help
```

## Config Schema

<details>
<summary>Full hat config reference (click to expand)</summary>

```json
{
  "id": "string",
  "description": "string",
  "type": "watcher | tracker | deadline | crawler | guardian",

  "source": {
    "url": "https://...",
    "method": "GET",
    "headers": {},
    "body": "",
    "needs_browser": false
  },

  "condition": {
    "type": "contains | regex | css_selector | json_path | rss_new_entry | changed | extract_value | deadline_date | llm"
  },

  "notify": {
    "telegram": true,
    "email": false,
    "message": "Custom template with {placeholders}",
    "include_extracted": false
  },

  "action": {
    "type": "http_request | github_issue | github_pr | trigger_hat | publish_api | shell | cloud_bus | chain"
  },

  "approval": "none | log_only | ask_first",
  "output_dir": "staging",
  "ttl": "2026-12-31",
  "lang": "en"
}
```

</details>

## Ecosystem

nano-zyrkel powers a growing collection of specialized agents:

| Agent | Description | Links |
|-------|-------------|-------|
| **vusTracker** | ClinVar variant intelligence — 4.4M variants, gene dashboards, HPO phenotype search | [Repo](https://github.com/schlein-lab/nano-zyrkel-vusTracker) · [Live](https://schlein-lab.github.io/nano-zyrkel-vusTracker/) |
| **Helix** | Interactive human genetics teaching suite — 10 WASM-powered modules | [Repo](https://github.com/schlein-lab/nano-zyrkel-helix) · [Live](https://schlein-lab.github.io/nano-zyrkel-helix/) |
| **Showcase** | Cinematic widget portal for all nano-zyrkels | [Repo](https://github.com/schlein-lab/nano-zyrkel-showcase) · [Live](https://schlein-lab.github.io/nano-zyrkel-showcase/) |
| **Incoming** | Security-hardened public ingress channel (zero-trust) | [Repo](https://github.com/schlein-lab/nano-zyrkel-incoming) |
| **literatureAlert** | PubMed / bioRxiv / medRxiv daily digest | Private |
| **maildesk** | Semi-autonomous email agent with Telegram approval | Private |

## Zyrkel Headless Integration

When used as part of the [Zyrkel](https://zyrkel.com) desktop agent system:

- **Auto-discovery** — Headless scans GitHub for `nano-zyrkel-*` repos
- **Dashboard** — live status, results, and run statistics for all agents
- **Spawn from chat** — *"Create a nano-zyrkel that watches example.com"* → repo + config + workflow + secrets
- **Findings ingestion** — agent results feed into the Zyrkel knowledge base
- **Message bus** — bidirectional communication between agents and Headless

## Build from Source

```bash
cargo build --release
```

For WASM targets (used by vusTracker, Helix):

```bash
cargo build --release --target wasm32-unknown-unknown --features wasm
```

## License

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://zyrkel.com">Schlein Lab</a> — autonomous agents for computational biology.
</p>
