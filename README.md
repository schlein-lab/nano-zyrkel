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

A **nano-zyrkel** is a lightweight, config-driven agent that monitors websites, tracks data, enforces deadlines, processes emails, and takes autonomous action — all from a single GitHub repository.

**One repo = one agent. GitHub Actions = free 24/7 runtime. Git commits = built-in audit trail.**

## Table of Contents

1. [How It Works](#how-it-works)
2. [Quick Start](#quick-start)
3. [Agent Types](#agent-types)
4. [Condition Types](#condition-types)
5. [Action Types](#action-types)
6. [Approval Levels](#approval-levels)
7. [Notifications](#notifications)
8. [LLM Integration](#llm-integration)
9. [Email / IMAP Integration](#email--imap-integration)
10. [Headless Browser](#headless-browser)
11. [Templates](#templates)
12. [CLI Reference](#cli-reference)
13. [Environment Variables](#environment-variables)
14. [State & Persistence](#state--persistence)
15. [Recipes & Patterns](#recipes--patterns)
16. [Troubleshooting](#troubleshooting)
17. [Building Your Own nano-zyrkel](#building-your-own-nano-zyrkel)
18. [Security Hardening](#security-hardening)
19. [Lessons Learned](#lessons-learned)
20. [Ecosystem](#ecosystem)
21. [Build from Source](#build-from-source)

---

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
2. **Fetch** — pull content from any URL (HTTP, API, RSS, or headless browser)
3. **Evaluate** — check a condition (text match, regex, CSS selector, JSONPath, LLM, change detection)
4. **Output** — write results to `staging/` (versioned as git commits)
5. **Notify** — send Telegram or email alerts on match
6. **Action** — optionally fire webhooks, create GitHub issues, trigger other agents

### Repository Structure

```
my-nano-zyrkel/
├── .github/workflows/run.yml    # Cron schedule
├── hats/config.json             # Mission config
├── scripts/                     # Optional helper scripts
├── staging/                     # Results (auto-committed each run)
│   └── my-task/
│       ├── latest.json          # Most recent result
│       ├── history.jsonl        # Full time series
│       └── state.json           # Runtime state (hashes, counters)
└── README.md
```

---

## Quick Start

### 1. Create a GitHub repo

Create a new repository (or use one of the [templates](#templates)).

### 2. Add secrets

Under **Settings → Secrets → Actions**:

| Secret | Purpose | Required |
|--------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token (via [@BotFather](https://t.me/BotFather)) | Yes |
| `TELEGRAM_CHAT_ID` | Target chat for notifications | Yes |
| `GH_TOKEN` | GitHub PAT for downloading the binary from a private release | If binary is private |

### 3. Create a config

Save as `hats/config.json`:

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

permissions:
  contents: write

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download nano-zyrkel
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
        run: |
          gh release download -R schlein-lab/nano-zyrkel -p "nano-zyrkel-linux" --clobber
          chmod +x nano-zyrkel-linux && mv nano-zyrkel-linux nano-zyrkel

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

### 5. Push and go

```bash
git add . && git commit -m "init nano-zyrkel" && git push
```

Your agent is now running every 15 minutes.

---

## Agent Types

| Type | Purpose | Use Case |
|------|---------|----------|
| `watcher` | Alert when a condition is met | "Notify me when this page says *available*" |
| `tracker` | Extract a value, build a time series | "Track this product's price daily" |
| `deadline` | Countdown with staged reminders | "Remind me 30, 14, 7, 3, 1 days before the deadline" |
| `crawler` | Collect data from multiple sources | Aggregate feeds, APIs, pages |
| `guardian` | Detect changes against a baseline | "Alert if this page changes more than 10%" |
| `literature_alert` | Daily literature digest from PubMed, bioRxiv, medRxiv, CrossRef | "Send me new papers about segmental duplications" |
| `maildesk` | Semi-autonomous email agent with Telegram approval | "Read my inbox, draft replies, wait for my OK" |
| `clinvar` | ClinVar variant submission tracker | "Track VUS reclassifications across all genes" |

### literature_alert

Polls PubMed, bioRxiv, medRxiv, and CrossRef for new publications matching configured keywords. Can run in two modes controlled by `RUN_MODE`:

- `crawl` — full multi-source search (default at 06:00 UTC)
- `poll` — quick IMAP check for email-triggered queries

```json
{
  "type": "literature_alert",
  "literature": {
    "keywords": ["segmental duplication", "IGHG gene"],
    "sources": ["pubmed", "biorxiv", "medrxiv", "crossref"],
    "max_results": 20
  }
}
```

### maildesk

Reads unseen emails via IMAP, uses an LLM to draft replies, sends the draft to Telegram for approval. Only sends the actual reply after `/approve <case-id>`.

```json
{
  "type": "maildesk",
  "maildesk": {
    "imap_host": "imap.gmail.com",
    "smtp_host": "smtp.gmail.com",
    "check_interval_secs": 300,
    "allowed_domains": ["example.com"]
  }
}
```

Required secrets: `SMTP_USER`, `SMTP_PASS`

### clinvar

Fetches new ClinVar submissions via NCBI E-Utilities, detects reclassifications, computes statistics (VUS half-life, concordance, drift), and generates an embeddable HTML widget.

```json
{
  "type": "clinvar",
  "clinvar": {
    "max_fetch": 500,
    "delay_ms": 350
  }
}
```

---

## Condition Types

| Condition | LLM? | Description |
|-----------|-------|-------------|
| `contains` | No | Text substring match. Set `negate: true` for "alert when text disappears" |
| `regex` | No | Rust regex pattern match |
| `css_selector` | No | HTML element lookup. Optional `extract` field for attribute extraction |
| `json_path` | No | JSONPath query against API responses. Optional `expected` value |
| `rss_new_entry` | No | New RSS/Atom feed entry (stateful, compares entry ID with last seen) |
| `changed` | No | SHA-256 content diff. Optional `selector` to scope, `threshold` (0.0–1.0) for sensitivity |
| `extract_value` | No | Numeric value extraction via CSS selector, with optional `unit` |
| `deadline_date` | No | Days-until-deadline countdown. Configurable `remind_at_days` array |
| `llm` | Yes | Natural language question answered by an LLM. Set `model: "haiku"` for cheap/fast |

### Example: Condition with negation

```json
{
  "condition": {
    "type": "contains",
    "value": "in stock",
    "negate": true
  }
}
```

This alerts when "in stock" **disappears** from the page.

---

## Action Types

Actions are optional. Without one, the agent only notifies on match.

| Action | Description |
|--------|-------------|
| `http_request` | Fire a webhook (POST, PUT, PATCH, DELETE) with templated body |
| `github_issue` | Create a GitHub issue with labels |
| `github_pr` | Create a pull request with file changes |
| `trigger_nano` | Trigger another nano-zyrkel's GitHub Actions workflow |
| `publish_api` | Copy results to `api/` for serving via GitHub Pages |
| `shell` | Run a shell command on the Actions runner (with configurable `timeout_secs`) |
| `cloud_bus` | Post to the Zyrkel Cloudflare message bus |
| `chain` | Execute multiple actions in sequence (stops on first failure) |

### Template placeholders

All action templates support these placeholders: `{id}`, `{description}`, `{summary}`, `{url}`, `{value}`.

### Example: Chain action

```json
{
  "action": {
    "type": "chain",
    "actions": [
      {
        "type": "http_request",
        "url": "https://example.com/api/webhook",
        "method": "POST",
        "body_template": "{\"event\": \"{summary}\"}",
        "content_type": "application/json"
      },
      {
        "type": "github_issue",
        "repo": "your-org/your-repo",
        "title": "Alert: {summary}",
        "labels": ["automated", "nano-zyrkel"]
      }
    ]
  }
}
```

---

## Approval Levels

Control whether actions require confirmation before execution.

| Level | Behavior |
|-------|----------|
| `none` | Execute immediately |
| `log_only` | Execute and log — **default** |
| `ask_first` | Ask via Telegram with inline buttons (5 min timeout, auto-reject) |
| `within_budget` | Execute only within a configured cost/currency budget |

```json
{ "approval": "ask_first" }
```

---

## Notifications

### Telegram (recommended)

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Get your chat ID: send a message to the bot, then call `https://api.telegram.org/bot<TOKEN>/getUpdates` and look for `chat.id`
3. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as GitHub Secrets

```json
{
  "notify": {
    "telegram": true,
    "message": "Alert from {id}: {summary}",
    "include_extracted": true
  }
}
```

### Email

Requires SMTP credentials as secrets (`SMTP_USER`, `SMTP_PASS`).

```json
{
  "notify": {
    "email": true
  }
}
```

### Custom message templates

| Placeholder | Value |
|------------|-------|
| `{id}` | Agent ID |
| `{description}` | Agent description |
| `{summary}` | Match summary |
| `{url}` | Source URL |
| `{value}` | Extracted value (trackers) |

---

## LLM Integration

For `llm` conditions, nano-zyrkel tries these backends in priority order:

| Priority | Backend | Mode | Requirement |
|----------|---------|------|-------------|
| 1 | Codex CLI | Sync | `codex` installed + `CODEX_AUTH` secret |
| 2 | Email relay | Async | SMTP/IMAP credentials + Zyrkel Headless running |
| 3 | Cloudflare Bus | Async | `ZYRKEL_BUS_URL` + `ZYRKEL_BUS_TOKEN` |
| 4 | Anthropic API | Sync | `ANTHROPIC_API_KEY` |

The LLM is asked to return JSON: `{"match": true, "summary": "..."}`. If it returns plain text, the agent heuristically checks for "yes"/"true".

### Using Codex CLI with ChatGPT Plus/Pro

Codex CLI works with your existing ChatGPT subscription — no separate API key needed.

```bash
npm install -g @openai/codex
codex login
cat ~/.codex/auth.json  # Save this as CODEX_AUTH secret
```

In your workflow:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
- env:
    CODEX_AUTH: ${{ secrets.CODEX_AUTH }}
  run: |
    npm install -g @openai/codex
    mkdir -p ~/.codex && echo "$CODEX_AUTH" > ~/.codex/auth.json
```

### Ad-hoc LLM analysis in workflows

You can also use Codex directly in workflow steps, outside of nano-zyrkel:

```yaml
- name: Analyze results
  run: |
    DATA=$(cat staging/my-agent/latest.json | head -c 6000)
    codex exec --skip-git-repo-check --ephemeral \
      -o staging/my-agent/analysis.txt \
      "Analyze this data. Output ONLY a markdown table: $DATA"
```

---

## Email / IMAP Integration

Several agent types use email as an input or output channel:

### Maildesk agent

Reads unseen emails via IMAP, drafts replies with an LLM, and requests approval via Telegram before sending.

Required secrets: `SMTP_USER`, `SMTP_PASS`

The IMAP/SMTP hosts default to `imap.gmail.com` / `smtp.gmail.com`. For Gmail, use an [App Password](https://myaccount.google.com/apppasswords) (not your regular password).

### Literature Alert (email-triggered queries)

In `poll` mode, the literature agent checks an IMAP inbox for new search requests and processes them.

### LLM Email Relay

nano-zyrkels without direct LLM access can send questions via SMTP to a shared mailbox. A running Zyrkel Headless instance reads the mailbox via IMAP, runs the LLM call, and pushes the answer as `staging/<id>/llm-answer.json` back to the repo.

Required secrets: `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `IMAP_HOST`, `NANO_ID`

### Sending HTML email reports

Use `curl` with SMTP in your workflow (no Python needed):

```yaml
- name: Send report
  env:
    SMTP_USER: ${{ secrets.SMTP_USER }}
    SMTP_PASS: ${{ secrets.SMTP_PASS }}
  run: |
    {
      printf 'From: nano-zyrkel <%s>\r\n' "$SMTP_USER"
      printf 'To: recipient@example.com\r\n'
      printf 'Subject: Report %s\r\n' "$(date -u +%Y-%m-%d)"
      printf 'MIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n'
      echo '<html><body><h2>Report</h2>'
      cat staging/my-agent/report.txt
      echo '</body></html>'
    } > /tmp/mail.eml
    curl -s --url "smtps://smtp.gmail.com:465" --ssl-reqd \
      --mail-from "$SMTP_USER" --mail-rcpt "recipient@example.com" \
      --user "$SMTP_USER:$SMTP_PASS" -T /tmp/mail.eml
```

> **Important:** Use `printf` + temp file, not heredocs — YAML misinterprets `<<`.

---

## Headless Browser

For JavaScript-heavy pages that don't work with plain HTTP fetching, set `needs_browser: true` in your source config:

```json
{
  "source": {
    "url": "https://spa-website.example.com",
    "needs_browser": true
  }
}
```

On GitHub Actions, Chrome is pre-installed. You can also render pages manually:

```yaml
- name: Render SPA
  run: |
    timeout 30 google-chrome --headless=new --disable-gpu --no-sandbox \
      --virtual-time-budget=10000 \
      --dump-dom "https://spa-website.example.com" > /tmp/rendered.html 2>/dev/null || true

- name: Run nano-zyrkel
  env:
    NANO_SOURCE_FILE: /tmp/rendered.html
  run: ./nano-zyrkel --config hats/config.json
```

---

## Templates

Ready-to-use workflow and repo templates in the `templates/` directory.

### Workflow Templates (`templates/workflows/`)

| Template | Use Case |
|----------|----------|
| `basic.yml` | Mechanical agents (watcher, tracker, guardian) — no LLM needed |
| `codex-llm.yml` | Agents with LLM conditions (uses Codex CLI) |
| `codex-email.yml` | LLM analysis + formatted HTML email report |
| `codex-maildesk.yml` | Semi-autonomous email agent (IMAP + Codex + Telegram approval) |

All templates use `{{PLACEHOLDER}}` variables. Replace before use:

| Placeholder | Example |
|-------------|---------|
| `{{NANO_ID}}` | `my-price-watcher` |
| `{{DESCRIPTION}}` | `Track GPU prices on Amazon` |
| `{{EMAIL_TO}}` | `you@example.com` |

### Repo Templates (`templates/repos/`)

| Template | Description |
|----------|-------------|
| `maildesk-codex-telegram/` | Complete repo scaffold for an email agent with Telegram approval flow |

### Example Configs (`examples/hats/`)

| Config | Type | Condition |
|--------|------|-----------|
| `watcher.json` | watcher | `contains` — simple text match |
| `tracker.json` | tracker | `extract_value` — numeric value extraction |
| `deadline.json` | deadline | `deadline_date` — countdown with reminders |
| `llm-watcher.json` | watcher | `llm` — natural language condition |

---

## CLI Reference

```
nano-zyrkel [OPTIONS]

Options:
  -c, --config <PATH>    Path to config JSON (required)
  -l, --lang <LANG>      Language: en, de (default: de)
      --dry-run           Test mode — no notifications, no commits
      --backfill <PATH>   Bulk import historical data (ClinVar: variant_summary.txt)
  -v, --verbose           Verbose logging
  -h, --help              Show help
```

---

## Environment Variables

| Variable | Purpose | Used By |
|----------|---------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token | All agents |
| `TELEGRAM_CHAT_ID` | Telegram target chat ID | All agents |
| `GH_TOKEN` / `GITHUB_TOKEN` | GitHub Personal Access Token | github_issue, github_pr, trigger_nano, binary download |
| `ANTHROPIC_API_KEY` | Anthropic API key | LLM conditions (fallback) |
| `OPENAI_API_KEY` | OpenAI API key | Codex CLI |
| `CODEX_AUTH` | Codex CLI auth JSON | LLM conditions via Codex |
| `SMTP_USER` | SMTP username (e.g. Gmail address) | Email notifications, maildesk, LLM relay |
| `SMTP_PASS` | SMTP password / app password | Email notifications, maildesk, LLM relay |
| `SMTP_HOST` | SMTP server (default: `smtp.gmail.com`) | Email sending |
| `IMAP_HOST` | IMAP server (default: `imap.gmail.com`) | Maildesk, LLM relay |
| `ZYRKEL_BUS_URL` | Zyrkel Cloudflare message bus URL | cloud_bus action, LLM relay |
| `ZYRKEL_BUS_TOKEN` | Message bus authentication token | cloud_bus action, LLM relay |
| `NANO_ID` | Agent identifier for LLM relay | LLM email relay |
| `NANO_SOURCE_FILE` | Local file path to use instead of HTTP fetch | Testing / headless browser |
| `RUN_MODE` | Override run mode (`crawl`, `poll`, `vus-watch`) | literature_alert, variant_classifier |
| `RUST_LOG` | Log level (e.g. `nano_zyrkel=debug`) | Debugging |

---

## State & Persistence

Each agent maintains state in `staging/<agent-id>/state.json`, persisted via git commits between runs.

| Field | Purpose |
|-------|---------|
| `last_check` | ISO 8601 timestamp of last run |
| `last_hash` | SHA-256 of last seen content (for change detection) |
| `last_value` | Last extracted value (for trackers) |
| `last_rss_id` | Last seen RSS entry GUID |
| `total_runs` | Total number of runs |
| `total_matches` | Total number of condition matches |
| `consecutive_errors` | Error counter (resets on success) |

Results are written to:
- `staging/<agent-id>/latest.json` — most recent result (overwritten each run)
- `staging/<agent-id>/history.jsonl` — append-only time series (one JSON line per run)

---

## Recipes & Patterns

Battle-tested patterns from production nano-zyrkels. See also [`docs/RECIPES.md`](docs/RECIPES.md) for the full collection.

### Download binary from private release

`curl` returns HTML for private repos. Use `gh release download` instead:

```yaml
- name: Get nano-zyrkel
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
  run: |
    gh release download -R schlein-lab/nano-zyrkel -p "nano-zyrkel-linux" --clobber
    chmod +x nano-zyrkel-linux && mv nano-zyrkel-linux nano-zyrkel
```

### Git push from workflow

The default `GITHUB_TOKEN` has no write permissions. Add this to your workflow:

```yaml
permissions:
  contents: write
```

And use `git diff --staged --quiet ||` before `git commit` to avoid empty commits.

### Cron patterns

```yaml
'*/15 * * * *'      # Every 15 minutes
'0 */2 * * *'       # Every 2 hours
'0 7 * * 1,5'       # Monday + Friday at 07:00 UTC
'*/30 5-9 * * 1-5'  # Weekdays 05:00-09:00, every 30 min
'0 6 * * *'         # Daily at 06:00 UTC
```

> GitHub deactivates cron workflows after 60 days of repo inactivity. Any push reactivates them.

### Force clean LLM output

LLMs tend to add explanations. Be explicit:

```
"Respond with ONLY a JSON object: {\"match\": true/false, \"summary\": \"...\"}. 
 No explanation, no footnotes, no commentary."
```

### Strip HTML for LLM analysis

```bash
sed 's/<[^>]*>//g; /^[[:space:]]*$/d' rendered.html > text-only.txt
```

### TTL — self-terminating agents

Set a `ttl` date and the agent will stop running after that date:

```json
{ "ttl": "2026-12-31" }
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `line 1: Not: command not found` | Binary is HTML (private repo, `curl` got a redirect) | Use `gh release download` instead of `curl` |
| `exit code 127` | Binary not executable | Add `chmod +x nano-zyrkel` |
| `git push` 403 | No write permission | Add `permissions: contents: write` to workflow |
| "No match" every run | Wrong condition, selector, or missing browser | Use `--dry-run --verbose` and check with `NANO_SOURCE_FILE` |
| SPA page is empty | JavaScript not rendered | Set `needs_browser: true` or use headless Chrome pre-rendering |
| Cron stopped running | Repo inactive for 60+ days | Push any commit to reactivate |
| LLM returns prose instead of JSON | Prompt not strict enough | Add "respond with ONLY JSON, no explanation" |
| `consecutive_errors` > 5 | URL down, page structure changed, or rate limited | Check source URL manually, verify selectors |
| Codex auth expired | Token rotated | Run `codex login` again, update `CODEX_AUTH` secret |
| Heredoc breaks YAML | YAML interprets `<<` | Use `printf` + temp file instead |

---

## Building Your Own nano-zyrkel

### The golden rule: don't touch the binary

The `nano-zyrkel` binary is a pre-compiled Rust executable that you download from GitHub Releases. **You never modify, rebuild, or fork it.** All customization happens through:

1. **Config files** (`hats/config.json`) — define what to watch, how to react
2. **Workflow files** (`.github/workflows/run.yml`) — define when to run, which secrets to pass
3. **Scripts** (`scripts/`) — optional helper scripts for pre/post-processing
4. **WASM modules** — for agents that serve interactive web frontends via GitHub Pages

Think of it like a game engine: the binary is the engine, your config is the game.

### Step-by-step: create a new nano-zyrkel

1. **Create a new GitHub repo** named `nano-zyrkel-<your-purpose>` (e.g. `nano-zyrkel-price-tracker`)
2. **Copy a workflow template** from `templates/workflows/` — choose `basic.yml` for simple agents or `codex-llm.yml` for LLM-powered ones
3. **Write your config** in `hats/config.json` — see the [example configs](examples/hats/) for starting points
4. **Set GitHub Secrets** — at minimum `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
5. **Push** — the agent starts running on schedule

### Building web frontends with WASM

nano-zyrkels can serve full interactive websites via GitHub Pages. The agent compiles to WASM and runs in the browser — see [vusTracker](https://schlein-lab.github.io/nano-zyrkel-vusTracker/) and [Helix](https://schlein-lab.github.io/nano-zyrkel-helix/) for examples, or the [Showcase](https://schlein-lab.github.io/nano-zyrkel-showcase/) for the portal.

To add a web frontend:
1. Put your HTML/JS/CSS in `web/` (or serve directly from the repo root on `gh-pages`)
2. If you need Rust logic in the browser, compile with `--features wasm` and use `wasm-bindgen`
3. Enable GitHub Pages on the `gh-pages` branch
4. The GitHub Actions workflow can build WASM and deploy to `gh-pages` automatically

### What goes where

| Directory | Purpose | Committed? |
|-----------|---------|------------|
| `hats/` | Agent config (JSON) | Yes |
| `staging/` | Runtime results, state, history | Yes (auto-committed by workflow) |
| `scripts/` | Helper scripts (bash, python) | Yes |
| `web/` | Web frontend (HTML/JS/CSS/WASM) | Yes |
| `.github/workflows/` | Cron schedule + CI/CD | Yes |

---

## Security Hardening

### Secrets management

- **Never put secrets in config files.** Use GitHub Secrets and pass them as environment variables in the workflow.
- **Use separate API keys per agent.** If one is compromised, others are unaffected.
- **Rotate tokens periodically.** Especially `GH_TOKEN` and `CODEX_AUTH`.

### Shell actions

If your agent uses `shell` actions (or LLM-generated scripts), restrict what commands are allowed:

**Safe (non-destructive, read-only):**
`bash`, `curl`, `jq`, `grep`, `sed`, `awk`, `cut`, `sort`, `head`, `tail`, `tr`, `wc`, `cat`

**Block (destructive or dangerous):**
`rm`, `mv`, `git push --force`, `ssh`, `sudo`, package installs, redirects to sensitive paths

Always set `timeout_secs` on shell actions to prevent runaway processes.

### Network access

- GitHub Actions runners have full internet access. If your agent makes HTTP requests, validate URLs in your config.
- For `http_request` actions, avoid templating user-controlled input directly into URLs (injection risk).

### Approval flow for critical actions

Use `"approval": "ask_first"` for any action that modifies external systems (creates issues, sends emails, triggers webhooks). The agent will send a Telegram message with approve/reject buttons and wait 5 minutes.

### Rate limiting

- GitHub Actions free tier: 2,000 minutes/month. A typical nano-zyrkel run takes 20-30 seconds.
- Don't set cron intervals below `*/5` — GitHub has API rate limits.
- Telegram: max 30 messages/second to the same chat.

### Repo permissions

Set your workflow permissions to the minimum required:

```yaml
permissions:
  contents: write   # Only if you need to commit staging/ results
```

---

## Lessons Learned

Hard-won patterns from running nano-zyrkels in production.

### Configuration

- **One condition per agent.** Keep configs simple. Two simple nano-zyrkels are better than one complex config.
- **Prefer `contains`/`regex` over `llm`.** LLM conditions cost money per invocation. Use them only when pattern matching can't solve it.
- **`negate: true` is your friend.** "Notify me when X disappears" is a very common use case — just negate a `contains` condition.
- **Test locally first.** Use `--dry-run --verbose` and `NANO_SOURCE_FILE=local.html` before deploying.

### Timing & scheduling

- **GitHub deactivates cron after 60 days of inactivity.** Any push reactivates it. Some nano-zyrkels commit to `staging/` every run, which keeps the repo active.
- **GitHub cron is not precise.** Expect up to 15 minutes of delay. Don't rely on exact timing.
- **Set `ttl` for temporary monitors.** If you only need to watch something until a certain date, the agent will auto-terminate.

### Output & data

- **`staging/` is your single source of truth.** All results, state, and history go here. It's auto-committed by the workflow.
- **`history.jsonl` is a time series.** Every run appends one JSON line. Great for analysis, charts, and auditing.
- **`latest.json` is always fresh.** Overwritten each run — use this for quick lookups.

### Error handling

- **Watch `consecutive_errors`.** More than 5 in a row usually means something fundamental broke (URL down, page structure changed, selector outdated).
- **Retry is built in.** HTTP fetches retry up to 3x with exponential backoff.
- **Don't panic on transient failures.** The agent runs on a schedule — a failed run will be retried next cycle.

### Browser mode

- **Only use `needs_browser: true` when necessary.** It requires Chromium, is slower, and uses more Actions minutes.
- **Most APIs and static pages don't need a browser.** Try without first.
- **SPAs with AJAX need real network time.** `virtual-time-budget` only simulates JS time — for API-heavy SPAs, consider fetching the API directly.

### LLM tips

- **Be extremely specific in LLM prompts.** "Respond with ONLY JSON" is not enough — add "no explanation, no footnotes, no commentary."
- **Use `model: "haiku"` for simple yes/no questions.** It's fast and cheap.
- **The Codex CLI fallback chain works.** Codex → email relay → CF Bus → Anthropic API. Configure what you have, the agent tries them in order.

### Maildesk security

- **Always use `allowed_domains` or `allowed_addresses`** to restrict which emails the agent processes.
- **The Telegram approval step is non-negotiable** for any agent that sends emails on your behalf.
- **Never auto-approve email replies.** Even with good LLM drafts, a human must confirm.

---

## Ecosystem

nano-zyrkel powers a collection of specialized agents:

| Agent | Description | Links |
|-------|-------------|-------|
| **vusTracker** | ClinVar variant intelligence — 4.4M variants, gene dashboards, HPO phenotype search | [Repo](https://github.com/schlein-lab/nano-zyrkel-vusTracker) · [Live](https://schlein-lab.github.io/nano-zyrkel-vusTracker/) |
| **Helix** | Interactive human genetics teaching suite — 10 WASM-powered modules | [Repo](https://github.com/schlein-lab/nano-zyrkel-helix) · [Live](https://schlein-lab.github.io/nano-zyrkel-helix/) |
| **Showcase** | Cinematic widget portal for all nano-zyrkels | [Repo](https://github.com/schlein-lab/nano-zyrkel-showcase) · [Live](https://schlein-lab.github.io/nano-zyrkel-showcase/) |
| **Incoming** | Security-hardened public ingress channel (zero-trust) | [Repo](https://github.com/schlein-lab/nano-zyrkel-incoming) |

### Zyrkel Headless Integration

When used as part of the [Zyrkel](https://zyrkel.com) desktop agent system:

- **Auto-discovery** — Headless scans GitHub for `nano-zyrkel-*` repos
- **Dashboard** — live status, results, and run statistics
- **Spawn from chat** — *"Create a nano-zyrkel that watches example.com"* → generates repo + config + workflow + secrets
- **Findings ingestion** — agent results feed into the Zyrkel knowledge base
- **Message bus** — bidirectional communication between agents and Headless

---

## Build from Source

This repo is a Cargo workspace with two crates:

- **`crates/core`** — `nano-zyrkel-core` library: config, fetchers, conditions,
  notifiers, actions, runtime, and the `Plugin` trait that user repos use to
  inject domain-specific behavior.
- **`crates/cli`** — `nano-zyrkel` binary: a thin wrapper that parses CLI
  arguments and calls `Runtime::run()` from the core library.

```bash
# Build everything
cargo build --release

# Build only the binary (skips library tests)
cargo build --release -p nano-zyrkel

# Run the binary against a config
./target/release/nano-zyrkel --config hats/config.json
```

User repos that need custom domain logic should depend on the **library**
rather than invoking the CLI:

```toml
# In your user repo's Cargo.toml
[dependencies]
nano-zyrkel-core = { git = "https://github.com/schlein-lab/nano-zyrkel", tag = "bin-v0.1.0" }
```

Then implement the `Plugin` trait and register your plugin with `Runtime`
before calling `run()`. See [docs/architecture.md](docs/architecture.md) for
the full layered design.

### Releases

Pre-built binaries for Linux (x86_64, aarch64), macOS (Intel + Apple Silicon)
and Windows are attached to every `bin-v*` GitHub Release. User repos can pull
them directly via the update-core reusable workflow without needing a Rust
toolchain on the runner.

<details>
<summary>Full config schema reference (click to expand)</summary>

```json
{
  "id": "string (required)",
  "description": "string (required)",
  "type": "watcher | tracker | deadline | crawler | guardian | literature_alert | maildesk | clinvar",

  "source": {
    "url": "https://...",
    "method": "GET | POST",
    "headers": { "Authorization": "Bearer ${TOKEN}" },
    "body": "optional POST body",
    "needs_browser": false
  },

  "condition": {
    "type": "contains | regex | css_selector | json_path | rss_new_entry | changed | extract_value | deadline_date | llm"
  },

  "literature": {
    "keywords": ["term1", "term2"],
    "sources": ["pubmed", "biorxiv", "medrxiv", "crossref"],
    "max_results": 20
  },

  "maildesk": {
    "imap_host": "imap.gmail.com",
    "smtp_host": "smtp.gmail.com",
    "check_interval_secs": 300,
    "allowed_domains": []
  },

  "clinvar": {
    "max_fetch": 500,
    "delay_ms": 350
  },

  "notify": {
    "telegram": true,
    "email": false,
    "message": "Custom template with {placeholders}",
    "include_extracted": false
  },

  "action": {
    "type": "http_request | github_issue | github_pr | trigger_nano | publish_api | shell | cloud_bus | chain"
  },

  "approval": "none | log_only | ask_first",
  "output_dir": "staging",
  "ttl": "2026-12-31",
  "lang": "en"
}
```

</details>

---

## License

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://zyrkel.com">Schlein Lab</a> — autonomous agents for computational biology.
</p>
