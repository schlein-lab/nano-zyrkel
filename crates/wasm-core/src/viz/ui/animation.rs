//! # Animation — easing functions and a tiny tween helper
//!
//! Stateless easing curves for use with `requestAnimationFrame`, plus
//! a `Tween` builder that runs a callback for `duration_ms` and
//! reports the eased progress on every frame.
//!
//! Easing names follow the Robert Penner conventions and are
//! exposed as `Easing.linear(t)`, `Easing.easeInQuad(t)`, etc.

use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

#[wasm_bindgen]
pub struct Easing;

#[wasm_bindgen]
impl Easing {
    /// `t` in `[0, 1]`, returns `t`.
    #[wasm_bindgen]
    pub fn linear(t: f64) -> f64 {
        t
    }

    #[wasm_bindgen(js_name = easeInQuad)]
    pub fn ease_in_quad(t: f64) -> f64 {
        t * t
    }

    #[wasm_bindgen(js_name = easeOutQuad)]
    pub fn ease_out_quad(t: f64) -> f64 {
        t * (2.0 - t)
    }

    #[wasm_bindgen(js_name = easeInOutQuad)]
    pub fn ease_in_out_quad(t: f64) -> f64 {
        if t < 0.5 {
            2.0 * t * t
        } else {
            -1.0 + (4.0 - 2.0 * t) * t
        }
    }

    #[wasm_bindgen(js_name = easeInCubic)]
    pub fn ease_in_cubic(t: f64) -> f64 {
        t.powi(3)
    }

    #[wasm_bindgen(js_name = easeOutCubic)]
    pub fn ease_out_cubic(t: f64) -> f64 {
        let f = t - 1.0;
        f.powi(3) + 1.0
    }

    #[wasm_bindgen(js_name = easeInOutCubic)]
    pub fn ease_in_out_cubic(t: f64) -> f64 {
        if t < 0.5 {
            4.0 * t.powi(3)
        } else {
            let f = 2.0 * t - 2.0;
            0.5 * f.powi(3) + 1.0
        }
    }

    #[wasm_bindgen(js_name = easeOutQuart)]
    pub fn ease_out_quart(t: f64) -> f64 {
        1.0 - (1.0 - t).powi(4)
    }

    #[wasm_bindgen(js_name = easeOutExpo)]
    pub fn ease_out_expo(t: f64) -> f64 {
        if (t - 1.0).abs() < f64::EPSILON {
            1.0
        } else {
            1.0 - 2f64.powf(-10.0 * t)
        }
    }
}

#[wasm_bindgen]
pub struct Tween;

#[wasm_bindgen]
impl Tween {
    /// Run `callback(progress)` once per animation frame for
    /// `duration_ms`. `progress` is the eased value in `[0, 1]`.
    /// Returns immediately; the animation runs in the background.
    #[wasm_bindgen]
    pub fn run(duration_ms: f64, easing: &str, callback: js_sys::Function) -> Result<(), JsValue> {
        let start = js_sys::Date::now();
        let easing_owned = easing.to_string();

        // Use a tail-recursive closure stored in a Box.
        let callback_inner = callback.clone();
        let f: std::rc::Rc<std::cell::RefCell<Option<Closure<dyn FnMut()>>>> =
            std::rc::Rc::new(std::cell::RefCell::new(None));
        let g = f.clone();

        *g.borrow_mut() = Some(Closure::wrap(Box::new(move || {
            let elapsed = js_sys::Date::now() - start;
            let raw = (elapsed / duration_ms).clamp(0.0, 1.0);
            let eased = ease_by_name(&easing_owned, raw);
            let _ = callback_inner.call1(&JsValue::NULL, &JsValue::from_f64(eased));
            if raw < 1.0 {
                let _ = web_sys::window()
                    .unwrap()
                    .request_animation_frame(
                        f.borrow().as_ref().unwrap().as_ref().unchecked_ref(),
                    );
            }
        }) as Box<dyn FnMut()>));

        web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .request_animation_frame(g.borrow().as_ref().unwrap().as_ref().unchecked_ref())?;
        Ok(())
    }
}

fn ease_by_name(name: &str, t: f64) -> f64 {
    match name {
        "linear" => Easing::linear(t),
        "ease-in-quad" | "easeInQuad" => Easing::ease_in_quad(t),
        "ease-out-quad" | "easeOutQuad" => Easing::ease_out_quad(t),
        "ease-in-out-quad" | "easeInOutQuad" => Easing::ease_in_out_quad(t),
        "ease-in-cubic" | "easeInCubic" => Easing::ease_in_cubic(t),
        "ease-out-cubic" | "easeOutCubic" => Easing::ease_out_cubic(t),
        "ease-in-out-cubic" | "easeInOutCubic" => Easing::ease_in_out_cubic(t),
        "ease-out-quart" | "easeOutQuart" => Easing::ease_out_quart(t),
        "ease-out-expo" | "easeOutExpo" => Easing::ease_out_expo(t),
        _ => Easing::linear(t),
    }
}
