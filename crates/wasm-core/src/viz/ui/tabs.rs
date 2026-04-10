//! # Tabs — tabbed section switcher
//!
//! Mounts a tab strip plus a content panel inside a target element.
//! Each tab is `{ id, label, html }`. Switching tabs simply replaces
//! the panel's `innerHTML`. Build it once at page load with
//! `Tabs.mount('#my-host', tabs)`.

use serde::Deserialize;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{Event, HtmlElement};

#[derive(Deserialize, Clone)]
struct Tab {
    id: String,
    label: String,
    html: String,
}

#[wasm_bindgen]
pub struct Tabs;

#[wasm_bindgen]
impl Tabs {
    /// Mount a tab strip + panel into the element matched by `selector`.
    /// `tabs` must be `[{ id, label, html }, ...]`. Returns once the
    /// initial tab is rendered.
    #[wasm_bindgen]
    pub fn mount(selector: &str, tabs: JsValue) -> Result<(), JsValue> {
        let parsed: Vec<Tab> = serde_wasm_bindgen::from_value(tabs)
            .map_err(|e| JsValue::from_str(&format!("tabs payload not parseable: {e}")))?;
        if parsed.is_empty() {
            return Ok(());
        }

        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;
        let host: HtmlElement = document
            .query_selector(selector)?
            .ok_or_else(|| JsValue::from_str("tabs host not found"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("host not HtmlElement"))?;

        host.set_inner_html(
            r#"<div class="nz-tabs-strip" style="display:flex;gap:8px;border-bottom:1px solid #E5E7EB;margin-bottom:12px;"></div>
               <div class="nz-tabs-panel"></div>"#,
        );

        let strip: HtmlElement = host
            .query_selector(".nz-tabs-strip")?
            .ok_or_else(|| JsValue::from_str("strip missing"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("strip cast failed"))?;
        let panel: HtmlElement = host
            .query_selector(".nz-tabs-panel")?
            .ok_or_else(|| JsValue::from_str("panel missing"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("panel cast failed"))?;

        for (i, tab) in parsed.iter().enumerate() {
            let btn: HtmlElement = document
                .create_element("button")?
                .dyn_into()
                .map_err(|_| JsValue::from_str("btn cast failed"))?;
            btn.set_inner_text(&tab.label);
            let style = btn.style();
            style.set_property("padding", "8px 14px")?;
            style.set_property("border", "none")?;
            style.set_property("background", "transparent")?;
            style.set_property("font", "inherit")?;
            style.set_property("color", "#6B7280")?;
            style.set_property("border-bottom", "2px solid transparent")?;
            style.set_property("cursor", "pointer")?;
            btn.set_attribute("data-tab-id", &tab.id)?;
            if i == 0 {
                btn.class_list().add_1("active")?;
                btn.style().set_property("color", "#111827")?;
                btn.style().set_property("border-bottom-color", "#8B5CF6")?;
            }
            strip.append_child(&btn)?;

            let strip_for_click = strip.clone();
            let panel_for_click = panel.clone();
            let btn_for_click = btn.clone();
            let html = tab.html.clone();
            let click = Closure::wrap(Box::new(move |_: Event| {
                // Reset every button.
                if let Ok(nodes) = strip_for_click.query_selector_all("button") {
                    for n in 0..nodes.length() {
                        if let Some(node) = nodes.item(n) {
                            if let Ok(b) = node.dyn_into::<HtmlElement>() {
                                let _ = b.style().set_property("color", "#6B7280");
                                let _ = b
                                    .style()
                                    .set_property("border-bottom-color", "transparent");
                            }
                        }
                    }
                }
                let _ = btn_for_click.style().set_property("color", "#111827");
                let _ = btn_for_click
                    .style()
                    .set_property("border-bottom-color", "#8B5CF6");
                panel_for_click.set_inner_html(&html);
            }) as Box<dyn FnMut(Event)>);
            btn.add_event_listener_with_callback("click", click.as_ref().unchecked_ref())?;
            click.forget();
        }

        // Initial content.
        panel.set_inner_html(&parsed[0].html);
        Ok(())
    }
}
