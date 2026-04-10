//! # LinearTrack — 1D coordinate viewer with markers
//!
//! Renders a horizontal "track" along which markers are positioned by their
//! `position` value. Markers can be circles, vertical ticks or rectangles
//! and carry an optional color. The view supports a `start..end` window so
//! consumers can implement zoom and pan from the outside.

use serde::Deserialize;
use std::f64::consts::TAU;
use wasm_bindgen::prelude::*;

use crate::viz::basic::canvas::ChartCanvas;
use crate::viz::basic::scale::Scale;

#[derive(Deserialize)]
struct Marker {
    position: f64,
    #[serde(default)]
    color: Option<String>,
    #[serde(default)]
    shape: Option<String>,
    #[serde(default)]
    size: Option<f64>,
    #[serde(default)]
    height: Option<f64>,
}

/// Builder for a 1D linear track.
#[wasm_bindgen]
pub struct LinearTrack {
    canvas: ChartCanvas,
    domain_start: f64,
    domain_end: f64,
    markers: Vec<Marker>,
    track_color: String,
    default_color: String,
    track_y: Option<f64>,
}

#[wasm_bindgen]
impl LinearTrack {
    /// Create a new linear track for `canvas`.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: ChartCanvas) -> LinearTrack {
        Self {
            canvas,
            domain_start: 0.0,
            domain_end: 1.0,
            markers: Vec::new(),
            track_color: "#E5E7EB".to_string(),
            default_color: "#8B5CF6".to_string(),
            track_y: None,
        }
    }

    /// Set the visible domain `[start, end]` (e.g. genomic positions, time).
    #[wasm_bindgen]
    pub fn domain(mut self, start: f64, end: f64) -> LinearTrack {
        self.domain_start = start;
        self.domain_end = end;
        self
    }

    /// Provide markers as `[{position, color?, shape?, size?, height?}, ...]`.
    /// Supported shapes: `circle` (default), `tick`, `rect`.
    #[wasm_bindgen]
    pub fn markers(mut self, markers: JsValue) -> Result<LinearTrack, JsValue> {
        self.markers = serde_wasm_bindgen::from_value(markers)
            .map_err(|e| JsValue::from_str(&format!("track markers: {e}")))?;
        Ok(self)
    }

    /// Background track color.
    #[wasm_bindgen(js_name = trackColor)]
    pub fn track_color(mut self, color: &str) -> LinearTrack {
        self.track_color = color.to_string();
        self
    }

    /// Default marker color when none is supplied per marker.
    #[wasm_bindgen(js_name = defaultColor)]
    pub fn default_color(mut self, color: &str) -> LinearTrack {
        self.default_color = color.to_string();
        self
    }

    /// Optional explicit Y position for the track centerline. Defaults to
    /// the vertical center of the plot area.
    #[wasm_bindgen(js_name = trackY)]
    pub fn track_y(mut self, y: f64) -> LinearTrack {
        self.track_y = Some(y);
        self
    }

    /// Render. Returns the number of markers actually drawn.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<u32, JsValue> {
        let plot_left = self.canvas.plot_left();
        let plot_top = self.canvas.plot_top();
        let plot_w = self.canvas.plot_width();
        let plot_h = self.canvas.plot_height();

        let cy = self.track_y.unwrap_or(plot_top + plot_h / 2.0);
        let track_height = (plot_h * 0.15).max(4.0);
        let scale = Scale::linear(self.domain_start, self.domain_end, plot_left, plot_left + plot_w);

        let ctx = self.canvas.ctx();

        // Background bar
        ctx.set_fill_style_str(&self.track_color);
        ctx.fill_rect(plot_left, cy - track_height / 2.0, plot_w, track_height);

        let mut drawn: u32 = 0;
        for marker in &self.markers {
            if marker.position < self.domain_start || marker.position > self.domain_end {
                continue;
            }
            let x = scale.map(marker.position);
            let color = marker.color.as_deref().unwrap_or(&self.default_color);
            ctx.set_fill_style_str(color);
            ctx.set_stroke_style_str(color);

            match marker.shape.as_deref().unwrap_or("circle") {
                "tick" => {
                    let h = marker.height.unwrap_or(track_height * 1.6);
                    ctx.set_line_width(marker.size.unwrap_or(1.5));
                    ctx.begin_path();
                    ctx.move_to(x, cy - h / 2.0);
                    ctx.line_to(x, cy + h / 2.0);
                    ctx.stroke();
                }
                "rect" => {
                    let w = marker.size.unwrap_or(2.0);
                    let h = marker.height.unwrap_or(track_height * 1.4);
                    ctx.fill_rect(x - w / 2.0, cy - h / 2.0, w, h);
                }
                _ => {
                    let r = marker.size.unwrap_or(3.0);
                    ctx.begin_path();
                    let _ = ctx.arc(x, cy, r, 0.0, TAU);
                    ctx.fill();
                }
            }
            drawn += 1;
        }

        Ok(drawn)
    }
}
