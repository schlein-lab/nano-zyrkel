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
    /// Claude CLI subprocess (`claude --print`). Uses the user's existing
    /// Claude login — no API key needed, works on any machine with Claude
    /// Code installed.
    ClaudeCli,
    /// Async dead-drop via nano-zyrkel-incoming: post a GitHub Issue with
    /// the prompt, Zyrkel Headless picks it up locally, processes with
    /// Claude, and posts the response as a comment. The next run polls
    /// for the answer. No tunnel, no exposed ports.
    Incoming { gh_token: String, repo: String },
    /// Legacy: shell out to `codex exec`.
    Codex,
    /// No LLM available.
    None,
}

/// Generic LLM client. Create via [`LlmClient::auto`] or [`LlmClient::new`].
pub struct LlmClient {
    backend: LlmBackend,
    headless: Option<HeadlessConnection>,
    /// Nano ID for incoming request tagging.
    nano_id: String,
}

impl LlmClient {
    /// Auto-detect the best available backend.
    ///
    /// Priority: Headless → Anthropic API → Claude CLI → Codex CLI → None.
    pub fn auto(headless: Option<&HeadlessConnection>) -> Self {
        // 1. Headless (if connected and empowered)
        if let Some(conn) = headless {
            if conn.caps.empowered && conn.caps.capabilities.contains(&"llm".to_string()) {
                return Self {
                    backend: LlmBackend::Headless,
                    headless: Some(conn.clone()),
                    nano_id: String::new(),
                };
            }
        }

        // 2. Anthropic API (if key set)
        if let Ok(key) = std::env::var("ANTHROPIC_API_KEY") {
            if !key.is_empty() {
                let model = std::env::var("ANTHROPIC_MODEL")
                    .unwrap_or_else(|_| "claude-haiku-4-5-20251001".to_string());
                return Self {
                    backend: LlmBackend::Anthropic { api_key: key, model },
                    headless: None,
                    nano_id: String::new(),
                };
            }
        }

        // 3. Claude CLI (if installed — uses existing login, no API key needed)
        if which_bin("claude") {
            return Self {
                backend: LlmBackend::ClaudeCli,
                headless: None,
                nano_id: String::new(),
            };
        }

        // 4. Incoming dead-drop (if GH_TOKEN set + incoming repo configured)
        if let Ok(gh_token) = std::env::var("GH_TOKEN") {
            let repo = std::env::var("NANO_INCOMING_REPO")
                .unwrap_or_else(|_| "schlein-lab/nano-zyrkel-incoming".to_string());
            if !gh_token.is_empty() {
                return Self {
                    backend: LlmBackend::Incoming { gh_token, repo },
                    headless: None,
                    nano_id: String::new(),
                };
            }
        }

        // 5. Codex CLI (legacy)
        if which_bin("codex") {
            return Self {
                backend: LlmBackend::Codex,
                headless: None,
                nano_id: String::new(),
            };
        }

        // 6. Nothing available
        Self {
            backend: LlmBackend::None,
            headless: None,
            nano_id: String::new(),
        }
    }

    /// Create a client with a specific backend (for testing or override).
    pub fn new(backend: LlmBackend) -> Self {
        Self { backend, headless: None, nano_id: String::new() }
    }

    /// Which backend is active?
    pub fn backend(&self) -> &LlmBackend {
        &self.backend
    }

