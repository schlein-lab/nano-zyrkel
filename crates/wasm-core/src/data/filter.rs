//! # Filter — chainable, SQL-WHERE-like predicates over a JSON array
//!
//! Replaces the hand-rolled `array.filter(x => ...)` chains that every
//! browser-side nano-zyrkel ends up writing. The implementation runs in
//! Rust → WASM and is dramatically faster than equivalent JavaScript
//! when applied to large datasets (hundreds of thousands of rows or more).
//!
//! ## Example
//!
//! ```js
//! const f = new Filter()
//!   .whereEq('classification', 'Pathogenic')
//!   .whereGt('reviewStars', 2);
//! const pathogenic = f.apply(allVariants);
//! ```

use serde_json::Value;
use wasm_bindgen::prelude::*;

/// A single filter predicate.
#[derive(Clone)]
enum Predicate {
    Eq { field: String, value: Value },
    Ne { field: String, value: Value },
    Gt { field: String, value: f64 },
    Gte { field: String, value: f64 },
    Lt { field: String, value: f64 },
    Lte { field: String, value: f64 },
    Contains { field: String, substr: String },
    StartsWith { field: String, prefix: String },
    In { field: String, values: Vec<Value> },
    Exists { field: String },
}

/// Builder for chained filter predicates.
///
/// All `where*` methods consume `self` and return `Self` so calls can be
/// chained. Predicates combine with logical AND.
#[wasm_bindgen]
#[derive(Default, Clone)]
pub struct Filter {
    predicates: Vec<Predicate>,
}

#[wasm_bindgen]
impl Filter {
    /// Empty filter that matches every record.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    /// Keep records where `field == value` (string compare).
    #[wasm_bindgen(js_name = whereEq)]
    pub fn where_eq(mut self, field: &str, value: &str) -> Self {
        self.predicates.push(Predicate::Eq {
            field: field.into(),
            value: Value::String(value.into()),
        });
        self
    }

    /// Keep records where `field != value` (string compare).
    #[wasm_bindgen(js_name = whereNe)]
    pub fn where_ne(mut self, field: &str, value: &str) -> Self {
        self.predicates.push(Predicate::Ne {
            field: field.into(),
            value: Value::String(value.into()),
        });
        self
    }

    /// Keep records where `field > value` (numeric compare).
    #[wasm_bindgen(js_name = whereGt)]
    pub fn where_gt(mut self, field: &str, value: f64) -> Self {
        self.predicates.push(Predicate::Gt {
            field: field.into(),
            value,
        });
        self
    }

    /// Keep records where `field >= value` (numeric compare).
    #[wasm_bindgen(js_name = whereGte)]
    pub fn where_gte(mut self, field: &str, value: f64) -> Self {
        self.predicates.push(Predicate::Gte {
            field: field.into(),
            value,
        });
        self
    }

    /// Keep records where `field < value` (numeric compare).
    #[wasm_bindgen(js_name = whereLt)]
    pub fn where_lt(mut self, field: &str, value: f64) -> Self {
        self.predicates.push(Predicate::Lt {
            field: field.into(),
            value,
        });
        self
    }

    /// Keep records where `field <= value` (numeric compare).
    #[wasm_bindgen(js_name = whereLte)]
    pub fn where_lte(mut self, field: &str, value: f64) -> Self {
        self.predicates.push(Predicate::Lte {
            field: field.into(),
            value,
        });
        self
    }

    /// Keep records whose stringified `field` contains `substr`
    /// (case-insensitive).
    #[wasm_bindgen(js_name = whereContains)]
    pub fn where_contains(mut self, field: &str, substr: &str) -> Self {
        self.predicates.push(Predicate::Contains {
            field: field.into(),
            substr: substr.to_lowercase(),
        });
        self
    }

    /// Keep records whose stringified `field` starts with `prefix`.
    #[wasm_bindgen(js_name = whereStartsWith)]
    pub fn where_starts_with(mut self, field: &str, prefix: &str) -> Self {
        self.predicates.push(Predicate::StartsWith {
            field: field.into(),
            prefix: prefix.into(),
        });
        self
    }

