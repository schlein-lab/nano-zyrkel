//! # Donut — donut / pie chart with optional center label
//!
//! Renders a series of `(name, value)` slices around a circle. The donut
//! mode (with non-zero `inner_ratio`) leaves room for a center label that
//! consumers typically use to display the total.

use serde::Deserialize;
use std::f64::consts::TAU;
use wasm_bindgen::prelude::*;
use web_sys::HtmlCanvasElement;

#[derive(Deserialize)]
struct Slice {
    label: String,
    value: f64,
    color: String,
}

/// Builder for a donut/pie chart drawn directly into a `<canvas>` element.
///
/// Donuts are usually small (40-80px) so they get their own constructor that
/// takes the canvas element directly, bypassing the heavier `ChartCanvas`
/// setup.
#[wasm_bindgen]
pub struct Donut {
    canvas: HtmlCanvasElement,
    size: f64,
    slices: Vec<Slice>,
    inner_ratio: f64,
    center_label: Option<String>,
    center_color: String,
    background: String,
}

#[wasm_bindgen]
impl Donut {
    /// Create a new donut chart for `canvas`. `size` is the side length in
    /// CSS pixels (the canvas is sized to a square).
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: HtmlCanvasElement, size: f64) -> Donut {
        Self {
            canvas,
            size,
            slices: Vec::new(),
            inner_ratio: 0.6,
            center_label: None,
            center_color: "#111827".to_string(),
            background: "#E5E7EB".to_string(),
        }
    }

    /// Provide the slices: `[{label, value, color}, ...]`.
    #[wasm_bindgen]
    pub fn data(mut self, slices: JsValue) -> Result<Donut, JsValue> {
        self.slices = serde_wasm_bindgen::from_value(slices)
            .map_err(|e| JsValue::from_str(&format!("donut data: {e}")))?;
        Ok(self)
    }

    /// Inner radius as a fraction of the outer radius.
    /// `0.0` → pie chart, `0.6` → donut. Default is `0.6`.
    #[wasm_bindgen(js_name = innerRatio)]
    pub fn inner_ratio(mut self, ratio: f64) -> Donut {
        self.inner_ratio = ratio.clamp(0.0, 1.0);
        self
    }

    /// Optional center label.
    #[wasm_bindgen(js_name = centerLabel)]
    pub fn center_label(mut self, label: &str) -> Donut {
        self.center_label = Some(label.to_string());
        self
    }

    /// Color used for the center label text.
    #[wasm_bindgen(js_name = centerColor)]
    pub fn center_color(mut self, color: &str) -> Donut {
        self.center_color = color.to_string();
        self
    }

    /// Background ring color shown when the data is empty.
    #[wasm_bindgen]
    pub fn background(mut self, color: &str) -> Donut {
        self.background = color.to_string();
        self
    }

    /// Draw the donut.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<(), JsValue> {
        let dpr = web_sys::window()
            .and_then(|w| Some(w.device_pixel_ratio()))
            .unwrap_or(1.0)
            .min(2.0);
        self.canvas.set_width((self.size * dpr) as u32);
        self.canvas.set_height((self.size * dpr) as u32);
        self.canvas.style().set_property("width", &format!("{}px", self.size))?;
        self.canvas.style().set_property("height", &format!("{}px", self.size))?;

        let ctx = self
            .canvas
            .get_context("2d")?
            .ok_or_else(|| JsValue::from_str("no 2d context"))?
            .dyn_into::<web_sys::CanvasRenderingContext2d>()?;
        ctx.scale(dpr, dpr)?;

        let cx = self.size / 2.0;
        let cy = self.size / 2.0;
        let outer_r = self.size / 2.0 - 1.0;
        let inner_r = outer_r * self.inner_ratio;

        // Background ring (also used when data is empty)
        ctx.set_fill_style_str(&self.background);
        ctx.begin_path();
        ctx.arc(cx, cy, outer_r, 0.0, TAU)?;
        ctx.arc_with_anticlockwise(cx, cy, inner_r, 0.0, TAU, true)?;
        ctx.fill();

        let total: f64 = self.slices.iter().map(|s| s.value).sum();
        if total > 0.0 {
            let mut start = -std::f64::consts::FRAC_PI_2;
            for slice in &self.slices {
                if slice.value <= 0.0 {
                    continue;
                }
                let end = start + (slice.value / total) * TAU;
                ctx.set_fill_style_str(&slice.color);
                ctx.begin_path();
                ctx.move_to(cx, cy);
                ctx.arc(cx, cy, outer_r, start, end)?;
                ctx.line_to(cx, cy);
                ctx.fill();
                start = end;
            }

            if self.inner_ratio > 0.0 {
                ctx.set_fill_style_str("#FFFFFF");
                ctx.begin_path();
                ctx.arc(cx, cy, inner_r, 0.0, TAU)?;
                ctx.fill();
            }
        }

        if let Some(label) = &self.center_label {
            ctx.set_fill_style_str(&self.center_color);
            ctx.set_font(&format!("700 {}px Inter, sans-serif", (self.size * 0.18).round()));
            ctx.set_text_align("center");
            ctx.set_text_baseline("middle");
            let _ = ctx.fill_text(label, cx, cy);
        }
        Ok(())
    }
}
