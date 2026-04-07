# nano-zyrkel Rezepte — getestete, funktionierende Patterns

Alles hier ist **live getestet** und funktioniert auf GitHub Actions.

---

## 1. Binary aus privatem Repo laden

`curl` funktioniert NICHT fuer private Repos (liefert HTML statt Binary).
Nutze `gh release download`:

```yaml
- name: Get nano-zyrkel
  env:
    GH_TOKEN: ${{ secrets.GH_TOKEN }}
  run: |
    gh release download -R dein-user/nano-zyrkel -p "nano-zyrkel-linux" --clobber
    chmod +x nano-zyrkel-linux
    mv nano-zyrkel-linux nano-zyrkel
```

**Secret:** `GH_TOKEN` = GitHub Personal Access Token mit `repo` Scope.

---

## 2. Git Push aus dem Workflow

Der Default-GITHUB_TOKEN hat KEINE Write-Permissions. Du musst `permissions` setzen:

```yaml
permissions:
  contents: write

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      # ... deine Steps ...
      - name: Commit
        run: |
          git config user.name "nano-zyrkel"
          git config user.email "nano@zyrkel.local"
          git add staging/
          git diff --staged --quiet || \
            git commit -m "nano $(date -u +%Y-%m-%dT%H:%M)"
          git push || true
```

**Wichtig:** `git diff --staged --quiet ||` verhindert leere Commits.

---

## 3. Telegram Notification

Secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

Bot erstellen: https://t.me/BotFather → `/newbot`
Chat-ID finden: Nachricht an den Bot senden, dann:
```
curl https://api.telegram.org/bot<TOKEN>/getUpdates | jq '.result[0].message.chat.id'
```

Im Workflow:
```yaml
env:
  TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
  TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
```

nano-zyrkel sendet automatisch wenn `"notify": {"telegram": true}` in der Config.

---

## 4. Codex CLI mit ChatGPT Plus/Pro Account

Codex CLI kann mit deinem bestehenden ChatGPT-Abo laufen (kein API Key noetig).

### Lokal einloggen:
```bash
npm install -g @openai/codex
codex login
```

### Auth-Datei als GitHub Secret speichern:
```bash
# Auth-JSON kopieren (NICHT den Inhalt teilen!)
cat ~/.codex/auth.json
# → Als GitHub Secret "CODEX_AUTH" im Repo setzen
```

### Im Workflow:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'

- name: Install + auth Codex CLI
  env:
    CODEX_AUTH: ${{ secrets.CODEX_AUTH }}
  run: |
    npm install -g @openai/codex
    mkdir -p ~/.codex
    echo "$CODEX_AUTH" > ~/.codex/auth.json
```

### nano-zyrkel Config mit Codex:
```json
{
  "condition": {
    "type": "llm",
    "question": "Deine Frage an den Inhalt...",
    "model": "codex"
  }
}
```

nano-zyrkel ruft `codex exec` als Subprocess auf. Fallback: Anthropic API.

---

## 5. HTML Email mit curl (kein Python, kein sendmail)

Secrets: `SMTP_USER` (Gmail-Adresse), `SMTP_PASS` (App-Password)

Gmail App-Password: Google Account → Sicherheit → App-Passwoerter

```yaml
- name: Send email
  env:
    SMTP_USER: ${{ secrets.SMTP_USER }}
    SMTP_PASS: ${{ secrets.SMTP_PASS }}
  run: |
    DATE=$(date -u +%Y-%m-%d)
    {
      printf 'From: nano-zyrkel <%s>\r\n' "$SMTP_USER"
      printf 'To: empfaenger@example.com\r\n'
      printf 'Subject: Report %s\r\n' "$DATE"
      printf 'MIME-Version: 1.0\r\n'
      printf 'Content-Type: text/html; charset=utf-8\r\n'
      printf '\r\n'
      echo '<html><body>'
      echo '<h2>Report</h2>'
      cat staging/result.txt
      echo '</body></html>'
    } > /tmp/mail.eml
    curl -s --url "smtps://smtp.gmail.com:465" \
      --ssl-reqd \
      --mail-from "$SMTP_USER" \
      --mail-rcpt "empfaenger@example.com" \
      --user "$SMTP_USER:$SMTP_PASS" \
      -T /tmp/mail.eml
```

**Keine Heredocs in YAML!** Nutze `printf` + Redirect in temporaere Datei.

---

## 6. JavaScript-Seiten rendern (Headless Chrome)

GitHub Actions Runner haben Chrome vorinstalliert.

```yaml
- name: Render SPA
  run: |
    timeout 30 google-chrome --headless=new --disable-gpu --no-sandbox \
      --virtual-time-budget=10000 \
      --dump-dom "https://spa-website.example.com" \
      > /tmp/rendered.html 2>/dev/null || true
    echo "Rendered: $(wc -c < /tmp/rendered.html) bytes"
