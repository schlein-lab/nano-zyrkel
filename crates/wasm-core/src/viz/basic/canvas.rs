//! # ChartCanvas — boilerplate-free 2D canvas setup
//!
//! Wraps `HTMLCanvasElement` + `CanvasRenderingContext2D` plus the padding /
//! plot-area arithmetic that every chart needs. A consumer creates one
//! `ChartCanvas` per `<canvas>` element and re-uses it for all draw calls.
//!
//! Replaces the 8-line DPR setup snippet that gets copy-pasted into every
//! browser-side nano-zyrkel.

use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};

/// Padding around the plot area, in CSS pixels.
#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Padding {
    pub left: f64,
    pub right: f64,
    pub top: f64,
    pub bottom: f64,
}

#[wasm_bindgen]
impl Padding {
    /// Construct padding with explicit values for each side.
    #[wasm_bindgen(constructor)]
    pub fn new(left: f64, right: f64, top: f64, bottom: f64) -> Self {
        Self { left, right, top, bottom }
    }

    /// Construct padding where all four sides share the same value.
    #[wasm_bindgen(js_name = uniform)]
    pub fn uniform(value: f64) -> Self {
        Self { left: value, right: value, top: value, bottom: value }
    }
}

/// Wraps a `<canvas>` element together with cached width/height/padding so
/// chart code can ask for the plot area without recomputing it every frame.
#[wasm_bindgen]
pub struct ChartCanvas {
    canvas: HtmlCanvasElement,
    ctx: CanvasRenderingContext2d,
    width: f64,
    height: f64,
    padding: Padding,
}

#[wasm_bindgen]
impl ChartCanvas {
    /// Build a chart canvas from an existing `<canvas>` element. Sizes the
    /// drawing buffer to `(parent_width, fixed_height)` taking
    /// `devicePixelRatio` into account so lines stay crisp on retina
    /// screens.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: HtmlCanvasElement, height: f64, padding: Padding) -> Result<ChartCanvas, JsValue> {
        let parent = canvas
            .parent_element()
            .ok_or_else(|| JsValue::from_str("canvas needs a parent element"))?;
        let parent_rect = parent
            .dyn_into::<web_sys::HtmlElement>()
            .map_err(|_| JsValue::from_str("canvas parent must be HTMLElement"))?
            .get_bounding_client_rect();

        let width = parent_rect.width();
        let dpr = web_sys::window()
            .and_then(|w| Some(w.device_pixel_ratio()))
            .unwrap_or(1.0)
            .min(2.0);

        canvas.set_width((width * dpr) as u32);
        canvas.set_height((height * dpr) as u32);
        canvas.style().set_property("width", &format!("{}px", width))?;
        canvas.style().set_property("height", &format!("{}px", height))?;

        let ctx = canvas
            .get_context("2d")?
            .ok_or_else(|| JsValue::from_str("no 2d context"))?
            .dyn_into::<CanvasRenderingContext2d>()?;
        ctx.scale(dpr, dpr)?;

        Ok(Self { canvas, ctx, width, height, padding })
    }

    /// Width of the plot area, i.e. canvas width minus horizontal padding.
    #[wasm_bindgen(js_name = plotWidth)]
    pub fn plot_width(&self) -> f64 {
        (self.width - self.padding.left - self.padding.right).max(0.0)
    }

    /// Height of the plot area, i.e. canvas height minus vertical padding.
    #[wasm_bindgen(js_name = plotHeight)]
    pub fn plot_height(&self) -> f64 {
        (self.height - self.padding.top - self.padding.bottom).max(0.0)
    }

    /// X coordinate of the plot area's left edge.
    #[wasm_bindgen(js_name = plotLeft)]
    pub fn plot_left(&self) -> f64 {
        self.padding.left
    }

    /// Y coordinate of the plot area's top edge.
    #[wasm_bindgen(js_name = plotTop)]
    pub fn plot_top(&self) -> f64 {
        self.padding.top
    }

    /// Underlying canvas width in CSS pixels.
    #[wasm_bindgen]
    pub fn width(&self) -> f64 {
        self.width
    }

    /// Underlying canvas height in CSS pixels.
    #[wasm_bindgen]
    pub fn height(&self) -> f64 {
        self.height
    }

    /// Clear the entire canvas.
    #[wasm_bindgen]
    pub fn clear(&self) {
        self.ctx.clear_rect(0.0, 0.0, self.width, self.height);
    }

    /// Return a clone of the underlying 2D context. Use this when you want
    /// to draw something custom on top of what the chart helpers provide.
    #[wasm_bindgen(js_name = context)]
    pub fn context(&self) -> CanvasRenderingContext2d {
        self.ctx.clone()
    }
}

impl ChartCanvas {
    /// Internal accessor for the 2D context. Used by the chart implementations
    /// in this crate to avoid going through the JS-bound clone every call.
    pub(crate) fn ctx(&self) -> &CanvasRenderingContext2d {
        &self.ctx
    }

    /// Internal accessor for the cached padding.
    pub(crate) fn padding(&self) -> Padding {
        self.padding
    }
}
