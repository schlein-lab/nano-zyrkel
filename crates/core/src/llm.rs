//! # LlmClient — generic LLM access for every nano-zyrkel
//!
//! A unified client that gives any nano-zyrkel access to language model
//! capabilities without coupling to a specific provider. Uses a three-tier
//! fallback chain:
//!
//! 1. **Headless** — if connected to a running Zyrkel, route through its
//!    Claude API key. Free for the nano, zero config.
//! 2. **Anthropic API** — if `ANTHROPIC_API_KEY` is set, call Claude directly.
//! 3. **Codex CLI** — legacy fallback, shells out to `codex exec`.
//!
//! The caller never needs to know which backend answered. Same API for a
//! simple one-shot prompt or a structured JSON extraction.
//!
//! ## Usage
//!
//! ```ignore
//! use nano_zyrkel_core::llm::LlmClient;
//!
//! let client = LlmClient::auto(&ctx); // picks best available backend
//! let answer = client.prompt("Summarize this email", 300).await?;
//! let plan = client.json::<MyPlan>("Analyze this...", 500).await?;
//! ```
//!
//! Every nano-zyrkel gets this for free — literature alerts summarize papers,
//! maildesk drafts replies, pipelines interpret anomalies, watchers explain
//! what changed and why.

use anyhow::{Context, Result};
use serde::de::DeserializeOwned;

use crate::headless::HeadlessConnection;

/// Which backend is currently active.
#[derive(Debug, Clone, PartialEq)]
pub enum LlmBackend {
    /// Routed through a connected Zyrkel Headless instance.
    Headless,
    /// Direct Anthropic API call with own key.
    Anthropic { api_key: String, model: String },
    /// Legacy: shell out to `codex exec`.
    Codex,
    /// No LLM available.
    None,
}

/// Generic LLM client. Create via [`LlmClient::auto`] or [`LlmClient::new`].
pub struct LlmClient {
    backend: LlmBackend,
    headless: Option<HeadlessConnection>,
}

impl LlmClient {
    /// Auto-detect the best available backend.
    ///
    /// Priority: Headless (if connected) → Anthropic (if key set) → Codex (if installed) → None.
    pub fn auto(headless: Option<&HeadlessConnection>) -> Self {
        // 1. Headless
        if let Some(conn) = headless {
            if conn.caps.empowered && conn.caps.capabilities.contains(&"llm".to_string()) {
                return Self {
                    backend: LlmBackend::Headless,
                    headless: Some(conn.clone()),
                };
            }
        }

        // 2. Anthropic API
        if let Ok(key) = std::env::var("ANTHROPIC_API_KEY") {
            if !key.is_empty() {
                let model = std::env::var("ANTHROPIC_MODEL")
                    .unwrap_or_else(|_| "claude-haiku-4-5-20251001".to_string());
                return Self {
                    backend: LlmBackend::Anthropic { api_key: key, model },
                    headless: None,
                };
            }
        }

        // 3. Codex CLI
        if which_codex() {
            return Self {
                backend: LlmBackend::Codex,
                headless: None,
            };
        }

        // 4. Nothing available
        Self {
            backend: LlmBackend::None,
            headless: None,
        }
    }

    /// Create a client with a specific backend (for testing or override).
    pub fn new(backend: LlmBackend) -> Self {
        Self { backend, headless: None }
    }

    /// Which backend is active?
    pub fn backend(&self) -> &LlmBackend {
        &self.backend
    }

    /// Is any LLM available?
    pub fn available(&self) -> bool {
        self.backend != LlmBackend::None
    }

    /// Send a prompt and get a text response.
    pub async fn prompt(&self, prompt: &str, max_tokens: usize) -> Result<String> {
        match &self.backend {
            LlmBackend::Headless => {
                let conn = self.headless.as_ref()
                    .ok_or_else(|| anyhow::anyhow!("headless connection lost"))?;
                crate::headless::llm(conn, prompt, max_tokens).await
            }
            LlmBackend::Anthropic { api_key, model } => {
                anthropic_call(api_key, model, prompt, max_tokens).await
            }
            LlmBackend::Codex => {
                codex_call(prompt).await
            }
            LlmBackend::None => {
                anyhow::bail!("no LLM backend available — set ANTHROPIC_API_KEY or connect to Headless")
            }
        }
    }

