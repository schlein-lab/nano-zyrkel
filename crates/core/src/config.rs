use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Complete HAT configuration — loaded from a JSON file.
/// This is all a HAT needs to know about its mission.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HatConfig {
    /// Unique identifier (e.g. "schwimmkurs", "airpods-price")
    pub id: String,

    /// Human-readable description
    pub description: String,

    /// HAT type determines behavior
    #[serde(rename = "type")]
    pub hat_type: HatType,

    /// Where to fetch data from (not used by LiteratureAlert)
    #[serde(default)]
    pub source: Option<Source>,

    /// When is a "match" found? (not used by LiteratureAlert)
    #[serde(default)]
    pub condition: Option<Condition>,

    /// Literature alert configuration (only for LiteratureAlert type)
    #[serde(default)]
    pub literature: Option<LiteratureConfig>,

    /// How to notify the user
    #[serde(default)]
    pub notify: Notify,

    /// What to DO when condition matches (beyond notifying)
    #[serde(default)]
    pub action: Option<Action>,

    /// Approval required before action executes
    #[serde(default)]
    pub approval: ApprovalLevel,

    /// Where to write results
    #[serde(default = "default_output_dir")]
    pub output_dir: String,

    /// Auto-terminate after this date (ISO 8601)
    #[serde(default)]
    pub ttl: Option<String>,

    /// When was this HAT created?
    #[serde(default)]
    pub created: Option<String>,

    /// Language for HAT messages (de, en)
    #[serde(default = "default_lang")]
    pub lang: String,

    /// HAT state — updated by hat-runner between runs
    #[serde(default)]
    pub state: HatState,

    /// Maildesk-specific config (only used when type = maildesk)
    #[serde(default)]
    pub maildesk: Option<MaildeskConfig>,

    /// Variant classifier config (only used when type = variant_classifier)
    #[serde(default)]
    pub variant_classifier: Option<VariantClassifierConfig>,

    /// ClinVar-specific config (only used when type = clinvar)
    #[serde(default)]
    pub clinvar: Option<ClinVarConfig>,

    /// Pipeline-specific config (only used when type = pipeline)
    #[serde(default)]
    pub pipeline: Option<PipelineConfig>,

    /// Optional Zyrkel Headless URL for empowerment.
    /// When set, the nano sends a heartbeat at startup and pushes events
    /// directly instead of relying on Git-polling. A connected nano can
    /// use Headless LLM, tool execution, and DB query capabilities.
    /// Can also be set via ZYRKEL_HEADLESS_URL env var.
    #[serde(default)]
    pub headless_url: Option<String>,
}

/// Configuration for the Variant Classifier nano type.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariantClassifierConfig {
    /// IMAP host for inbox polling
    #[serde(default = "default_imap_host")]
    pub imap_host: String,
    /// SMTP host for sending replies
    #[serde(default = "default_smtp_host")]
    pub smtp_host: String,
    /// Reply display name
    #[serde(default = "default_vc_reply_name")]
    pub reply_name: String,
    /// Keywords in email subject that trigger classification
    #[serde(default = "default_vc_triggers")]
    pub trigger_keywords: Vec<String>,
    /// gnomAD AF threshold for PM2/BS1 (default: 0.01)
    #[serde(default = "default_af_threshold")]
    pub gnomad_af_threshold: f64,
    /// Path to VUS watchlist JSON
    #[serde(default = "default_vc_watchlist")]
    pub watchlist_path: String,
    /// Allowed sender addresses (empty = allow all)
    #[serde(default)]
    pub allowed_addresses: Vec<String>,
    /// Allowed sender domains (empty = allow all)
    #[serde(default)]
    pub allowed_domains: Vec<String>,
    /// Genome build (default: hg38)
    #[serde(default = "default_vc_build")]
    pub genome_build: String,
    /// Response language
    #[serde(default = "default_lang")]
    pub response_language: String,
}

fn default_vc_reply_name() -> String { "ACMG Classifier".into() }
fn default_vc_triggers() -> Vec<String> {
    vec!["acmg".into(), "classify".into(), "variante".into(), "variant".into()]
}
fn default_af_threshold() -> f64 { 0.01 }
fn default_vc_watchlist() -> String { "data/vus_watchlist.json".into() }
fn default_vc_build() -> String { "hg38".into() }

