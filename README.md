# Zyrkel HAT Runner

Autonome Agenten die als GitHub Actions Workflows leben und 24/7 arbeiten.

## Was ist ein HAT?

Ein HAT (Headless Autonomous Task) ist ein leichtgewichtiger Agent der:
- In einem GitHub-Repo als Action Workflow lebt
- Auf GitHubs Servern laeuft (nicht auf deinem Rechner)
- Webseiten beobachtet, Daten trackt, an Fristen erinnert
- Dich per Telegram benachrichtigt wenn etwas passiert
- Ergebnisse als Git-Commits versioniert (Zeitreihen, Audit-Trail)
- Weiterlaeuft wenn du deinen Laptop zuklappst

## Schnellstart

1. Dieses Repo forken/klonen
2. GitHub Secrets setzen: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
3. HAT-Config erstellen unter `hats/mein-hat.json`
4. Workflow-YAML kopieren von `.github/workflows/hat-template.yml`
5. Platzhalter ersetzen, pushen — HAT laeuft.

## HAT-Typen

| Typ | Beschreibung |
|-----|-------------|
| `watcher` | Beobachtet URL auf Bedingung (Text, Regex, CSS-Selector, LLM) |
| `tracker` | Extrahiert Werte und baut Zeitreihe (Preise, Kurse, Metriken) |
| `deadline` | Countdown mit gestaffelten Erinnerungen |
| `crawler` | Sammelt Daten aus mehreren Quellen |
| `guardian` | Erkennt Aenderungen/Anomalien gegenueber Baseline |

## Bedingungstypen (Condition)

| Typ | Beschreibung | LLM? |
|-----|-------------|------|
| `contains` | Textsuche | Nein |
| `regex` | Regulaerer Ausdruck | Nein |
| `css_selector` | HTML-Element per CSS-Selector finden | Nein |
| `json_path` | JSON-API-Response abfragen | Nein |
| `rss_new_entry` | Neuer RSS/Atom-Feed-Eintrag | Nein |
| `changed` | Inhalt hat sich geaendert (Hash-Vergleich) | Nein |
| `extract_value` | Zahlenwert extrahieren + tracken | Nein |
| `deadline_date` | Tage bis Frist berechnen | Nein |
| `llm` | Natuerlichsprachige Frage an die Seite stellen | Ja (Haiku) |

## Sprachen

HAT-Runner unterstuetzt Deutsch und Englisch.
Konfigurierbar ueber `--lang de` oder `"lang": "en"` in der Config.

## Verzeichnisstruktur

```
zyrkel-hat/
├── .github/workflows/     ← HAT-Workflows (je einer pro HAT)
├── hats/                  ← HAT-Konfigurationen (JSON)
├── staging/               ← HAT-Ergebnisse (automatisch befuellt)
│   └── {hat-id}/
│       ├── latest.json    ← Letztes Ergebnis
│       ├── history.jsonl  ← Alle bisherigen Checks
│       └── state.json     ← Persistenter Zustand
├── examples/hats/         ← Beispiel-Konfigurationen
└── src/                   ← hat-runner Quellcode (Rust)
```

## Lizenz

MIT
