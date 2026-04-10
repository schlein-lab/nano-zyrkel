//! # Csv — JSON ⇄ CSV conversion + browser download
//!
//! Two complementary helpers for the "Download as CSV" pattern that
//! every dashboard ends up implementing:
//!
//! - [`Csv::from_json_array`] turns a JSON array of objects into a
//!   well-formed CSV string. Field names are unioned across every row,
//!   sorted alphabetically, and properly escaped (quotes doubled,
//!   commas / newlines wrapped).
//! - [`Csv::download`] turns the resulting string into a `Blob`, builds
//!   an in-memory `<a download="…">` element, clicks it, and revokes
//!   the object URL — the canonical browser pattern, kept inside the
//!   core so consumers do not have to know it.
//!
//! ## Example
//!
//! ```js
//! import { Csv } from './core/wasm/nano_zyrkel_wasm_core.js';
//!
//! const rows = [
//!   { gene: 'BRCA1', score: 0.92, classification: 'Pathogenic' },
//!   { gene: 'BRCA2', score: 0.41, classification: 'VUS' },
//! ];
//! Csv.download('variants.csv', Csv.from_json_array(rows));
//! ```

use serde_json::{Map, Value};
use std::collections::BTreeSet;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{Blob, HtmlAnchorElement, Url};

/// Stateless namespace for CSV helpers.
#[wasm_bindgen]
pub struct Csv;

#[wasm_bindgen]
impl Csv {
    /// Convert a JSON array of objects into a CSV string.
    ///
    /// The header row is the union of every key seen in the array,
    /// sorted alphabetically. Missing fields render as empty cells.
    /// Cells containing commas, double quotes or newlines are quoted
    /// according to RFC 4180.
    #[wasm_bindgen(js_name = fromJsonArray)]
    pub fn from_json_array(data: JsValue) -> Result<String, JsValue> {
        let value: Value = serde_wasm_bindgen::from_value(data)
            .map_err(|e| JsValue::from_str(&format!("csv input not parseable: {e}")))?;
        let arr = match value {
            Value::Array(a) => a,
            _ => Vec::new(),
        };
        Ok(serialize_array(&arr))
    }

    /// Trigger a browser "Save As" dialog with the given CSV body.
    /// Creates a Blob, builds an `<a download>` element, clicks it,
    /// and revokes the object URL afterwards.
    #[wasm_bindgen]
    pub fn download(filename: &str, body: &str) -> Result<(), JsValue> {
        // Encode the body once. We use a `Uint8Array` because the
        // simpler `Blob::new_with_str_sequence` is sensitive to BOM
        // handling on some browsers.
        let bytes = body.as_bytes();
        let array = js_sys::Uint8Array::new_with_length(bytes.len() as u32);
        array.copy_from(bytes);
        let parts = js_sys::Array::new();
        parts.push(&array);
        let blob = Blob::new_with_u8_array_sequence(&parts)?;
        let url = Url::create_object_url_with_blob(&blob)?;

        let document = web_sys::window()
            .ok_or_else(|| JsValue::from_str("no window"))?
            .document()
            .ok_or_else(|| JsValue::from_str("no document"))?;
        let anchor: HtmlAnchorElement = document
            .create_element("a")?
            .dyn_into()
            .map_err(|_| JsValue::from_str("anchor cast failed"))?;
        anchor.set_href(&url);
        anchor.set_download(filename);
        anchor.style().set_property("display", "none")?;
        document.body().ok_or_else(|| JsValue::from_str("no body"))?.append_child(&anchor)?;
        anchor.click();
        anchor.remove();
        Url::revoke_object_url(&url)?;
        Ok(())
    }
}

fn serialize_array(arr: &[Value]) -> String {
    if arr.is_empty() {
        return String::new();
    }

    // Union of all keys, sorted alphabetically.
    let mut keys: BTreeSet<String> = BTreeSet::new();
    for record in arr {
        if let Some(obj) = record.as_object() {
            for k in obj.keys() {
                keys.insert(k.clone());
            }
        }
    }
    let header: Vec<String> = keys.into_iter().collect();

    let mut out = String::new();
    out.push_str(
        &header
            .iter()
            .map(|h| escape_field(h))
            .collect::<Vec<_>>()
            .join(","),
    );
    out.push('\n');

    let empty = Map::new();
    for record in arr {
        let obj = record.as_object().unwrap_or(&empty);
        let row: Vec<String> = header
            .iter()
            .map(|key| {
                let cell = obj.get(key).map(stringify).unwrap_or_default();
                escape_field(&cell)
            })
            .collect();
        out.push_str(&row.join(","));
        out.push('\n');
    }
    out
}

fn stringify(v: &Value) -> String {
    match v {
        Value::Null => String::new(),
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        other => serde_json::to_string(other).unwrap_or_default(),
    }
}

fn escape_field(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') || s.contains('\r') {
        let escaped = s.replace('"', "\"\"");
        format!("\"{escaped}\"")
    } else {
        s.to_string()
    }
}
