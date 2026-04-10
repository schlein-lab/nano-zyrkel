//! # Histogram — distribution of a numeric series
//!
//! Bin a `Vec<f64>` into `n` equal-width buckets and draw the result as a
//! bar chart. Returns the bin edges so consumers can label the X axis.

use wasm_bindgen::prelude::*;

use crate::viz::basic::canvas::ChartCanvas;
use crate::viz::basic::scale::Scale;

/// Builder for histogram charts.
#[wasm_bindgen]
pub struct Histogram {
    canvas: ChartCanvas,
    values: Vec<f64>,
    bins: u32,
    color: String,
}

#[wasm_bindgen]
impl Histogram {
    /// Create a new histogram. `values` is the raw numeric series.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: ChartCanvas, values: Vec<f64>) -> Histogram {
        Self {
            canvas,
            values,
            bins: 20,
            color: "#06B6D4".to_string(),
        }
    }

    /// Number of bins. Default 20.
    #[wasm_bindgen]
    pub fn bins(mut self, bins: u32) -> Histogram {
        self.bins = bins.max(1);
        self
    }

    /// Bar fill color.
    #[wasm_bindgen]
    pub fn color(mut self, color: &str) -> Histogram {
        self.color = color.to_string();
        self
    }

    /// Compute the bin counts and draw the bars. Returns the bin edges so
    /// consumers can label the X axis themselves.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<Vec<f64>, JsValue> {
        if self.values.is_empty() {
            return Ok(Vec::new());
        }
        let mut min = f64::INFINITY;
        let mut max = f64::NEG_INFINITY;
        for v in &self.values {
            if *v < min { min = *v; }
            if *v > max { max = *v; }
        }
        if min == max {
            max = min + 1.0;
        }

        let bin_count = self.bins as usize;
        let bin_width = (max - min) / bin_count as f64;
        let mut counts = vec![0u32; bin_count];
        for v in &self.values {
            let mut idx = ((v - min) / bin_width).floor() as usize;
            if idx >= bin_count {
                idx = bin_count - 1;
            }
            counts[idx] += 1;
        }
        let max_count = counts.iter().copied().max().unwrap_or(1) as f64;

        let plot_top = self.canvas.plot_top();
        let plot_left = self.canvas.plot_left();
        let plot_w = self.canvas.plot_width();
        let plot_h = self.canvas.plot_height();
        let plot_bottom = plot_top + plot_h;

        let y_scale = Scale::linear(0.0, max_count, plot_bottom, plot_top);
        let bar_w = (plot_w / bin_count as f64).max(1.0);

        let ctx = self.canvas.ctx();
        ctx.set_fill_style_str(&self.color);
        for (i, c) in counts.iter().enumerate() {
            if *c == 0 {
                continue;
            }
            let x = plot_left + i as f64 * bar_w;
            let y_top = y_scale.map(*c as f64);
            let h = (plot_bottom - y_top).max(0.0);
            ctx.fill_rect(x, y_top, bar_w - 1.0, h);
        }

        let mut edges = Vec::with_capacity(bin_count + 1);
        for i in 0..=bin_count {
            edges.push(min + i as f64 * bin_width);
        }
        Ok(edges)
    }
}