    /// Send a prompt and parse the response as JSON into a typed struct.
    ///
    /// Automatically appends "respond with ONLY JSON" instruction.
    /// Retries once with a stricter prompt if parsing fails.
    pub async fn json<T: DeserializeOwned>(&self, prompt: &str, max_tokens: usize) -> Result<T> {
        let full_prompt = format!(
            "{}\n\nRespond with ONLY a valid JSON object. No explanation, no markdown, no commentary.",
            prompt
        );

        let raw = self.prompt(&full_prompt, max_tokens).await?;

        // Try direct parse
        if let Ok(parsed) = serde_json::from_str::<T>(&raw) {
            return Ok(parsed);
        }

        // Try extracting JSON from mixed output (LLMs love wrapping in ```)
        if let Some(json_str) = extract_json(&raw) {
            if let Ok(parsed) = serde_json::from_str::<T>(json_str) {
                return Ok(parsed);
            }
        }

        // Retry with stricter prompt
        tracing::debug!("LLM JSON parse failed, retrying with stricter prompt");
        let strict = format!(
            "{}\n\nCRITICAL: Output ONLY the raw JSON object. Start with {{ and end with }}. \
             No text before or after. No ```json blocks.",
            prompt
        );
        let raw2 = self.prompt(&strict, max_tokens).await?;

        serde_json::from_str::<T>(&raw2)
            .or_else(|_| {
                extract_json(&raw2)
                    .and_then(|s| serde_json::from_str::<T>(s).ok())
                    .ok_or_else(|| anyhow::anyhow!("LLM returned unparseable JSON: {}", &raw2[..raw2.len().min(200)]))
            })
    }
}

// ── Anthropic API ──────────────────────────────────────────────────────

async fn anthropic_call(api_key: &str, model: &str, prompt: &str, max_tokens: usize) -> Result<String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;

    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&serde_json::json!({
            "model": model,
            "max_tokens": max_tokens,
            "messages": [{ "role": "user", "content": prompt }]
        }))
        .send()
        .await
        .context("Anthropic API request")?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        anyhow::bail!("Anthropic API error: {} — {}", status, &body[..body.len().min(200)]);
    }

    let body: serde_json::Value = resp.json().await?;
    let text = body["content"][0]["text"]
        .as_str()
        .unwrap_or("")
        .to_string();

    Ok(text)
}

// ── Codex CLI (legacy) ─────────────────────────────────────────────────

async fn codex_call(prompt: &str) -> Result<String> {
    let output_file = format!("/tmp/nano-llm-{}.txt", std::process::id());

    let status = tokio::process::Command::new("codex")
        .args(["exec", "--skip-git-repo-check", "--ephemeral", "-o", &output_file])
        .arg(prompt)
        .output()
        .await;

    let result = match status {
        Ok(out) if out.status.success() => {
            tokio::fs::read_to_string(&output_file).await.unwrap_or_default()
        }
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            anyhow::bail!("codex failed: {}", stderr);
        }
        Err(e) => anyhow::bail!("codex not found: {}", e),
    };

    let _ = tokio::fs::remove_file(&output_file).await;
    Ok(result)
}

fn which_codex() -> bool {
    std::process::Command::new("which")
        .arg("codex")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

// ── Helpers ────────────────────────────────────────────────────────────

/// Try to extract a JSON object from mixed LLM output.
fn extract_json(raw: &str) -> Option<&str> {
    // Strip ```json ... ``` blocks
    let trimmed = raw.trim();
    let inner = if trimmed.starts_with("```") {
        let start = trimmed.find('\n').map(|i| i + 1).unwrap_or(3);
        let end = trimmed.rfind("```").unwrap_or(trimmed.len());
        &trimmed[start..end]
    } else {
        trimmed
    };

    // Find first { and last }
    let start = inner.find('{')?;
    let end = inner.rfind('}')?;
    if end > start {
        Some(&inner[start..=end])
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extract_json_from_markdown() {
        let raw = "Here's the JSON:\n```json\n{\"needs_reply\": true}\n```\nDone.";
        assert_eq!(extract_json(raw), Some("{\"needs_reply\": true}"));
    }

    #[test]
    fn extract_json_bare() {
        let raw = "{\"a\": 1, \"b\": 2}";
        assert_eq!(extract_json(raw), Some("{\"a\": 1, \"b\": 2}"));
    }

    #[test]
    fn extract_json_with_preamble() {
        let raw = "Sure! Here you go:\n{\"x\": true}\nHope that helps!";
        assert_eq!(extract_json(raw), Some("{\"x\": true}"));
    }
}
