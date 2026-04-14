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

/// Push an event (finding, milestone, error, advancement) to Headless.
pub async fn push_event(
    conn: &HeadlessConnection,
    result: &ConditionResult,
    event_type: &str,
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
