use anyhow::Result;
use crate::config::{Condition, HatConfig};

/// Result of evaluating a HAT condition.
#[derive(Debug, Clone)]
pub struct ConditionResult {
    /// Did the condition match?
    pub matched: bool,
    /// Human-readable summary of what was found
    pub summary: String,
    /// Extracted value (for trackers, price monitors, etc.)
    pub extracted_value: Option<serde_json::Value>,
    /// Content hash for change detection
    pub content_hash: String,
}

/// Evaluate a condition against fetched content.
pub async fn evaluate(condition: &Condition, content: &str, config: &HatConfig) -> Result<ConditionResult> {
    let content_hash = hash_content(content);

    match condition {
        Condition::Contains { value, negate } => {
            let found = content.contains(value.as_str());
            let matched = if *negate { !found } else { found };
            Ok(ConditionResult {
                matched,
                summary: if matched {
                    format!("Text '{}' gefunden", value)
                } else {
                    String::new()
                },
                extracted_value: None,
                content_hash,
            })
        }

        Condition::Regex { pattern, negate } => {
            let re = regex::Regex::new(pattern)?;
            let found = re.is_match(content);
            let matched = if *negate { !found } else { found };
            let capture = if found {
                re.find(content).map(|m| m.as_str().to_string())
            } else {
                None
            };
            Ok(ConditionResult {
                matched,
                summary: capture.unwrap_or_default(),
                extracted_value: None,
                content_hash,
            })
        }

        Condition::CssSelector { selector, extract } => {
            let document = scraper::Html::parse_document(content);
            let sel = scraper::Selector::parse(selector)
                .map_err(|e| anyhow::anyhow!("Invalid CSS selector: {e:?}"))?;
            let element = document.select(&sel).next();
            let matched = element.is_some();
            let extracted = element.map(|el| {
                match extract.as_deref() {
                    Some(attr) => el.value().attr(attr).unwrap_or("").to_string(),
                    None => el.text().collect::<Vec<_>>().join(" ").trim().to_string(),
                }
            });
            Ok(ConditionResult {
                matched,
                summary: extracted.clone().unwrap_or_default(),
                extracted_value: extracted.map(|v| serde_json::Value::String(v)),
                content_hash,
            })
        }

        Condition::JsonPath { path, expected } => {
            use jsonpath_rust::JsonPathQuery;
            let json: serde_json::Value = serde_json::from_str(content)?;
            let result = json.path(path)?;

            let found_values: Vec<&serde_json::Value> = match &result {
                serde_json::Value::Array(arr) => arr.iter().collect(),
                other => vec![other],
            };

            let matched = if let Some(exp) = expected {
                found_values.iter().any(|v| *v == exp)
            } else {
                !found_values.is_empty() && found_values[0] != &serde_json::Value::Null
            };

            Ok(ConditionResult {
                matched,
                summary: found_values.first()
                    .map(|v| v.to_string())
                    .unwrap_or_default(),
                extracted_value: found_values.first().map(|v| (*v).clone()),
                content_hash,
            })
        }

        Condition::RssNewEntry => {
            // Simple RSS: check if any entry ID differs from last seen
            let has_new = if let Some(last_id) = &config.state.last_rss_id {
                // Look for <id> or <guid> tags
                let id_re = regex::Regex::new(r"<(?:id|guid)[^>]*>([^<]+)</(?:id|guid)>")?;
                if let Some(cap) = id_re.captures(content) {
                    let first_id = cap.get(1).map(|m| m.as_str()).unwrap_or("");
                    first_id != last_id.as_str()
                } else {
                    false
                }
            } else {
                // First run — always match to establish baseline
                true
            };

            // Extract first entry ID for state
            let id_re = regex::Regex::new(r"<(?:id|guid)[^>]*>([^<]+)</(?:id|guid)>")?;
            let first_id = id_re.captures(content)
                .and_then(|c| c.get(1))
                .map(|m| m.as_str().to_string());

            // Extract first entry title
            let title_re = regex::Regex::new(r"<title[^>]*>([^<]+)</title>")?;
            let titles: Vec<String> = title_re.captures_iter(content)
                .filter_map(|c| c.get(1).map(|m| m.as_str().to_string()))
                .collect();
            let title = titles.get(1).or(titles.first()) // skip feed title, get first entry
                .cloned()
                .unwrap_or_default();

            Ok(ConditionResult {
                matched: has_new,
                summary: title,
                extracted_value: first_id.map(serde_json::Value::String),
                content_hash,
            })
        }

        Condition::Changed { selector, threshold } => {
            let relevant_content = if let Some(sel) = selector {
                let document = scraper::Html::parse_document(content);
                let sel = scraper::Selector::parse(sel)
                    .map_err(|e| anyhow::anyhow!("Invalid CSS selector: {e:?}"))?;
                document.select(&sel)
                    .map(|el| el.text().collect::<Vec<_>>().join(" "))
                    .collect::<Vec<_>>()
                    .join("\n")
            } else {
                content.to_string()
            };

            let new_hash = hash_content(&relevant_content);
            let changed = match &config.state.last_hash {
                Some(last) => {
                    if let Some(thresh) = threshold {
                        // Simple character-level difference ratio
                        let diff_ratio = char_diff_ratio(&relevant_content, &new_hash);
                        diff_ratio >= *thresh
                    } else {
                        &new_hash != last
                    }
                }
                None => true, // First run
            };

            Ok(ConditionResult {
                matched: changed,
                summary: if changed { "Inhalt hat sich geaendert".to_string() } else { String::new() },
                extracted_value: None,
                content_hash: new_hash,
            })
        }

        Condition::ExtractValue { selector, unit } => {
            let document = scraper::Html::parse_document(content);
            let sel = scraper::Selector::parse(selector)
                .map_err(|e| anyhow::anyhow!("Invalid CSS selector: {e:?}"))?;
            let text = document.select(&sel)
                .next()
                .map(|el| el.text().collect::<Vec<_>>().join(""))
                .unwrap_or_default();

            // Extract first number from text
            let num_re = regex::Regex::new(r"[\d.,]+")?;
            let value_str = num_re.find(&text)
                .map(|m| m.as_str().replace(',', "."))
                .unwrap_or_default();

            let value: f64 = value_str.parse().unwrap_or(0.0);
            let unit_str = unit.as_deref().unwrap_or("");

            Ok(ConditionResult {
                matched: true, // Trackers always "match" — they record data
                summary: format!("{}{}", value, unit_str),
                extracted_value: Some(serde_json::json!({
                    "value": value,
                    "unit": unit_str,
                    "raw": text.trim(),
                })),
                content_hash,
            })
        }

        Condition::DeadlineDate { date, remind_at_days } => {
            let deadline = chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d")?;
            let today = chrono::Utc::now().date_naive();
            let days_left = (deadline - today).num_days();

            let should_remind = remind_at_days.iter().any(|&d| days_left == d as i64);
            let is_today = days_left == 0;
            let is_overdue = days_left < 0;

            Ok(ConditionResult {
                matched: should_remind || is_today || is_overdue,
                summary: if is_overdue {
                    format!("UEBERFAELLIG seit {} Tagen!", -days_left)
                } else if is_today {
                    "HEUTE!".to_string()
                } else {
                    format!("Noch {} Tage bis {}", days_left, date)
                },
                extracted_value: Some(serde_json::json!({ "days_left": days_left })),
                content_hash,
            })
        }

        Condition::Llm { question, model: _ } => {
            // Stufe 2: LLM-based condition evaluation
            // Requires ANTHROPIC_API_KEY environment variable
            let api_key = std::env::var("ANTHROPIC_API_KEY").ok();

            if api_key.is_none() {
                tracing::warn!("ANTHROPIC_API_KEY not set — LLM condition skipped");
                return Ok(ConditionResult {
                    matched: false,
                    summary: "LLM nicht verfuegbar (kein API Key)".to_string(),
                    extracted_value: None,
                    content_hash,
                });
            }

            let answer = call_llm(&api_key.unwrap(), question, content).await?;

            // LLM returns JSON: { "match": true/false, "summary": "..." }
            let parsed: serde_json::Value = serde_json::from_str(&answer)
                .unwrap_or_else(|_| serde_json::json!({
                    "match": answer.to_lowercase().contains("ja")
                        || answer.to_lowercase().contains("yes")
                        || answer.to_lowercase().contains("true"),
                    "summary": answer,
                }));

            Ok(ConditionResult {
                matched: parsed["match"].as_bool().unwrap_or(false),
                summary: parsed["summary"].as_str().unwrap_or("").to_string(),
                extracted_value: Some(parsed),
                content_hash,
            })
        }
    }
}

fn hash_content(content: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn char_diff_ratio(_content: &str, _hash: &str) -> f64 {
    // Simplified — in practice, compare actual content
    // For now: any hash difference = 1.0 change
    1.0
}

async fn call_llm(api_key: &str, question: &str, content: &str) -> Result<String> {
    // Truncate content to avoid token limits
    let max_content = 4000;
    let truncated = if content.len() > max_content {
        &content[..max_content]
    } else {
        content
    };

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&serde_json::json!({
            "model": "claude-haiku-4-5-20251001",
            "max_tokens": 200,
            "messages": [{
                "role": "user",
                "content": format!(
                    "Analysiere den folgenden Webseiten-Inhalt und beantworte die Frage.\n\
                     Antworte NUR mit JSON: {{\"match\": true/false, \"summary\": \"kurze Zusammenfassung\"}}\n\n\
                     FRAGE: {}\n\n\
                     INHALT:\n{}",
                    question, truncated
                )
            }]
        }))
        .send()
        .await?;

    let body: serde_json::Value = response.json().await?;

    body["content"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| anyhow::anyhow!("Unexpected LLM response format"))
}
