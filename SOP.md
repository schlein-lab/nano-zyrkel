# SOP: nano-zyrkel einrichten

Diese Anleitung ist fuer Zyrkel selbst — damit er nano-zyrkels standardisiert einrichten kann.

## Schritt 1: Typ bestimmen

| User sagt | Typ | Bedingung | LLM? |
|---|---|---|---|
| "Beobachte ob X auf Seite Y steht" | watcher | contains | Nein |
| "Sag mir wenn sich Seite Y aendert" | watcher | changed | Nein |
| "Gibt es neue Eintraege im RSS-Feed?" | watcher | rss_new_entry | Nein |
| "Verfolge den Preis von X" | tracker | extract_value | Nein |
| "Erinnere mich an Frist am Datum" | deadline | deadline_date | Nein |
| "Gibt es was Neues zu Thema X auf Seite Y?" | watcher | llm | Ja |
| "Beobachte ob Angebot X noch da ist" | watcher | llm | Ja |
| "Beantworte Emails fuer mich" | maildesk | codex/llm | Ja |

**Regel: IMMER erst pruefen ob es OHNE LLM geht. LLM kostet Geld.**

## Schritt 2: Config erstellen

### Minimal-Config (watcher mit contains):
```json
{
  "id": "mein-nano",
  "description": "Beobachte example.com auf 'verfuegbar'",
  "type": "watcher",
  "source": { "url": "https://example.com", "method": "GET" },
  "condition": { "type": "contains", "value": "verfuegbar" },
  "notify": { "telegram": true },
  "output_dir": "staging",
  "lang": "de"
}
```

### Mit LLM:
```json
{
  "condition": {
    "type": "llm",
    "question": "Gibt es ein neues Angebot das nicht ausverkauft ist?",
    "model": "haiku"
  }
}
```

### Tracker:
```json
{
  "type": "tracker",
  "condition": {
    "type": "extract_value",
    "selector": ".price",
    "unit": "EUR"
  }
}
```

### Deadline:
```json
{
  "type": "deadline",
  "condition": {
    "type": "deadline_date",
    "date": "2026-06-30",
    "remind_at_days": [30, 14, 7, 3, 1]
  }
}
```

## Schritt 3: Repo erstellen

Tool aufrufen:
```
spawn_nano(
  description: "Was der nano tun soll",
  template: "watcher",        // oder llm-watcher, tracker, deadline
  target_url: "https://...",
  search_term: "text"          // nur bei watcher/contains
)
```

Das erstellt:
- Privates GitHub-Repo: `{username}/nano-zyrkel-{name}`
- Config: `hats/config.json`
- Workflow: `.github/workflows/run.yml`
- README mit Beschreibung

## Schritt 4: Secrets setzen

User muss im GitHub-Repo unter Settings > Secrets > Actions setzen:
- `TELEGRAM_BOT_TOKEN` — von @BotFather
- `TELEGRAM_CHAT_ID` — eigene Chat-ID
- `OPENAI_API_KEY` — nur wenn LLM-Bedingung (llm-watcher Template)

## Schritt 5: Cron anpassen

In `.github/workflows/run.yml` den cron-Ausdruck anpassen:
```yaml
on:
  schedule:
    - cron: '0 */2 * * *'   # Alle 2 Stunden
```

Empfohlene Intervalle:
- Stuendlich: `'0 * * * *'`
- Alle 2h: `'0 */2 * * *'`
- Taeglich: `'0 8 * * *'`
- Woechentlich: `'0 9 * * 1'`
- Minimum: `'*/5 * * * *'` (GitHub Rate Limits!)

## Schritt 6: Testen

1. Im GitHub-Repo: Actions > Workflow > "Run workflow" (manuell)
2. Pruefen ob `staging/` Ergebnisse hat
3. Telegram-Benachrichtigung testen

## Haeufige Fehler

| Problem | Loesung |
|---|---|
| "Binary not found" | nano-zyrkel Release pruefen, URL in Workflow korrekt? |
| "No match" bei jedem Run | URL pruefen, Bedingung testen, evtl. needs_browser=true |
| Kein Telegram | Secrets korrekt? Bot gestartet? Chat-ID stimmt? |
| GitHub Actions laeuft nicht | Actions im Repo aktiviert? Workflow YAML Syntax ok? |
| Rate limited | Cron-Intervall erhoehen (mindestens */5) |
| consecutive_errors > 5 | URL offline? Seite hat Layout geaendert? Selector anpassen |

## Anpassen bestehender nano-zyrkels

1. `nano_status(name)` — Status und letzte Findings pruefen
2. Config in `hats/config.json` im Repo aendern und pushen
3. `pause_nano(name)` — Temporaer pausieren
4. `kill_nano(name)` — Dauerhaft archivieren

## Bedingungstyp-Entscheidungsbaum

```
Ist die Bedingung ein einfacher Text?
  Ja → contains
  Nein ↓

Ist es ein Muster (Email, Telefonnummer, Datum)?
  Ja → regex
  Nein ↓

Ist es ein HTML-Element auf einer Webseite?
  Ja → css_selector
  Nein ↓

Ist es ein Feld in einer JSON-API?
  Ja → json_path
  Nein ↓

Ist es ein neuer RSS/Atom-Eintrag?
  Ja → rss_new_entry
  Nein ↓

Soll nur gemeldet werden wenn sich was aendert?
  Ja → changed
  Nein ↓

Soll ein Zahlenwert verfolgt werden?
  Ja → extract_value
  Nein ↓

Ist es eine Frist/Deadline?
  Ja → deadline_date
  Nein ↓

Braucht es menschliches Verstaendnis der Seite?
  Ja → llm (kostet Geld!)
  Nein ↓

Soll eine Inbox bearbeitet und Emails beantwortet werden?
  Ja → maildesk (Codex CLI + Telegram-Approval)
  Nein → contains oder regex nochmal pruefen
```
