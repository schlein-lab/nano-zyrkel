//! # EmptyState — shared "no data" / "loading" placeholder
//!
//! Replaces any chart's `<canvas>` with a small status block. The previous
//! children of the parent element are removed so calling code can swap
//! between chart and placeholder freely.

use wasm_bindgen::prelude::*;
use web_sys::HtmlElement;

/// Stateless namespace for inserting placeholder content.
#[wasm_bindgen]
pub struct EmptyState;

#[wasm_bindgen]
impl EmptyState {
    /// Replace `target`'s contents with a "no data" message.
    #[wasm_bindgen(js_name = noData)]
    pub fn no_data(target: HtmlElement, message: &str) -> Result<(), JsValue> {
        render(&target, message, "#9CA3AF")
    }

    /// Replace `target`'s contents with a "loading" message.
    #[wasm_bindgen]
    pub fn loading(target: HtmlElement, message: &str) -> Result<(), JsValue> {
        render(&target, message, "#6B7280")
    }
}

fn render(target: &HtmlElement, text: &str, color: &str) -> Result<(), JsValue> {
    target.set_inner_html("");
    let style = target.style();
    style.set_property("display", "flex")?;
    style.set_property("align-items", "center")?;
    style.set_property("justify-content", "center")?;
    style.set_property("min-height", "120px")?;
    style.set_property("color", color)?;
    style.set_property("font-family", "Inter, sans-serif")?;
    style.set_property("font-size", "13px")?;

    let document = web_sys::window()
        .ok_or_else(|| JsValue::from_str("no window"))?
        .document()
        .ok_or_else(|| JsValue::from_str("no document"))?;
    let label = document.create_text_node(text);
    target.append_child(&label)?;
    Ok(())
}
