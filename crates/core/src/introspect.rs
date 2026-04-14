//! # Introspection — machine-readable description of the SDK surface
//!
//! Returns a single JSON document that enumerates every nano-zyrkel
//! building block: nano types, fetcher kinds, condition kinds,
//! action kinds, notification channels and the environment variables
//! each one needs.
//!
//! This is the canonical source consumed by the browser-side builder
//! and by any user-facing tooling that wants to render a form for
//! "create a new nano-zyrkel" without hard-coding the catalog.
//!
//! The same data is also exposed through the
//! `nano-zyrkel introspect` CLI subcommand and shipped as a release
//! artifact (`schema.json`) on every `bin-v*` GitHub Release so it
//! can be fetched without running the binary at all.
//!
//! Stability: every entry's `id` is part of the **v1 contract**.
//! Adding new entries is non-breaking; renaming or removing one
//! requires a major version bump.

use serde::Serialize;
use serde_json::{json, Value};

/// One field of a config block.
#[derive(Clone, Serialize)]
pub struct FieldSchema {
    pub name: &'static str,
    pub kind: &'static str, // string | number | boolean | enum | url | regex | hash
    #[serde(skip_serializing_if = "Option::is_none")]
    pub help: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<Value>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub options: Vec<&'static str>,
    #[serde(default, skip_serializing_if = "<&bool as std::ops::Not>::not")]
    pub required: bool,
}

/// One catalog entry.
#[derive(Clone, Serialize)]
pub struct EntrySchema {
    pub id: &'static str,
    pub label: &'static str,
    pub help: &'static str,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub fields: Vec<FieldSchema>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub env: Vec<&'static str>,
}

/// Top-level schema document.
#[derive(Clone, Serialize)]
pub struct SdkSchema {
    pub version: &'static str,
    pub schema: &'static str,
    pub nano_types: Vec<EntrySchema>,
    pub fetchers: Vec<EntrySchema>,
    pub conditions: Vec<EntrySchema>,
    pub actions: Vec<EntrySchema>,
    pub notifiers: Vec<EntrySchema>,
}

/// Build the schema document for the current binary.
pub fn schema() -> SdkSchema {
    SdkSchema {
        version: env!("CARGO_PKG_VERSION"),
        schema: "nano-zyrkel-sdk/v1",
        nano_types: nano_types(),
        fetchers: fetchers(),
        conditions: conditions(),
        actions: actions(),
        notifiers: notifiers(),
    }
}

/// Convenience: render the schema as a pretty-printed JSON string.
pub fn schema_json() -> String {
    serde_json::to_string_pretty(&schema()).unwrap_or_default()
}

// ─── Catalogs ─────────────────────────────────────────────────────────

fn nano_types() -> Vec<EntrySchema> {
    vec![
        EntrySchema {
            id: "watcher",
            label: "Watcher",
            help: "Generic page / API watcher with a fetch → condition → notify pipeline.",
            fields: vec![],
            env: vec![],
        },
        EntrySchema {
            id: "tracker",
            label: "Tracker",
            help: "Numeric value tracker with a daily history.",
            fields: vec![],
            env: vec![],
        },
        EntrySchema {
            id: "deadline",
            label: "Deadline",
            help: "Countdown to a target date with reminder thresholds.",
            fields: vec![],
            env: vec![],
        },
        EntrySchema {
            id: "literature_alert",
            label: "Literature alert",
            help: "Email-driven literature search across PubMed, bioRxiv, medRxiv and CrossRef.",
            fields: vec![],
            env: vec![],
        },
        EntrySchema {
            id: "maildesk",
            label: "Maildesk",
            help: "IMAP-driven semi-autonomous email triage agent.",
            fields: vec![],
            env: vec![],
        },
        EntrySchema {
            id: "clinvar",
            label: "ClinVar tracker",
            help: "ClinVar variant fetcher with reclassification detection.",
            fields: vec![],
            env: vec![],
        },
        EntrySchema {
            id: "variant_classifier",
            label: "Variant classifier",
            help: "ACMG-style variant classification with a VUS watchlist.",
            fields: vec![],
            env: vec![],
        },
        EntrySchema {
            id: "pipeline",
            label: "Pipeline",
            help: "Distributed work queue: iterate a manifest, poll progress, auto-advance on threshold, notify on milestones.",
            fields: vec![],
            env: vec![],
        },
    ]
}

