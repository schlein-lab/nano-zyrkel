# Getting started with nano-zyrkel

This page walks you through building a brand-new nano-zyrkel from
scratch. The whole flow is config-first: you fork a scaffold, edit one
JSON file, push.

## 1. Pick a scaffold

| Scaffold                  | When to use it                                 |
| ------------------------- | ---------------------------------------------- |
| `scaffold-data-pipeline`  | Cron-driven data fetcher, no browser side      |
| `scaffold-interactive-app`| Cron data fetcher + a browser dashboard        |
| `scaffold-showcase`       | Pure browser app, no binary, no cron           |

Each scaffold is a GitHub template repository under `schlein-lab`.
Click **Use this template** or run:

```bash
gh repo create my-nano \
  --template schlein-lab/nano-zyrkel-scaffold-interactive-app
```

## 2. Edit `hats/config.json`

This file is the single source of truth. Both the binary core and the
WASM core read it. The schema is documented in
[`docs/architecture.md`](architecture.md). The most important fields:

```json
{
  "schema": "1",
  "id": "my-nano",
  "type": "tracker",
  "lang": "en",
  "description": "What this nano does in one line",
  "branding": { "color": "#8B5CF6" },
  "source": { "url": "https://example.com/feed.json" },
  "condition": { "type": "json_path", "path": "$.items[*]" }
}
```

## 3. Pick a theme (optional)

If your scaffold ships a `docs/` directory, replace its style and HTML
with one of the bundled themes — see [theming.md](theming.md).

## 4. Add custom logic (optional)

For domain-specific behavior, drop a Rust crate under `crates/plugin/`
in your repo and implement the `Plugin` trait. See
[plugin-guide.md](plugin-guide.md).

## 5. Push

Three workflows take over the moment your repo is on GitHub:

- **`data-update.yml`** — runs the binary on a cron, commits the
  result of every run into `staging/`. (Skipped for showcase scaffolds.)
- **`deploy.yml`** — publishes `docs/` to GitHub Pages. (Skipped for
  data-pipeline scaffolds.)
- **`update-core.yml`** — opens a pull request every Monday with the
  latest compatible binary + WASM cores. You merge the PR to apply the
  upgrade.

That's it. The rest is config.

## Where to go next

- [`theming.md`](theming.md) — list of bundled themes and how to make
  your own.
- [`chart-cookbook.md`](chart-cookbook.md) — copy-paste recipes for the
  WASM visualization primitives.
- [`plugin-guide.md`](plugin-guide.md) — write a Rust plugin for the
  binary core.
- [`architecture.md`](architecture.md) — the layered design explained.
