//! # Legend — small DOM helper for color → label mappings
//!
//! Builds a flat list of `<span>` swatches inside a target element. Pure
//! DOM manipulation, no canvas — most charts pair a `<canvas>` with a
//! sibling `<div>` that this helper populates.

use serde::Deserialize;
use wasm_bindgen::prelude::*;
use web_sys::HtmlElement;

#[derive(Deserialize)]
struct Item {
    label: String,
    color: String,
}

/// Builder for a chart legend.
#[wasm_bindgen]
pub struct Legend {
    target: HtmlElement,
    items: Vec<Item>,
    swatch_size: u32,
}

#[wasm_bindgen]
impl Legend {
    /// Create a new legend that will populate `target` (typically a `<div>`).
    #[wasm_bindgen(constructor)]
    pub fn new(target: HtmlElement) -> Legend {
        Self {
            target,
            items: Vec::new(),
            swatch_size: 12,
        }
    }

    /// Provide the items as `[{label, color}, ...]`.
    #[wasm_bindgen]
    pub fn items(mut self, items: JsValue) -> Result<Legend, JsValue> {
        self.items = serde_wasm_bindgen::from_value(items)
            .map_err(|e| JsValue::from_str(&format!("legend items: {e}")))?;
        Ok(self)
    }

    /// Swatch size in pixels.
    #[wasm_bindgen(js_name = swatchSize)]
    pub fn swatch_size(mut self, size: u32) -> Legend {
        self.swatch_size = size.max(4);
        self
    }

    /// Render. Replaces any existing children of the target element.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<(), JsValue> {
        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;

        self.target.set_inner_html("");
        let style = self.target.style();
        style.set_property("display", "flex")?;
        style.set_property("flex-wrap", "wrap")?;
        style.set_property("gap", "12px")?;
        style.set_property("font-family", "Inter, sans-serif")?;
        style.set_property("font-size", "12px")?;
        style.set_property("color", "#374151")?;

        for item in &self.items {
            let row: HtmlElement = document
                .create_element("span")?
                .dyn_into::<HtmlElement>()
                .map_err(|_| JsValue::from_str("legend row create failed"))?;
            let row_style = row.style();
            row_style.set_property("display", "inline-flex")?;
            row_style.set_property("align-items", "center")?;
            row_style.set_property("gap", "6px")?;

            let swatch: HtmlElement = document
                .create_element("span")?
                .dyn_into::<HtmlElement>()
                .map_err(|_| JsValue::from_str("legend swatch create failed"))?;
            let swatch_style = swatch.style();
            swatch_style.set_property("display", "inline-block")?;
            swatch_style.set_property("width", &format!("{}px", self.swatch_size))?;
            swatch_style.set_property("height", &format!("{}px", self.swatch_size))?;
            swatch_style.set_property("border-radius", "2px")?;
            swatch_style.set_property("background", &item.color)?;
            row.append_child(&swatch)?;

            let label_node = document.create_text_node(&item.label);
            row.append_child(&label_node)?;
            self.target.append_child(&row)?;
        }
        Ok(())
    }
}
