//! # Form — minimal form-control wrappers
//!
//! Three thin wrappers around the standard HTML form elements that
//! handle change events, debouncing, and JS callback dispatch in a
//! consistent way. Mount them on existing inputs by selector.
//!
//! Mounting `TextInput` on a `<input type="text">` is enough to start
//! receiving callbacks for every value change. The wrappers do not
//! create elements themselves — that stays in the consumer's HTML so
//! styling, layout and accessibility are out of scope here.
//!
//! ## Example
//!
//! ```js
//! TextInput.bind('#search', value => filter(value), { debounceMs: 200 });
//! Select.bind('#sort', value => render({ sort: value }));
//! Range.bind('#opacity', value => setOpacity(value));
//! ```

use serde::Deserialize;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{Event, HtmlInputElement, HtmlSelectElement};

#[derive(Deserialize, Default)]
struct BindOptions {
    #[serde(default)]
    debounce_ms: Option<i32>,
}

#[wasm_bindgen]
pub struct TextInput;

#[wasm_bindgen]
impl TextInput {
    /// Bind a JS callback to the value of the input matched by
    /// `selector`. The callback receives the latest value as a string.
    /// Pass `{ debounceMs: 250 }` for typing-friendly debouncing.
    #[wasm_bindgen]
    pub fn bind(selector: &str, callback: js_sys::Function, options: JsValue) -> Result<(), JsValue> {
        let opts: BindOptions = serde_wasm_bindgen::from_value(options).unwrap_or_default();
        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;
        let element: HtmlInputElement = document
            .query_selector(selector)?
            .ok_or_else(|| JsValue::from_str("text input not found"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("not an HtmlInputElement"))?;

        let cb = callback.clone();
        let element_for_listener = element.clone();
        let debounce = opts.debounce_ms;

        let listener = Closure::wrap(Box::new(move |_: Event| {
            let value = element_for_listener.value();
            let cb_inner = cb.clone();
            match debounce {
                Some(ms) if ms > 0 => {
                    let timeout = Closure::wrap(Box::new(move || {
                        let _ = cb_inner.call1(&JsValue::NULL, &JsValue::from_str(&value));
                    }) as Box<dyn FnMut()>);
                    let _ = web_sys::window()
                        .unwrap()
                        .set_timeout_with_callback_and_timeout_and_arguments_0(
                            timeout.as_ref().unchecked_ref(),
                            ms,
                        );
                    timeout.forget();
                }
                _ => {
                    let _ = cb_inner.call1(&JsValue::NULL, &JsValue::from_str(&value));
                }
            }
        }) as Box<dyn FnMut(Event)>);
        element.add_event_listener_with_callback("input", listener.as_ref().unchecked_ref())?;
        listener.forget();
        Ok(())
    }
}

#[wasm_bindgen]
pub struct Select;

#[wasm_bindgen]
impl Select {
    /// Bind a JS callback to the value of a `<select>` matched by
    /// `selector`. The callback receives the selected option's value
    /// as a string.
    #[wasm_bindgen]
    pub fn bind(selector: &str, callback: js_sys::Function) -> Result<(), JsValue> {
        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;
        let element: HtmlSelectElement = document
            .query_selector(selector)?
            .ok_or_else(|| JsValue::from_str("select not found"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("not an HtmlSelectElement"))?;

        let cb = callback.clone();
        let element_for_listener = element.clone();
        let listener = Closure::wrap(Box::new(move |_: Event| {
            let value = element_for_listener.value();
            let _ = cb.call1(&JsValue::NULL, &JsValue::from_str(&value));
        }) as Box<dyn FnMut(Event)>);
        element.add_event_listener_with_callback("change", listener.as_ref().unchecked_ref())?;
        listener.forget();
        Ok(())
    }
}

#[wasm_bindgen]
pub struct Range;

#[wasm_bindgen]
impl Range {
    /// Bind a JS callback to the value of a `<input type="range">`
    /// matched by `selector`. The callback receives the latest value
    /// as a `f64`.
    #[wasm_bindgen]
    pub fn bind(selector: &str, callback: js_sys::Function) -> Result<(), JsValue> {
        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;
        let element: HtmlInputElement = document
            .query_selector(selector)?
            .ok_or_else(|| JsValue::from_str("range input not found"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("not an HtmlInputElement"))?;

        let cb = callback.clone();
        let element_for_listener = element.clone();
        let listener = Closure::wrap(Box::new(move |_: Event| {
            let value: f64 = element_for_listener.value().parse().unwrap_or(0.0);
            let _ = cb.call1(&JsValue::NULL, &JsValue::from_f64(value));
        }) as Box<dyn FnMut(Event)>);
        element.add_event_listener_with_callback("input", listener.as_ref().unchecked_ref())?;
        listener.forget();
        Ok(())
    }
}
