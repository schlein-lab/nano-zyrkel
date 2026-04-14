//! # Headless Bridge — connect nano-zyrkels to a running Zyrkel Headless
//!
//! When a Zyrkel Headless instance is reachable (configured via `headless_url`
//! in config or `ZYRKEL_HEADLESS_URL` env var), the nano gains superpowers:
//!
//! - **Heartbeat**: Announce existence + version on each run.
//! - **Event push**: Send findings directly instead of waiting for Git polling.
//! - **Empowerment**: Access to Headless LLM, tool execution, and DB queries.
//!
//! All of this is **opt-in and graceful**. If Headless is unreachable or not
//! configured, the nano runs exactly as before — fully autonomous via GitHub.

use anyhow::Result;
use serde::{Deserialize, Serialize};

use crate::condition::ConditionResult;
use crate::config::HatConfig;

// ── Shared event types (must match zyrkel-domain/src/event.rs) ─────────

/// Event types that nano-zyrkels can push to Headless.
/// These map 1:1 to the `RoomEventType::Nano*` variants on the Headless side.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NanoEventType {
    /// Condition evaluated, no match.
    Check,
    /// Condition matched — a finding.
    Finding,
    /// Pipeline milestone crossed (10%, 25%, 50%, ...).
    Milestone,
    /// Pipeline advanced to next item.
    Advancement,
    /// Runtime error during this run.
    Error,
}

/// Capabilities granted by Headless when a nano is empowered.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct HeadlessCapabilities {
    pub empowered: bool,
    pub capabilities: Vec<String>,
    #[serde(default)]
    pub headless_version: String,
}

/// Connection state for this run.
#[derive(Debug, Clone)]
pub struct HeadlessConnection {
    pub base_url: String,
    pub nano_id: String,
    pub caps: HeadlessCapabilities,
}

/// Resolve the Headless URL from config or environment.
/// Returns None if not configured — nano runs standalone.
pub fn resolve_url(config: &HatConfig) -> Option<String> {
    // Env var takes precedence (allows per-run override)
    if let Ok(url) = std::env::var("ZYRKEL_HEADLESS_URL") {
        if !url.is_empty() {
            return Some(url.trim_end_matches('/').to_string());
        }
    }
    config
        .headless_url
        .as_ref()
        .filter(|u| !u.is_empty())
        .map(|u| u.trim_end_matches('/').to_string())
}

/// Send heartbeat to Headless. Returns capabilities if successful.
pub async fn send_heartbeat(config: &HatConfig, base_url: &str) -> Result<HeadlessCapabilities> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()?;

    let payload = serde_json::json!({
        "id": config.id,
        "repo": std::env::var("GITHUB_REPOSITORY").unwrap_or_default(),
        "hat_type": config.hat_type.to_string(),
        "runner_version": env!("CARGO_PKG_VERSION"),
        "run_number": std::env::var("GITHUB_RUN_NUMBER").unwrap_or_default(),
        "config_hash": "", // TODO: hash of config file
    });

    let resp = client
        .post(format!("{}/api/nanos/heartbeat", base_url))
        .json(&payload)
        .send()
        .await?;

    if !resp.status().is_success() {
        anyhow::bail!("heartbeat failed: HTTP {}", resp.status());
    }

    let caps: HeadlessCapabilities = resp.json().await?;
    Ok(caps)
}

/// Push an event to Headless.
pub async fn push_event(
    conn: &HeadlessConnection,
    result: &ConditionResult,
    event_type: NanoEventType,
) -> Result<()> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()?;

    let payload = serde_json::json!({
        "type": event_type,
        "matched": result.matched,
        "summary": result.summary,
        "extracted_value": result.extracted_value,
        "content_hash": result.content_hash,
    });

    let resp = client
        .post(format!(
            "{}/api/nanos/{}/event",
            conn.base_url, conn.nano_id
        ))
        .json(&payload)
        .send()
        .await?;

    if !resp.status().is_success() {
        tracing::warn!("event push failed: HTTP {}", resp.status());
    }

    Ok(())
}

// ── Empowerment: LLM + Query ───────────────────────────────────────────

/// Send a prompt to Headless LLM. Only works if connected and empowered.
pub async fn llm(conn: &HeadlessConnection, prompt: &str, max_tokens: usize) -> Result<String> {
    if !conn.caps.empowered || !conn.caps.capabilities.contains(&"llm".to_string()) {
        anyhow::bail!("not empowered for LLM");
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;

    let resp = client
        .post(format!("{}/api/nanos/{}/llm", conn.base_url, conn.nano_id))
        .json(&serde_json::json!({
            "prompt": prompt,
            "max_tokens": max_tokens,
        }))
        .send()
        .await?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        anyhow::bail!("LLM request failed: {}", body);
    }

    let body: serde_json::Value = resp.json().await?;
    Ok(body["response"].as_str().unwrap_or("").to_string())
}

/// Query Headless DB. Only SELECT on nano_* tables. Returns rows as JSON array.
pub async fn query(conn: &HeadlessConnection, sql: &str) -> Result<Vec<serde_json::Value>> {
    if !conn.caps.empowered || !conn.caps.capabilities.contains(&"db_query".to_string()) {
        anyhow::bail!("not empowered for DB queries");
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()?;

    let resp = client
        .post(format!(
            "{}/api/nanos/{}/query",
            conn.base_url, conn.nano_id
        ))
        .json(&serde_json::json!({ "sql": sql }))
        .send()
        .await?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        anyhow::bail!("query failed: {}", body);
    }

    let body: serde_json::Value = resp.json().await?;
    let rows = body["rows"]
        .as_array()
        .cloned()
        .unwrap_or_default();
    Ok(rows)
}

/// Try to connect to Headless. Returns None if not configured or unreachable.
/// This is called once at the start of each run.
pub async fn try_connect(config: &HatConfig) -> Option<HeadlessConnection> {
    let base_url = resolve_url(config)?;

    tracing::debug!("Attempting Headless connection: {}", base_url);

    match send_heartbeat(config, &base_url).await {
        Ok(caps) => {
            tracing::info!(
                headless = %base_url,
                empowered = %caps.empowered,
                capabilities = ?caps.capabilities,
                "Connected to Zyrkel Headless"
            );
            Some(HeadlessConnection {
                base_url,
                nano_id: config.id.clone(),
                caps,
            })
        }
        Err(e) => {
            tracing::debug!("Headless not available ({}), running standalone", e);
            None
        }
    }
}
