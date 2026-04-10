# scaffold-data-pipeline

A nano-zyrkel that runs the binary core on a cron schedule, fetches
data, evaluates a condition and notifies on match. No browser side, no
WASM, no GitHub Pages — pure pipeline.

## How to use this template

1. Click **Use this template** on GitHub or run
   `gh repo create my-tracker --template schlein-lab/nano-zyrkel-scaffold-data-pipeline`.
2. Edit `hats/config.json` to point at your real data source and set the
   condition that should trigger a notification.
3. Set the repo secrets `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (or
   the SMTP equivalents) so the binary can deliver notifications.
4. Push. The scheduled `run.yml` workflow will start firing on the next
   cron tick. The `update-core.yml` workflow opens a PR every Monday
   when a new compatible binary release is available.

## What lives where

| Path                                  | Purpose                                  |
| ------------------------------------- | ---------------------------------------- |
| `hats/config.json`                    | Your config — the only file you edit     |
| `staging/`                            | Auto-committed output of every run       |
| `core/bin/nano-zyrkel`                | Binary, pulled in by `update-core.yml`   |
| `.github/workflows/run.yml`           | Cron job that calls the binary           |
| `.github/workflows/update-core.yml`   | Weekly auto-PR for binary updates        |
| `.nano-zyrkel-versions.json`          | Pinned binary + wasm versions            |
