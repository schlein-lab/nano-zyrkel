# scaffold-monitor

Heartbeat-style nano-zyrkel that polls an upstream URL on a 15-minute
cron and exposes a status page on GitHub Pages. Wires the
`stale` condition from the binary core to the status table on the
WASM side via `DataLoader` + `Format.percent` + `DateTime`.

## How to use this template

1. Click **Use this template** on GitHub or run
   `gh repo create my-monitor --template schlein-lab/nano-zyrkel-scaffold-monitor`.
2. Edit `hats/config.json` and point `source.url` at the URL or feed
   you want to monitor.
3. (Optional) Set `notify.telegram = true` and add the Telegram
   secrets to receive alerts when the upstream goes stale.
4. Push. Three workflows take over:
   - `heartbeat.yml` — runs the binary every 15 minutes.
   - `deploy.yml` — publishes `docs/` to GitHub Pages.
   - `update-core.yml` — opens auto-PRs for binary + WASM upgrades.