    /// Set the nano ID (used for incoming request tagging).
    pub fn with_nano_id(mut self, id: &str) -> Self {
        self.nano_id = id.to_string();
        self
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
            LlmBackend::ClaudeCli => {
                claude_cli_call(prompt, max_tokens).await
            }
            LlmBackend::Incoming { gh_token, repo } => {
                incoming_call(gh_token, repo, &self.nano_id, prompt).await
            }
            LlmBackend::Codex => {
                codex_call(prompt).await
            }
            LlmBackend::None => {
                anyhow::bail!("no LLM backend available — install Claude CLI, set ANTHROPIC_API_KEY, or connect to Headless")
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

// ── Claude CLI (`claude --print`) ──────────────────────────────────────

async fn claude_cli_call(prompt: &str, _max_tokens: usize) -> Result<String> {
    let mut cmd = tokio::process::Command::new("claude");
    cmd.arg("--print");
    cmd.arg("--model").arg("haiku");  // fast + cheap for automated use

    // Pass prompt via stdin
    cmd.stdin(std::process::Stdio::piped());
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    let mut child = cmd.spawn().context("spawning claude CLI")?;

    // Write prompt to stdin
    if let Some(mut stdin) = child.stdin.take() {
        use tokio::io::AsyncWriteExt;
        stdin.write_all(prompt.as_bytes()).await?;
        drop(stdin); // close stdin so claude reads EOF
    }

    let output = child.wait_with_output().await.context("waiting for claude CLI")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("claude CLI failed (exit {}): {}", output.status, stderr);
    }

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(stdout)
}

// ── Incoming dead-drop (async LLM via GitHub Issues) ───────────────────

/// Post an LLM request as a GitHub Issue on the incoming repo.
/// Then check for any existing response from a previous request.
///
/// Flow:
/// 1. Check if there's a completed response from a prior run (issue with
///    `llm-response` label and a comment containing the answer).
/// 2. If yes → return the response, close the issue.
/// 3. If no → create a new issue with the prompt. The response will be
///    picked up on the NEXT run (async, not blocking).
/// 4. Return a placeholder so the caller can proceed.
async fn incoming_call(gh_token: &str, repo: &str, nano_id: &str, prompt: &str) -> Result<String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()?;
    let nano = if nano_id.is_empty() { "unknown" } else { nano_id };

    // 1. Check for completed responses (issues with llm-response label from this nano)
    let search_url = format!(
        "https://api.github.com/repos/{}/issues?labels=llm-response&state=open&per_page=10",
        repo
    );
    let resp = client.get(&search_url)
        .header("authorization", format!("Bearer {}", gh_token))
        .header("user-agent", "nano-zyrkel")
        .header("accept", "application/vnd.github+json")
        .send().await?;

    if resp.status().is_success() {
        let issues: Vec<serde_json::Value> = resp.json().await?;
        for issue in &issues {
            let title = issue["title"].as_str().unwrap_or("");
            if title.contains(&format!("src={}", nano)) {
                // Found a response! Read the first comment.
                let comments_url = issue["comments_url"].as_str().unwrap_or("");
                if !comments_url.is_empty() {
                    let cr = client.get(comments_url)
                        .header("authorization", format!("Bearer {}", gh_token))
                        .header("user-agent", "nano-zyrkel")
                        .send().await?;
                    if cr.status().is_success() {
                        let comments: Vec<serde_json::Value> = cr.json().await?;
                        if let Some(first) = comments.first() {
                            let body = first["body"].as_str().unwrap_or("");
                            if !body.is_empty() {
                                // Close the issue (consumed)
                                let issue_num = issue["number"].as_u64().unwrap_or(0);
                                let close_url = format!(
                                    "https://api.github.com/repos/{}/issues/{}",
                                    repo, issue_num
                                );
                                let _ = client.patch(&close_url)
                                    .header("authorization", format!("Bearer {}", gh_token))
                                    .header("user-agent", "nano-zyrkel")
                                    .json(&serde_json::json!({"state": "closed"}))
                                    .send().await;

                                tracing::info!("[llm:incoming] picked up response from #{}", issue_num);
                                return Ok(body.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. No response found — post a new request
    let prompt_hash = &format!("{:x}", md5_simple(prompt))[..8];
    let title = format!(
        "[llm-request] src={} hash={} action=llm_request",
        nano, prompt_hash
    );

    let create_url = format!("https://api.github.com/repos/{}/issues", repo);
    let resp = client.post(&create_url)
        .header("authorization", format!("Bearer {}", gh_token))
        .header("user-agent", "nano-zyrkel")
        .header("accept", "application/vnd.github+json")
        .json(&serde_json::json!({
            "title": title,
            "body": prompt,
            "labels": ["llm-request"],
        }))
        .send().await?;

    if resp.status().is_success() {
        let issue: serde_json::Value = resp.json().await?;
        let num = issue["number"].as_u64().unwrap_or(0);
        tracing::info!("[llm:incoming] posted request #{} — response will arrive async", num);
    } else {
        tracing::warn!("[llm:incoming] failed to create issue: {}", resp.status());
    }

    // 3. Return placeholder (async — response comes next run)
    Ok("(LLM response pending — will be available on next pipeline run)".to_string())
}

/// Simple non-crypto hash for dedup.
fn md5_simple(input: &str) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in input.bytes() {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
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

/// Check if a binary is available on PATH.
fn which_bin(name: &str) -> bool {
    // Use `where` on Windows, `which` on Unix
    let cmd = if cfg!(windows) { "where" } else { "which" };
    std::process::Command::new(cmd)
        .arg(name)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
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
