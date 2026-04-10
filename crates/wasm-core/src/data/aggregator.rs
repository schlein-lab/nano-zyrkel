//! # Aggregator — group-by + count/sum/avg/min/max over a JSON array
//!
//! Lets browser-side nano-zyrkels build chart-ready datasets without writing
//! reduce loops by hand. Inspired by SQL `GROUP BY ... AGG(...)`.
//!
//! ## Example
//!
//! ```js
//! const counts = new Aggregator()
//!   .groupBy('classification')
//!   .count(allVariants);
//! // → { Pathogenic: 123, VUS: 45, Benign: 12 }
//!
//! const avgScore = new Aggregator()
//!   .groupBy('gene')
//!   .avg('reviewStars', allVariants);
//! ```

use serde_json::{Map, Value};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// Builder for grouped aggregation queries.
#[wasm_bindgen]
#[derive(Default, Clone)]
pub struct Aggregator {
    group_field: Option<String>,
}

#[wasm_bindgen]
impl Aggregator {
    /// Create an empty aggregator.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    /// Group records by the value of `field`. Records where the field is
    /// missing are grouped under the empty string `""`.
    #[wasm_bindgen(js_name = groupBy)]
    pub fn group_by(mut self, field: &str) -> Self {
        self.group_field = Some(field.to_string());
        self
    }

    /// Count records per group. Returns an object `{ group: count }`.
    #[wasm_bindgen]
    pub fn count(&self, data: JsValue) -> Result<JsValue, JsValue> {
        let arr = parse_array(data)?;
        let mut out: HashMap<String, u64> = HashMap::new();
        for record in arr.iter() {
            let key = self.key_for(record);
            *out.entry(key).or_insert(0) += 1;
        }
        serialize_map_u64(out)
    }

    /// Sum the numeric value of `field` per group.
    #[wasm_bindgen]
    pub fn sum(&self, field: &str, data: JsValue) -> Result<JsValue, JsValue> {
        let arr = parse_array(data)?;
        let mut out: HashMap<String, f64> = HashMap::new();
        for record in arr.iter() {
            if let Some(value) = lookup_f64(record, field) {
                let key = self.key_for(record);
                *out.entry(key).or_insert(0.0) += value;
            }
        }
        serialize_map_f64(out)
    }

    /// Average the numeric value of `field` per group.
    #[wasm_bindgen]
    pub fn avg(&self, field: &str, data: JsValue) -> Result<JsValue, JsValue> {
        let arr = parse_array(data)?;
        let mut sum: HashMap<String, f64> = HashMap::new();
        let mut count: HashMap<String, u64> = HashMap::new();
        for record in arr.iter() {
            if let Some(value) = lookup_f64(record, field) {
                let key = self.key_for(record);
                *sum.entry(key.clone()).or_insert(0.0) += value;
                *count.entry(key).or_insert(0) += 1;
            }
        }
        let avg: HashMap<String, f64> = sum
            .into_iter()
            .map(|(k, total)| {
                let n = count.get(&k).copied().unwrap_or(1) as f64;
                (k, total / n)
            })
            .collect();
        serialize_map_f64(avg)
    }

    /// Minimum numeric value of `field` per group.
    #[wasm_bindgen]
    pub fn min(&self, field: &str, data: JsValue) -> Result<JsValue, JsValue> {
        let arr = parse_array(data)?;
        let mut out: HashMap<String, f64> = HashMap::new();
        for record in arr.iter() {
            if let Some(value) = lookup_f64(record, field) {
                let key = self.key_for(record);
                let current = out.entry(key).or_insert(f64::INFINITY);
                if value < *current {
                    *current = value;
                }
            }
        }
        serialize_map_f64(out)
    }

    /// Maximum numeric value of `field` per group.
    #[wasm_bindgen]
    pub fn max(&self, field: &str, data: JsValue) -> Result<JsValue, JsValue> {
        let arr = parse_array(data)?;
        let mut out: HashMap<String, f64> = HashMap::new();
        for record in arr.iter() {
            if let Some(value) = lookup_f64(record, field) {
                let key = self.key_for(record);
                let current = out.entry(key).or_insert(f64::NEG_INFINITY);
                if value > *current {
                    *current = value;
                }
            }
        }
        serialize_map_f64(out)
    }

    fn key_for(&self, record: &Value) -> String {
        match &self.group_field {
            Some(field) => match lookup(record, field) {
                Some(Value::String(s)) => s.clone(),
                Some(Value::Number(n)) => n.to_string(),
                Some(Value::Bool(b)) => b.to_string(),
                Some(other) => other.to_string(),
                None => String::new(),
            },
            None => String::new(),
        }
    }
}

fn parse_array(data: JsValue) -> Result<Vec<Value>, JsValue> {
    let value: Value = serde_wasm_bindgen::from_value(data)
        .map_err(|e| JsValue::from_str(&format!("aggregator input not parseable: {e}")))?;
    Ok(match value {
        Value::Array(a) => a,
        _ => Vec::new(),
    })
}

fn lookup<'a>(record: &'a Value, field: &str) -> Option<&'a Value> {
    field.split('.').try_fold(record, |acc, seg| acc.get(seg))
}

fn lookup_f64(record: &Value, field: &str) -> Option<f64> {
    lookup(record, field).and_then(|v| match v {
        Value::Number(n) => n.as_f64(),
        Value::String(s) => s.parse().ok(),
        Value::Bool(b) => Some(if *b { 1.0 } else { 0.0 }),
        _ => None,
    })
}

fn serialize_map_u64(map: HashMap<String, u64>) -> Result<JsValue, JsValue> {
    let mut object = Map::with_capacity(map.len());
    for (k, v) in map {
        object.insert(k, Value::Number(v.into()));
    }
    serde_wasm_bindgen::to_value(&Value::Object(object))
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

fn serialize_map_f64(map: HashMap<String, f64>) -> Result<JsValue, JsValue> {
    let mut object = Map::with_capacity(map.len());
    for (k, v) in map {
        if let Some(n) = serde_json::Number::from_f64(v) {
            object.insert(k, Value::Number(n));
        }
    }
    serde_wasm_bindgen::to_value(&Value::Object(object))
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
