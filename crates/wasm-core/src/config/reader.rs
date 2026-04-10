//! # ConfigReader — load and read `hats/config.json` from the browser
//!
//! Mirrors the binary core's understanding of the schema so that the
//! browser-side nano-zyrkel and the GitHub Actions binary always agree on
//! what the config means. This is the canonical way for a user repo's JS
//! glue to ask "what's my id, branding color, language, list of widgets?".
//!
//! ## Example
//!
//! ```js
//! const cfg = await ConfigReader.load('hats/config.json');
//! document.title = cfg.id();
//! document.documentElement.lang = cfg.lang();
//! ```

use serde_json::Value;
use wasm_bindgen::prelude::*;

use crate::data::loader::fetch_json;

/// Lazy reader over the parsed `hats/config.json`.
///
/// Methods take an optional dot path so a consumer can pull out custom
/// fields without having to declare them on the Rust side.
#[wasm_bindgen]
pub struct ConfigReader {
    raw: Value,
}

#[wasm_bindgen]
impl ConfigReader {
    /// Load the config from a relative URL (typically `hats/config.json`).
    /// Throws on network or parse errors.
    #[wasm_bindgen]
    pub async fn load(url: &str) -> Result<ConfigReader, JsValue> {
        let value = fetch_json(url).await?;
        let raw: Value = serde_wasm_bindgen::from_value(value)
            .map_err(|e| JsValue::from_str(&format!("config not parseable: {e}")))?;
        Ok(Self { raw })
    }

    /// Build a reader directly from a JS object — useful for tests or for
    /// repos that bundle the config inline.
    #[wasm_bindgen(js_name = fromValue)]
    pub fn from_value(value: JsValue) -> Result<ConfigReader, JsValue> {
        let raw: Value = serde_wasm_bindgen::from_value(value)
            .map_err(|e| JsValue::from_str(&format!("config not parseable: {e}")))?;
        Ok(Self { raw })
    }

    /// `id` field — typically the nano-zyrkel slug.
    #[wasm_bindgen]
    pub fn id(&self) -> String {
        self.raw.get("id").and_then(Value::as_str).unwrap_or("").to_string()
    }

    /// `type` field (e.g. `data-pipeline`, `interactive-app`, `showcase`).
    #[wasm_bindgen(js_name = nanoType)]
    pub fn nano_type(&self) -> String {
        self.raw.get("type").and_then(Value::as_str).unwrap_or("").to_string()
    }

    /// `lang` field, used by [`I18n`](super::i18n::I18n). Defaults to `"de"`.
    #[wasm_bindgen]
    pub fn lang(&self) -> String {
        self.raw
            .get("lang")
            .and_then(Value::as_str)
            .unwrap_or("de")
            .to_string()
    }

    /// `description` free-text field.
    #[wasm_bindgen]
    pub fn description(&self) -> String {
        self.raw
            .get("description")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string()
    }

    /// Branding color from `branding.color` if present.
    #[wasm_bindgen(js_name = brandingColor)]
    pub fn branding_color(&self) -> Option<String> {
        self.raw
            .get("branding")
            .and_then(|b| b.get("color"))
            .and_then(Value::as_str)
            .map(|s| s.to_string())
    }

    /// Generic dot-path getter. Returns `null` if the path is missing.
    /// Example: `cfg.get('notify.telegram')`.
    #[wasm_bindgen]
    pub fn get(&self, path: &str) -> JsValue {
        match resolve(&self.raw, path) {
            Some(v) => serde_wasm_bindgen::to_value(v).unwrap_or(JsValue::NULL),
            None => JsValue::NULL,
        }
    }

    /// Returns the entire config as a `JsValue` for cases where the consumer
    /// wants to walk it themselves.
    #[wasm_bindgen]
    pub fn raw(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.raw).unwrap_or(JsValue::NULL)
    }
}

fn resolve<'a>(value: &'a Value, path: &str) -> Option<&'a Value> {
    path.split('.').try_fold(value, |acc, seg| acc.get(seg))
}
