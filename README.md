# nano-zyrkel

Autonome Mini-Agenten die als GitHub-Repos leben und auf GitHub Actions 24/7 arbeiten — ohne eigenen Server, kostenlos.

---

## Inhaltsverzeichnis

1. [Was ist nano-zyrkel?](#1-was-ist-nano-zyrkel)
2. [Architektur](#2-architektur)
3. [Schnellstart](#3-schnellstart)
4. [Hat-Typen](#4-hat-typen)
5. [Bedingungstypen (Conditions)](#5-bedingungstypen-conditions)
6. [Aktionstypen (Actions)](#6-aktionstypen-actions)
7. [Approval-Level](#7-approval-level)
8. [Benachrichtigungen](#8-benachrichtigungen)
9. [LLM-Integration](#9-llm-integration)
10. [Zyrkel Headless Integration](#10-zyrkel-headless-integration)
11. [Best Practices und Erfahrungen](#11-best-practices-und-erfahrungen)
12. [Config-Referenz (JSON-Schema)](#12-config-referenz-json-schema)
13. [Troubleshooting](#13-troubleshooting)
14. [Beispiele](#14-beispiele)
15. [Lizenz](#15-lizenz)

---

## 1. Was ist nano-zyrkel?

Ein nano-zyrkel ist ein leichtgewichtiger, autonomer Agent der:

- **In einem eigenen GitHub-Repo lebt** — 1 Repo = 1 Agent
- **Auf GitHub Actions laeuft** — kostenlos, 24/7, kein Server noetig
- **Webseiten beobachtet**, Daten trackt, an Fristen erinnert
- **Per Telegram/Email benachrichtigt** wenn etwas passiert
- **Ergebnisse als Git-Commits versioniert** — Zeitreihen, Audit-Trail
- **Weiterlaeuft wenn du deinen Laptop zuklappst**
- **Config-driven ist** — eine JSON-Datei reicht, kein Code noetig fuer einfache Faelle

Die `nano-zyrkel` Binary wird als Release heruntergeladen und per GitHub Actions Workflow ausgefuehrt. Die gesamte Konfiguration liegt in JSON-Dateien (`hats/*.json`).

---

## 2. Architektur

```
mein-nano-zyrkel/                  # Ein GitHub-Repo = ein nano-zyrkel
├── .github/
│   └── workflows/
│       └── run.yml                # GitHub Actions Scheduler (Cron)
├── hats/
│   └── meine-aufgabe.json         # Mission-Config (was beobachten, wie reagieren)
├── staging/                       # Ergebnisse (auto-committed nach jedem Run)
│   └── meine-aufgabe/
│       ├── latest.json            # Letztes Ergebnis
│       ├── history.jsonl          # Alle bisherigen Ergebnisse (JSONL)
│       └── state.json             # Laufzeit-Zustand (Hashes, Zaehler, etc.)
└── README.md
```

### Ablauf eines Runs

1. GitHub Actions Cron triggert den Workflow
2. Workflow laedt die `nano-zyrkel` Binary aus dem Release herunter
3. Binary liest die Hat-Config (`hats/*.json`)
4. **Fetch**: Inhalt von der konfigurierten URL holen
5. **Evaluate**: Bedingung pruefen (Text-Match, Regex, CSS-Selector, LLM, ...)
6. **Output**: Ergebnis nach `staging/` schreiben
7. **Notify**: Bei Treffer → Telegram/Email-Benachrichtigung senden
8. **Action**: Optionale Aktion ausfuehren (HTTP-Request, GitHub Issue, ...)
9. Workflow committed Aenderungen in `staging/` zurueck ins Repo

### Zustand zwischen Runs

Der Zustand wird in `staging/<hat-id>/state.json` gespeichert und per Git-Commit persistiert. So weiss der nano-zyrkel beim naechsten Run:
- Wann der letzte Check war (`last_check`)
- Welchen Hash der Inhalt hatte (`last_hash` — fuer Change Detection)
- Welchen Wert er zuletzt gesehen hat (`last_value` — fuer Tracker)
- Welche RSS-Entry-ID zuletzt gesehen wurde (`last_rss_id`)
- Wie viele Runs und Treffer es gab (`total_runs`, `total_matches`)
- Wie viele aufeinanderfolgende Fehler es gab (`consecutive_errors`)

---

## 3. Schnellstart

### Schritt 1: Repo erstellen

Neues GitHub-Repo erstellen (oder dieses Repo forken). Name ist frei waehlbar.

### Schritt 2: GitHub Secrets setzen

Unter **Settings → Secrets and variables → Actions** diese Secrets anlegen:

| Secret | Beschreibung | Pflicht? |
|--------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Token deines Telegram-Bots (via [@BotFather](https://t.me/BotFather)) | Ja |
| `TELEGRAM_CHAT_ID` | Chat-ID fuer Benachrichtigungen | Ja |
| `GH_TOKEN` | GitHub Personal Access Token (fuer GitHub Issue/PR Actions) | Optional |
| `ANTHROPIC_API_KEY` | Anthropic API Key (fuer LLM-Bedingungen) | Optional |
| `OPENAI_API_KEY` | OpenAI API Key (fuer Codex CLI) | Optional |
| `ZYRKEL_BUS_URL` | URL des Zyrkel Message Bus (fuer Headless-Integration) | Optional |
| `ZYRKEL_BUS_TOKEN` | Token fuer den Message Bus | Optional |

### Schritt 3: Hat-Config erstellen

Datei `hats/mein-watcher.json` anlegen:

```json
{
  "id": "mein-watcher",
  "description": "Beobachte eine Seite auf Aenderungen",
  "type": "watcher",
  "source": {
    "url": "https://example.com/page",
    "method": "GET"
  },
  "condition": {
    "type": "contains",
    "value": "verfuegbar"
  },
  "notify": {
    "telegram": true
  },
  "output_dir": "staging",
  "lang": "de"
}
```

### Schritt 4: Workflow erstellen

Datei `.github/workflows/run.yml` anlegen:

```yaml
name: nano-zyrkel

on:
  schedule:
    - cron: '*/15 * * * *'    # Alle 15 Minuten
  workflow_dispatch:            # Manueller Trigger

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download nano-zyrkel
        run: |
          curl -sL https://github.com/DEIN-USER/nano-zyrkel/releases/latest/download/nano-zyrkel-linux-x64 -o nano-zyrkel
          chmod +x nano-zyrkel

      - name: Run HAT
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          for config in hats/*.json; do
            echo "=== Running: $config ==="
            ./nano-zyrkel --config "$config" || true
          done

      - name: Commit results
        run: |
          git config user.name "nano-zyrkel[bot]"
          git config user.email "bot@example.com"
          git add staging/
          git diff --staged --quiet || git commit -m "nano-zyrkel: run $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push
```

### Schritt 5: Pushen

```bash
git add .
git commit -m "nano-zyrkel einrichten"
git push
```

Der nano-zyrkel laeuft jetzt alle 15 Minuten auf GitHub Actions.

---

## 4. Hat-Typen

Ein "Hat" (Hut) definiert die Mission eines nano-zyrkels. Der Typ bestimmt das Grundverhalten.

### `watcher`

Beobachtet eine URL auf eine bestimmte Bedingung. Benachrichtigt bei Treffer.

**Anwendung:** "Sage mir Bescheid wenn auf dieser Seite X steht."

```json
{
  "type": "watcher",
  "source": { "url": "https://example.com/status" },
  "condition": { "type": "contains", "value": "offen" }
}
```

### `tracker`

Extrahiert einen Wert und baut eine Zeitreihe. Jeder Run fuegt einen Datenpunkt hinzu.

**Anwendung:** Preise verfolgen, Metriken tracken, Kurse beobachten.

```json
{
  "type": "tracker",
  "source": { "url": "https://example.com/produkt" },
  "condition": { "type": "extract_value", "selector": ".price", "unit": "EUR" }
}
```

### `deadline`

Countdown zu einer Frist mit gestaffelten Erinnerungen.

**Anwendung:** "Erinnere mich 30, 14, 7, 3 und 1 Tag vorher."

```json
{
  "type": "deadline",
  "condition": {
    "type": "deadline_date",
    "date": "2026-12-31",
    "remind_at_days": [30, 14, 7, 3, 1]
  }
}
```

### `crawler`

Sammelt Daten aus einer oder mehreren Quellen. Wie ein Watcher, aber fuer Datensammlung statt Einzelbedingung.

### `guardian`

Erkennt Aenderungen und Anomalien gegenueber einer Baseline. Nutzt Change Detection mit optionalem Schwellwert.

**Anwendung:** "Benachrichtige mich wenn sich diese Seite wesentlich aendert."

```json
{
  "type": "guardian",
  "condition": {
    "type": "changed",
    "selector": "#main-content",
    "threshold": 0.1
  }
}
```

---

## 5. Bedingungstypen (Conditions)

Bedingungen bestimmen, wann ein nano-zyrkel "Treffer" meldet. Die meisten kommen ohne LLM aus.

### `contains` — Textsuche (kein LLM)

Prueft ob ein bestimmter Text im Seiteninhalt vorkommt.

```json
{
  "type": "contains",
  "value": "verfuegbar",
  "negate": false
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `value` | String | Gesuchter Text |
| `negate` | Boolean | `true` = Treffer wenn Text NICHT vorkommt (Default: `false`) |

**Tipp:** Mit `negate: true` kannst du "benachrichtige mich wenn X verschwindet" umsetzen.

### `regex` — Regulaerer Ausdruck (kein LLM)

Prueft ob ein Regex-Pattern im Inhalt matcht.

```json
{
  "type": "regex",
  "pattern": "Preis:\\s*\\d+[.,]\\d{2}\\s*EUR",
  "negate": false
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `pattern` | String | Rust-Regex-Pattern |
| `negate` | Boolean | `true` = Treffer wenn Pattern NICHT matcht |

### `css_selector` — HTML-Element (kein LLM)

Findet ein HTML-Element per CSS-Selector. Treffer wenn das Element existiert.

```json
{
  "type": "css_selector",
  "selector": "div.availability span.in-stock",
  "extract": "href"
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `selector` | String | CSS-Selector |
| `extract` | String (optional) | HTML-Attribut extrahieren (z.B. `href`, `src`). Ohne: Text-Inhalt |

### `json_path` — JSON-API abfragen (kein LLM)

Wertet eine JSON-API-Response per JSONPath aus.

```json
{
  "type": "json_path",
  "path": "$.data.items[0].status",
  "expected": "available"
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `path` | String | JSONPath-Ausdruck |
| `expected` | JSON-Value (optional) | Erwarteter Wert. Ohne: Treffer wenn Pfad existiert und nicht null |

### `rss_new_entry` — Neuer Feed-Eintrag (kein LLM)

Prueft ob ein RSS/Atom-Feed einen neuen Eintrag hat (vergleicht Entry-ID/GUID mit dem letzten bekannten Wert).

```json
{
  "type": "rss_new_entry"
}
```

Keine weiteren Felder noetig. Der Zustand (letzte Entry-ID) wird automatisch in `state.json` gespeichert.

### `changed` — Inhalt geaendert (kein LLM)

Vergleicht den SHA-256-Hash des Inhalts mit dem letzten Run. Optional auf ein CSS-Element beschraenkt.

```json
{
  "type": "changed",
  "selector": "#main-content",
  "threshold": 0.1
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `selector` | String (optional) | CSS-Selector um nur einen Teil der Seite zu vergleichen |
| `threshold` | Float (optional) | Mindest-Aenderungsrate (0.0-1.0) um als Treffer zu gelten |

### `extract_value` — Wert extrahieren (kein LLM)

Extrahiert einen numerischen Wert per CSS-Selector. Wird fuer Tracker-Zeitreihen genutzt.

```json
{
  "type": "extract_value",
  "selector": ".price",
  "unit": "EUR"
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `selector` | String | CSS-Selector zum Element mit dem Wert |
| `unit` | String (optional) | Einheit (z.B. "EUR", "kg", "%") |

Tracker-Typ matcht immer — jeder Run fuegt einen Datenpunkt zur History hinzu.

### `deadline_date` — Frist-Countdown (kein LLM)

Berechnet Tage bis zu einer Frist und benachrichtigt an konfigurierten Tagen.

```json
{
  "type": "deadline_date",
  "date": "2026-12-31",
  "remind_at_days": [30, 14, 7, 3, 1]
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `date` | String | Frist im Format `YYYY-MM-DD` |
| `remind_at_days` | Array<Number> | Tage vorher an denen erinnert wird (Default: `[30, 14, 7, 3, 1]`) |

Erkennt auch "HEUTE" und "UEBERFAELLIG" automatisch.

### `llm` — KI-Analyse (benoetigt API-Key)

Stellt eine natuerlichsprachige Frage an den Seiteninhalt. Ein LLM bewertet ob die Bedingung erfuellt ist.

```json
{
  "type": "llm",
  "question": "Gibt es auf dieser Seite ein neues Angebot das noch nicht ausverkauft ist?",
  "model": "haiku"
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `question` | String | Frage in natuerlicher Sprache |
| `model` | String | LLM-Modell: `"haiku"` (guenstig/schnell) oder Default (Qualitaet) |

**Achtung:** LLM-Bedingungen kosten Geld pro Aufruf. Nutze zuerst `contains`/`regex` wenn moeglich.

---

## 6. Aktionstypen (Actions)

Aktionen machen nano-zyrkels zu Agenten statt nur Monitoren. Eine Aktion wird ausgefuehrt wenn die Bedingung matcht.

Actions sind optional — ohne `action`-Feld wird nur benachrichtigt.

### `http_request` — HTTP-Aufruf

Sendet einen HTTP-Request (POST, PUT, PATCH, DELETE).

```json
{
  "action": {
    "type": "http_request",
    "url": "https://example.com/api/webhook",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer ${API_TOKEN}"
    },
    "body_template": "{\"event\": \"match\", \"hat\": \"{id}\", \"summary\": \"{summary}\"}",
    "content_type": "application/json"
  }
}
```

**Platzhalter in Templates:** `{id}`, `{description}`, `{summary}`, `{url}`, `{value}`

### `github_issue` — GitHub Issue erstellen

Erstellt ein GitHub Issue bei Treffer. Benoetigt `GH_TOKEN` Secret.

```json
{
  "action": {
    "type": "github_issue",
    "repo": "user/repo",
    "title": "Neuer Treffer: {summary}",
    "body_template": "HAT '{id}' hat etwas gefunden:\n\n{summary}\n\nQuelle: {url}",
    "labels": ["automated", "nano-zyrkel"]
  }
}
```

### `github_pr` — GitHub Pull Request erstellen

Erstellt einen PR mit Datei-Aenderungen. Benoetigt `GH_TOKEN` Secret.

```json
{
  "action": {
    "type": "github_pr",
    "repo": "user/repo",
    "branch": "auto/update-data",
    "title": "Daten-Update: {summary}",
    "body_template": "Automatisch aktualisiert durch nano-zyrkel '{id}'",
    "files": {
      "data/latest.json": "{\"value\": \"{value}\", \"updated\": \"{summary}\"}"
    }
  }
}
```

> **Hinweis:** Die volle GitHub PR-Erstellung (Branch + Dateien + PR via Git Tree API) ist noch nicht vollstaendig implementiert.

### `trigger_hat` — Anderen nano-zyrkel triggern

Triggert einen GitHub Actions Workflow in einem anderen Repo. Damit lassen sich nano-zyrkels verketten.

```json
{
  "action": {
    "type": "trigger_hat",
    "repo": "user/anderer-nano-zyrkel",
    "workflow": "run.yml",
    "inputs": {
      "trigger_source": "{id}",
      "data": "{summary}"
    }
  }
}
```

### `publish_api` — Daten veroeffentlichen

Kopiert das letzte Ergebnis nach `api/` fuer GitHub Pages.

```json
{
  "action": {
    "type": "publish_api",
    "path": "preise/latest.json"
  }
}
```

### `shell` — Shell-Kommando ausfuehren

Fuehrt ein Bash-Kommando auf dem GitHub Actions Runner aus.

```json
{
  "action": {
    "type": "shell",
    "command": "python3 scripts/process.py staging/mein-hat/latest.json",
    "timeout_secs": 60
  }
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `command` | String | Bash-Kommando |
| `timeout_secs` | Number (optional) | Timeout in Sekunden (Default: 30) |

### `cloud_bus` — Nachricht an Message Bus

Sendet eine Nachricht an den Zyrkel Cloudflare Message Bus. Benoetigt `ZYRKEL_BUS_URL` und `ZYRKEL_BUS_TOKEN`.

```json
{
  "action": {
    "type": "cloud_bus",
    "topic": "findings/mein-hat",
    "payload_template": "{\"hat\": \"{id}\", \"summary\": \"{summary}\"}"
  }
}
```

### `chain` — Mehrere Aktionen verketten

Fuehrt mehrere Aktionen nacheinander aus. Bricht ab wenn eine fehlschlaegt.

```json
{
  "action": {
    "type": "chain",
    "actions": [
      {
        "type": "http_request",
        "url": "https://example.com/api/notify",
        "method": "POST",
        "body_template": "{\"event\": \"{summary}\"}"
      },
      {
        "type": "github_issue",
        "repo": "user/repo",
        "title": "Treffer: {summary}",
        "labels": ["automated"]
      }
    ]
  }
}
```

---

## 7. Approval-Level

Bestimmt ob und wie eine Aktion genehmigt werden muss bevor sie ausgefuehrt wird.

```json
{
  "approval": "none"
}
```

| Level | Beschreibung |
|-------|-------------|
| `none` | Sofort ausfuehren, ohne Rueckfrage |
| `log_only` | Ausfuehren und loggen (Audit-Trail) — **Default** |
| `ask_first` | Per Telegram fragen bevor ausgefuehrt wird (Ja/Nein-Buttons, 5 Min Timeout) |
| `within_budget` | Nur ausfuehren wenn innerhalb eines Budgets |

### `ask_first` im Detail

Bei `ask_first` sendet der nano-zyrkel eine Telegram-Nachricht mit Inline-Buttons:

```
HAT 'mein-watcher' moechte handeln:

Treffer: Neues Angebot gefunden
Aktion: POST https://example.com/api/buy

Ausfuehren?
[Ja] [Nein]
```

Der nano-zyrkel wartet bis zu 5 Minuten auf Antwort. Ohne Antwort wird die Aktion abgelehnt.

### `within_budget`

```json
{
  "approval": {
    "within_budget": {
      "max_cost": 50.0,
      "currency": "EUR"
    }
  }
}
```

---

## 8. Benachrichtigungen

### Telegram (empfohlen)

Telegram ist der primaere Benachrichtigungskanal. Setup:

1. Telegram-Bot erstellen via [@BotFather](https://t.me/BotFather)
2. Bot-Token als `TELEGRAM_BOT_TOKEN` Secret setzen
3. Chat-ID ermitteln (z.B. via [@userinfobot](https://t.me/userinfobot)) und als `TELEGRAM_CHAT_ID` setzen

```json
{
  "notify": {
    "telegram": true
  }
}
```

### Email

Email-Benachrichtigungen benoetigen SMTP-Konfiguration:

```json
{
  "notify": {
    "email": true
  }
}
```

Secrets: `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `EMAIL_TO`, `EMAIL_FROM`

> **Hinweis:** Email-Benachrichtigungen sind aktuell noch nicht vollstaendig implementiert.

### Nachricht anpassen

Eigene Nachrichten-Templates mit Platzhaltern:

```json
{
  "notify": {
    "telegram": true,
    "message": "Neuer Treffer fuer '{id}':\n{summary}\n\nDetails: {url}",
    "include_extracted": true
  }
}
```

**Verfuegbare Platzhalter:**

| Platzhalter | Beschreibung |
|------------|-------------|
| `{id}` | Hat-ID |
| `{description}` | Beschreibung des Hats |
| `{summary}` | Zusammenfassung des Treffers |
| `{url}` | Quell-URL |
| `{value}` | Extrahierter Wert (bei Trackern) |

Mit `include_extracted: true` wird der vollstaendige extrahierte Wert (als JSON) an die Nachricht angehaengt.

### Standard-Nachricht (ohne Template)

```
HAT 'mein-watcher'
Beobachte eine Seite auf Aenderungen

Neues Angebot gefunden

Quelle: https://example.com/page
```

---

## 9. LLM-Integration

Fuer den `llm`-Bedingungstyp braucht der nano-zyrkel Zugang zu einem LLM. Es gibt mehrere Wege, in dieser Prioritaet:

### 1. Codex CLI (direkt, sync)

Wenn Codex CLI installiert und eingeloggt ist (oder `OPENAI_API_KEY` gesetzt):

```bash
codex exec --skip-git-repo-check --ephemeral "Analysiere..."
```

### 2. Email → Zyrkel Headless (async, durch jede Firewall)

Der nano-zyrkel sendet die LLM-Frage per SMTP an eine gemeinsame Mailbox. Zyrkel Headless liest die Mailbox per IMAP, macht den LLM-Aufruf, und pushed die Antwort als `staging/<id>/llm-answer.json` ins Repo.

Die Antwort kommt erst beim naechsten Run an — asynchron, aber funktioniert durch jede Firewall.

Secrets: `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `IMAP_HOST`, `NANO_ID`

### 3. CF Bus → Zyrkel Headless (async)

Sendet die Frage an den Zyrkel Message Bus. Headless nimmt sie entgegen, macht den LLM-Aufruf, postet die Antwort zurueck.

Secrets: `ZYRKEL_BUS_URL`, `ZYRKEL_BUS_TOKEN`, `NANO_ID`

### 4. Anthropic API direkt

Direkter API-Aufruf an die Anthropic API. Kostet Geld pro Anfrage.

Secret: `ANTHROPIC_API_KEY`

Verwendet `claude-haiku-4-5` (guenstig, schnell).

### Modellwahl

| Wert | Beschreibung |
|------|-------------|
| `"haiku"` | Guenstig und schnell — fuer einfache Ja/Nein-Fragen |
| Default | Qualitaetsmodell — fuer komplexe Analyse |

### LLM-Antwortformat

Das LLM wird gebeten, JSON zurueckzugeben:

```json
{"match": true, "summary": "Kurze Zusammenfassung"}
```

Falls die Antwort kein valides JSON ist, wird heuristisch geprueft ob sie "ja"/"yes"/"true" enthaelt.

---

## 10. Zyrkel Headless Integration

nano-zyrkels koennen als Teil des Zyrkel-Oekosystems arbeiten:

### Auto-Discovery

Zyrkel Headless (der Desktop-Agent) kann nano-zyrkels automatisch auf GitHub entdecken. Die GitHub-Repos werden gescannt und im Zyrkel-Dashboard angezeigt.

### Dashboard-Anzeige

Im Zyrkel-Dashboard sieht man fuer jeden nano-zyrkel:
- Status (aktiv, Fehler, gestoppt)
- Letzte Ergebnisse und Treffer
- Laufzeit-Statistiken (Runs, Matches, Fehlerrate)

### `spawn_nano` Tool

Aus dem Zyrkel-Chat kann man mit dem `spawn_nano`-Tool neue nano-zyrkels erstellen:

```
"Erstelle einen nano-zyrkel der die Seite example.com beobachtet"
```

Zyrkel Headless erstellt dann automatisch:
- Ein neues GitHub-Repo
- Die Hat-Config
- Den Workflow
- Die Secrets

### Findings-Ingestion

Ergebnisse von nano-zyrkels werden in das Zyrkel-Memory integriert. Was nano-zyrkels finden, steht dem Haupt-Zyrkel als Wissen zur Verfuegung.

### Message Bus

Ueber den CloudBus-Aktionstyp koennen nano-zyrkels Nachrichten an Zyrkel Headless senden und umgekehrt.

---

## 11. Best Practices und Erfahrungen

### Konfiguration

- **Eine Bedingung pro Hat.** Halte Configs einfach. Lieber zwei nano-zyrkels als eine komplizierte Config.
- **`contains`/`regex` vor `llm`.** LLM-Bedingungen kosten Geld. Fuer einfache Textsuchen reicht `contains`.
- **`negate: true` nutzen.** "Benachrichtige mich wenn X verschwindet" ist ein haeufiger Use-Case.

### Timing

- **Cron nicht unter `*/5` setzen.** GitHub hat Rate Limits. Alle 15 Minuten ist ein guter Standard.
- **GitHub Actions haben Limits.** Free-Tier: 2000 Minuten/Monat. Ein Run braucht ca. 20-30 Sekunden.
- **`ttl` setzen fuer temporaere Monitore.** Wenn du nur bis zu einem bestimmten Datum beobachten willst, setze `ttl`. Der nano-zyrkel raeumt sich dann selbst auf.

### Output

- **`staging/` fuer alles.** Alle Ergebnisse gehoeren nach `staging/`. Das Verzeichnis wird automatisch committed.
- **`history.jsonl` ist deine Zeitreihe.** Jeder Run fuegt eine Zeile hinzu. Gut fuer Auswertungen.
- **`latest.json` fuer schnellen Zugriff.** Das letzte Ergebnis, immer aktuell.

### Fehlerbehandlung

- **`consecutive_errors` beobachten.** Ab 5+ aufeinanderfolgenden Fehlern stimmt etwas grundlegend nicht.
- **Retry ist eingebaut.** HTTP-Fetches werden bis zu 3x wiederholt mit exponentieller Wartezeit.
- **`--dry-run` zum Testen.** Fuehrt alles aus ohne zu benachrichtigen oder zu committen.
- **`--verbose` fuer Debugging.** Zeigt detaillierte Logs.

### Browser-Modus

- **`needs_browser: true` nur wenn noetig.** Braucht Chromium, ist langsamer, verbraucht mehr Ressourcen.
- **Ohne Browser geht vieles.** Die meisten APIs und statischen Seiten brauchen keinen Browser.

### Sicherheit

- **Keine Secrets in Configs.** Immer GitHub Secrets verwenden und per `${{ secrets.NAME }}` im Workflow uebergeben.
- **Approval-Level nutzen.** Fuer kritische Aktionen `ask_first` setzen.
- **Shell-Actions mit Vorsicht.** `shell`-Aktionen koennen beliebigen Code ausfuehren. Timeout setzen.

---

## 12. Config-Referenz (JSON-Schema)

### Vollstaendiges Hat-Config Schema

```json
{
  "id": "string (pflicht) — Eindeutige ID",
  "description": "string (pflicht) — Menschenlesbare Beschreibung",
  "type": "watcher | tracker | deadline | crawler | guardian (pflicht)",

  "source": {
    "url": "string (pflicht) — URL zum Fetchen",
    "method": "GET | POST | PUT (default: GET)",
    "headers": { "key": "value" },
    "body": "string (optional, fuer POST)",
    "needs_browser": false
  },

  "condition": {
    "type": "contains | regex | css_selector | json_path | rss_new_entry | changed | extract_value | deadline_date | llm",
    "...": "typ-spezifische Felder (siehe Abschnitt 5)"
  },

  "notify": {
    "telegram": true,
    "email": false,
    "message": "string (optional) — Custom Template mit Platzhaltern",
    "include_extracted": false
  },

  "action": {
    "type": "http_request | github_issue | github_pr | trigger_hat | publish_api | shell | cloud_bus | chain",
    "...": "typ-spezifische Felder (siehe Abschnitt 6)"
  },

  "approval": "none | log_only | ask_first | { within_budget: { max_cost, currency } }",

  "output_dir": "staging (default)",
  "ttl": "2026-12-31 (optional, ISO 8601 — auto-terminate)",
  "created": "2026-01-01T00:00:00Z (optional)",
  "lang": "de | en (default: de)",

  "state": {
    "last_check": "ISO 8601 timestamp",
    "last_hash": "SHA-256 hex string",
    "last_value": "JSON value",
    "last_rss_id": "string",
    "total_runs": 0,
    "total_matches": 0,
    "consecutive_errors": 0
  }
}
```

### CLI-Optionen

```
nano-zyrkel [OPTIONS]

Optionen:
  -c, --config <PATH>    Pfad zur Hat-Config JSON (pflicht)
  -l, --lang <LANG>      Sprache: de, en (default: de)
      --dry-run           Trockentest — kein Notify, kein Commit
  -v, --verbose           Ausfuehrliche Logs
  -h, --help              Hilfe anzeigen
```

### Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID |
| `GH_TOKEN` / `GITHUB_TOKEN` | GitHub Personal Access Token |
| `ANTHROPIC_API_KEY` | Anthropic API Key (fuer LLM-Bedingungen) |
| `OPENAI_API_KEY` | OpenAI API Key (fuer Codex CLI) |
| `ZYRKEL_BUS_URL` | Zyrkel Message Bus URL |
| `ZYRKEL_BUS_TOKEN` | Zyrkel Message Bus Token |
| `SMTP_USER` | SMTP-Benutzername (fuer Email-LLM-Relay) |
| `SMTP_PASS` | SMTP-Passwort |
| `SMTP_HOST` | SMTP-Server (default: smtp.gmail.com) |
| `IMAP_HOST` | IMAP-Server (fuer LLM-Antwort-Empfang) |
| `NANO_ID` | nano-zyrkel ID (fuer LLM-Relay) |
| `NANO_SOURCE_FILE` | Lokale Datei statt HTTP-Fetch (zum Testen) |
| `RUST_LOG` | Log-Level (z.B. `nano_zyrkel=debug`) |

---

## 13. Troubleshooting

### "No match" bei jedem Run

1. **URL pruefen:** Lade die URL im Browser und pruefe ob der erwartete Inhalt sichtbar ist
2. **Bedingung testen:** Stimmt der Suchtext / das Pattern / der CSS-Selector?
3. **`--dry-run --verbose` nutzen:** Zeigt was gefetcht und evaluiert wird
4. **`NANO_SOURCE_FILE` nutzen:** Lokale HTML-Datei zum Testen verwenden
5. **`needs_browser: true`?** Falls die Seite JavaScript braucht

### GitHub Actions laufen nicht

1. **Actions aktiviert?** Settings → Actions → General → "Allow all actions"
2. **Workflow-Datei korrekt?** Muss unter `.github/workflows/` liegen
3. **Cron-Syntax pruefen:** [crontab.guru](https://crontab.guru/) zum Validieren
4. **Repo nicht zu inaktiv?** GitHub deaktiviert Crons nach 60 Tagen Inaktivitaet — ein Push reaktiviert

### Rate Limited

- **Cron-Intervall erhoehen:** `*/15` statt `*/5`
- **GitHub API Limits:** 5000 Requests/Stunde mit Token, 60 ohne
- **Telegram Rate Limits:** Max 30 Nachrichten/Sekunde an denselben Chat

### Binary nicht gefunden

- **Release-URL pruefen:** Stimmt die URL im Workflow?
- **Architektur:** GitHub Actions Runner sind `linux-x64` (Ubuntu)
- **Berechtigung:** `chmod +x nano-zyrkel` nicht vergessen

### LLM-Bedingung scheitert

1. **API-Key gesetzt?** `ANTHROPIC_API_KEY` oder `OPENAI_API_KEY` als Secret
2. **Codex CLI verfuegbar?** Nur wenn explizit installiert
3. **Fallback-Kette pruefen:** Codex → Email → CF Bus → Anthropic API
4. **Kosten im Blick:** Jeder LLM-Aufruf kostet Geld

### Staging wird nicht committed

- **Workflow-Step pruefen:** `git add staging/ && git commit && git push` muss im Workflow sein
- **Keine Aenderungen?** `git diff --staged --quiet` ueberspringt leere Commits (gewollt)
- **Berechtigungen:** Workflow braucht `contents: write` Permission

### Consecutive Errors hoch

Ab `consecutive_errors >= 5` ist vermutlich etwas kaputt:
- URL nicht mehr erreichbar
- Seiten-Struktur hat sich geaendert (CSS-Selector passt nicht mehr)
- API-Endpunkt veraendert
- Rate Limited

---

## 14. Beispiele

Vier vorgefertigte Beispiel-Configs findest du unter `examples/hats/`:

### [`examples/hats/watcher.json`](examples/hats/watcher.json) — Einfacher Watcher

Beobachtet eine Webseite auf einen bestimmten Text.

```json
{
  "id": "example-watcher",
  "description": "Beobachte eine Webseite auf Aenderungen",
  "type": "watcher",
  "source": { "url": "https://example.com/page", "method": "GET" },
  "condition": { "type": "contains", "value": "verfuegbar" },
  "notify": { "telegram": true },
  "output_dir": "staging",
  "lang": "de"
}
```

### [`examples/hats/tracker.json`](examples/hats/tracker.json) — Wert-Tracker

Extrahiert einen Preis und baut eine Zeitreihe.

```json
{
  "id": "example-tracker",
  "description": "Verfolge einen Wert ueber Zeit",
  "type": "tracker",
  "source": { "url": "https://example.com/api/data", "method": "GET" },
  "condition": { "type": "extract_value", "selector": ".price", "unit": "EUR" },
  "notify": { "telegram": true, "message": "Neuer Datenpunkt: {value}" },
  "output_dir": "staging",
  "lang": "de"
}
```

### [`examples/hats/deadline.json`](examples/hats/deadline.json) — Frist-Erinnerung

Countdown mit gestaffelten Erinnerungen.

```json
{
  "id": "example-deadline",
  "description": "Erinnerung an eine Frist",
  "type": "deadline",
  "source": { "url": "https://example.com", "method": "GET" },
  "condition": {
    "type": "deadline_date",
    "date": "2026-06-30",
    "remind_at_days": [30, 14, 7, 3, 1]
  },
  "notify": { "telegram": true, "message": "{summary}" },
  "output_dir": "staging",
  "lang": "de"
}
```

### [`examples/hats/llm-watcher.json`](examples/hats/llm-watcher.json) — LLM-Watcher

Intelligente Beobachtung mit natuerlicher Sprache.

```json
{
  "id": "example-llm",
  "description": "Intelligente Beobachtung mit natuerlicher Sprache",
  "type": "watcher",
  "source": { "url": "https://example.com/page", "method": "GET" },
  "condition": {
    "type": "llm",
    "question": "Gibt es auf dieser Seite ein neues Angebot das noch nicht ausverkauft ist?",
    "model": "haiku"
  },
  "notify": { "telegram": true, "include_extracted": true },
  "output_dir": "staging",
  "lang": "de"
}
```

---

## 15. Lizenz

MIT

---

## Bauen aus Source

```bash
# Debug-Build
cargo build

# Release-Build (optimiert, klein)
cargo build --release

# Mit optionalen Features
cargo build --release --features browser       # Headless Chrome fuer JS-Seiten
cargo build --release --features rhai-scripting # Rhai-Scripting-Support
```

### Abhaengigkeiten

- Rust 1.75+
- OpenSSL / rustls (kein nativer OpenSSL noetig dank `rustls-tls`)
- Optional: Chromium (fuer `needs_browser: true` / `--features browser`)

### Release-Profil

Das Release-Binary ist optimiert fuer Groesse:
- LTO (Link-Time Optimization)
- Single Codegen Unit
- Symbol-Stripping
- Optimiert fuer Groesse (`opt-level = "s"`)