```

Dann dem nano-zyrkel die gerenderte Datei geben:
```yaml
- name: Execute
  env:
    NANO_SOURCE_FILE: /tmp/rendered.html
  run: ./nano-zyrkel --config hats/config.json
```

**Achtung:** `virtual-time-budget` simuliert Zeit, aber AJAX-Calls brauchen echte Netzwerk-Zeit. Fuer SPAs die API-Calls machen, besser die API direkt abfragen.

**HTML fuer LLM aufbereiten:**
```yaml
- name: Strip HTML for LLM
  run: |
    sed 's/<[^>]*>//g; /^[[:space:]]*$/d' /tmp/rendered.html > /tmp/text-only.txt
```

---

## 7. LLM-Ausgabe als saubere Tabelle erzwingen

Codex/LLM gibt gerne Erklaerungen, Fussnoten, Quellen aus. Um **nur eine Tabelle** zu bekommen:

```
"Gib NUR die Tabelle aus — kein einleitender Text, keine Erlaeuterungen, 
 keine Fussnoten, keine Quellen. NUR die Markdown-Tabelle."
```

Fuer JSON-Ausgabe:
```
"Antworte NUR mit JSON: {\"match\": true/false, \"summary\": \"...\"}"
```

---

## 8. Codex CLI im Workflow als Ad-Hoc Analyse

Nicht nur in nano-zyrkel Configs — auch direkt im Workflow als Shell-Step:

```yaml
- name: Analyze with Codex
  run: |
    DATA=$(cat staging/data.json | head -c 6000)
    codex exec --skip-git-repo-check --ephemeral \
      -o staging/analysis.txt \
      "Analysiere diese Daten: $DATA"
```

Flags:
- `--skip-git-repo-check` — laeuft auch ausserhalb eines Git-Repos
- `--ephemeral` — keine Session-Dateien persistieren
- `-o datei.txt` — Ausgabe in Datei statt stdout

---

## 9. Workflow-Trigger Patterns

```yaml
# Alle 2 Stunden:
cron: '0 */2 * * *'

# Montag + Freitag 07:00 UTC:
cron: '0 7 * * 1,5'

# Mo-Fr 05:00-09:00 alle 30 Min:
cron: '*/30 5-9 * * 1-5'

# Einmal taeglich um 06:00 UTC:
cron: '0 6 * * *'

# Immer wenn in hats/ etwas gepusht wird:
push:
  branches: [master]
  paths: ['hats/**']

# Manuell + Cron:
workflow_dispatch:
schedule:
  - cron: '0 7 * * *'
```

---

## 10. Secrets die JEDER nano braucht

| Secret | Zweck | Wie erstellen |
|--------|-------|---------------|
| `GH_TOKEN` | Binary download aus privatem Repo | github.com → Settings → Developer Settings → PAT |
| `TELEGRAM_BOT_TOKEN` | Telegram Push | @BotFather auf Telegram |
| `TELEGRAM_CHAT_ID` | Deine Chat-ID | getUpdates API (siehe oben) |
| `CODEX_AUTH` | Codex CLI Auth (optional) | `cat ~/.codex/auth.json` |
| `SMTP_USER` | Email-Versand (optional) | Gmail-Adresse |
| `SMTP_PASS` | Gmail App-Password (optional) | Google → App-Passwoerter |

Setzen: `gh secret set SECRET_NAME -R user/repo -b "wert"`

---

## 11. Haeufige Fehler

| Fehler | Ursache | Fix |
|--------|---------|-----|
| `line 1: Not: command not found` | Binary ist HTML statt Binary (privates Repo) | `gh release download` statt `curl` |
| `exit code 127` | Binary nicht ausfuehrbar | `chmod +x` vergessen |
| `git push` 403 | Keine Write-Permission | `permissions: contents: write` |
| `workflow_dispatch` 422 | GitHub cached alten Workflow | Datei umbenennen oder warten |
| Heredoc in YAML | YAML interpretiert `<<` falsch | `printf` + temp file statt Heredoc |
| SPA leer | JS nicht gerendert | Headless Chrome mit `--dump-dom` |
| LLM schreibt Roman | Prompt nicht streng genug | "NUR Tabelle, kein Text" |
| Codex auth expired | Token abgelaufen | `codex login` neu, Secret updaten |
