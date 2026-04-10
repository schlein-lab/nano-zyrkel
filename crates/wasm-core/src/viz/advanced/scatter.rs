//! # ScatterPlot — point cloud with optional colors and sizes
//!
//! Each datum is a `{x, y}` pair with optional `color` and `size` overrides.
//! The chart writes directly into a `ChartCanvas`.

use serde::Deserialize;
use std::f64::consts::TAU;
use wasm_bindgen::prelude::*;

use crate::viz::basic::canvas::ChartCanvas;
use crate::viz::basic::scale::Scale;

#[derive(Deserialize)]
struct Point {
    x: f64,
    y: f64,
    #[serde(default)]
    color: Option<String>,
    #[serde(default)]
    size: Option<f64>,
}

/// Builder for a scatter plot.
#[wasm_bindgen]
pub struct ScatterPlot {
    canvas: ChartCanvas,
    x_scale: Option<Scale>,
    y_scale: Option<Scale>,
    points: Vec<Point>,
    default_color: String,
    default_size: f64,
    stroke: Option<String>,
}

#[wasm_bindgen]
impl ScatterPlot {
    /// Create a new scatter plot for `canvas`.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: ChartCanvas) -> ScatterPlot {
        Self {
            canvas,
            x_scale: None,
            y_scale: None,
            points: Vec::new(),
            default_color: "#8B5CF6".to_string(),
            default_size: 3.0,
            stroke: None,
        }
    }

    /// X-axis scale.
    #[wasm_bindgen]
    pub fn x(mut self, scale: Scale) -> ScatterPlot {
        self.x_scale = Some(scale);
        self
    }

    /// Y-axis scale.
    #[wasm_bindgen]
    pub fn y(mut self, scale: Scale) -> ScatterPlot {
        self.y_scale = Some(scale);
        self
    }

    /// Provide the data series.
    #[wasm_bindgen]
    pub fn data(mut self, points: JsValue) -> Result<ScatterPlot, JsValue> {
        self.points = serde_wasm_bindgen::from_value(points)
            .map_err(|e| JsValue::from_str(&format!("scatter data: {e}")))?;
        Ok(self)
    }

    /// Default fill color for points without an individual `color`.
    #[wasm_bindgen(js_name = defaultColor)]
    pub fn default_color(mut self, color: &str) -> ScatterPlot {
        self.default_color = color.to_string();
        self
    }

    /// Default radius (CSS px) for points without an individual `size`.
    #[wasm_bindgen(js_name = defaultSize)]
    pub fn default_size(mut self, size: f64) -> ScatterPlot {
        self.default_size = size;
        self
    }

    /// Optional stroke around each point. Useful when point colors clash
    /// with the background.
    #[wasm_bindgen]
    pub fn stroke(mut self, color: &str) -> ScatterPlot {
        self.stroke = Some(color.to_string());
        self
    }

    /// Render.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<(), JsValue> {
        let x_scale = self.x_scale.ok_or_else(|| JsValue::from_str("ScatterPlot: x scale missing"))?;
        let y_scale = self.y_scale.ok_or_else(|| JsValue::from_str("ScatterPlot: y scale missing"))?;
        let ctx = self.canvas.ctx();

        if let Some(stroke) = &self.stroke {
            ctx.set_stroke_style_str(stroke);
            ctx.set_line_width(0.75);
        }

        for point in &self.points {
            let x = x_scale.map(point.x);
            let y = y_scale.map(point.y);
            let color = point.color.as_deref().unwrap_or(&self.default_color);
            let size = point.size.unwrap_or(self.default_size).max(0.5);
            ctx.set_fill_style_str(color);
            ctx.begin_path();
            let _ = ctx.arc(x, y, size, 0.0, TAU);
            ctx.fill();
            if self.stroke.is_some() {
                ctx.stroke();
            }
        }
        Ok(())
    }
}
