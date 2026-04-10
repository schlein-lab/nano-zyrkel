//! # Search — fast substring + fuzzy lookup over a JSON array
//!
//! Builds a lightweight in-memory index over the configured fields of a JSON
//! array and answers `query` calls in microseconds. Replaces the manual
//! `array.filter(x => x.name.toLowerCase().includes(q))` patterns that
//! every browser-side nano-zyrkel rewrites.
//!
//! ## Example
//!
//! ```js
//! const idx = SearchIndex.build(allGenes, ['symbol', 'aliases']);
//! const matches = idx.query('BRCA');         // exact substring
//! const fuzzy = idx.fuzzyQuery('brc1', 1);   // tolerates 1 typo
//! ```

use serde_json::Value;
use wasm_bindgen::prelude::*;

/// One indexed entry: the original record index plus its lowercased
/// concatenated searchable text.
#[derive(Clone)]
struct Entry {
    record_index: u32,
    haystack: String,
}

/// In-memory search index over a JSON array.
#[wasm_bindgen]
pub struct SearchIndex {
    entries: Vec<Entry>,
}

#[wasm_bindgen]
impl SearchIndex {
    /// Build an index over `data`, concatenating the values found at each
    /// of `fields` (dot paths supported) into a lowercase haystack per
    /// record.
    #[wasm_bindgen]
    pub fn build(data: JsValue, fields: Vec<JsValue>) -> Result<SearchIndex, JsValue> {
        let value: Value = serde_wasm_bindgen::from_value(data)
            .map_err(|e| JsValue::from_str(&format!("search input not parseable: {e}")))?;
        let arr = match value {
            Value::Array(a) => a,
            _ => Vec::new(),
        };
        let field_paths: Vec<String> = fields
            .into_iter()
            .filter_map(|v| v.as_string())
            .collect();

        let mut entries = Vec::with_capacity(arr.len());
        for (idx, record) in arr.iter().enumerate() {
            let mut haystack = String::new();
            for field in &field_paths {
                if let Some(v) = lookup(record, field) {
                    haystack.push_str(&stringify(v));
                    haystack.push(' ');
                }
            }
            entries.push(Entry {
                record_index: idx as u32,
                haystack: haystack.to_lowercase(),
            });
        }

        Ok(Self { entries })
    }

    /// Plain substring query. Returns the indices into the original array
    /// that contain `q` (case-insensitive).
    #[wasm_bindgen]
    pub fn query(&self, q: &str) -> Vec<u32> {
        let needle = q.to_lowercase();
        if needle.is_empty() {
            return self.entries.iter().map(|e| e.record_index).collect();
        }
        self.entries
            .iter()
            .filter(|e| e.haystack.contains(&needle))
            .map(|e| e.record_index)
            .collect()
    }

    /// Fuzzy query: returns indices whose haystack contains a fragment within
    /// `max_distance` Levenshtein edits of `q`. `max_distance` is clamped to
    /// `[0, 3]` to keep this cheap.
    #[wasm_bindgen(js_name = fuzzyQuery)]
    pub fn fuzzy_query(&self, q: &str, max_distance: u32) -> Vec<u32> {
        let needle = q.to_lowercase();
        if needle.is_empty() {
            return self.entries.iter().map(|e| e.record_index).collect();
        }
        let limit = max_distance.min(3) as usize;

        self.entries
            .iter()
            .filter(|e| {
                if e.haystack.contains(&needle) {
                    return true;
                }
                e.haystack
                    .split_whitespace()
                    .any(|word| levenshtein(word, &needle) <= limit)
            })
            .map(|e| e.record_index)
            .collect()
    }

    /// Number of indexed records.
    #[wasm_bindgen]
    pub fn len(&self) -> usize {
        self.entries.len()
    }
}

fn lookup<'a>(record: &'a Value, field: &str) -> Option<&'a Value> {
    field.split('.').try_fold(record, |acc, seg| acc.get(seg))
}

fn stringify(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Array(arr) => arr.iter().map(stringify).collect::<Vec<_>>().join(" "),
        Value::Object(obj) => obj.values().map(stringify).collect::<Vec<_>>().join(" "),
        Value::Null => String::new(),
    }
}

/// Iterative Levenshtein distance with a small per-row buffer. Cheap enough
/// for short tokens against short queries.
fn levenshtein(a: &str, b: &str) -> usize {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    if a_chars.is_empty() {
        return b_chars.len();
    }
    if b_chars.is_empty() {
        return a_chars.len();
    }

    let mut prev: Vec<usize> = (0..=b_chars.len()).collect();
    let mut curr: Vec<usize> = vec![0; b_chars.len() + 1];

    for (i, ca) in a_chars.iter().enumerate() {
        curr[0] = i + 1;
        for (j, cb) in b_chars.iter().enumerate() {
            let cost = if ca == cb { 0 } else { 1 };
            curr[j + 1] = (curr[j] + 1)
                .min(prev[j + 1] + 1)
                .min(prev[j] + cost);
        }
        std::mem::swap(&mut prev, &mut curr);
    }
    prev[b_chars.len()]
}
