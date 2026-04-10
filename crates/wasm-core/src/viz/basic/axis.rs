//! # Axis — draw axes and grid lines on a `ChartCanvas`
//!
//! Two free-standing functions, kept stateless on purpose so consumers can
//! call them inline from any chart implementation. They take a
//! [`ChartCanvas`] plus a [`Scale`] and write directly into the underlying
//! 2D context.
//!
//! Both functions accept an optional formatter callback to turn raw tick
//! values into human-readable labels.

use wasm_bindgen::prelude::*;

use super::canvas::ChartCanvas;
use super::scale::Scale;

/// Draw a horizontal grid (one line per Y tick) plus the leftmost Y axis
/// labels onto `chart`. The labels are positioned to the left of the plot
/// area inside the configured padding.
#[wasm_bindgen(js_name = drawYGrid)]
pub fn draw_y_grid(
    chart: &ChartCanvas,
    scale: &Scale,
    ticks: u32,
    label_format: Option<js_sys::Function>,
) {
    let ctx = chart.ctx();
    let pad = chart.padding();
    let plot_w = chart.plot_width();
    let plot_top = chart.plot_top();
    let plot_left = chart.plot_left();

    ctx.set_stroke_style_str("#E5E7EB");
    ctx.set_line_width(0.5);
    ctx.set_fill_style_str("#6B7280");
    ctx.set_font("10px Inter, sans-serif");
    ctx.set_text_align("right");
    ctx.set_text_baseline("middle");

    for value in scale.ticks(ticks) {
        let y = scale.map(value);
        ctx.begin_path();
        ctx.move_to(plot_left, y);
        ctx.line_to(plot_left + plot_w, y);
        ctx.stroke();

        let label = format_value(&label_format, value);
        let _ = ctx.fill_text(&label, plot_left - 4.0, y);
    }
    let _ = pad;
    let _ = plot_top;
}

/// Draw a vertical grid (one tick per X value) plus the X axis labels at
/// the bottom of the plot area.
#[wasm_bindgen(js_name = drawXAxis)]
pub fn draw_x_axis(
    chart: &ChartCanvas,
    scale: &Scale,
    ticks: u32,
    label_format: Option<js_sys::Function>,
) {
    let ctx = chart.ctx();
    let plot_h = chart.plot_height();
    let plot_top = chart.plot_top();
    let plot_left = chart.plot_left();
    let plot_bottom = plot_top + plot_h;

    ctx.set_stroke_style_str("#E5E7EB");
    ctx.set_line_width(0.5);
    ctx.set_fill_style_str("#6B7280");
    ctx.set_font("10px Inter, sans-serif");
    ctx.set_text_align("center");
    ctx.set_text_baseline("top");

    for value in scale.ticks(ticks) {
        let x = scale.map(value);
        ctx.begin_path();
        ctx.move_to(x, plot_top);
        ctx.line_to(x, plot_bottom);
        ctx.stroke();

        let label = format_value(&label_format, value);
        let _ = ctx.fill_text(&label, x, plot_bottom + 4.0);
    }
    let _ = plot_left;
}

fn format_value(callback: &Option<js_sys::Function>, value: f64) -> String {
    match callback {
        Some(f) => {
            let this = JsValue::NULL;
            let arg = JsValue::from_f64(value);
            f.call1(&this, &arg)
                .ok()
                .and_then(|v| v.as_string())
                .unwrap_or_else(|| format!("{:.0}", value))
        }
        None => format!("{:.0}", value),
    }
}
