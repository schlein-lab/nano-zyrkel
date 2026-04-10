//! # Icons — built-in inline SVG icon set
//!
//! ~30 minimal stroke-based icons that cover the standard dashboard
//! needs (search, settings, filter, download, chevrons, status,
//! arrows, social). Each icon is `inline SVG` so it inherits
//! `currentColor` and scales freely.
//!
//! ## Example
//!
//! ```js
//! document.getElementById('btn').innerHTML = Icons.svg('search', 18);
//! ```

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Icons;

#[wasm_bindgen]
impl Icons {
    /// Return the inline SVG markup for `name` at `size` pixels.
    /// Unknown icons render as a small placeholder square.
    #[wasm_bindgen]
    pub fn svg(name: &str, size: u32) -> String {
        let path = match name {
            "search" => "M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z",
            "settings" => "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
            "filter" => "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
            "download" => "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
            "upload" => "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
            "refresh" => "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
            "check" => "M20 6L9 17l-5-5",
            "x" => "M18 6L6 18M6 6l12 12",
            "plus" => "M12 5v14M5 12h14",
            "minus" => "M5 12h14",
            "chevron-up" => "M18 15l-6-6-6 6",
            "chevron-down" => "M6 9l6 6 6-6",
            "chevron-left" => "M15 18l-6-6 6-6",
            "chevron-right" => "M9 18l6-6-6-6",
            "arrow-up" => "M12 19V5M5 12l7-7 7 7",
            "arrow-down" => "M12 5v14M19 12l-7 7-7-7",
            "arrow-left" => "M19 12H5M12 19l-7-7 7-7",
            "arrow-right" => "M5 12h14M12 5l7 7-7 7",
            "info" => "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01",
            "alert" => "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
            "success" => "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
            "error" => "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6",
            "user" => "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
            "calendar" => "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18",
            "clock" => "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
            "link" => "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
            "external" => "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
            "trash" => "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
            "edit" => "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
            "menu" => "M3 12h18M3 6h18M3 18h18",
            _ => "M12 12m-5 0a5 5 0 1 0 10 0 5 5 0 1 0-10 0",
        };
        format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="{path}"/></svg>"#
        )
    }

    /// Return the list of available icon names. Useful for builder
    /// UIs that want to render a picker.
    #[wasm_bindgen(js_name = listNames)]
    pub fn list_names() -> Vec<JsValue> {
        [
            "search", "settings", "filter", "download", "upload", "refresh",
            "check", "x", "plus", "minus",
            "chevron-up", "chevron-down", "chevron-left", "chevron-right",
            "arrow-up", "arrow-down", "arrow-left", "arrow-right",
            "info", "alert", "success", "error",
            "user", "calendar", "clock", "link", "external",
            "trash", "edit", "menu",
        ]
        .iter()
        .map(|s| JsValue::from_str(s))
        .collect()
    }
}
