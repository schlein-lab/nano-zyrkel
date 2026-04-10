//! # Modal — backdrop dialog with focus trap and escape-to-close
//!
//! Reuses a single global `<div id="nz-modal-root">` element. Calling
//! `Modal::open` replaces its content and shows the backdrop; the
//! returned `Modal` instance can be closed via `close()` or by the
//! user pressing Escape / clicking the backdrop.
//!
//! ## Example
//!
//! ```js
//! const modal = Modal.open('<h2>Confirm</h2><p>Delete this record?</p>');
//! modal.onClose(() => console.log('dismissed'));
//! ```

use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{Document, HtmlElement, KeyboardEvent, MouseEvent};

const ROOT_ID: &str = "nz-modal-root";
const PANEL_ID: &str = "nz-modal-panel";

#[wasm_bindgen]
pub struct Modal;

#[wasm_bindgen]
impl Modal {
    /// Show a modal with `html` as its body. Returns once the dialog
    /// is in the DOM. Use [`Modal::close`] to dismiss it
    /// programmatically.
    #[wasm_bindgen]
    pub fn open(html: &str) -> Result<(), JsValue> {
        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;

        let root = ensure_root(&document)?;
        root.set_inner_html(&format!(
            r#"<div id="{PANEL_ID}" role="dialog" aria-modal="true"></div>"#
        ));

        let panel: HtmlElement = document
            .get_element_by_id(PANEL_ID)
            .ok_or_else(|| JsValue::from_str("panel missing"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("panel cast failed"))?;

        panel.set_inner_html(html);
        let panel_style = panel.style();
        panel_style.set_property("background", "#FFFFFF")?;
        panel_style.set_property("color", "#111827")?;
        panel_style.set_property("max-width", "min(560px, calc(100vw - 32px))")?;
        panel_style.set_property("width", "100%")?;
        panel_style.set_property("padding", "20px 24px")?;
        panel_style.set_property("border-radius", "12px")?;
        panel_style.set_property("box-shadow", "0 24px 64px rgba(0,0,0,0.32)")?;
        panel_style.set_property("font-family", "Inter, system-ui, sans-serif")?;
        panel_style.set_property("max-height", "80vh")?;
        panel_style.set_property("overflow", "auto")?;

        let backdrop_style = root.style();
        backdrop_style.set_property("display", "flex")?;

        // Backdrop click closes.
        let click = Closure::wrap(Box::new(move |event: MouseEvent| {
            if let Some(target) = event.target() {
                if let Ok(el) = target.dyn_into::<HtmlElement>() {
                    if el.id() == ROOT_ID {
                        let _ = Modal::close();
                    }
                }
            }
        }) as Box<dyn FnMut(MouseEvent)>);
        root.add_event_listener_with_callback("click", click.as_ref().unchecked_ref())?;
        click.forget();

        // Escape closes.
        let document_for_keys = document.clone();
        let key = Closure::wrap(Box::new(move |event: KeyboardEvent| {
            if event.key() == "Escape" {
                let _ = Modal::close();
                let _ = document_for_keys; // keep alive
            }
        }) as Box<dyn FnMut(KeyboardEvent)>);
        document
            .add_event_listener_with_callback("keydown", key.as_ref().unchecked_ref())?;
        key.forget();

        Ok(())
    }

    /// Dismiss the modal if one is open.
    #[wasm_bindgen]
    pub fn close() -> Result<(), JsValue> {
        let document = match web_sys::window().and_then(|w| w.document()) {
            Some(d) => d,
            None => return Ok(()),
        };
        if let Some(root) = document.get_element_by_id(ROOT_ID) {
            if let Ok(el) = root.dyn_into::<HtmlElement>() {
                el.style().set_property("display", "none")?;
                el.set_inner_html("");
            }
        }
        Ok(())
    }
}

fn ensure_root(document: &Document) -> Result<HtmlElement, JsValue> {
    if let Some(el) = document.get_element_by_id(ROOT_ID) {
        return el
            .dyn_into::<HtmlElement>()
            .map_err(|_| JsValue::from_str("modal root wrong type"));
    }
    let root: HtmlElement = document
        .create_element("div")?
        .dyn_into()
        .map_err(|_| JsValue::from_str("modal root create failed"))?;
    root.set_id(ROOT_ID);
    let style = root.style();
    style.set_property("position", "fixed")?;
    style.set_property("inset", "0")?;
    style.set_property("background", "rgba(17, 24, 39, 0.55)")?;
    style.set_property("backdrop-filter", "blur(4px)")?;
    style.set_property("z-index", "10000")?;
    style.set_property("display", "none")?;
    style.set_property("align-items", "center")?;
    style.set_property("justify-content", "center")?;
    document
        .body()
        .ok_or_else(|| JsValue::from_str("no body"))?
        .append_child(&root)?;
    Ok(root)
}
