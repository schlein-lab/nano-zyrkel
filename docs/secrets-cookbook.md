# Secrets cookbook

Every notifier and action that talks to a third-party service reads
its credentials from environment variables. In a typical user
nano-zyrkel those env vars come from **GitHub repository secrets**
that the workflow forwards to the binary at run time.

This page lists every secret the SDK currently understands, where to
get it, and which scope to grant. Use it as a checklist when you wire
up a new repo.

## Notifiers

### Telegram

| Secret               | Where to get it                                          |
| -------------------- | -------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/botfather) → `/newbot`         |
| `TELEGRAM_CHAT_ID`   | DM your bot, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates` and read the `chat.id` field |

Workflow snippet:

```yaml
env:
  TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
  TELEGRAM_CHAT_ID:   ${{ secrets.TELEGRAM_CHAT_ID }}
```

### Discord

| Secret                  | Where to get it                                              |
| ----------------------- | ------------------------------------------------------------ |
| `DISCORD_WEBHOOK_URL`   | Server settings → Integrations → Webhooks → New Webhook → copy URL |

The webhook URL itself contains the auth token, so it is the only
secret you need.

### Slack

| Secret              | Where to get it                                                |
| ------------------- | -------------------------------------------------------------- |
| `SLACK_WEBHOOK_URL` | <https://api.slack.com/messaging/webhooks> → Create New App → enable Incoming Webhooks → Add to Workspace |

### Email (SMTP)

| Secret             | Notes                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| `EMAIL_TO`         | Recipient address.                                                          |
| `EMAIL_FROM`       | Sender address (must be allowed by the SMTP server).                        |
| `SMTP_HOST`        | e.g. `smtp.fastmail.com`, `smtp.gmail.com`, `smtp-relay.brevo.com`.         |
| `SMTP_USERNAME`    | SMTP login.                                                                 |
| `SMTP_PASSWORD`    | SMTP password or app-specific token.                                        |

For Gmail you must create an
[app password](https://support.google.com/accounts/answer/185833) — the
regular account password no longer works for SMTP.

## Actions

### GitHub Issue / Comment / Release / PR / TriggerHat

| Secret      | Required scope                                                       |
| ----------- | -------------------------------------------------------------------- |
| `GH_TOKEN`  | `contents: read`, plus `issues: write` for issue + comment actions, plus `actions: write` for `trigger_hat`. |

Use a fine-grained personal access token scoped to the target repo,
or rely on the workflow's own `${{ github.token }}` if the action
operates on the same repo. The binary checks `GH_TOKEN` first and
falls back to `GITHUB_TOKEN`.

### CloudBus

The CloudBus action uses signed HTTP requests; supply
`CLOUDBUS_SECRET` if your bus instance enforces signatures.

## Conditions

### LLM

| Secret              | Used by                                  |
| ------------------- | ---------------------------------------- |
| `ANTHROPIC_API_KEY` | The `llm` condition kind. Required.      |
| `OPENAI_API_KEY`    | Optional fallback when Anthropic is down.|

## Fetchers

### IMAP (maildesk + literature_alert)

| Secret           | Notes                                              |
| ---------------- | -------------------------------------------------- |
| `IMAP_HOST`      | e.g. `imap.fastmail.com`, `imap.gmail.com`         |
| `IMAP_USER`      | Mailbox login                                      |
| `IMAP_PASSWORD`  | App password (Gmail) or account password           |

## Setting secrets

```bash
gh secret set TELEGRAM_BOT_TOKEN -R my-nano-zyrkel
gh secret set TELEGRAM_CHAT_ID   -R my-nano-zyrkel
```

…or visit *Settings → Secrets and variables → Actions* in the
GitHub UI.

## Tips

- Set one secret per service per repo. Reusing the same `GH_TOKEN`
  across many nano-zyrkels means a single leak burns them all.
- Rotate `GH_TOKEN` and any long-lived API keys every 90 days.
- Never put secrets in `hats/config.json`; configs land in git, env
  vars do not.