    /// Keep records where `field` is one of `values` (string compare).
    #[wasm_bindgen(js_name = whereIn)]
    pub fn where_in(mut self, field: &str, values: Vec<JsValue>) -> Self {
        let parsed: Vec<Value> = values
            .into_iter()
            .filter_map(|v| serde_wasm_bindgen::from_value::<Value>(v).ok())
            .collect();
        self.predicates.push(Predicate::In {
            field: field.into(),
            values: parsed,
        });
        self
    }

    /// Keep records where `field` exists (is not null/undefined).
    #[wasm_bindgen(js_name = whereExists)]
    pub fn where_exists(mut self, field: &str) -> Self {
        self.predicates.push(Predicate::Exists {
            field: field.into(),
        });
        self
    }

    /// Apply this filter to a JSON array. Returns a new array of matching
    /// records. Non-array inputs return an empty array.
    #[wasm_bindgen]
    pub fn apply(&self, data: JsValue) -> Result<JsValue, JsValue> {
        let value: Value = serde_wasm_bindgen::from_value(data)
            .map_err(|e| JsValue::from_str(&format!("filter input not parseable: {e}")))?;
        let arr = match value {
            Value::Array(a) => a,
            _ => Vec::new(),
        };

        let kept: Vec<Value> = arr
            .into_iter()
            .filter(|record| self.predicates.iter().all(|p| eval(p, record)))
            .collect();

        serde_wasm_bindgen::to_value(&kept).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Convenience: count matching records without materializing them.
    #[wasm_bindgen]
    pub fn count(&self, data: JsValue) -> Result<usize, JsValue> {
        let value: Value = serde_wasm_bindgen::from_value(data)
            .map_err(|e| JsValue::from_str(&format!("count input not parseable: {e}")))?;
        let arr = match value {
            Value::Array(a) => a,
            _ => return Ok(0),
        };
        Ok(arr.iter().filter(|r| self.predicates.iter().all(|p| eval(p, r))).count())
    }
}

/// Resolve a possibly-dotted field path on a JSON value.
fn lookup<'a>(record: &'a Value, field: &str) -> Option<&'a Value> {
    field.split('.').try_fold(record, |acc, segment| acc.get(segment))
}

/// Coerce a JSON value to f64 for numeric comparisons.
fn as_f64(v: &Value) -> Option<f64> {
    match v {
        Value::Number(n) => n.as_f64(),
        Value::String(s) => s.parse::<f64>().ok(),
        Value::Bool(b) => Some(if *b { 1.0 } else { 0.0 }),
        _ => None,
    }
}

/// Stringify a JSON value for substring/equality compares.
fn as_str(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

fn eval(pred: &Predicate, record: &Value) -> bool {
    match pred {
        Predicate::Eq { field, value } => lookup(record, field) == Some(value),
        Predicate::Ne { field, value } => lookup(record, field) != Some(value),
        Predicate::Gt { field, value } => lookup(record, field).and_then(as_f64).map(|v| v > *value).unwrap_or(false),
        Predicate::Gte { field, value } => lookup(record, field).and_then(as_f64).map(|v| v >= *value).unwrap_or(false),
        Predicate::Lt { field, value } => lookup(record, field).and_then(as_f64).map(|v| v < *value).unwrap_or(false),
        Predicate::Lte { field, value } => lookup(record, field).and_then(as_f64).map(|v| v <= *value).unwrap_or(false),
        Predicate::Contains { field, substr } => lookup(record, field)
            .map(|v| as_str(v).to_lowercase().contains(substr))
            .unwrap_or(false),
        Predicate::StartsWith { field, prefix } => lookup(record, field)
            .map(|v| as_str(v).starts_with(prefix))
            .unwrap_or(false),
        Predicate::In { field, values } => lookup(record, field)
            .map(|v| values.iter().any(|expected| expected == v))
            .unwrap_or(false),
        Predicate::Exists { field } => matches!(
            lookup(record, field),
            Some(v) if !v.is_null()
        ),
    }
}