/// Configuration for the Maildesk nano type.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaildeskConfig {
    /// IMAP server (default: imap.gmail.com)
    #[serde(default = "default_imap_host")]
    pub imap_host: String,
    /// SMTP server (default: smtp.gmail.com)
    #[serde(default = "default_smtp_host")]
    pub smtp_host: String,
    /// Reply display name (e.g. "Schlein Lab")
    #[serde(default)]
    pub reply_name: String,
    /// Signature name
    #[serde(default)]
    pub sig_name: String,
    /// Signature role
    #[serde(default)]
    pub sig_role: String,
    /// Max emails to process per run
    #[serde(default = "default_max_emails")]
    pub max_emails: u32,
    /// Max characters to send to Codex
    #[serde(default = "default_max_codex_chars")]
    pub max_codex_chars: usize,
    /// Max preview characters in Telegram message
    #[serde(default = "default_max_preview")]
    pub max_preview_chars: usize,
    /// HTML email template path (relative to config)
    #[serde(default)]
    pub template_path: Option<String>,
}

fn default_imap_host() -> String { "imap.gmail.com".into() }
fn default_smtp_host() -> String { "smtp.gmail.com".into() }
fn default_max_emails() -> u32 { 5 }
fn default_max_codex_chars() -> usize { 12000 }
fn default_max_preview() -> usize { 2400 }

/// Configuration for the ClinVar tracker nano type.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClinVarConfig {
    /// Max variants to fetch per run
    #[serde(default = "default_cv_max_variants")]
    pub max_variants_per_run: u32,
    /// Delay between NCBI API requests (ms) — rate limit compliance
    #[serde(default = "default_cv_delay")]
    pub request_delay_ms: u64,
    /// Send Telegram on reclassification events
    #[serde(default = "default_true")]
    pub notify_reclassifications: bool,
    /// Send Telegram on new pathogenic variants
    #[serde(default = "default_true")]
    pub notify_new_pathogenic: bool,
    /// Generate HTML widget report
    #[serde(default = "default_true")]
    pub generate_html: bool,
    /// Track only specific genes (empty = all)
    #[serde(default)]
    pub track_genes: Vec<String>,
    /// NCBI API key (optional, increases rate limit from 3 to 10 req/sec)
    #[serde(default)]
    pub ncbi_api_key: Option<String>,
}

fn default_cv_max_variants() -> u32 { 100 }
fn default_cv_delay() -> u64 { 350 }
fn default_true() -> bool { true }

/// Configuration for the Pipeline nano type.
///
/// A pipeline iterates through a manifest of work items (tiles, genes, pages,
/// etc.), polls an external progress API, and auto-advances to the next item
/// when a threshold is reached. The active item is written to a queue file
/// in staging/ so downstream consumers (browsers, workers, other nano-zyrkels)
/// can read it.
///
/// ## Generic concepts
///
/// - **Manifest**: A JSON URL that lists all items to process (fetched once, cached).
/// - **Progress**: A JSON URL that reports how much work is done (polled each run).
/// - **Threshold**: Fraction (0.0–1.0) of total work done before advancing.
/// - **Queue file**: `staging/{id}/active.json` — the currently active item.
///
/// ## Example config (CrowdGenome)
///
/// ```json
/// {
///   "type": "pipeline",
///   "pipeline": {
///     "manifest_url": "https://cdn.example.com/ref/manifest.json",
///     "manifest_items_path": "$.chromosomes.*.tile_list[*]",
///     "progress_url": "https://api.example.com/stats",
///     "progress_done_path": "$.unique_chunks",
///     "progress_total": 256271,
///     "advance_threshold": 0.8,
///     "item_key_template": "{chr}:{start}-{end}",
///     "item_url_template": "https://cdn.example.com/{file}",
///     "milestones": [10, 25, 50, 75, 90, 100]
///   }
/// }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineConfig {
    /// URL to the manifest JSON (list of all work items).
    pub manifest_url: String,

    /// JSONPath into the manifest to extract the flat list of items.
    /// Each item is a JSON object with fields used by the templates below.
    #[serde(default = "default_manifest_items_path")]
    pub manifest_items_path: String,

    /// URL to poll for progress (e.g. an API stats endpoint).
    pub progress_url: String,

    /// JSONPath to extract the "done" count from the progress response.
    #[serde(default = "default_progress_done_path")]
    pub progress_done_path: String,

    /// Total number of work units. If 0, extracted from manifest at runtime.
    #[serde(default)]
    pub progress_total: u64,

    /// Advance to next item when done/total >= this value (0.0–1.0).
    #[serde(default = "default_threshold")]
    pub advance_threshold: f64,

    /// Template for the item key, using `{field}` placeholders resolved
    /// against each manifest item. E.g. `"{chr}:{start}-{end}"`.
    #[serde(default)]
    pub item_key_template: Option<String>,

    /// Template for the item URL. E.g. `"https://cdn.example.com/{file}"`.
    #[serde(default)]
    pub item_url_template: Option<String>,

    /// Percentage milestones at which to send a notification.
    #[serde(default = "default_milestones")]
    pub milestones: Vec<u32>,
}

