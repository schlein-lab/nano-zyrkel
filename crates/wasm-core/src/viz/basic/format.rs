//! # Format — number, percent and SI-prefix formatters
//!
//! Stateless namespace exposed to JavaScript so the same number formatting
//! is reused across charts and labels.

use wasm_bindgen::prelude::*;

/// Stateless namespace for value formatters.
#[wasm_bindgen]
pub struct Format;

#[wasm_bindgen]
impl Format {
    /// Format `value` as `42.0%`. `digits` controls fractional digits.
    #[wasm_bindgen]
    pub fn percent(value: f64, digits: u32) -> String {
        format!("{:.*}%", digits as usize, value * 100.0)
    }

    /// Format `value` with SI prefixes (`1.2K`, `4.5M`, `2.3B`).
    #[wasm_bindgen]
    pub fn si(value: f64) -> String {
        let abs = value.abs();
        let (scaled, suffix) = if abs >= 1e9 {
            (value / 1e9, "B")
        } else if abs >= 1e6 {
            (value / 1e6, "M")
        } else if abs >= 1e3 {
            (value / 1e3, "K")
        } else {
            (value, "")
        };
        if suffix.is_empty() {
            format!("{:.0}", scaled)
        } else {
            format!("{:.1}{}", scaled, suffix)
        }
    }

    /// Format `value` as a fixed-decimal number.
    #[wasm_bindgen]
    pub fn fixed(value: f64, digits: u32) -> String {
        format!("{:.*}", digits as usize, value)
    }

    /// Format `unix_ms` as `YYYY-MM-DD`.
    #[wasm_bindgen]
    pub fn date(unix_ms: f64) -> String {
        let date = js_sys::Date::new(&JsValue::from_f64(unix_ms));
        let y = date.get_full_year();
        let m = date.get_month() + 1;
        let d = date.get_date();
        format!("{:04}-{:02}-{:02}", y, m, d)
    }

    /// Format `unix_ms` as a short month/day label.
    #[wasm_bindgen(js_name = monthDay)]
    pub fn month_day(unix_ms: f64) -> String {
        let date = js_sys::Date::new(&JsValue::from_f64(unix_ms));
        let m = date.get_month() + 1;
        let d = date.get_date();
        format!("{}/{}", m, d)
    }
}
