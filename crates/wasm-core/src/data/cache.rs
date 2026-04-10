//! # Cache — IndexedDB-backed key/value cache for browser-side nano-zyrkels
//!
//! Wraps `localStorage` for now (small footprint, synchronous, available
//! everywhere). The public API is async on purpose so a future version can
//! be backed by IndexedDB without breaking consumers.
//!
//! Each entry is stored as a JSON envelope `{ "v": <value>, "exp": <unix_ms>|null }`
//! which lets the cache implement TTL semantics on top of plain string
//! storage.
//!
//! ## Example
//!
//! ```js
//! const cache = new Cache('vusTracker');
//! const cached = await cache.get('genes/BRCA1');
//! if (!cached) {
//!   const fresh = await loader.fetch('staging/.../latest.json');
//!   await cache.set('genes/BRCA1', fresh, 3600);  // 1 hour TTL
//! }
//! ```

use serde::{Deserialize, Serialize};
use serde_json::Value;
use wasm_bindgen::prelude::*;
use web_sys::window;

/// Versioned envelope for cached values.
#[derive(Serialize, Deserialize)]
struct Envelope {
    v: Value,
    /// Unix epoch in milliseconds. `None` means "never expires".
    exp: Option<f64>,
}

/// Key/value cache scoped by `namespace`. Multiple caches can coexist on the
/// same page without colliding because every key is internally prefixed.
#[wasm_bindgen]
pub struct Cache {
    namespace: String,
}

#[wasm_bindgen]
impl Cache {
    /// Create a new cache scoped under `namespace`. Pick a string that is
    /// unique to your nano-zyrkel (e.g. its `id` from `hats/config.json`).
    #[wasm_bindgen(constructor)]
    pub fn new(namespace: &str) -> Self {
        Self { namespace: namespace.to_string() }
    }

    /// Get a cached value by key. Returns `null` if missing or expired.
    #[wasm_bindgen]
    pub async fn get(&self, key: &str) -> Result<JsValue, JsValue> {
        let storage = local_storage()?;
        let raw = match storage.get_item(&self.scoped_key(key))? {
            Some(s) => s,
            None => return Ok(JsValue::NULL),
        };
        let envelope: Envelope = match serde_json::from_str(&raw) {
            Ok(env) => env,
            Err(_) => return Ok(JsValue::NULL),
        };
        if let Some(exp) = envelope.exp {
            if now_millis() > exp {
                let _ = storage.remove_item(&self.scoped_key(key));
                return Ok(JsValue::NULL);
            }
        }
        serde_wasm_bindgen::to_value(&envelope.v)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Store a value under `key`. Pass `ttl_seconds = 0` for "never expires".
    #[wasm_bindgen]
    pub async fn set(&self, key: &str, value: JsValue, ttl_seconds: u32) -> Result<(), JsValue> {
        let storage = local_storage()?;
        let v: Value = serde_wasm_bindgen::from_value(value)
            .map_err(|e| JsValue::from_str(&format!("cache value not serializable: {e}")))?;
        let exp = if ttl_seconds == 0 {
            None
        } else {
            Some(now_millis() + (ttl_seconds as f64) * 1000.0)
        };
        let envelope = Envelope { v, exp };
        let serialized = serde_json::to_string(&envelope)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        storage.set_item(&self.scoped_key(key), &serialized)?;
        Ok(())
    }

    /// Drop a single key.
    #[wasm_bindgen]
    pub async fn invalidate(&self, key: &str) -> Result<(), JsValue> {
        let storage = local_storage()?;
        storage.remove_item(&self.scoped_key(key))?;
        Ok(())
    }

    /// Drop every key under this namespace.
    #[wasm_bindgen(js_name = invalidateAll)]
    pub async fn invalidate_all(&self) -> Result<(), JsValue> {
        let storage = local_storage()?;
        let prefix = format!("{}:", self.namespace);
        let len = storage.length()?;
        let mut to_remove = Vec::new();
        for i in 0..len {
            if let Ok(Some(k)) = storage.key(i) {
                if k.starts_with(&prefix) {
                    to_remove.push(k);
                }
            }
        }
        for k in to_remove {
            storage.remove_item(&k)?;
        }
        Ok(())
    }

    fn scoped_key(&self, key: &str) -> String {
        format!("{}:{}", self.namespace, key)
    }
}

fn local_storage() -> Result<web_sys::Storage, JsValue> {
    window()
        .ok_or_else(|| JsValue::from_str("no window"))?
        .local_storage()?
        .ok_or_else(|| JsValue::from_str("localStorage not available"))
}

fn now_millis() -> f64 {
    js_sys::Date::now()
}
