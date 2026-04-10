//! # DateTime — date / time utilities for browser-side nano-zyrkels
//!
//! Wraps the JavaScript `Date` object behind a small Rust API so the
//! glue code does not have to remember which methods are 0-indexed
//! (`getMonth`) and which are 1-indexed (`getDate`). Every method is
//! `#[wasm_bindgen]`.
//!
//! Operations:
//!
//! - **Construction**: `now`, `from_unix_ms`, `from_iso`
//! - **Inspection**: `to_iso`, `to_date`, `to_time`
//! - **Arithmetic**: `add_days`, `add_hours`, `add_minutes`
//! - **Comparison**: `diff_days`, `diff_hours`, `diff_minutes`
//! - **Truncation**: `start_of_day`, `start_of_week`, `start_of_month`
//! - **Range**: `range_days(from, to)` returns the inclusive list of
//!   ISO date strings between two timestamps.

use wasm_bindgen::prelude::*;

const MS_PER_SECOND: f64 = 1_000.0;
const MS_PER_MINUTE: f64 = 60.0 * MS_PER_SECOND;
const MS_PER_HOUR: f64 = 60.0 * MS_PER_MINUTE;
const MS_PER_DAY: f64 = 24.0 * MS_PER_HOUR;

/// Stateless namespace exposed to JavaScript. Methods take and return
/// Unix milliseconds (`f64`) so they compose freely with `Date.now()`
/// on the JS side.
#[wasm_bindgen]
pub struct DateTime;

#[wasm_bindgen]
impl DateTime {
    /// Current Unix milliseconds.
    #[wasm_bindgen]
    pub fn now() -> f64 {
        js_sys::Date::now()
    }

    /// Build a Unix-ms timestamp from an ISO 8601 string. Returns
    /// `NaN` for unparseable input — pair with `JsValue::is_finite`.
    #[wasm_bindgen(js_name = fromIso)]
    pub fn from_iso(iso: &str) -> f64 {
        let date = js_sys::Date::new(&JsValue::from_str(iso));
        let v = date.get_time();
        if v.is_nan() {
            f64::NAN
        } else {
            v
        }
    }

    /// Render `unix_ms` as an ISO 8601 timestamp (`YYYY-MM-DDTHH:MM:SSZ`).
    #[wasm_bindgen(js_name = toIso)]
    pub fn to_iso(unix_ms: f64) -> String {
        js_sys::Date::new(&JsValue::from_f64(unix_ms))
            .to_iso_string()
            .as_string()
            .unwrap_or_default()
    }

    /// Render `unix_ms` as `YYYY-MM-DD`.
    #[wasm_bindgen(js_name = toDate)]
    pub fn to_date(unix_ms: f64) -> String {
        let d = js_sys::Date::new(&JsValue::from_f64(unix_ms));
        format!(
            "{:04}-{:02}-{:02}",
            d.get_full_year(),
            d.get_month() + 1,
            d.get_date()
        )
    }

    /// Render `unix_ms` as `HH:MM`.
    #[wasm_bindgen(js_name = toTime)]
    pub fn to_time(unix_ms: f64) -> String {
        let d = js_sys::Date::new(&JsValue::from_f64(unix_ms));
        format!("{:02}:{:02}", d.get_hours(), d.get_minutes())
    }

    /// Add `days` to a timestamp. `days` may be negative.
    #[wasm_bindgen(js_name = addDays)]
    pub fn add_days(unix_ms: f64, days: f64) -> f64 {
        unix_ms + days * MS_PER_DAY
    }

    /// Add `hours` to a timestamp.
    #[wasm_bindgen(js_name = addHours)]
    pub fn add_hours(unix_ms: f64, hours: f64) -> f64 {
        unix_ms + hours * MS_PER_HOUR
    }

    /// Add `minutes` to a timestamp.
    #[wasm_bindgen(js_name = addMinutes)]
    pub fn add_minutes(unix_ms: f64, minutes: f64) -> f64 {
        unix_ms + minutes * MS_PER_MINUTE
    }

    /// Difference in whole days between `a` and `b` (a − b).
    #[wasm_bindgen(js_name = diffDays)]
    pub fn diff_days(a: f64, b: f64) -> f64 {
        (a - b) / MS_PER_DAY
    }

    /// Difference in whole hours between `a` and `b` (a − b).
    #[wasm_bindgen(js_name = diffHours)]
    pub fn diff_hours(a: f64, b: f64) -> f64 {
        (a - b) / MS_PER_HOUR
    }

    /// Difference in whole minutes between `a` and `b` (a − b).
    #[wasm_bindgen(js_name = diffMinutes)]
    pub fn diff_minutes(a: f64, b: f64) -> f64 {
        (a - b) / MS_PER_MINUTE
    }

    /// Truncate to local-midnight.
    #[wasm_bindgen(js_name = startOfDay)]
    pub fn start_of_day(unix_ms: f64) -> f64 {
        let d = js_sys::Date::new(&JsValue::from_f64(unix_ms));
        d.set_hours(0);
        d.set_minutes(0);
        d.set_seconds(0);
        d.set_milliseconds(0);
        d.get_time()
    }

    /// Truncate to the local Monday at 00:00.
    #[wasm_bindgen(js_name = startOfWeek)]
    pub fn start_of_week(unix_ms: f64) -> f64 {
        let day_start = Self::start_of_day(unix_ms);
        let d = js_sys::Date::new(&JsValue::from_f64(day_start));
        // JS week: 0=Sun, 1=Mon, …, 6=Sat. We want Monday as the first day.
        let dow = d.get_day();
        let offset = if dow == 0 { 6.0 } else { (dow - 1) as f64 };
        day_start - offset * MS_PER_DAY
    }

    /// Truncate to the first day of the month at 00:00.
    #[wasm_bindgen(js_name = startOfMonth)]
    pub fn start_of_month(unix_ms: f64) -> f64 {
        let d = js_sys::Date::new(&JsValue::from_f64(unix_ms));
        d.set_date(1);
        d.set_hours(0);
        d.set_minutes(0);
        d.set_seconds(0);
        d.set_milliseconds(0);
        d.get_time()
    }

    /// Inclusive list of `YYYY-MM-DD` strings between `from` and `to`.
    /// Returns at most 366 entries.
    #[wasm_bindgen(js_name = rangeDays)]
    pub fn range_days(from: f64, to: f64) -> Vec<JsValue> {
        let mut out = Vec::new();
        let start = Self::start_of_day(from.min(to));
        let end = Self::start_of_day(from.max(to));
        let mut current = start;
        let mut steps = 0;
        while current <= end && steps < 366 {
            out.push(JsValue::from_str(&Self::to_date(current)));
            current += MS_PER_DAY;
            steps += 1;
        }
        out
    }
}
