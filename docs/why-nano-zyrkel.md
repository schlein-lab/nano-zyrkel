# Why nano-zyrkel?

Most projects that need "an agent that watches a thing and notifies someone"
end up reinventing the same five layers from scratch: a scheduler, an HTTP
fetcher, a state file, a notifier, and a tiny static website to look at the
result. nano-zyrkel is a deliberate attempt to ship those five layers as a
single coherent SDK so you can stop writing them.

This page exists because the framing question developers usually ask is not
"how does nano-zyrkel work?" but "why would I pick this over $X". Here are
the comparisons.

## What nano-zyrkel is

- A **Rust binary** that runs on a schedule (typically a GitHub Actions
  cron) and walks through fetch → check → notify → act.
- A **WebAssembly library** that ships data, charting and UI primitives the
  static site can use to render whatever the binary produced.
- A **template library** of scaffolds, themes and examples a builder UI can
  expand into a fresh repo.
- A **versioned distribution model**: every consumer pins to a specific
  release tag of each core and updates on its own schedule.

## What it deliberately is not

- A SaaS product. There is no nano-zyrkel cloud, no signup, no metered
  pricing. Every nano-zyrkel runs in the user's own GitHub account on the
  free Actions tier.
- A general workflow engine. It does five things — fetch, check, notify,
  act, render — and tries to do them well. If you need branching DAGs,
  conditional steps and a UI to orchestrate them, look elsewhere.
- A heavyweight framework. The CLI binary is roughly 5 MB stripped, the
  default WASM bundle is around 80 KB gzipped, and a fresh nano-zyrkel
  repo is well under 200 KB.

## How it stacks up against the obvious alternatives

| Concern | nano-zyrkel | Plain GitHub Actions cron + bash | Zapier / Make | Airflow / Prefect | n8n / Node-RED |
| --- | --- | --- | --- | --- | --- |
| **Where it runs** | Your GitHub repo, free tier | Your GitHub repo, free tier | Vendor cloud | Your servers | Your servers / vendor cloud |
| **Cost at idle** | Zero | Zero | Per-task | Compute + storage | Compute |
| **State persistence** | Git commits in `staging/` | You roll your own | Vendor DB | Metadata DB | Local DB / Postgres |
| **Versioning** | Semver-pinned cores via `.nano-zyrkel-versions.json` | Whatever bash version is on the runner | Vendor controls upgrades | Pip pins | npm pins |
| **Source of truth** | One repo per agent — code, config, history, output | Scattered scripts | Vendor dashboard | DAG repo + DB | Visual editor + DB |
| **Front-end story** | WASM core ships chart, table, map, UI primitives | None — write your own | Vendor templates | None | Limited dashboards |
| **i18n** | Built into both cores, BCP 47 tags | None | Vendor-specific | None | None |
| **Plugin model** | Rust trait, in-process | Shell out to anything | Vendor's app store | Python operators | Custom nodes |
| **Lock-in risk** | Low — every artefact is in your own git history | Lowest | High | Medium | Medium |
| **Learning curve** | Three CLI commands, one JSON file | Low | Low | High | Medium |
| **Best for** | Long-running, deterministic, explainable agents | Throw-away one-shots | Non-developer flows | Heavy data pipelines | Visual workflows with humans in the loop |

## When NOT to use nano-zyrkel

- **You need sub-minute latency.** GitHub Actions cron has a coarse
  scheduler (typically a few minutes). For real-time work, use a long-lived
  service.
- **You need complex branching workflows.** A nano-zyrkel runs straight
  through `fetch → check → notify → act` once per cron tick. There is no
  DAG, no fan-out, no conditional joins. If your problem looks like a
  flowchart with diamonds, pick Airflow.
- **You can't put your config in git.** nano-zyrkel assumes the agent's
  configuration lives in a public or private GitHub repo. If your config
  has to live in a database that non-developers edit through a GUI, this
  is the wrong tool.
- **You have an existing observability stack and want to plug into it.**
  nano-zyrkel emits structured logs to stderr and does not currently
  integrate with Prometheus, OpenTelemetry, etc. PRs welcome.

## When nano-zyrkel is a good fit

- **A nightly or hourly literature watch.** New PubMed hits, new
  preprints, new releases on a vendor's blog. The literature-alert
  scaffold is exactly this.
- **An uptime / freshness monitor.** The monitor scaffold runs every 15
  minutes, hits a URL, evaluates a `Stale` condition, posts to Slack and
  publishes a status page. About a hundred lines of config.
- **A research data dashboard that should not depend on a server.** WASM
  core renders the entire site in the browser; the binary regenerates
  the underlying JSON on cron and commits it.
- **Anything you would otherwise build as a tiny scheduled script and
  forget about for a year.** That is the design centre.

## Why two cores?

Server-side and browser-side have very different constraints — process
spawning, secrets, filesystem access on one side; bundle size, no network
trust, runtime UI on the other. Trying to share code between them through
conditional compilation always ends up worse than just splitting the
library cleanly.

The split also lets WASM-only consumers (interactive teaching widgets,
zero-backend dashboards) skip the binary entirely, and binary-only
consumers (cron-driven notifiers, headless ETL) skip the WASM bundle. The
shared concept that survives in both is the **typed config schema** — the
binary writes it, the WASM library reads it.

## Want to try it without installing anything?

Open the [live builder](https://schlein-lab.github.io/nano-zyrkel/builder/)
and click any scaffold. You can fill in three fields and download a
zip-shaped repo without ever running a `cargo` command.
