# nano-zyrkel template: maildesk-codex-telegram

Semi-autonomous maildesk template with:
- Gmail via IMAP + SMTP app password
- Codex for summary, research planning, and draft generation
- Telegram for review, revision, and send approval
- optional web fetches and tiny shell artifacts for evidence gathering

## Replace these placeholders

- `{{MAILBOX_EMAIL}}`
- `{{REPLY_NAME}}`
- `{{SIGNATURE_NAME}}`
- `{{SIGNATURE_ROLE}}`
- `{{NANO_ID}}`
- `{{DESCRIPTION}}`

## Telegram commands

- `/pending`
- `/show <case-id>`
- `/approve <case-id>`
- `/revise <case-id> <hinweis>`
- `/ignore <case-id>`

## Required secrets

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `CODEX_AUTH`
- `SMTP_USER`
- `SMTP_PASS`
