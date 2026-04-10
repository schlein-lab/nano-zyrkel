# scaffold-showcase

A nano-zyrkel that lives entirely in the browser. No binary, no cron,
no `staging/`. Use it for portals, demos and single-page experiences
where the only data source is the `widgets` list inside
`hats/config.json`.

## How to use this template

1. Click **Use this template** on GitHub or run
   `gh repo create my-showcase --template schlein-lab/nano-zyrkel-scaffold-showcase`.
2. Edit `hats/config.json` and fill the `widgets` array with the items
   you want to feature.
3. (Optional) Replace `docs/style.css` with one of the bundled themes —
   `theme-cinematic` is the obvious match.
4. Push. The `deploy.yml` workflow publishes `docs/` to GitHub Pages.

## Where each layer lives

| Path                                  | Purpose                                 |
| ------------------------------------- | --------------------------------------- |
| `hats/config.json`                    | Widget list and branding                |
| `core/wasm/profile/`                  | WASM bundle, pulled in by update-core   |
| `docs/index.html` + `style.css`       | Theme — replace freely                  |
| `docs/app.js`                         | JS glue — wires DOM to WASM             |
| `.github/workflows/deploy.yml`        | Publishes docs/ on every push           |
| `.github/workflows/update-core.yml`   | Weekly auto-PR for WASM core updates    |
| `.nano-zyrkel-versions.json`          | Pinned WASM version (binary unused)     |

## Want a cinematic intro?

Add a Rust crate under `crates/app/` that uses `wasm-bindgen` to
expose your custom particle/animation engine and import it from
`docs/app.js`. The WASM core stays generic; everything domain-specific
lives in your repo.
