//! # BarChart — single and stacked bars
//!
//! Two construction modes:
//!
//! - `BarChart::single` for one value per category (use it for histograms,
//!   sorted bars, simple counts).
//! - `BarChart::stacked` for one or more named series stacked on top of
//!   each other (the timeline + survival pattern from vusTracker).
//!
//! Both modes share the same draw call.

use serde::Deserialize;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use super::canvas::ChartCanvas;
use super::scale::Scale;

/// Single-bar entry for `BarChart::single`.
#[derive(Deserialize)]
struct SingleBar {
    label: String,
    value: f64,
    #[serde(default)]
    color: Option<String>,
}

/// Stacked-bar entry for `BarChart::stacked`. Each entry carries a label
/// (the X position) and a map of `series → value`.
#[derive(Deserialize)]
struct StackedBar {
    label: String,
    values: HashMap<String, f64>,
}

enum Mode {
    Single(Vec<SingleBar>),
    Stacked {
        bars: Vec<StackedBar>,
        series: Vec<String>,
        colors: HashMap<String, String>,
    },
}

/// Builder for bar charts.
#[wasm_bindgen]
pub struct BarChart {
    canvas: ChartCanvas,
    mode: Option<Mode>,
    y_scale: Option<Scale>,
    bar_color: String,
    gap: f64,
}

#[wasm_bindgen]
impl BarChart {
    /// Single-bar chart constructor.
    #[wasm_bindgen]
    pub fn single(canvas: ChartCanvas, bars: JsValue) -> Result<BarChart, JsValue> {
        let parsed: Vec<SingleBar> = serde_wasm_bindgen::from_value(bars)
            .map_err(|e| JsValue::from_str(&format!("single bars: {e}")))?;
        Ok(Self {
            canvas,
            mode: Some(Mode::Single(parsed)),
            y_scale: None,
            bar_color: "#8B5CF6".to_string(),
            gap: 2.0,
        })
    }

    /// Stacked-bar chart constructor.
    ///
    /// `series` is the ordered list of stack names (bottom → top).
    /// `colors` is an object mapping each series name to a `#RRGGBB`
    /// string. Bars whose `values` map is missing a series treat it as 0.
    #[wasm_bindgen]
    pub fn stacked(
        canvas: ChartCanvas,
        bars: JsValue,
        series: Vec<JsValue>,
        colors: JsValue,
    ) -> Result<BarChart, JsValue> {
        let parsed: Vec<StackedBar> = serde_wasm_bindgen::from_value(bars)
            .map_err(|e| JsValue::from_str(&format!("stacked bars: {e}")))?;
        let series: Vec<String> = series.into_iter().filter_map(|v| v.as_string()).collect();
        let colors: HashMap<String, String> = serde_wasm_bindgen::from_value(colors)
            .map_err(|e| JsValue::from_str(&format!("stacked colors: {e}")))?;
        Ok(Self {
            canvas,
            mode: Some(Mode::Stacked { bars: parsed, series, colors }),
            y_scale: None,
            bar_color: "#8B5CF6".to_string(),
            gap: 2.0,
        })
    }

    /// Y-axis scale (mapping data values → pixels). Required.
    #[wasm_bindgen]
    pub fn y(mut self, scale: Scale) -> BarChart {
        self.y_scale = Some(scale);
        self
    }

    /// Bar fill color (single mode only).
    #[wasm_bindgen]
    pub fn color(mut self, color: &str) -> BarChart {
        self.bar_color = color.to_string();
        self
    }

    /// Pixel gap between bars.
    #[wasm_bindgen]
    pub fn gap(mut self, gap: f64) -> BarChart {
        self.gap = gap;
        self
    }

    /// Render the chart.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<(), JsValue> {
        let y_scale = self.y_scale.ok_or_else(|| JsValue::from_str("BarChart: y scale missing"))?;
        let mode = self.mode.ok_or_else(|| JsValue::from_str("BarChart: no data"))?;
        let ctx = self.canvas.ctx();
        let plot_left = self.canvas.plot_left();
        let plot_top = self.canvas.plot_top();
        let plot_w = self.canvas.plot_width();
        let plot_h = self.canvas.plot_height();
        let plot_bottom = plot_top + plot_h;

        match mode {
            Mode::Single(bars) => {
                if bars.is_empty() {
                    return Ok(());
                }
                let n = bars.len() as f64;
                let bar_w = ((plot_w - self.gap * (n - 1.0)) / n).max(1.0);
                for (i, b) in bars.iter().enumerate() {
                    let x = plot_left + i as f64 * (bar_w + self.gap);
                    let y_top = y_scale.map(b.value).max(plot_top);
                    let h = (plot_bottom - y_top).max(0.0);
                    let color = b.color.as_deref().unwrap_or(&self.bar_color);
                    ctx.set_fill_style_str(color);
                    ctx.fill_rect(x, y_top, bar_w, h);
                }
            }
            Mode::Stacked { bars, series, colors } => {
                if bars.is_empty() || series.is_empty() {
                    return Ok(());
                }
                let n = bars.len() as f64;
                let bar_w = ((plot_w - self.gap * (n - 1.0)) / n).max(1.0);
                for (i, bar) in bars.iter().enumerate() {
                    let x = plot_left + i as f64 * (bar_w + self.gap);
                    let mut cursor = plot_bottom;
                    for series_name in &series {
                        let value = bar.values.get(series_name).copied().unwrap_or(0.0);
                        if value <= 0.0 {
                            continue;
                        }
                        let segment_top = y_scale.map(value).max(plot_top);
                        let segment_height = cursor - segment_top;
                        let color = colors
                            .get(series_name)
                            .map(String::as_str)
                            .unwrap_or("#8B5CF6");
                        ctx.set_fill_style_str(color);
                        ctx.fill_rect(x, segment_top, bar_w, segment_height);
                        cursor = segment_top;
                    }
                }
            }
        }
        Ok(())
    }
}
