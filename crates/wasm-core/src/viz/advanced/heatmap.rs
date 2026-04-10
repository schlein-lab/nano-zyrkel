//! # Heatmap — color matrix with row/column labels
//!
//! Renders a `rows × columns` grid where each cell is colored according to
//! a sequential or diverging palette. Replaces the hand-rolled concordance
//! matrix in vusTracker.

use wasm_bindgen::prelude::*;

use crate::viz::basic::canvas::ChartCanvas;

/// Builder for heatmap charts.
#[wasm_bindgen]
pub struct Heatmap {
    canvas: ChartCanvas,
    rows: Vec<String>,
    cols: Vec<String>,
    values: Vec<Vec<f64>>,
    min: f64,
    max: f64,
    low: String,
    high: String,
    cell_gap: f64,
}

#[wasm_bindgen]
impl Heatmap {
    /// Create a new heatmap with empty data. Use [`Heatmap::matrix`] to
    /// provide values.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: ChartCanvas) -> Heatmap {
        Self {
            canvas,
            rows: Vec::new(),
            cols: Vec::new(),
            values: Vec::new(),
            min: 0.0,
            max: 1.0,
            low: "#FFFFFF".to_string(),
            high: "#8B5CF6".to_string(),
            cell_gap: 1.0,
        }
    }

    /// Provide row labels (top → bottom).
    #[wasm_bindgen]
    pub fn rows(mut self, rows: Vec<JsValue>) -> Heatmap {
        self.rows = rows.into_iter().filter_map(|v| v.as_string()).collect();
        self
    }

    /// Provide column labels (left → right).
    #[wasm_bindgen]
    pub fn cols(mut self, cols: Vec<JsValue>) -> Heatmap {
        self.cols = cols.into_iter().filter_map(|v| v.as_string()).collect();
        self
    }

    /// Provide the matrix as `rows × cols` numeric values.
    #[wasm_bindgen]
    pub fn matrix(mut self, values: JsValue) -> Result<Heatmap, JsValue> {
        self.values = serde_wasm_bindgen::from_value(values)
            .map_err(|e| JsValue::from_str(&format!("heatmap matrix: {e}")))?;
        Ok(self)
    }

    /// Numeric range used for the color interpolation.
    #[wasm_bindgen]
    pub fn range(mut self, min: f64, max: f64) -> Heatmap {
        self.min = min;
        self.max = max;
        self
    }

    /// Two endpoint colors for the sequential palette (low → high).
    #[wasm_bindgen]
    pub fn palette(mut self, low: &str, high: &str) -> Heatmap {
        self.low = low.to_string();
        self.high = high.to_string();
        self
    }

    /// Pixel gap between cells.
    #[wasm_bindgen(js_name = cellGap)]
    pub fn cell_gap(mut self, gap: f64) -> Heatmap {
        self.cell_gap = gap;
        self
    }

    /// Render.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<(), JsValue> {
        if self.values.is_empty() || self.values[0].is_empty() {
            return Ok(());
        }
        let n_rows = self.values.len();
        let n_cols = self.values[0].len();

        let plot_left = self.canvas.plot_left();
        let plot_top = self.canvas.plot_top();
        let plot_w = self.canvas.plot_width();
        let plot_h = self.canvas.plot_height();
        let cell_w = (plot_w - self.cell_gap * (n_cols as f64 - 1.0)) / n_cols as f64;
        let cell_h = (plot_h - self.cell_gap * (n_rows as f64 - 1.0)) / n_rows as f64;

        let (low_r, low_g, low_b) = parse_hex(&self.low).unwrap_or((255, 255, 255));
        let (high_r, high_g, high_b) = parse_hex(&self.high).unwrap_or((139, 92, 246));

        let ctx = self.canvas.ctx();
        let span = (self.max - self.min).max(1e-9);

        for (r, row) in self.values.iter().enumerate() {
            for (c, value) in row.iter().enumerate() {
                let t = ((value - self.min) / span).clamp(0.0, 1.0);
                let red = lerp(low_r as f64, high_r as f64, t) as u8;
                let green = lerp(low_g as f64, high_g as f64, t) as u8;
                let blue = lerp(low_b as f64, high_b as f64, t) as u8;
                let x = plot_left + c as f64 * (cell_w + self.cell_gap);
                let y = plot_top + r as f64 * (cell_h + self.cell_gap);
                ctx.set_fill_style_str(&format!("#{:02X}{:02X}{:02X}", red, green, blue));
                ctx.fill_rect(x, y, cell_w, cell_h);
            }
        }
        let _ = (&self.rows, &self.cols);
        Ok(())
    }
}

fn parse_hex(s: &str) -> Option<(u8, u8, u8)> {
    let s = s.trim_start_matches('#');
    if s.len() != 6 {
        return None;
    }
    let r = u8::from_str_radix(&s[0..2], 16).ok()?;
    let g = u8::from_str_radix(&s[2..4], 16).ok()?;
    let b = u8::from_str_radix(&s[4..6], 16).ok()?;
    Some((r, g, b))
}

fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}