fn fetchers() -> Vec<EntrySchema> {
    vec![
        EntrySchema {
            id: "http",
            label: "HTTP request",
            help: "GET / POST / PUT against an HTTP(S) URL with optional headers and body.",
            fields: vec![
                field("url", "url", "Source URL", Some(json!("https://example.com")), true),
                enum_field("method", "HTTP verb", "GET", &["GET", "POST", "PUT"]),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "rss",
            label: "RSS / Atom feed",
            help: "Parses an RSS 2.0 or Atom 1.0 feed and returns its items.",
            fields: vec![field("url", "url", "Feed URL", None, true)],
            env: vec![],
        },
        EntrySchema {
            id: "sitemap",
            label: "Sitemap",
            help: "Expands a sitemap.xml (and optional sitemap indexes) into a list of URLs.",
            fields: vec![field("url", "url", "Sitemap URL", None, true)],
            env: vec![],
        },
        EntrySchema {
            id: "ical",
            label: "iCal feed",
            help: "Parses an iCal (.ics) feed and returns the upcoming events.",
            fields: vec![field("url", "url", "iCal feed URL", None, true)],
            env: vec![],
        },
        EntrySchema {
            id: "imap",
            label: "IMAP mailbox",
            help: "Polls an IMAP mailbox and returns new messages. Used by maildesk and literature_alert.",
            fields: vec![],
            env: vec!["IMAP_HOST", "IMAP_USER", "IMAP_PASSWORD"],
        },
    ]
}

fn conditions() -> Vec<EntrySchema> {
    vec![
        EntrySchema {
            id: "contains",
            label: "Contains",
            help: "Triggers when the fetched body contains the given substring.",
            fields: vec![
                field("value", "string", "Substring to search for", None, true),
                bool_field("negate", "Invert the match", false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "regex",
            label: "Regex",
            help: "Triggers when a regular expression matches.",
            fields: vec![
                field("pattern", "regex", "Regular expression", None, true),
                bool_field("negate", "Invert the match", false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "css_selector",
            label: "CSS selector",
            help: "Triggers when a CSS selector matches an element. Optional `extract` returns the inner text.",
            fields: vec![
                field("selector", "string", "CSS selector", None, true),
                field("extract", "string", "Optional sub-selector for the value", None, false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "json_path",
            label: "JSONPath",
            help: "Triggers when a JSONPath expression resolves to the expected value.",
            fields: vec![
                field("path", "string", "JSONPath expression", None, true),
                field("expected", "string", "Optional expected value", None, false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "rss_new_entry",
            label: "RSS new entry",
            help: "Triggers when a new RSS entry has appeared since the last run.",
            fields: vec![],
            env: vec![],
        },
        EntrySchema {
            id: "changed",
            label: "Content changed",
            help: "Triggers when the fetched body changes by more than the threshold ratio.",
            fields: vec![
                field("selector", "string", "Optional CSS selector", None, false),
                field("threshold", "number", "Minimum change ratio (0..1)", Some(json!(0.05)), false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "extract_value",
            label: "Extract value",
            help: "Extracts a numeric value via CSS selector and tracks it over time.",
            fields: vec![
                field("selector", "string", "CSS selector", None, true),
                field("unit", "string", "Optional unit label", None, false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "deadline_date",
            label: "Deadline date",
            help: "Counts down to a target date and notifies at configurable intervals.",
            fields: vec![
                field("date", "string", "ISO 8601 date", None, true),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "threshold",
            label: "Numeric threshold",
            help: "Compares an extracted numeric value against a threshold.",
            fields: vec![
                field(
                    "path",
                    "string",
                    "Source path: json:$.field, css:.selector or regex:^(\\d+)$",
                    None,
                    true,
                ),
                enum_field("op", "Operator", "gt", &["gt", "gte", "lt", "lte", "eq", "ne"]),
                field("value", "number", "Right-hand side", None, true),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "stale",
            label: "Staleness",
            help: "Triggers when the freshest record in the payload is older than max_age_hours.",
            fields: vec![
                field("max_age_hours", "number", "Maximum allowed age in hours", Some(json!(24)), true),
                field("date_field", "string", "Optional JSON field name to read", None, false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "json_schema",
            label: "JSON Schema validation",
            help: "Triggers when the fetched JSON payload does NOT validate against the supplied JSON Schema.",
            fields: vec![
                field("schema_path", "string", "Path to a JSON Schema file", None, false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "diff",
            label: "Snapshot diff",
            help: "Compares the current run with the previous one and triggers when the number of changed records exceeds min_changes.",
            fields: vec![
                field("key_field", "string", "Field used as a unique key", None, true),
                field("min_changes", "number", "Minimum changes to fire", Some(json!(1)), false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "llm",
            label: "LLM judgment",
            help: "Asks an LLM whether the fetched content satisfies a natural-language question.",
            fields: vec![
                field("question", "string", "Natural-language question", None, true),
                field("model", "string", "Model name", Some(json!("claude-haiku-4-5")), false),
            ],
            env: vec!["ANTHROPIC_API_KEY"],
        },
    ]
}

fn actions() -> Vec<EntrySchema> {
    vec![
        EntrySchema {
            id: "http_request",
            label: "HTTP request",
            help: "Send an HTTP POST/PUT — webhook callbacks, form submissions, API writes.",
            fields: vec![
                field("url", "url", "Target URL", None, true),
                enum_field("method", "HTTP verb", "POST", &["POST", "PUT", "PATCH", "DELETE"]),
                field("body_template", "string", "Body template", None, false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "github_issue",
            label: "Create GitHub issue",
            help: "Open an issue on a GitHub repository.",
            fields: vec![
                field("repo", "string", "owner/repo", None, true),
                field("title", "string", "Issue title", None, true),
                field("body_template", "string", "Issue body template", None, false),
            ],
            env: vec!["GH_TOKEN"],
        },
        EntrySchema {
            id: "github_comment",
            label: "Comment on GitHub issue / PR",
            help: "Post a comment on an existing issue or pull request.",
            fields: vec![
                field("repo", "string", "owner/repo", None, true),
                field("number", "number", "Issue or PR number", None, true),
                field("body_template", "string", "Comment body", None, true),
            ],
            env: vec!["GH_TOKEN"],
        },
        EntrySchema {
            id: "github_release",
            label: "Create GitHub release",
            help: "Publish a release for an existing tag.",
            fields: vec![
                field("repo", "string", "owner/repo", None, true),
                field("tag", "string", "Tag name", None, true),
                field("name", "string", "Release title", None, true),
                bool_field("draft", "Draft", false),
                bool_field("prerelease", "Prerelease", false),
            ],
            env: vec!["GH_TOKEN"],
        },
        EntrySchema {
            id: "trigger_hat",
            label: "Trigger another nano-zyrkel",
            help: "Dispatch a workflow_dispatch event in a downstream nano-zyrkel.",
            fields: vec![
                field("repo", "string", "Target repo", None, true),
                field("workflow", "string", "Workflow filename", None, true),
            ],
            env: vec!["GH_TOKEN"],
        },
        EntrySchema {
            id: "publish_api",
            label: "Publish API endpoint",
            help: "Write a JSON file under api/ that GitHub Pages serves as a static endpoint.",
            fields: vec![field("path", "string", "Path under api/", None, true)],
            env: vec![],
        },
        EntrySchema {
            id: "shell",
            label: "Shell command",
            help: "Execute a shell command on the runner. Use with caution and an allow-list.",
            fields: vec![
                field("command", "string", "Command to run", None, true),
                field("timeout_secs", "number", "Optional timeout", None, false),
            ],
            env: vec![],
        },
        EntrySchema {
            id: "chain",
            label: "Chain of actions",
            help: "Execute a sequence of actions in order. Aborts on the first failure.",
            fields: vec![],
            env: vec![],
        },
    ]
}

fn notifiers() -> Vec<EntrySchema> {
    vec![
        EntrySchema {
            id: "telegram",
            label: "Telegram",
            help: "Sends messages to a Telegram chat via the bot API.",
            fields: vec![],
            env: vec!["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
        },
        EntrySchema {
            id: "discord",
            label: "Discord",
            help: "Posts to a Discord channel via incoming webhook.",
            fields: vec![],
            env: vec!["DISCORD_WEBHOOK_URL"],
        },
        EntrySchema {
            id: "slack",
            label: "Slack",
            help: "Posts to a Slack channel via incoming webhook.",
            fields: vec![],
            env: vec!["SLACK_WEBHOOK_URL"],
        },
        EntrySchema {
            id: "email",
            label: "Email",
            help: "Sends a notification via SMTP.",
            fields: vec![],
            env: vec!["EMAIL_TO", "EMAIL_FROM", "SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD"],
        },
    ]
}

// ─── Field constructors ───────────────────────────────────────────────

fn field(
    name: &'static str,
    kind: &'static str,
    help: &'static str,
    default: Option<Value>,
    required: bool,
) -> FieldSchema {
    FieldSchema {
        name,
        kind,
        help: Some(help),
        default,
        options: Vec::new(),
        required,
    }
}

fn bool_field(name: &'static str, help: &'static str, default: bool) -> FieldSchema {
    FieldSchema {
        name,
        kind: "boolean",
        help: Some(help),
        default: Some(json!(default)),
        options: Vec::new(),
        required: false,
    }
}

fn enum_field(
    name: &'static str,
    help: &'static str,
    default: &'static str,
    options: &[&'static str],
) -> FieldSchema {
    FieldSchema {
        name,
        kind: "enum",
        help: Some(help),
        default: Some(json!(default)),
        options: options.to_vec(),
        required: true,
    }
}
