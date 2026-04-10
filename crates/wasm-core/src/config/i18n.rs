//! # I18n — translation lookup keyed by language and message id
//!
//! Tiny key/value lookup. The user repo bundles a JSON object per language
//! and registers it once at startup; subsequent calls to [`I18n::t`] resolve
//! the right string for the configured language with a fallback chain
//! `lang → "en" → key`.
//!
//! ## Example
//!
//! ```js
//! const i18n = new I18n('de');
//! i18n.register('de', { greeting: 'Hallo {name}' });
//! i18n.register('en', { greeting: 'Hello {name}' });
//! i18n.t('greeting', { name: 'Welt' });   // → "Hallo Welt"
//! ```

use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// Tiny i18n catalog. Stores one JSON object per language and resolves
/// keys with substitution.
#[wasm_bindgen]
pub struct I18n {
    lang: String,
    fallback: String,
    catalogs: HashMap<String, HashMap<String, String>>,
}

#[wasm_bindgen]
impl I18n {
    /// Create a new catalog. `lang` is the desired language; the fallback
    /// chain is `lang → "en" → key`.
    #[wasm_bindgen(constructor)]
    pub fn new(lang: &str) -> Self {
        Self {
            lang: lang.to_string(),
            fallback: "en".to_string(),
            catalogs: HashMap::new(),
        }
    }

    /// Register a translation table for one language. `messages` should be
    /// a flat JS object `{ key: "translated string" }`.
    #[wasm_bindgen]
    pub fn register(&mut self, lang: &str, messages: JsValue) -> Result<(), JsValue> {
        let map: HashMap<String, String> = serde_wasm_bindgen::from_value(messages)
            .map_err(|e| JsValue::from_str(&format!("messages must be flat object: {e}")))?;
        self.catalogs.insert(lang.to_string(), map);
        Ok(())
    }

    /// Resolve `key` for the configured language. Returns `key` itself
    /// when no translation is found in any catalog.
    #[wasm_bindgen]
    pub fn t(&self, key: &str) -> String {
        self.lookup(key).unwrap_or_else(|| key.to_string())
    }

    /// Resolve `key` and substitute named placeholders from `vars`
    /// (e.g. `t_with('greeting', {name: 'World'})`).
    #[wasm_bindgen(js_name = tWith)]
    pub fn t_with(&self, key: &str, vars: JsValue) -> String {
        let template = self.lookup(key).unwrap_or_else(|| key.to_string());
        let map: HashMap<String, String> = serde_wasm_bindgen::from_value(vars).unwrap_or_default();
        let mut out = template;
        for (k, v) in map {
            out = out.replace(&format!("{{{}}}", k), &v);
        }
        out
    }

    /// Switch the active language at runtime.
    #[wasm_bindgen(js_name = setLang)]
    pub fn set_lang(&mut self, lang: &str) {
        self.lang = lang.to_string();
    }

    /// Currently active language tag.
    #[wasm_bindgen]
    pub fn lang(&self) -> String {
        self.lang.clone()
    }

    fn lookup(&self, key: &str) -> Option<String> {
        if let Some(map) = self.catalogs.get(&self.lang) {
            if let Some(v) = map.get(key) {
                return Some(v.clone());
            }
        }
        if let Some(map) = self.catalogs.get(&self.fallback) {
            if let Some(v) = map.get(key) {
                return Some(v.clone());
            }
        }
        None
    }
}
