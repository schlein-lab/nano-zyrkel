//! # SortedBar — top-N bar chart with descending order
//!
//! Convenience wrapper around `BarChart::single` that takes an unordered
//! list of `(label, value)` pairs, sorts them descending and clips to the
//! top N entries.

use serde::Deserialize;
use wasm_bindgen::prelude::*;

use crate::viz::basic::canvas::ChartCanvas;
use crate::viz::basic::scale::Scale;

#[derive(Deserialize, Clone)]
struct Entry {
    label: String,
    value: f64,
    #[serde(default)]
    color: Option<String>,
}

/// Builder for sorted bar charts.
#[wasm_bindgen]
pub struct SortedBar {
    canvas: ChartCanvas,
    entries: Vec<Entry>,
    top: u32,
    color: String,
}

#[wasm_bindgen]
impl SortedBar {
    /// Create a new sorted bar chart from `[{label, value, color?}, ...]`.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: ChartCanvas, data: JsValue) -> Result<SortedBar, JsValue> {
        let entries: Vec<Entry> = serde_wasm_bindgen::from_value(data)
            .map_err(|e| JsValue::from_str(&format!("sorted bar data: {e}")))?;
        Ok(Self {
            canvas,
            entries,
            top: 10,
            color: "#8B5CF6".to_string(),
        })
    }

    /// Take the top N entries by value. Default 10.
    #[wasm_bindgen]
    pub fn top(mut self, n: u32) -> SortedBar {
        self.top = n.max(1);
        self
    }

    /// Default fill color when an entry has no `color` of its own.
    #[wasm_bindgen]
    pub fn color(mut self, color: &str) -> SortedBar {
        self.color = color.to_string();
        self
    }

    /// Render. Bars are drawn in descending order from left to right.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<(), JsValue> {
        let mut sorted = self.entries.clone();
        sorted.sort_by(|a, b| b.value.partial_cmp(&a.value).unwrap_or(std::cmp::Ordering::Equal));
        sorted.truncate(self.top as usize);
        if sorted.is_empty() {
            return Ok(());
        }

        let max = sorted[0].value.max(1e-9);
        let plot_top = self.canvas.plot_top();
        let plot_left = self.canvas.plot_left();
        let plot_w = self.canvas.plot_width();
        let plot_h = self.canvas.plot_height();
        let plot_bottom = plot_top + plot_h;
        let y_scale = Scale::linear(0.0, max, plot_bottom, plot_top);

        let n = sorted.len() as f64;
        let gap = 4.0;
        let bar_w = ((plot_w - gap * (n - 1.0)) / n).max(1.0);

        let ctx = self.canvas.ctx();
        for (i, entry) in sorted.iter().enumerate() {
            let x = plot_left + i as f64 * (bar_w + gap);
            let y_top = y_scale.map(entry.value);
            let h = (plot_bottom - y_top).max(0.0);
            let color = entry.color.as_deref().unwrap_or(&self.color);
            ctx.set_fill_style_str(color);
            ctx.fill_rect(x, y_top, bar_w, h);
        }
        Ok(())
    }
}
