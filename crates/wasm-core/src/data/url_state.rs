//! # UrlState — synchronize app state with the URL query string
//!
//! Builds shareable links by mirroring app state into the URL. Three
//! operations:
//!
//! - [`UrlState::read`] returns the current `?key=value&…` pairs as a
//!   plain JS object so the app can hydrate its initial state.
//! - [`UrlState::write`] replaces the query string with a serialized
//!   form of the supplied JS object via `history.replaceState` —
//!   no scroll jump, no extra history entry.
//! - [`UrlState::on_change`] registers a callback fired when the user
//!   navigates back / forward (the `popstate` event).
//!
//! ## Example
//!
//! ```js
//! import { UrlState } from './core/wasm/nano_zyrkel_wasm_core.js';
//!
//! // Hydrate
//! const params = UrlState.read();          // { gene: 'BRCA1', sort: 'desc' }
//!
//! // After a filter change
//! UrlState.write({ gene: 'BRCA2', sort: 'asc' });
//!
//! // Listen for back/forward
//! UrlState.onChange(state => render(state));
//! ```

use serde_json::{Map, Value};
use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{Event, UrlSearchParams};

/// Stateless namespace for URL ↔ state synchronization.
#[wasm_bindgen]
pub struct UrlState;

#[wasm_bindgen]
impl UrlState {
    /// Read the current URL query string into a plain JS object.
    /// Repeated keys collapse into the last value seen.
    #[wasm_bindgen]
    pub fn read() -> Result<JsValue, JsValue> {
        let window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
        let search = window.location().search()?;
        let params = UrlSearchParams::new_with_str(&search)?;
        let mut map = Map::new();
        let entries = js_sys::try_iter(&params)?
            .ok_or_else(|| JsValue::from_str("URLSearchParams not iterable"))?;
        for entry in entries {
            let entry = entry?;
            let pair: js_sys::Array = entry.dyn_into()?;
            let key = pair.get(0).as_string().unwrap_or_default();
            let value = pair.get(1).as_string().unwrap_or_default();
            map.insert(key, Value::String(value));
        }
        serde_wasm_bindgen::to_value(&Value::Object(map))
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Replace the current URL query string with a serialized form of
    /// `state` (a plain JS object). Skips empty values.
    #[wasm_bindgen]
    pub fn write(state: JsValue) -> Result<(), JsValue> {
        let value: Value = serde_wasm_bindgen::from_value(state)
            .map_err(|e| JsValue::from_str(&format!("url state not parseable: {e}")))?;

        let params = UrlSearchParams::new()?;
        if let Some(obj) = value.as_object() {
            for (k, v) in obj {
                let serialized = match v {
                    Value::Null => continue,
                    Value::String(s) if s.is_empty() => continue,
                    Value::String(s) => s.clone(),
                    Value::Number(n) => n.to_string(),
                    Value::Bool(b) => b.to_string(),
                    other => other.to_string(),
                };
                params.set(k, &serialized);
            }
        }

        let window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
        let history = window.history()?;
        let path = window.location().pathname()?;
        let query = params.to_string().as_string().unwrap_or_default();
        let new_url = if query.is_empty() {
            path
        } else {
            format!("{path}?{query}")
        };
        history.replace_state_with_url(&JsValue::NULL, "", Some(&new_url))?;
        Ok(())
    }

    /// Register a callback fired on `popstate` (back / forward
    /// navigation). The callback receives the new state object.
    #[wasm_bindgen(js_name = onChange)]
    pub fn on_change(callback: js_sys::Function) -> Result<(), JsValue> {
        let window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
        let cb_clone = callback.clone();
        let listener = Closure::wrap(Box::new(move |_: Event| {
            if let Ok(state) = UrlState::read() {
                let _ = cb_clone.call1(&JsValue::NULL, &state);
            }
        }) as Box<dyn FnMut(Event)>);
        window
            .add_event_listener_with_callback("popstate", listener.as_ref().unchecked_ref())?;
        listener.forget();
        Ok(())
    }
}
