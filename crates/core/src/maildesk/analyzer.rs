//! Email analyzer — uses LlmClient to understand incoming emails.
//! Produces a structured plan: needs_reply, summary, risk_flags, reply_brief.
//!
//! Uses the generic LlmClient (Headless → Anthropic → Codex fallback chain)
//! instead of hardcoding a specific LLM provider.

use anyhow::Result;
use super::imap_client::EmailHeaders;
use crate::llm::LlmClient;

/// Structured analysis result from LLM.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AnalysisPlan {
    #[serde(default)]
    pub needs_reply: bool,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub risk_flags: Vec<String>,
    #[serde(default)]
    pub reply_brief: String,
    #[serde(default)]
    pub follow_up_questions: Vec<String>,
}

/// Analyze an email using the best available LLM backend.
pub async fn analyze(
    headers: &EmailHeaders,
    body: &str,
    mailbox: &str,
    llm: &LlmClient,
) -> Result<AnalysisPlan> {
    if !llm.available() {
        tracing::warn!("[analyzer] No LLM available, using fallback plan");
        return Ok(fallback_plan(headers));
    }

    let prompt = format!(
        "Du bist der Maildesk-Agent fuer {}. Analysiere diese eingehende E-Mail.\n\n\
         VON: {}\n\
         BETREFF: {}\n\n\
         INHALT:\n{}\n\n\
         Regeln:\n\
         - needs_reply: false bei Info-Mails, Newslettern, Spam.\n\
         - summary: Was will die Person? Kurz und klar.\n\
         - reply_brief: Kern der Antwort in einem Satz.\n\
         - Keine Fakten erfinden.",
        mailbox,
        headers.from_raw,
        headers.subject,
        &body[..body.len().min(8000)]
    );

    match llm.json::<AnalysisPlan>(&prompt, 500).await {
        Ok(plan) => Ok(plan),
        Err(e) => {
            tracing::warn!("[analyzer] LLM analysis failed ({}), using fallback", e);
            Ok(fallback_plan(headers))
        }
    }
}

fn fallback_plan(headers: &EmailHeaders) -> AnalysisPlan {
    AnalysisPlan {
        needs_reply: true,
        summary: format!("Email von {} zu '{}'", headers.from_email, headers.subject),
        risk_flags: vec![],
        reply_brief: "Antwort erforderlich".into(),
        follow_up_questions: vec![],
    }
}
