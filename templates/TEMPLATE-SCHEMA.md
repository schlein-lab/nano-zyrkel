# `template.json` schema

Every template ships a `template.json` next to its files. The schema
is designed to be consumed by **two** audiences:

1. **The browser-based nano-zyrkel builder** — reads the manifest at
   startup, renders one form per template, and on submit copies the
   files into a fresh user repo via the GitHub API. Slot values are
   substituted into placeholder strings during the copy.
2. **Humans browsing this repo on GitHub** — `template.json` is small
   enough to read at a glance and tells you what each template
   actually is.

## Required fields

```json
{
  "schema": "nano-zyrkel-template/v1",
  "id": "scaffold-interactive-app",
  "kind": "scaffold",
  "name": "Interactive app",
  "description": "Cron binary plus a browser dashboard built on top of the WASM core.",
  "tags": ["binary", "wasm", "dashboard", "github-pages"],

  "requires": {
    "binary": ">=0.1.0",
    "wasm": ">=0.2.0",
    "wasm_features": ["data", "config", "viz-basic"]
  },

  "slots": [
    {
      "name": "NANO_ID",
      "label": "Nano ID",
      "kind": "string",
      "default": "my-nano",
      "required": true,
      "help": "Slug used in the repo name and on the dashboard."
    },
    {
      "name": "DESCRIPTION",
      "label": "Short description",
      "kind": "string",
      "default": "What this nano-zyrkel does",
      "required": true
    },
    {
      "name": "BRANDING_COLOR",
      "label": "Brand color",
      "kind": "color",
      "default": "#8B5CF6",
      "required": false
    }
  ],

  "files": [
    "hats/config.json",
    "docs/index.html",
    "docs/style.css",
    "docs/app.js",
    ".github/workflows/data-update.yml",
    ".github/workflows/deploy.yml",
    ".github/workflows/update-core.yml",
    ".nano-zyrkel-versions.json",
    "README.md"
  ]
}
```

## Field reference

| Field         | Type                | Notes |
| ------------- | ------------------- | ----- |
| `schema`      | string              | Always `"nano-zyrkel-template/v1"`. Bumped on breaking changes. |
| `id`          | string              | Slug, must match the directory name. |
| `kind`        | enum                | `"scaffold"`, `"theme"` or `"example"`. |
| `name`        | string              | Human label. |
| `description` | string              | One-line summary. |
| `tags`        | string array        | Free-form tags used by the builder for filtering. |
| `requires`    | object              | Min binary version, min WASM version, optional list of WASM features that must be enabled in the consuming user repo. |
| `slots`       | array of slot specs | Builder renders one form control per slot; the user's value is substituted into placeholder strings of the form `{{NAME}}` inside the listed `files` during copy. |
| `files`       | string array        | Paths (relative to the template directory) that the builder copies into the new repo. Files NOT in the list are ignored. |

## Slot kinds

| Kind        | Renders as       | Notes |
| ----------- | ---------------- | ----- |
| `string`    | text input       | Default validation: non-empty when `required` is set. |
| `multiline` | textarea         | Multi-line free text. |
| `number`    | number input     | Use `min` / `max` for bounds. |
| `boolean`   | checkbox         | `default` decides the initial state. |
| `enum`      | select           | Provide an `options` array of `{value, label}` pairs. |
| `url`       | url input        | Validated as `URL`. |
| `color`     | color picker     | Returns `#RRGGBB`. |
| `slug`      | text input       | Auto-lowercases and replaces spaces with `-`. |

## Substitution rules

During copy, every file in `files` is read as text and any
placeholder of the form `{{SLOT_NAME}}` is replaced with the user's
chosen value. Files marked as binary (anything outside the allow-list
`html, css, js, json, md, yml, yaml, toml, rs, txt, svg`) are copied
verbatim.

## Versioning

`schema: "nano-zyrkel-template/v1"` is part of the v1 contract.
Adding new slot kinds is non-breaking; renaming or removing existing
ones requires a major version bump (`v2`) and a migration note in the
manifest.
