# i18n guide

The SDK supports multiple languages on both sides:

- **Binary core** uses [`i18n::msg`][bin-i18n] to localize the
  log + notification strings it produces. Each nano-zyrkel picks a
  language with the `lang` field in `hats/config.json` (currently
  `de` and `en`).
- **WASM core** ships an [`I18n`][wasm-i18n] catalog that the JS
  glue can populate at runtime to localize headings, button labels
  and form helper text.

[bin-i18n]: ../crates/core/src/i18n.rs
[wasm-i18n]: ../crates/wasm-core/src/config/i18n.rs

## Set the language in `hats/config.json`

```json
{
  "id": "my-nano",
  "lang": "en",
  "...": "..."
}
```

Both the binary `Runtime` and the browser `ConfigReader` read the
same `lang` value, so the binary's notifications and the browser
dashboard always agree on which language to render.

## Server-side strings

Add new keys to the binary's translation table by editing
[`crates/core/src/i18n.rs`](../crates/core/src/i18n.rs). Every string
must have an entry for every supported language; the build fails if
you forget one.

```rust
// crates/core/src/i18n.rs
pub fn msg(lang: &str, key: &str, args: &[&str]) -> String {
    match (lang, key) {
        ("de", "hat_starting") => format!("nano-zyrkel '{}' startet", args[0]),
        ("en", "hat_starting") => format!("nano-zyrkel '{}' starting", args[0]),
        // …
    }
}
```

This is intentionally minimal — there is no MO/PO toolchain to learn,
no fluent runtime, no compile step. Adding a third language is a
~20-line patch.

## Client-side strings

In the browser, register a translation table per language and call
`I18n.t(key)` from your glue code:

```js
import init, { I18n } from './core/wasm/profile/nano_zyrkel_wasm_core.js';
await init();

const i18n = new I18n('de');
i18n.register('en', {
  greeting:  'Hello {name}',
  no_data:   'No data yet',
  download:  'Download as CSV',
});
i18n.register('de', {
  greeting:  'Hallo {name}',
  no_data:   'Noch keine Daten',
  download:  'Als CSV herunterladen',
});

document.getElementById('greet').textContent =
  i18n.tWith('greeting', { name: 'Welt' });
document.getElementById('export').textContent = i18n.t('download');
```

The catalog is just a `Map<String, String>` per language, so the
JSON files you keep in `docs/i18n/` can be loaded with the
`DataLoader` and registered in one go:

```js
import init, { DataLoader, I18n } from './core/wasm/profile/nano_zyrkel_wasm_core.js';
await init();

const lang = new URLSearchParams(location.search).get('lang') || 'en';
const messages = await new DataLoader().fetch(`docs/i18n/${lang}.json`);

const i18n = new I18n(lang);
i18n.register(lang, messages);
```

## Fallback chain

`I18n.t(key)` walks the chain `currentLang → en → key`. If the key
is missing in both the active language and the fallback, the helper
returns the key string unchanged so you can spot untranslated
content at a glance during development.

## Adding a new language

1. Pick the BCP 47 tag (`fr`, `pt-BR`, `zh-Hans`, …).
2. Add the matching arms to `crates/core/src/i18n.rs` for every
   binary string (the compiler tells you which ones).
3. Drop a `docs/i18n/<tag>.json` into your nano-zyrkel repo and
   register it from `app.js`.
4. Set `"lang": "<tag>"` in `hats/config.json` and push.

That is the entire flow. The SDK does not enforce a fixed list — any
string is a valid language tag, and the i18n catalog stays per-repo.
