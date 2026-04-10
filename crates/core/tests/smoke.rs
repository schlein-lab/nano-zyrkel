//! Smoke tests for the public surface of `nano-zyrkel-core`.
//!
//! These deliberately stay at the level of "the API loads, parses and round-
//! trips data". They run on every CI build, take milliseconds, and need no
//! network or filesystem state. Heavier integration coverage lives in the
//! user-repo regression suites.

use nano_zyrkel_core::{introspect, HatConfig};
use serde_json::Value;

#[test]
fn introspect_schema_is_well_formed() {
    let schema = introspect::schema();
    assert_eq!(schema.schema, "nano-zyrkel-sdk/v1");
    assert!(!schema.version.is_empty());
    assert!(!schema.nano_types.is_empty(), "nano_types must not be empty");
    assert!(!schema.fetchers.is_empty(), "fetchers must not be empty");
    assert!(!schema.conditions.is_empty(), "conditions must not be empty");
    assert!(!schema.actions.is_empty(), "actions must not be empty");
    assert!(!schema.notifiers.is_empty(), "notifiers must not be empty");

    // Every entry id is non-empty and unique within its category.
    for category in [
        &schema.nano_types,
        &schema.fetchers,
        &schema.conditions,
        &schema.actions,
        &schema.notifiers,
    ] {
        let mut seen = std::collections::HashSet::new();
        for entry in category.iter() {
            assert!(!entry.id.is_empty(), "entry id must not be empty");
            assert!(!entry.label.is_empty(), "entry label must not be empty");
            assert!(seen.insert(entry.id), "duplicate id {}", entry.id);
        }
    }
}

#[test]
fn introspect_schema_json_is_parseable() {
    let json = introspect::schema_json();
    let v: Value = serde_json::from_str(&json).expect("schema JSON must parse");
    assert!(v.get("schema").is_some());
    assert!(v.get("nano_types").and_then(Value::as_array).is_some());
    assert!(v.get("fetchers").and_then(Value::as_array).is_some());
}

#[test]
fn config_round_trip_minimal() {
    let raw = r#"{
        "schema": "1",
        "id": "test",
        "type": "tracker",
        "lang": "en",
        "description": "smoke test",
        "source": {
            "url": "https://example.com",
            "method": "GET"
        },
        "condition": {
            "type": "json_path",
            "path": "$.items[*]",
            "match": "any"
        },
        "notify": {
            "telegram": false,
            "email": false
        },
        "output_dir": "staging"
    }"#;

    let cfg: HatConfig = serde_json::from_str(raw).expect("minimal config must parse");
    assert_eq!(cfg.id, "test");
    assert_eq!(cfg.description, "smoke test");
    assert_eq!(cfg.output_dir, "staging");

    // Round trip back to JSON without losing data.
    let serialised = serde_json::to_string(&cfg).expect("serialise");
    let _back: HatConfig = serde_json::from_str(&serialised).expect("re-parse");
}

#[test]
fn config_load_rejects_garbage() {
    let bad = r#"{ "id": "no-type" }"#;
    assert!(serde_json::from_str::<HatConfig>(bad).is_err());
}
