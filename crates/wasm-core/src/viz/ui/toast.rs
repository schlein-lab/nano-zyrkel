//! # Toast — short-lived floating notification
//!
//! A single global container element with a stack of dismissable
//! cards. Calling `Toast::show` appends a new card and schedules its
//! removal after the configured duration.
//!
//! ## Example
//!
//! ```js
//! Toast.success('Saved');
//! Toast.error('Network down', 6000);
//! ```

use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{Document, HtmlElement};

const CONTAINER_ID: &str = "nz-toast-container";
const DEFAULT_DURATION_MS: i32 = 3500;

#[wasm_bindgen]
pub struct Toast;

#[wasm_bindgen]
impl Toast {
    /// Show a neutral toast.
    #[wasm_bindgen]
    pub fn show(message: &str, duration_ms: Option<i32>) -> Result<(), JsValue> {
        push("info", message, duration_ms.unwrap_or(DEFAULT_DURATION_MS))
    }

    /// Show a success-styled toast.
    #[wasm_bindgen]
    pub fn success(message: &str, duration_ms: Option<i32>) -> Result<(), JsValue> {
        push("success", message, duration_ms.unwrap_or(DEFAULT_DURATION_MS))
    }

    /// Show a warning-styled toast.
    #[wasm_bindgen]
    pub fn warning(message: &str, duration_ms: Option<i32>) -> Result<(), JsValue> {
        push("warning", message, duration_ms.unwrap_or(DEFAULT_DURATION_MS))
    }

    /// Show an error-styled toast.
    #[wasm_bindgen]
    pub fn error(message: &str, duration_ms: Option<i32>) -> Result<(), JsValue> {
        push("error", message, duration_ms.unwrap_or(DEFAULT_DURATION_MS))
    }
}

fn push(kind: &str, message: &str, duration_ms: i32) -> Result<(), JsValue> {
    let document = web_sys::window()
        .ok_or_else(|| JsValue::from_str("no window"))?
        .document()
        .ok_or_else(|| JsValue::from_str("no document"))?;
    let container = ensure_container(&document)?;

    let card: HtmlElement = document
        .create_element("div")?
        .dyn_into()
        .map_err(|_| JsValue::from_str("toast card cast failed"))?;
    card.set_inner_html(message);

    let style = card.style();
    style.set_property("padding", "10px 14px")?;
    style.set_property("border-radius", "8px")?;
    style.set_property("font-family", "Inter, system-ui, sans-serif")?;
    style.set_property("font-size", "13px")?;
    style.set_property("color", "#F9FAFB")?;
    style.set_property("box-shadow", "0 8px 24px rgba(0,0,0,0.18)")?;
    style.set_property("opacity", "0")?;
    style.set_property("transform", "translateY(8px)")?;
    style.set_property("transition", "opacity 200ms ease, transform 200ms ease")?;

    let bg = match kind {
        "success" => "#16A34A",
        "warning" => "#F59E0B",
        "error" => "#DC2626",
        _ => "#1F2937",
    };
    style.set_property("background", bg)?;

    container.append_child(&card)?;

    // Animate in on the next frame.
    let card_in = card.clone();
    let raf_in = Closure::wrap(Box::new(move || {
        let _ = card_in.style().set_property("opacity", "1");
        let _ = card_in.style().set_property("transform", "translateY(0)");
    }) as Box<dyn FnMut()>);
    web_sys::window()
        .unwrap()
        .request_animation_frame(raf_in.as_ref().unchecked_ref())?;
    raf_in.forget();

    // Schedule removal.
    let card_out = card.clone();
    let timeout = Closure::wrap(Box::new(move || {
        let _ = card_out.style().set_property("opacity", "0");
        let _ = card_out.style().set_property("transform", "translateY(8px)");
        let card_remove = card_out.clone();
        let cleanup = Closure::wrap(Box::new(move || {
            card_remove.remove();
        }) as Box<dyn FnMut()>);
        let _ = web_sys::window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(
                cleanup.as_ref().unchecked_ref(),
                220,
            );
        cleanup.forget();
    }) as Box<dyn FnMut()>);
    web_sys::window()
        .unwrap()
        .set_timeout_with_callback_and_timeout_and_arguments_0(
            timeout.as_ref().unchecked_ref(),
            duration_ms,
        )?;
    timeout.forget();
    Ok(())
}

fn ensure_container(document: &Document) -> Result<HtmlElement, JsValue> {
    if let Some(el) = document.get_element_by_id(CONTAINER_ID) {
        return el
            .dyn_into::<HtmlElement>()
            .map_err(|_| JsValue::from_str("toast container wrong type"));
    }
    let container: HtmlElement = document
        .create_element("div")?
        .dyn_into()
        .map_err(|_| JsValue::from_str("create container failed"))?;
    container.set_id(CONTAINER_ID);
    let style = container.style();
    style.set_property("position", "fixed")?;
    style.set_property("top", "16px")?;
    style.set_property("right", "16px")?;
    style.set_property("z-index", "9999")?;
    style.set_property("display", "flex")?;
    style.set_property("flex-direction", "column")?;
    style.set_property("gap", "8px")?;
    style.set_property("pointer-events", "none")?;
    document
        .body()
        .ok_or_else(|| JsValue::from_str("no body"))?
        .append_child(&container)?;
    Ok(container)
}
