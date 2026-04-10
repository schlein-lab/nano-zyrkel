//! # Accordion — collapsible panels
//!
//! Mounts a list of `{ title, html }` rows. Clicking a title expands
//! the panel and collapses the others (single-open mode) or toggles
//! independently (`multi: true`).

use serde::Deserialize;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{Event, HtmlElement};

#[derive(Deserialize, Clone)]
struct Item {
    title: String,
    html: String,
}

#[wasm_bindgen]
pub struct Accordion;

#[wasm_bindgen]
impl Accordion {
    /// Mount an accordion inside `selector`. `items` is
    /// `[{ title, html }, ...]`. When `multi` is `true`, multiple
    /// panels can be open at once; otherwise opening one collapses
    /// every other.
    #[wasm_bindgen]
    pub fn mount(selector: &str, items: JsValue, multi: bool) -> Result<(), JsValue> {
        let parsed: Vec<Item> = serde_wasm_bindgen::from_value(items)
            .map_err(|e| JsValue::from_str(&format!("accordion items not parseable: {e}")))?;

        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;
        let host: HtmlElement = document
            .query_selector(selector)?
            .ok_or_else(|| JsValue::from_str("accordion host not found"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("host not HtmlElement"))?;
        host.set_inner_html("");

        for item in parsed {
            let row: HtmlElement = document
                .create_element("div")?
                .dyn_into()
                .map_err(|_| JsValue::from_str("row cast failed"))?;
            row.style().set_property("border-bottom", "1px solid #E5E7EB")?;

            let title_btn: HtmlElement = document
                .create_element("button")?
                .dyn_into()
                .map_err(|_| JsValue::from_str("title cast failed"))?;
            title_btn.set_inner_text(&item.title);
            let ts = title_btn.style();
            ts.set_property("display", "block")?;
            ts.set_property("width", "100%")?;
            ts.set_property("text-align", "left")?;
            ts.set_property("padding", "10px 0")?;
            ts.set_property("border", "none")?;
            ts.set_property("background", "transparent")?;
            ts.set_property("font", "inherit")?;
            ts.set_property("font-weight", "600")?;
            ts.set_property("cursor", "pointer")?;
            ts.set_property("color", "#111827")?;
            row.append_child(&title_btn)?;

            let body: HtmlElement = document
                .create_element("div")?
                .dyn_into()
                .map_err(|_| JsValue::from_str("body cast failed"))?;
            body.set_inner_html(&item.html);
            let bs = body.style();
            bs.set_property("padding", "0 0 12px 0")?;
            bs.set_property("color", "#374151")?;
            bs.set_property("display", "none")?;
            row.append_child(&body)?;

            let host_for_click = host.clone();
            let body_for_click = body.clone();
            let click = Closure::wrap(Box::new(move |_: Event| {
                let currently_visible = body_for_click
                    .style()
                    .get_property_value("display")
                    .unwrap_or_else(|_| "none".to_string())
                    != "none";

                if !multi {
                    // Collapse every body in the host.
                    let bodies = host_for_click
                        .query_selector_all(":scope > div > div + div")
                        .unwrap();
                    for n in 0..bodies.length() {
                        if let Some(node) = bodies.get(n) {
                            if let Ok(el) = node.dyn_into::<HtmlElement>() {
                                let _ = el.style().set_property("display", "none");
                            }
                        }
                    }
                }

                let _ = body_for_click
                    .style()
                    .set_property("display", if currently_visible { "none" } else { "block" });
            }) as Box<dyn FnMut(Event)>);
            title_btn.add_event_listener_with_callback("click", click.as_ref().unchecked_ref())?;
            click.forget();

            host.append_child(&row)?;
        }
        Ok(())
    }
}
