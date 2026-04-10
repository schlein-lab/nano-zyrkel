# scaffold-newsletter

Weekly literature digest. The binary core's `literature_alert`
pipeline aggregates fresh items into a Markdown issue, ships it
via SMTP, and a static GitHub Pages site renders the latest issue
plus an archive using the wasm-core `Markdown` renderer.

## How to use this template

1. Click **Use this template** on GitHub or run
   `gh repo create my-digest --template schlein-lab/nano-zyrkel-scaffold-newsletter`.
2. Edit `hats/config.json` and fill in your `literature.topics`.
3. Set the SMTP secrets (`SMTP_USERNAME`, `SMTP_PASSWORD`,
   `EMAIL_FROM`, `EMAIL_TO`) so the binary can deliver the digest.
4. Push. The Monday cron starts firing on the next tick.

The bundled `app.js` reads `staging/{id}/latest.json` and renders its
`body` field through `pulldown-cmark`. Replace `theme` files freely —
`theme-magazine` and `theme-report` both fit the editorial use case.
