//! # LineChart — connect a sequence of `(x, y)` points
//!
//! Builder API: configure scales, data, stroke and draw. The chart writes
//! directly into the underlying `ChartCanvas` and returns nothing — layout
//! is the consumer's responsibility.

use serde::Deserialize;
use wasm_bindgen::prelude::*;

use super::canvas::ChartCanvas;
use super::scale::Scale;

/// One data point in a line series.
#[derive(Deserialize)]
struct Point {
    x: f64,
    y: f64,
}

/// Builder for a single-series line chart.
#[wasm_bindgen]
pub struct LineChart {
    canvas: ChartCanvas,
    x_scale: Option<Scale>,
    y_scale: Option<Scale>,
    points: Vec<Point>,
    stroke: String,
    width: f64,
    fill_under: Option<String>,
}

#[wasm_bindgen]
impl LineChart {
    /// Create a new chart for `canvas`.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: ChartCanvas) -> LineChart {
        Self {
            canvas,
            x_scale: None,
            y_scale: None,
            points: Vec::new(),
            stroke: "#8B5CF6".to_string(),
            width: 2.0,
            fill_under: None,
        }
    }

    /// X-axis scale.
    #[wasm_bindgen]
    pub fn x(mut self, scale: Scale) -> LineChart {
        self.x_scale = Some(scale);
        self
    }

    /// Y-axis scale.
    #[wasm_bindgen]
    pub fn y(mut self, scale: Scale) -> LineChart {
        self.y_scale = Some(scale);
        self
    }

    /// Provide the data series. Expected shape: `[{x, y}, ...]`.
    #[wasm_bindgen]
    pub fn data(mut self, points: JsValue) -> Result<LineChart, JsValue> {
        self.points = serde_wasm_bindgen::from_value(points)
            .map_err(|e| JsValue::from_str(&format!("line data not parseable: {e}")))?;
        Ok(self)
    }

    /// Stroke color and width.
    #[wasm_bindgen]
    pub fn stroke(mut self, color: &str, width: f64) -> LineChart {
        self.stroke = color.to_string();
        self.width = width;
        self
    }

    /// Fill the area under the line with the given color.
    #[wasm_bindgen(js_name = fillUnder)]
    pub fn fill_under(mut self, color: &str) -> LineChart {
        self.fill_under = Some(color.to_string());
        self
    }

    /// Render. Consumes `self` to enforce the builder pattern.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<(), JsValue> {
        let x_scale = self.x_scale.ok_or_else(|| JsValue::from_str("LineChart: x scale missing"))?;
        let y_scale = self.y_scale.ok_or_else(|| JsValue::from_str("LineChart: y scale missing"))?;
        if self.points.is_empty() {
            return Ok(());
        }

        let ctx = self.canvas.ctx();

        if let Some(fill) = &self.fill_under {
            ctx.set_fill_style_str(fill);
            ctx.begin_path();
            let first = &self.points[0];
            ctx.move_to(x_scale.map(first.x), self.canvas.plot_top() + self.canvas.plot_height());
            for p in &self.points {
                ctx.line_to(x_scale.map(p.x), y_scale.map(p.y));
            }
            let last = &self.points[self.points.len() - 1];
            ctx.line_to(x_scale.map(last.x), self.canvas.plot_top() + self.canvas.plot_height());
            ctx.close_path();
            ctx.fill();
        }

        ctx.set_stroke_style_str(&self.stroke);
        ctx.set_line_width(self.width);
        ctx.set_line_join("round");
        ctx.set_line_cap("round");
        ctx.begin_path();
        let first = &self.points[0];
        ctx.move_to(x_scale.map(first.x), y_scale.map(first.y));
        for p in self.points.iter().skip(1) {
            ctx.line_to(x_scale.map(p.x), y_scale.map(p.y));
        }
        ctx.stroke();
        Ok(())
    }
}