fn default_manifest_items_path() -> String { "$[*]".to_string() }
fn default_progress_done_path() -> String { "$.done".to_string() }
fn default_threshold() -> f64 { 0.8 }
fn default_milestones() -> Vec<u32> { vec![10, 25, 50, 75, 90, 100] }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HatType {
    /// Check URL/API for a specific condition
    Watcher,
    /// Track a value over time (build time series)
    Tracker,
    /// Countdown to a deadline with staged reminders
    Deadline,
    /// Collect data from multiple sources
    Crawler,
    /// Detect anomalies / changes from baseline
    Guardian,
    /// Semi-autonomous email agent with Telegram approval
    Maildesk,
    /// Email-driven literature research alert (PubMed, bioRxiv, medRxiv, CrossRef)
    LiteratureAlert,
    /// ACMG variant classification, VUS watchlist, prediction aggregation
    VariantClassifier,
    /// ClinVar VUS reclassification + submission tracker
    ClinVar,
    /// Distributed work pipeline: iterate through a manifest of items,
    /// track external progress via API, auto-advance when threshold met.
    Pipeline,
}

impl std::fmt::Display for HatType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Watcher => write!(f, "watcher"),
            Self::Tracker => write!(f, "tracker"),
            Self::Deadline => write!(f, "deadline"),
            Self::Crawler => write!(f, "crawler"),
            Self::Guardian => write!(f, "guardian"),
            Self::Maildesk => write!(f, "maildesk"),
            Self::LiteratureAlert => write!(f, "literature_alert"),
            Self::VariantClassifier => write!(f, "variant_classifier"),
            Self::ClinVar => write!(f, "clinvar"),
            Self::Pipeline => write!(f, "pipeline"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Source {
    /// URL to fetch
    pub url: String,

    /// HTTP method (default: GET)
    #[serde(default = "default_method")]
    pub method: String,

    /// Optional HTTP headers
    #[serde(default)]
    pub headers: std::collections::HashMap<String, String>,

    /// Optional request body (for POST)
    #[serde(default)]
    pub body: Option<String>,

    /// Use headless Chrome for JS-rendered pages
    #[serde(default)]
    pub needs_browser: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Condition {
    /// Simple text search
    Contains { value: String, #[serde(default)] negate: bool },

    /// Regular expression match
    Regex { pattern: String, #[serde(default)] negate: bool },

    /// CSS selector — matches if element exists
    CssSelector { selector: String, #[serde(default)] extract: Option<String> },

    /// JSON path — for API responses
    JsonPath { path: String, #[serde(default)] expected: Option<serde_json::Value> },

    /// RSS/Atom — new entry since last check
    RssNewEntry,

    /// LLM-based natural language condition (Stufe 2)
    Llm {
        question: String,
        #[serde(default = "default_model")]
        model: String,
    },

    /// Value changed from last run (Guardian)
    Changed {
        #[serde(default)]
        selector: Option<String>,
        /// Minimum change threshold (0.0-1.0) to trigger
        #[serde(default)]
        threshold: Option<f64>,
    },

    /// Extract a numeric value and track over time (Tracker)
    ExtractValue {
        selector: String,
        #[serde(default)]
        unit: Option<String>,
    },

    /// Deadline countdown
    DeadlineDate {
        date: String,
        #[serde(default = "default_reminders")]
        remind_at_days: Vec<u32>,
    },

    /// Numeric threshold against a value extracted via JSONPath or
    /// CSS selector. Triggers when the comparison evaluates to true.
    Threshold {
        /// Where to read the value from. Supported prefixes:
        /// `json:` for JSONPath, `css:` for a CSS selector, `regex:` for
        /// a capture-group regex.
        path: String,
        /// Comparison operator: `gt`, `gte`, `lt`, `lte`, `eq`, `ne`.
        op: String,
        /// Right-hand side of the comparison.
        value: f64,
    },

    /// Triggers when the upstream feed has not changed for too long.
    /// `max_age_hours` is compared against the freshest record in the
    /// fetched payload (using `date_field` if given, otherwise the
    /// HTTP `Last-Modified` header).
    Stale {
        max_age_hours: u32,
        #[serde(default)]
        date_field: Option<String>,
    },

    /// Validates the fetched JSON payload against a JSON Schema and
    /// triggers when the document is INVALID. Useful for monitoring
    /// API contracts and catching upstream breakage early.
    JsonSchema {
        /// Inline schema, OR…
        #[serde(default)]
        schema: Option<serde_json::Value>,
        /// …a path to a schema file relative to the config directory.
        #[serde(default)]
        schema_path: Option<String>,
    },

    /// Triggers when the structural diff between the previous run and
    /// the current run exceeds `min_changes` records. State is read
    /// from `staging/{nano_id}/state.json`.
    Diff {
        /// Field that uniquely identifies a record (e.g. `id`).
        key_field: String,
        /// Minimum number of added + removed + modified records to fire.
        #[serde(default)]
        min_changes: u32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Notify {
    /// Send via Telegram (reads `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`).
    #[serde(default)]
    pub telegram: bool,

    /// Send via email (reads `EMAIL_TO`, `EMAIL_FROM`, `SMTP_*`).
    #[serde(default)]
    pub email: bool,

    /// Send via Discord webhook (reads `DISCORD_WEBHOOK_URL`).
    #[serde(default)]
    pub discord: bool,

    /// Send via Slack incoming webhook (reads `SLACK_WEBHOOK_URL`).
    #[serde(default)]
    pub slack: bool,

    /// Custom notification message template.
    /// Placeholders: `{id}`, `{description}`, `{summary}`, `{url}`, `{value}`.
    #[serde(default)]
    pub message: Option<String>,

    /// Include extracted data in the notification body.
    #[serde(default)]
    pub include_extracted: bool,
}

/// What the HAT should DO when its condition matches.
/// This is what makes HATs agents instead of just monitors.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Action {
    /// Submit an HTTP POST/PUT request (form submission, API call)
    HttpRequest {
        url: String,
        method: String,
        #[serde(default)]
        headers: std::collections::HashMap<String, String>,
        #[serde(default)]
        body: Option<String>,
        /// Body template with placeholders: {summary}, {value}, {url}, {id}
        #[serde(default)]
        body_template: Option<String>,
        #[serde(default)]
        content_type: Option<String>,
    },

    /// Create a GitHub Issue
    GithubIssue {
        repo: String,
        title: String,
        #[serde(default)]
        body_template: Option<String>,
        #[serde(default)]
        labels: Vec<String>,
    },

    /// Create a GitHub Pull Request (e.g. dependency update)
    GithubPr {
        repo: String,
        branch: String,
        title: String,
        #[serde(default)]
        body_template: Option<String>,
        /// Files to create/modify: { "path": "content" }
        #[serde(default)]
        files: std::collections::HashMap<String, String>,
    },

    /// Post a comment on an existing GitHub issue or pull request.
    GithubComment {
        /// Repository in `owner/name` form.
        repo: String,
        /// Issue or PR number.
        number: u64,
        /// Comment body, with the standard placeholder set.
        body_template: String,
    },

    /// Create a GitHub release for an existing tag.
    GithubRelease {
        /// Repository in `owner/name` form.
        repo: String,
        /// Tag name (must already exist on the default branch).
        tag: String,
        /// Release title.
        name: String,
        /// Release notes body, with the standard placeholder set.
        #[serde(default)]
        body_template: Option<String>,
        /// Mark as draft instead of publishing immediately.
        #[serde(default)]
        draft: bool,
        /// Mark as prerelease.
        #[serde(default)]
        prerelease: bool,
    },

    /// Trigger another HAT (chain workflows)
    TriggerHat {
        /// Repository where the target HAT lives
        repo: String,
        /// Workflow filename to trigger
        workflow: String,
        /// Inputs to pass
        #[serde(default)]
        inputs: std::collections::HashMap<String, String>,
    },

    /// Write data to the Brain-Repo API endpoint (GitHub Pages)
    PublishApi {
        /// Path in the api/ directory (e.g. "prices/latest.json")
        path: String,
    },

    /// Run a shell command on the Actions runner
    Shell {
        command: String,
        #[serde(default)]
        timeout_secs: Option<u64>,
    },

    /// Send a message to the Cloudflare Message Bus
    CloudBus {
        topic: String,
        #[serde(default)]
        payload_template: Option<String>,
    },

    /// Execute multiple actions in sequence
    Chain {
        actions: Vec<Action>,
    },
}

/// What approval level is required before the action executes?
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalLevel {
    /// Just do it, no questions asked
    None,
    /// Log the action but don't ask (audit trail)
    #[default]
    LogOnly,
    /// Ask via Telegram before executing
    AskFirst,
    /// Only act within pre-approved budget/scope
    WithinBudget {
        max_cost: Option<f64>,
        currency: Option<String>,
    },
}

/// Persistent state between HAT runs — stored in the config or staging dir.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HatState {
    /// Last check timestamp (ISO 8601)
    #[serde(default)]
    pub last_check: Option<String>,

    /// Last seen content hash (SHA-256, for change detection)
    #[serde(default)]
    pub last_hash: Option<String>,

    /// Last extracted value (for trackers)
    #[serde(default)]
    pub last_value: Option<serde_json::Value>,

    /// Last RSS entry ID seen
    #[serde(default)]
    pub last_rss_id: Option<String>,

    /// Total runs executed
    #[serde(default)]
    pub total_runs: u64,

    /// Total matches found
    #[serde(default)]
    pub total_matches: u64,

    /// Consecutive errors
    #[serde(default)]
    pub consecutive_errors: u32,
}

impl HatConfig {
    pub fn load(path: &Path) -> Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let config: HatConfig = serde_json::from_str(&content)?;
        Ok(config)
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }
}

/// Literature alert specific configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiteratureConfig {
    /// IMAP/SMTP mailbox settings
    pub mailbox: LiteratureMailbox,

    /// Which sources to search
    #[serde(default = "default_lit_sources")]
    pub sources: Vec<String>,

    /// How many days back to search
    #[serde(default = "default_days_back")]
    pub days_back: u32,

    /// Max results per source
    #[serde(default = "default_max_per_source")]
    pub max_results_per_source: u32,

    /// Bouncer / access control
    #[serde(default)]
    pub bouncer: LiteratureBouncer,

    /// Enable automatic conference discovery via LLM (requires Codex)
    /// When true, the bot autonomously finds relevant conferences for each topic.
    #[serde(default = "default_true_bool")]
    pub conference_discovery: bool,

    /// Max conference sources to discover per topic per crawl
    #[serde(default = "default_max_conferences")]
    pub max_conferences_per_topic: u32,
}

fn default_true_bool() -> bool { true }
fn default_max_conferences() -> u32 { 5 }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiteratureMailbox {
    pub address: String,
    #[serde(default = "default_reply_name")]
    pub reply_name: String,
    #[serde(default = "default_lit_imap_host")]
    pub imap_host: String,
    #[serde(default = "default_lit_smtp_host")]
    pub smtp_host: String,
}

fn default_lit_imap_host() -> String { "imap.gmail.com".into() }
fn default_lit_smtp_host() -> String { "smtp.gmail.com".into() }

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LiteratureBouncer {
    #[serde(default)]
    pub allowlist_file: String,
    #[serde(default)]
    pub topics_file: String,
    #[serde(default = "default_subject_prefix")]
    pub register_subject_prefix: String,
}

fn default_lit_sources() -> Vec<String> {
    vec!["pubmed".into(), "biorxiv".into(), "medrxiv".into(), "crossref".into()]
}
fn default_days_back() -> u32 { 1 }
fn default_max_per_source() -> u32 { 20 }
fn default_reply_name() -> String { "Literature Alert".into() }
fn default_subject_prefix() -> String { "Literatur Recherche".into() }

fn default_method() -> String { "GET".to_string() }
fn default_model() -> String { "haiku".to_string() }
fn default_output_dir() -> String { "staging".to_string() }
fn default_lang() -> String { "de".to_string() }
fn default_reminders() -> Vec<u32> { vec![30, 14, 7, 3, 1] }
