# Timing — what to expect

Concrete numbers measured against the real CI pipeline and the actual
release artefacts. They will drift slightly over time as the SDK grows,
but the orders of magnitude should stay the same.

## How long things take

| Step | Cold | Warm |
| --- | --- | --- |
| `cargo build --workspace` | ~3 minutes | ~10 seconds |
| `cargo test --workspace` | ~3 minutes | ~5 seconds |
| `nano-zyrkel demo` (subcommand) | < 1 second after one HTTPS round trip | n/a |
| `nano-zyrkel introspect` | < 100 ms | n/a |
| WASM bundle build (one feature profile) | ~30 seconds | ~5 seconds |
| Live builder cold load | ~600 ms (HTML + JS + manifest fetch) | ~100 ms (cached) |
| Generate + download a scaffold zip in the builder | ~1 second (depends on file count) | n/a |
| GitHub Actions cron tick (small nano-zyrkel) | 30-90 seconds wall clock | n/a |
| Cross-platform release (`release.yml`) | ~20 minutes total across runners | n/a |
| crates.io publish (`publish-crates.yml`, all three crates) | ~5 minutes including index waits | n/a |

"Cold" means a clean checkout with no Cargo cache. "Warm" means an
incremental build after touching one file.

## How big things are

| Artefact | Size |
| --- | --- |
| `nano-zyrkel` CLI binary, release stripped, Linux x86_64 | ~5 MB |
| WASM core, default features (data + config), release | ~80 KB gzipped |
| WASM core, all features (data + config + viz-basic + viz-advanced + viz-spatial + viz-ui) | ~280 KB gzipped |
| A fresh nano-zyrkel scaffold (empty staging/) | < 200 KB |
| `templates/` directory in this repo | ~1.2 MB across all 16 templates |
| `schema.json` shipped on every binary release | ~25 KB |

## How much it costs to run

A nano-zyrkel scheduled to fetch one URL every 15 minutes consumes about
**5 minutes of GitHub Actions time per day**, which is well inside the
free tier (2000 min/month for private repos, unlimited for public). At
that rate the SDK pays for itself the moment it replaces a paid SaaS
notifier.

The numbers above are for one healthy run. A run that hits a transient
HTTP error and retries three times with backoff still finishes in well
under a minute.

## Where the time actually goes

For a typical `tracker` nano-zyrkel run:

```
fetch:    ~200-500 ms   (depends on upstream, usually one HTTPS GET)
parse:    < 50 ms       (JSON / HTML / RSS parsing)
condition:< 50 ms       (in-memory)
notify:   ~100-300 ms   (one POST per channel, runs in parallel)
action:   ~200-500 ms   (one POST to GitHub API, similar)
commit:   ~500-1500 ms  (git add, git commit, git push)
total:    ~1-3 seconds  (plus the GitHub Actions runner spin-up)
```

The runner spin-up itself is the dominant cost — usually 20-40 seconds
before the binary even starts. That is why nano-zyrkels prefer 5- or
15-minute cadences over 1-minute ones; you would spend most of your
quota waiting for runners to boot.

## Why these numbers matter

When a developer is evaluating "would I use this", "how long does the
first cycle take" is the deciding question. If the answer is "five
minutes from `cargo install` to a deployed agent", they try it. If the
answer is "an afternoon", they keep looking. The SDK is intentionally
shaped so the first answer is the true one.
