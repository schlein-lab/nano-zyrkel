//! # Tooltip — minimal floating tooltip helper
//!
//! Manages a single absolutely-positioned `<div>` floating above the page
//! content. Consumers call [`Tooltip::show`] from their hover handlers and
//! [`Tooltip::hide`] when the cursor leaves. The element is created lazily
//! the first time `show` is called.

use wasm_bindgen::prelude::*;
use web_sys::{Document, HtmlElement};

const ELEMENT_ID: &str = "nz-tooltip";

/// Stateless namespace; the actual DOM element lives on `document.body`.
#[wasm_bindgen]
pub struct Tooltip;

#[wasm_bindgen]
impl Tooltip {
    /// Show or update the tooltip with `html` content positioned at
    /// `(x, y)` in viewport coordinates.
    #[wasm_bindgen]
    pub fn show(x: f64, y: f64, html: &str) -> Result<(), JsValue> {
        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;
        let element = ensure_element(&document)?;
        element.set_inner_html(html);
        element.style().set_property("display", "block")?;
        element.style().set_property("left", &format!("{}px", x + 12.0))?;
        element.style().set_property("top", &format!("{}px", y + 12.0))?;
        Ok(())
    }

    /// Hide the tooltip if it exists.
    #[wasm_bindgen]
    pub fn hide() -> Result<(), JsValue> {
        let document = match web_sys::window().and_then(|w| w.document()) {
            Some(doc) => doc,
            None => return Ok(()),
        };
        if let Some(el) = document.get_element_by_id(ELEMENT_ID) {
            if let Ok(html_el) = el.dyn_into::<HtmlElement>() {
                html_el.style().set_property("display", "none")?;
            }
        }
        Ok(())
    }
}

fn ensure_element(document: &Document) -> Result<HtmlElement, JsValue> {
    if let Some(el) = document.get_element_by_id(ELEMENT_ID) {
        return el
            .dyn_into::<HtmlElement>()
            .map_err(|_| JsValue::from_str("tooltip element wrong type"));
    }
    let element: HtmlElement = document
        .create_element("div")?
        .dyn_into::<HtmlElement>()
        .map_err(|_| JsValue::from_str("could not create tooltip"))?;
    element.set_id(ELEMENT_ID);
    let style = element.style();
    style.set_property("position", "fixed")?;
    style.set_property("z-index", "9999")?;
    style.set_property("pointer-events", "none")?;
    style.set_property("background", "rgba(17, 24, 39, 0.92)")?;
    style.set_property("color", "#F9FAFB")?;
    style.set_property("padding", "6px 10px")?;
    style.set_property("border-radius", "6px")?;
    style.set_property("font-size", "12px")?;
    style.set_property("font-family", "Inter, sans-serif")?;
    style.set_property("box-shadow", "0 4px 12px rgba(0,0,0,0.18)")?;
    style.set_property("display", "none")?;

    let body = document
        .body()
        .ok_or_else(|| JsValue::from_str("no body"))?;
    body.append_child(&element)?;
    Ok(element)
}
