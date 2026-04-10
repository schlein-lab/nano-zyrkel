//! Worked example: end-to-end Plugin trait usage.
//!
//! Builds a small CLI that loads a `hats/config.json`, registers a
//! custom plugin against `nano_zyrkel_core::Runtime`, and runs the
//! pipeline. The plugin demonstrates every lifecycle hook:
//!
//! - `on_init`     — stash a value in `PluginContext::scratch`
//! - `on_record`   — drop records that fail a custom score check
//! - `on_pre_action` — print a one-line summary before any action fires
//! - `on_finish`   — emit a final tally
//!
//! User repos should depend on this crate via the `nano-zyrkel-core`
//! Cargo dep instead of the path used here.

use anyhow::{Context, Result};
use clap::Parser;
use nano_zyrkel_core::{HatConfig, Plugin, PluginContext, RunOptions, Runtime};
use serde_json::Value;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tracing_subscriber::EnvFilter;

#[derive(Parser, Debug)]
#[command(name = "example-plugin")]
struct Cli {
    #[arg(short, long)]
    config: PathBuf,
}

#[derive(Default)]
struct ScoreFilter {
    threshold: f64,
    kept: Arc<AtomicUsize>,
    dropped: Arc<AtomicUsize>,
}

impl Plugin for ScoreFilter {
    fn name(&self) -> &str {
        "score-filter"
    }

    fn on_init(&self, ctx: &mut PluginContext) -> Result<()> {
        ctx.set("threshold", Value::from(self.threshold));
        tracing::info!(name = %self.name(), threshold = self.threshold, "plugin initialised");
        Ok(())
    }

    fn on_record(&self, _ctx: &mut PluginContext, record: &mut Value) -> bool {
        let score = record
            .get("score")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        if score >= self.threshold {
            // Enrich the record with a marker so downstream consumers
            // know it passed our filter.
            if let Some(obj) = record.as_object_mut() {
                obj.insert("score_filter".into(), Value::from("kept"));
            }
            self.kept.fetch_add(1, Ordering::Relaxed);
            true
        } else {
            self.dropped.fetch_add(1, Ordering::Relaxed);
            false
        }
    }

    fn on_pre_action(&self, _ctx: &mut PluginContext) -> Result<()> {
        tracing::info!(
            kept = self.kept.load(Ordering::Relaxed),
            dropped = self.dropped.load(Ordering::Relaxed),
            "score filter — pre-action summary"
        );
        Ok(())
    }

    fn on_finish(&self, _ctx: &mut PluginContext, success: bool) -> Result<()> {
        tracing::info!(
            success,
            kept = self.kept.load(Ordering::Relaxed),
            dropped = self.dropped.load(Ordering::Relaxed),
            "score filter — final tally"
        );
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "example_plugin=info,nano_zyrkel_core=info".into()
        }))
        .compact()
        .init();

    let config = HatConfig::load(&cli.config)
        .with_context(|| format!("load config: {}", cli.config.display()))?;

    let plugin = ScoreFilter {
        threshold: 0.5,
        kept: Arc::new(AtomicUsize::new(0)),
        dropped: Arc::new(AtomicUsize::new(0)),
    };

    let mut runtime = Runtime::new(config);
    runtime.register_plugin(Box::new(plugin));
    runtime
        .run(RunOptions {
            lang: "en".into(),
            dry_run: true,
            backfill: None,
        })
        .await
}
