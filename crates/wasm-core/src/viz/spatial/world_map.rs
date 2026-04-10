//! # WorldMap — choropleth on an equirectangular projection
//!
//! Minimal world map without bundled GeoJSON: the consumer ships its own
//! polygon outlines via [`WorldMap::shapes`]. This keeps the WASM bundle
//! small and lets each repo decide how detailed the map should be (low-res
//! for performance, high-res for editorial use).
//!
//! Each shape is `[[lon, lat], ...]` and is colored according to the
//! configured palette and the per-country values supplied in [`WorldMap::values`].

use serde::Deserialize;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use crate::viz::basic::canvas::ChartCanvas;

#[derive(Deserialize)]
struct CountryShape {
    code: String,
    rings: Vec<Vec<[f64; 2]>>,
}

/// Builder for a world map choropleth.
#[wasm_bindgen]
pub struct WorldMap {
    canvas: ChartCanvas,
    shapes: Vec<CountryShape>,
    values: HashMap<String, f64>,
    min: f64,
    max: f64,
    low: String,
    high: String,
    background: String,
    stroke: String,
}

#[wasm_bindgen]
impl WorldMap {
    /// Create a new world map for `canvas`.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: ChartCanvas) -> WorldMap {
        Self {
            canvas,
            shapes: Vec::new(),
            values: HashMap::new(),
            min: 0.0,
            max: 1.0,
            low: "#F3F4F6".to_string(),
            high: "#8B5CF6".to_string(),
            background: "#FFFFFF".to_string(),
            stroke: "#9CA3AF".to_string(),
        }
    }

    /// Provide country shapes as `[{code, rings: [[[lon, lat], ...], ...]}, ...]`.
    #[wasm_bindgen]
    pub fn shapes(mut self, shapes: JsValue) -> Result<WorldMap, JsValue> {
        self.shapes = serde_wasm_bindgen::from_value(shapes)
            .map_err(|e| JsValue::from_str(&format!("world map shapes: {e}")))?;
        Ok(self)
    }

    /// Provide values keyed by country code: `{ "DE": 0.42, "US": 0.31 }`.
    #[wasm_bindgen]
    pub fn values(mut self, values: JsValue) -> Result<WorldMap, JsValue> {
        self.values = serde_wasm_bindgen::from_value(values)
            .map_err(|e| JsValue::from_str(&format!("world map values: {e}")))?;
        Ok(self)
    }

    /// Numeric range used for the color interpolation.
    #[wasm_bindgen]
    pub fn range(mut self, min: f64, max: f64) -> WorldMap {
        self.min = min;
        self.max = max;
        self
    }

    /// Sequential palette endpoints (low → high).
    #[wasm_bindgen]
    pub fn palette(mut self, low: &str, high: &str) -> WorldMap {
        self.low = low.to_string();
        self.high = high.to_string();
        self
    }

    /// Background fill of the canvas.
    #[wasm_bindgen]
    pub fn background(mut self, color: &str) -> WorldMap {
        self.background = color.to_string();
        self
    }

    /// Outline stroke color.
    #[wasm_bindgen]
    pub fn stroke(mut self, color: &str) -> WorldMap {
        self.stroke = color.to_string();
        self
    }

    /// Render.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<(), JsValue> {
        let plot_left = self.canvas.plot_left();
        let plot_top = self.canvas.plot_top();
        let plot_w = self.canvas.plot_width();
        let plot_h = self.canvas.plot_height();

        let ctx = self.canvas.ctx();
        ctx.set_fill_style_str(&self.background);
        ctx.fill_rect(plot_left, plot_top, plot_w, plot_h);

        let (low_r, low_g, low_b) = parse_hex(&self.low).unwrap_or((243, 244, 246));
        let (high_r, high_g, high_b) = parse_hex(&self.high).unwrap_or((139, 92, 246));
        let span = (self.max - self.min).max(1e-9);

        let to_x = |lon: f64| plot_left + ((lon + 180.0) / 360.0) * plot_w;
        let to_y = |lat: f64| plot_top + ((90.0 - lat) / 180.0) * plot_h;

        for shape in &self.shapes {
            let value = self.values.get(&shape.code).copied();
            let fill = match value {
                Some(v) => {
                    let t = ((v - self.min) / span).clamp(0.0, 1.0);
                    let r = lerp(low_r as f64, high_r as f64, t) as u8;
                    let g = lerp(low_g as f64, high_g as f64, t) as u8;
                    let b = lerp(low_b as f64, high_b as f64, t) as u8;
                    format!("#{:02X}{:02X}{:02X}", r, g, b)
                }
                None => "#F9FAFB".to_string(),
            };
            ctx.set_fill_style_str(&fill);
            ctx.set_stroke_style_str(&self.stroke);
            ctx.set_line_width(0.5);

            for ring in &shape.rings {
                if ring.len() < 3 {
                    continue;
                }
                ctx.begin_path();
                let first = ring[0];
                ctx.move_to(to_x(first[0]), to_y(first[1]));
                for point in ring.iter().skip(1) {
                    ctx.line_to(to_x(point[0]), to_y(point[1]));
                }
                ctx.close_path();
                ctx.fill();
                ctx.stroke();
            }
        }
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
