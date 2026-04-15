//! # Pipeline — distributed work queue with progress-based advancement
//!
//! A generic orchestration module for nano-zyrkels that coordinate
//! distributed work. The binary iterates through a manifest of items
//! (tiles, genes, pages, batches), polls an external progress API,
//! and advances to the next item when a threshold is reached.
//!
//! ## How it works
//!
//! 1. **Load manifest** (first run or when cache expires): a JSON URL
//!    listing all work items. Parsed via a JSONPath expression.
//!
//! 2. **Load state** from `staging/{id}/pipeline_state.json`: which item
//!    is active, which are done, milestone history.
//!
//! 3. **Poll progress** from the configured API endpoint. Extract the
//!    "done" count via JSONPath.
//!
//! 4. **Check threshold**: if done/total >= `advance_threshold`, mark the
//!    current item as complete and advance to the next.
//!
//! 5. **Write active item** to `staging/{id}/active.json` so browsers,
//!    workers, and other nano-zyrkels can read it.
//!
//! 6. **Check milestones**: if the overall pipeline progress crosses a
//!    milestone percentage, return a match for notification.
//!
//! ## State files written
//!
//! - `staging/{id}/active.json` — current item for consumers
//! - `staging/{id}/pipeline_state.json` — internal progression state
//! - `staging/{id}/latest.json` — standard nano output (via output::write_result)
//! - `staging/{id}/history.jsonl` — append-only run log

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

use crate::condition::ConditionResult;
use crate::config::{HatConfig, PipelineConfig};
use crate::{fetch, notify, output};

/// Persistent pipeline state (survives between runs).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PipelineState {
    /// Index of the currently active item in the manifest.
    pub active_index: usize,
    /// Keys of completed items.
    #[serde(default)]
    pub completed: HashSet<String>,
    /// Milestone percentages already notified.
    #[serde(default)]
    pub notified_milestones: HashSet<u32>,
    /// Total items in manifest (cached).
    #[serde(default)]
    pub total_items: usize,
    /// Last seen progress value.
    #[serde(default)]
    pub last_progress: u64,
}

/// A single item from the manifest, resolved to key + URL.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineItem {
    pub index: usize,
    pub key: String,
    pub url: String,
    /// All original fields from the manifest item.
    #[serde(flatten)]
    pub fields: serde_json::Map<String, serde_json::Value>,
}

