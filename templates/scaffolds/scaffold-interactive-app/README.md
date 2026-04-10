# scaffold-interactive-app

A nano-zyrkel that combines the binary core (cron-driven data fetcher)
with the WASM core (browser-side rendering on the user's CPU). This is
the right scaffold for vusTracker, helix and any other repo that needs
both a data pipeline and an interactive UI.

## How to use this template

1. Click **Use this template** on GitHub or run
   `gh repo create my-app --template schlein-lab/nano-zyrkel-scaffold-interactive-app`.
2. Edit `hats/config.json` for the binary side: data source, schedule,
   notification preferences.
3. (Optional) Replace `docs/style.css` and `docs/index.html` with one
   of the bundled themes from
   [`templates/themes/`](https://github.com/schlein-lab/nano-zyrkel/tree/main/templates/themes).
4. Edit `docs/app.js` to wire your fields into the chart helpers.
5. Push. Three workflows take over:

   - `data-update.yml` — runs the binary on a cron and commits
     `staging/`.
   - `deploy.yml` — publishes `docs/` to GitHub Pages.
   - `update-core.yml` — opens a PR every Monday when a new compatible
     binary or WASM release is available.

## Where each layer lives

| Path                                  | Purpose                                 |
| ------------------------------------- | --------------------------------------- |
| `hats/config.json`                    | Single source of truth (binary + WASM)  |
| `crates/plugin/`                      | Optional: domain-specific Rust plugin   |
| `staging/`                            | Output of every binary run              |
| `core/bin/nano-zyrkel`                | Binary, pulled in by `update-core.yml`  |
| `core/wasm/profile/`                  | WASM bundle, same                       |
| `docs/index.html` + `style.css`       | Theme — replace freely                  |
| `docs/app.js`                         | JS glue — wires DOM to WASM             |
| `.github/workflows/*.yml`             | Reusable workflows from the central repo|
| `.nano-zyrkel-versions.json`          | Pinned binary + WASM versions           |

## Plugin (optional)

If you need custom domain logic that the generic core does not cover,
add a Rust crate under `crates/plugin/` that depends on
`nano-zyrkel-core` and implements the `Plugin` trait. See
`docs/plugin-guide.md` in the central repo for details.
