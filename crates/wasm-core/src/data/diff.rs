//! # Diff — compare two snapshots of a JSON array
//!
//! Returns the records that were added, removed or modified between an
//! "old" and a "new" version of a dataset, keyed by a stable id field.
//! This is the operation that nano-zyrkels in the browser most often want:
//! "what changed since the last fetch?".
//!
//! ## Example
//!
//! ```js
//! const result = Diff.byKey('id', oldVariants, newVariants);
//! // → { added: [...], removed: [...], modified: [...] }
//! ```

use serde::Serialize;
use serde_json::{Map, Value};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// Result of a snapshot comparison.
#[derive(Serialize)]
struct DiffResult {
    added: Vec<Value>,
    removed: Vec<Value>,
    modified: Vec<ModifiedEntry>,
    /// Number of records present in both snapshots that did NOT change.
    unchanged_count: usize,
}

#[derive(Serialize)]
struct ModifiedEntry {
    key: String,
    old: Value,
    new: Value,
    /// Field-level paths that differ between `old` and `new`.
    fields: Vec<String>,
}

/// Stateless namespace for diff operations.
#[wasm_bindgen]
pub struct Diff;

#[wasm_bindgen]
impl Diff {
    /// Diff two JSON arrays keyed by `key_field`.
    ///
    /// - Records present in `new_data` but not `old_data` are reported as
    ///   *added*.
    /// - Records present in `old_data` but not `new_data` are reported as
    ///   *removed*.
    /// - Records present in both whose JSON serialization differs are
    ///   reported as *modified*, together with the list of changed top-level
    ///   field names.
    #[wasm_bindgen(js_name = byKey)]
    pub fn by_key(key_field: &str, old_data: JsValue, new_data: JsValue) -> Result<JsValue, JsValue> {
        let old: Value = serde_wasm_bindgen::from_value(old_data)
            .map_err(|e| JsValue::from_str(&format!("diff old not parseable: {e}")))?;
        let new: Value = serde_wasm_bindgen::from_value(new_data)
            .map_err(|e| JsValue::from_str(&format!("diff new not parseable: {e}")))?;

        let old_arr = match old { Value::Array(a) => a, _ => Vec::new() };
        let new_arr = match new { Value::Array(a) => a, _ => Vec::new() };

        let mut old_map: HashMap<String, &Value> = HashMap::with_capacity(old_arr.len());
        for record in &old_arr {
            if let Some(k) = key_of(record, key_field) {
                old_map.insert(k, record);
            }
        }
        let mut new_map: HashMap<String, &Value> = HashMap::with_capacity(new_arr.len());
        for record in &new_arr {
            if let Some(k) = key_of(record, key_field) {
                new_map.insert(k, record);
            }
        }

        let mut added = Vec::new();
        let mut removed = Vec::new();
        let mut modified = Vec::new();
        let mut unchanged_count = 0;

        for (k, new_v) in &new_map {
            match old_map.get(k) {
                None => added.push((*new_v).clone()),
                Some(old_v) if !json_eq(old_v, new_v) => {
                    let fields = changed_fields(old_v, new_v);
                    modified.push(ModifiedEntry {
                        key: k.clone(),
                        old: (*old_v).clone(),
                        new: (*new_v).clone(),
                        fields,
                    });
                }
                _ => unchanged_count += 1,
            }
        }
        for (k, old_v) in &old_map {
            if !new_map.contains_key(k) {
                removed.push((*old_v).clone());
            }
        }

        let result = DiffResult { added, removed, modified, unchanged_count };
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

fn key_of(record: &Value, field: &str) -> Option<String> {
    match record.get(field)? {
        Value::String(s) => Some(s.clone()),
        Value::Number(n) => Some(n.to_string()),
        Value::Bool(b) => Some(b.to_string()),
        _ => None,
    }
}

fn json_eq(a: &Value, b: &Value) -> bool {
    a == b
}

fn changed_fields(old: &Value, new: &Value) -> Vec<String> {
    let empty = Map::new();
    let old_obj = old.as_object().unwrap_or(&empty);
    let new_obj = new.as_object().unwrap_or(&empty);
    let mut keys: Vec<String> = old_obj.keys().chain(new_obj.keys()).cloned().collect();
    keys.sort();
    keys.dedup();
    keys.into_iter()
        .filter(|k| old_obj.get(k) != new_obj.get(k))
        .collect()
}