/// Run the pipeline orchestration for one cycle.
pub async fn run(config: &HatConfig, dry_run: bool) -> Result<()> {
    let cfg = config.pipeline.as_ref()
        .ok_or_else(|| anyhow::anyhow!("'pipeline' config required for hat_type=pipeline"))?;

    let staging_dir = format!("{}/{}", config.output_dir, config.id);
    std::fs::create_dir_all(&staging_dir)?;

    // 1. Load or refresh manifest
    let items = load_manifest(cfg).await
        .context("loading pipeline manifest")?;
    if items.is_empty() {
        tracing::warn!("[pipeline] manifest has no items");
        return Ok(());
    }
    tracing::info!("[pipeline] manifest: {} items", items.len());

    // 2. Load state
    let mut state = load_state(&staging_dir);
    state.total_items = items.len();

    // 3. Poll progress
    let progress = poll_progress(cfg).await.unwrap_or(0);
    state.last_progress = progress;
    let total = if cfg.progress_total > 0 { cfg.progress_total } else { items.len() as u64 };
    let progress_pct = if total > 0 { (progress as f64 / total as f64) * 100.0 } else { 0.0 };

    tracing::info!(
        "[pipeline] progress: {} / {} ({:.1}%), threshold: {:.0}%",
        progress, total, progress_pct, cfg.advance_threshold * 100.0
    );

    // 4. Check advancement
    let active_item = if state.active_index < items.len() {
        &items[state.active_index]
    } else {
        state.active_index = 0;
        &items[0]
    };

    let done_ratio = if total > 0 { progress as f64 / total as f64 } else { 0.0 };
    let mut advanced = false;

    if done_ratio >= cfg.advance_threshold && state.active_index + 1 < items.len() {
        tracing::info!(
            "[pipeline] threshold reached ({:.1}% >= {:.0}%), advancing {} → {}",
            done_ratio * 100.0, cfg.advance_threshold * 100.0,
            active_item.key, items[state.active_index + 1].key
        );
        state.completed.insert(active_item.key.clone());
        state.active_index += 1;
        advanced = true;
    }

    let current = &items[state.active_index];

    // 5. Write active.json for consumers
    // Try "chr" field first, fall back to "_parent" (injected by wildcard extraction)
    let chr_val = current.fields.get("chr")
        .or_else(|| current.fields.get("_parent"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let active_json = serde_json::json!({
        "tile": {
            "chr": chr_val,
            "index": current.fields.get("index").and_then(|v| v.as_u64()).unwrap_or(current.index as u64),
            "key": current.key,
            "url": current.url,
        },
        "items_completed": state.completed.len(),
        "items_total": items.len(),
        "progress": progress,
        "progress_total": total,
        "progress_pct": (progress_pct * 100.0).round() / 100.0,
    });

    if !dry_run {
        let active_path = format!("{}/active.json", staging_dir);
        std::fs::write(&active_path, serde_json::to_string_pretty(&active_json)?)?;
    }

    // 6. Check milestones
    let overall_pct = (state.completed.len() as f64 / items.len() as f64) * 100.0;
    let mut milestone_hit = None;
    for &m in &cfg.milestones {
        if overall_pct >= m as f64 && !state.notified_milestones.contains(&m) {
            state.notified_milestones.insert(m);
            milestone_hit = Some(m);
        }
    }

    // Build condition result for standard output pipeline
    let summary = if let Some(m) = milestone_hit {
        format!(
            "Pipeline milestone: {}% ({}/{} items complete, {:.1}% current item progress)",
            m, state.completed.len(), items.len(), progress_pct
        )
    } else if advanced {
        format!(
            "Advanced to {} ({}/{} items complete)",
            current.key, state.completed.len(), items.len()
        )
    } else {
        format!(
            "Active: {} — {:.1}% done ({}/{})",
            current.key, progress_pct, progress, total
        )
    };

    let result = ConditionResult {
        matched: milestone_hit.is_some() || advanced,
        summary: summary.clone(),
        extracted_value: Some(serde_json::json!({
            "active_key": current.key,
            "active_index": state.active_index,
            "items_completed": state.completed.len(),
            "items_total": items.len(),
            "progress": progress,
            "progress_total": total,
            "progress_pct": progress_pct,
            "advanced": advanced,
            "milestone": milestone_hit,
        })),
        content_hash: format!("{}:{}", state.active_index, progress),
    };

    // Write standard output (latest.json + history.jsonl)
    output::write_result(config, &result, dry_run)?;

    // Notify on milestone or advancement
    if result.matched && !dry_run {
        notify::send(&config.notify, config, &result, &config.lang).await?;
    }

    // 7. LLM insight — generate a human-readable teaching summary
    //    Only runs when LLM is available. Written to staging/{id}/insight.json.
    //    Consumers (browser widgets, dashboards) can display this to educate
    //    users about what the pipeline is doing and what the data means.
    if !dry_run {
        generate_insight(config, &state, &items, progress, total, &staging_dir).await;
    }

    // Save state
    if !dry_run {
        save_state(&staging_dir, &state)?;
    }

    tracing::info!("[pipeline] {}", summary);
    Ok(())
}

// ── Helpers ────────────────────────────────────────────────────────────

async fn load_manifest(cfg: &PipelineConfig) -> Result<Vec<PipelineItem>> {
    let source = crate::config::Source {
        url: cfg.manifest_url.clone(),
        method: "GET".into(),
        headers: Default::default(),
        body: None,
        needs_browser: false,
    };
    let content = fetch::fetch_source(&source).await
        .context("fetching manifest")?;
    let manifest: serde_json::Value = serde_json::from_str(&content)
        .context("parsing manifest JSON")?;

    // Extract items via JSONPath (simplified: support flat arrays and
    // nested chr→tile_list patterns)
    let items = extract_items(&manifest, &cfg.manifest_items_path);

    // Resolve keys and URLs from templates
    let resolved: Vec<PipelineItem> = items.into_iter().enumerate().map(|(i, obj)| {
        let key = resolve_template(cfg.item_key_template.as_deref().unwrap_or("{index}"), &obj, i);
        let url = resolve_template(cfg.item_url_template.as_deref().unwrap_or(""), &obj, i);
        let fields = match obj {
            serde_json::Value::Object(m) => m,
            _ => serde_json::Map::new(),
        };
        PipelineItem { index: i, key, url, fields }
    }).collect();

    Ok(resolved)
}

fn extract_items(manifest: &serde_json::Value, path: &str) -> Vec<serde_json::Value> {
    // Support common patterns:
    // "$[*]" → root is an array
    // "$.chromosomes.*.tile_list[*]" → nested objects → arrays
    //
    // When a "*" wildcard matches an object, the parent key (e.g. "chr1")
    // is injected as a "_parent" field into every downstream item.
    // This lets item_key_template use {_parent} to build keys like
    // "chr1:0-5000000" from nested manifests.
    if path == "$[*]" {
        return manifest.as_array().cloned().unwrap_or_default();
    }

    // Parse "$.a.*.b[*]" pattern: walk through nested objects.
    // Each entry carries an optional parent key from the last wildcard.
    let parts: Vec<&str> = path.trim_start_matches("$.").split('.').collect();
    let mut current: Vec<(Option<String>, serde_json::Value)> = vec![(None, manifest.clone())];

    for part in parts {
        let mut next: Vec<(Option<String>, serde_json::Value)> = Vec::new();
        for (parent, val) in &current {
            if part == "*" {
                // Iterate all entries of an object, capturing the KEY
                if let Some(obj) = val.as_object() {
                    for (key, child) in obj {
                        next.push((Some(key.clone()), child.clone()));
                    }
                }
            } else if part.ends_with("[*]") {
                // Access field then iterate array, preserving parent
                let field = part.trim_end_matches("[*]");
                if let Some(arr) = val.get(field).and_then(|v| v.as_array()) {
                    for item in arr {
                        next.push((parent.clone(), item.clone()));
                    }
                }
            } else {
                // Access field, preserving parent
                if let Some(v) = val.get(part) {
                    next.push((parent.clone(), v.clone()));
                }
            }
        }
        current = next;
    }

    // Inject _parent into each item that has one
    current.into_iter().map(|(parent, mut val)| {
        if let Some(parent_key) = parent {
            if let Some(obj) = val.as_object_mut() {
                obj.insert("_parent".to_string(), serde_json::Value::String(parent_key));
            }
        }
        val
    }).collect()
}

fn resolve_template(template: &str, item: &serde_json::Value, index: usize) -> String {
    let mut result = template.to_string();
    result = result.replace("{index}", &index.to_string());
    if let Some(obj) = item.as_object() {
        for (k, v) in obj {
            let val_str = match v {
                serde_json::Value::String(s) => s.clone(),
                serde_json::Value::Number(n) => n.to_string(),
                _ => v.to_string(),
            };
            result = result.replace(&format!("{{{}}}", k), &val_str);
        }
    }
    result
}

async fn poll_progress(cfg: &PipelineConfig) -> Result<u64> {
    let source = crate::config::Source {
        url: cfg.progress_url.clone(),
        method: "GET".into(),
        headers: Default::default(),
        body: None,
        needs_browser: false,
    };
    let content = fetch::fetch_source(&source).await
        .context("polling progress")?;
    let json: serde_json::Value = serde_json::from_str(&content)
        .context("parsing progress JSON")?;

    // Extract value via simplified JSONPath ($.field.subfield)
    let path = cfg.progress_done_path.trim_start_matches("$.");
    let mut val = &json;
    for part in path.split('.') {
        val = val.get(part).unwrap_or(&serde_json::Value::Null);
    }

    Ok(val.as_u64().or_else(|| val.as_f64().map(|f| f as u64)).unwrap_or(0))
}

fn load_state(staging_dir: &str) -> PipelineState {
    let path = format!("{}/pipeline_state.json", staging_dir);
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_state(staging_dir: &str, state: &PipelineState) -> Result<()> {
    let path = format!("{}/pipeline_state.json", staging_dir);
    std::fs::write(&path, serde_json::to_string_pretty(state)?)?;
    Ok(())
}

// ── LLM Insight ────────────────────────────────────────────────────────

/// LLM insight for the pipeline output.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct Insight {
    /// Human-readable summary of what's happening and what it means.
    summary: String,
    /// What the current numbers mean in context.
    context: String,
    /// What comes next / what to watch for.
    next_up: String,
    /// Timestamp of generation.
    generated_at: String,
    /// Which LLM backend generated this.
    backend: String,
}

/// Generate a teaching insight about the pipeline's current state.
///
/// Uses the generic LlmClient — works with Headless, Anthropic API,
/// Claude CLI, or Codex. If no LLM is available, writes a static
/// summary instead. Consumers (browser widgets) can display this to
/// help users understand what the data means.
///
/// Written to `staging/{id}/insight.json`.
async fn generate_insight(
    config: &crate::config::HatConfig,
    state: &PipelineState,
    items: &[PipelineItem],
    progress: u64,
    total: u64,
    staging_dir: &str,
) {
    let headless = crate::headless::try_connect(config).await;
    let llm = crate::llm::LlmClient::auto(headless.as_ref());

    let progress_pct = if total > 0 { (progress as f64 / total as f64) * 100.0 } else { 0.0 };
    let current_key = items.get(state.active_index)
        .map(|i| i.key.as_str())
        .unwrap_or("unknown");

    let insight = if llm.available() {
        let prompt = format!(
            "You are explaining a distributed computing pipeline to a curious user \
             who wants to understand what's happening. Be concise (3 sentences each).\n\n\
             Pipeline: {}\n\
             Current item: {} (#{} of {})\n\
             Progress on current item: {:.1}% ({} / {} units done)\n\
             Items completed: {} / {}\n\n\
             Respond with ONLY a JSON object:\n\
             {{\n\
               \"summary\": \"What is happening right now in plain language\",\n\
               \"context\": \"What these numbers mean — why this matters\",\n\
               \"next_up\": \"What will happen next in the pipeline\"\n\
             }}",
            config.description,
            current_key,
            state.active_index + 1,
            items.len(),
            progress_pct,
            progress,
            total,
            state.completed.len(),
            items.len(),
        );

        match llm.json::<serde_json::Value>(&prompt, 400).await {
            Ok(val) => Insight {
                summary: val["summary"].as_str().unwrap_or("").to_string(),
                context: val["context"].as_str().unwrap_or("").to_string(),
                next_up: val["next_up"].as_str().unwrap_or("").to_string(),
                generated_at: chrono::Utc::now().to_rfc3339(),
                backend: format!("{:?}", llm.backend()),
            },
            Err(e) => {
                tracing::debug!("[pipeline] LLM insight failed: {}", e);
                static_insight(config, state, items, progress, total, progress_pct, current_key)
            }
        }
    } else {
        static_insight(config, state, items, progress, total, progress_pct, current_key)
    };

    let path = format!("{}/insight.json", staging_dir);
    if let Ok(json) = serde_json::to_string_pretty(&insight) {
        if let Err(e) = std::fs::write(&path, json) {
            tracing::debug!("[pipeline] failed to write insight: {}", e);
        }
    }
}

fn static_insight(
    config: &crate::config::HatConfig,
    state: &PipelineState,
    items: &[PipelineItem],
    progress: u64,
    total: u64,
    progress_pct: f64,
    current_key: &str,
) -> Insight {
    let summary = format!(
        "Processing item {} of {}: {}. {:.1}% of work units completed ({}/{}).",
        state.active_index + 1, items.len(), current_key,
        progress_pct, progress, total,
    );
    let context = format!(
        "{} — {} items done so far. Each item is processed until {:.0}% \
         of work units are covered, then the pipeline advances to the next.",
        config.description, state.completed.len(), 80.0,
    );
    let next_up = if progress_pct >= 70.0 {
        format!("Almost ready to advance. At {:.0}% threshold, the next item will activate automatically.", 80.0)
    } else {
        format!("Continuing on {}. {:.0}% remaining before advancement.", current_key, 80.0 - progress_pct)
    };
    Insight {
        summary,
        context,
        next_up,
        generated_at: chrono::Utc::now().to_rfc3339(),
        backend: "static".to_string(),
    }
}
