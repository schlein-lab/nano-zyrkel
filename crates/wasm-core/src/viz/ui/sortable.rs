//! # Sortable — drag-to-reorder list
//!
//! HTML5 drag-and-drop based list reordering. Mounts on a container
//! element whose direct children are list items. The order is
//! reported back to the consumer through a callback after every drop.

use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{DragEvent, Element, HtmlElement, Node};

#[wasm_bindgen]
pub struct Sortable;

#[wasm_bindgen]
impl Sortable {
    /// Make the children of `selector` draggable. The callback fires
    /// after every drop and receives the new array of `data-id`
    /// attributes (or empty strings) in their visual order.
    #[wasm_bindgen]
    pub fn mount(selector: &str, on_change: js_sys::Function) -> Result<(), JsValue> {
        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;
        let host: HtmlElement = document
            .query_selector(selector)?
            .ok_or_else(|| JsValue::from_str("sortable host not found"))?
            .dyn_into()
            .map_err(|_| JsValue::from_str("host not HtmlElement"))?;

        let children = host.query_selector_all(":scope > *")?;
        for i in 0..children.length() {
            if let Some(node) = children.item(i) {
                if let Ok(element) = node.dyn_into::<Element>() {
                    Self::wire_item(&host, &element, &on_change)?;
                }
            }
        }
        Ok(())
    }

    fn wire_item(
        host: &HtmlElement,
        item: &Element,
        on_change: &js_sys::Function,
    ) -> Result<(), JsValue> {
        item.set_attribute("draggable", "true")?;

        let dragstart = Closure::wrap(Box::new(move |event: DragEvent| {
            if let Some(target) = event.target() {
                if let Ok(el) = target.dyn_into::<HtmlElement>() {
                    if let Some(dt) = event.data_transfer() {
                        let _ = dt.set_data("text/plain", &el.id());
                        let _ = dt.set_effect_allowed("move");
                    }
                    let _ = el.style().set_property("opacity", "0.4");
                }
            }
        }) as Box<dyn FnMut(DragEvent)>);
        item.add_event_listener_with_callback("dragstart", dragstart.as_ref().unchecked_ref())?;
        dragstart.forget();

        let dragend = Closure::wrap(Box::new(move |event: DragEvent| {
            if let Some(target) = event.target() {
                if let Ok(el) = target.dyn_into::<HtmlElement>() {
                    let _ = el.style().set_property("opacity", "1");
                }
            }
        }) as Box<dyn FnMut(DragEvent)>);
        item.add_event_listener_with_callback("dragend", dragend.as_ref().unchecked_ref())?;
        dragend.forget();

        let dragover = Closure::wrap(Box::new(move |event: DragEvent| {
            event.prevent_default();
        }) as Box<dyn FnMut(DragEvent)>);
        item.add_event_listener_with_callback("dragover", dragover.as_ref().unchecked_ref())?;
        dragover.forget();

        let host_for_drop = host.clone();
        let on_change_for_drop = on_change.clone();
        let drop = Closure::wrap(Box::new(move |event: DragEvent| {
            event.prevent_default();
            let dragged_id = event
                .data_transfer()
                .and_then(|dt| dt.get_data("text/plain").ok())
                .unwrap_or_default();
            let document = web_sys::window().unwrap().document().unwrap();
            if let Some(dragged) = document.get_element_by_id(&dragged_id) {
                if let Some(target) = event.target() {
                    if let Ok(over) = target.dyn_into::<Element>() {
                        let _ = over.before_with_node_1(&dragged);
                    }
                }
            }
            // Report the new order.
            let order = js_sys::Array::new();
            if let Ok(kids) = host_for_drop.query_selector_all(":scope > *") {
                for i in 0..kids.length() {
                    if let Some(node) = kids.item(i) {
                        if let Ok(element) = node.dyn_into::<Element>() {
                            let id = element.get_attribute("data-id").unwrap_or_default();
                            order.push(&JsValue::from_str(&id));
                        }
                    }
                }
            }
            let _ = Node::clone; // keep import alive
            let _ = on_change_for_drop.call1(&JsValue::NULL, &order);
        }) as Box<dyn FnMut(DragEvent)>);
        item.add_event_listener_with_callback("drop", drop.as_ref().unchecked_ref())?;
        drop.forget();

        Ok(())
    }
}
