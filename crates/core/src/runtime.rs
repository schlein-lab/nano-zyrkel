//! # Runtime — orchestrates a single nano-zyrkel run
//!
//! This is the **stable entry point** that the CLI and any user repo can call
//! to execute a nano-zyrkel pipeline. It dispatches to the right handler based
//! on the configured `HatType`, applies the standard fetch → condition →
//! notify → act flow for generic types, and runs registered plugins at every
//! lifecycle hook.
//!
//! ## Layered responsibilities
//!
//! - **Runtime** decides *what to do* based on config + plugins.
//! - **Modules** (`fetch`, `condition`, `notify`, `action`) decide *how to do it*.
//! - **Plugins** (registered at startup) inject domain-specific behavior.
//!
//! Anything that is **not generic enough to ship in this crate** belongs in a
//! plugin or in a separate user crate that depends on this library.

use anyhow::{Context, Result};
use chrono::Timelike;

use crate::config::{HatConfig, HatType};
use crate::plugin::{Plugin, PluginContext};
use crate::{action, clinvar, condition, fetch, headless, i18n, literature, maildesk, notify, output, pipeline, variant_classifier};

/// Options that control how the runtime executes a single run.
///
/// All fields default to safe values; the CLI overrides them from command-line
/// arguments.
#[derive(Debug, Clone, Default)]
pub struct RunOptions {
    /// Output language for log messages and notifications (`"de"` or `"en"`).
    pub lang: String,
    /// If `true`, the runtime fetches and evaluates but does not notify or
    /// commit anything.
    pub dry_run: bool,
    /// Optional path to a bulk data file for one-time imports
    /// (delegated to the nano type).
    pub backfill: Option<String>,
}

impl RunOptions {
    /// Returns the language string, defaulting to `"de"` if empty.
    pub fn lang_or_default(&self) -> &str {
        if self.lang.is_empty() { "de" } else { &self.lang }
    }
}

/// The runtime owns the config and a list of registered plugins, and exposes
/// a single [`Runtime::run`] entry point.
pub struct Runtime {
    config: HatConfig,
    plugins: Vec<Box<dyn Plugin>>,
}

impl Runtime {
    /// Build a new runtime around a parsed config.
    pub fn new(config: HatConfig) -> Self {
        Self { config, plugins: Vec::new() }
    }

    /// Register a plugin. Plugins are invoked in registration order.
    pub fn register_plugin(&mut self, plugin: Box<dyn Plugin>) -> &mut Self {
        self.plugins.push(plugin);
        self
    }

    /// Execute one full run of this nano-zyrkel.
    ///
    /// Dispatches to the appropriate handler based on `HatType` and runs all
    /// registered plugin hooks in the right order.
    pub async fn run(self, opts: RunOptions) -> Result<()> {
        let lang = opts.lang_or_default().to_string();
        let mut ctx = PluginContext {
            scratch: Default::default(),
            lang: lang.clone(),
            dry_run: opts.dry_run,
            headless: None,
        };

        // ── Plugin init phase ──
        for p in &self.plugins {
            p.on_init(&mut ctx)
                .with_context(|| format!("plugin '{}' init failed", p.name()))?;
        }

        tracing::info!(
            nano_id = %self.config.id,
            nano_type = %self.config.hat_type,
            "{}",
            i18n::msg(&lang, "hat_starting", &[&self.config.id])
        );

        // ── Headless connection (opt-in: if headless_url or ZYRKEL_HEADLESS_URL set) ──
        if !opts.dry_run {
            ctx.headless = headless::try_connect(&self.config).await;
        }

        // ── Backfill mode (delegated per nano type) ──
        if let Some(backfill_path) = &opts.backfill {
            let staging_dir = format!("{}/{}", self.config.output_dir, self.config.id);
            let result = self.dispatch_backfill(backfill_path, &staging_dir);
            self.finalize(&mut ctx, result.is_ok())?;
            return result;
        }

        // ── Specialized pipelines ──
        let result = match &self.config.hat_type {
            HatType::Maildesk => {
                maildesk::run_maildesk(&self.config, opts.dry_run).await
            }
            HatType::LiteratureAlert => {
                let mode = std::env::var("RUN_MODE").unwrap_or_else(|_| {
                    let hour = chrono::Utc::now().hour();
                    if hour == 6 { "crawl".into() } else { "poll".into() }
                });
                literature::run(&self.config, &mode, opts.dry_run, &lang).await
            }
            HatType::VariantClassifier => {
                let mode = std::env::var("RUN_MODE").unwrap_or_else(|_| {
                    let now = chrono::Utc::now();
                    if now.hour() % 6 == 0 && now.minute() < 15 {
                        "vus-watch".into()
                    } else {
                        "poll".into()
                    }
                });
                variant_classifier::run(&self.config, &mode, opts.dry_run).await
            }
            HatType::ClinVar => {
                clinvar::run_clinvar(&self.config, opts.dry_run).await
            }
            HatType::Pipeline => {
                pipeline::run(&self.config, opts.dry_run).await
            }
            // ── Standard nano flow: fetch → condition → notify → act ──
            _ => self.run_standard(&mut ctx, &lang).await,
        };

        self.finalize(&mut ctx, result.is_ok())?;
        result
    }

    /// Standard pipeline used by every "generic" nano type.
    async fn run_standard(&self, ctx: &mut PluginContext, lang: &str) -> Result<()> {
        let source = self.config.source.as_ref().ok_or_else(|| {
            anyhow::anyhow!("'source' required for hat_type={}", self.config.hat_type)
        })?;
        let condition_cfg = self.config.condition.as_ref().ok_or_else(|| {
            anyhow::anyhow!("'condition' required for hat_type={}", self.config.hat_type)
        })?;

        // 1. Fetch — local file override or HTTP
        let content = if let Ok(file_path) = std::env::var("NANO_SOURCE_FILE") {
            tracing::info!("Reading from local file: {}", file_path);
            tokio::fs::read_to_string(&file_path).await
                .with_context(|| format!("Failed to read {}", file_path))?
        } else {
            fetch::fetch_source(source).await
                .with_context(|| i18n::msg(lang, "fetch_failed", &[&source.url]))?
        };

        tracing::debug!(bytes = content.len(), "Content fetched");

        // 2. Evaluate condition
        let result = condition::evaluate(condition_cfg, &content, &self.config).await?;

        // 3. Write output to staging/
        output::write_result(&self.config, &result, ctx.dry_run)?;

        // 3b. Push event to Headless (if connected)
        if let Some(conn) = &ctx.headless {
            let event_type = if result.matched { "finding" } else { "check" };
            if let Err(e) = headless::push_event(conn, &result, event_type).await {
                tracing::debug!("Headless event push failed: {}", e);
            }
        }

        // 4. If match → plugin pre-action hooks → notify → act
        if result.matched {
            for p in &self.plugins {
                p.on_pre_action(ctx)
                    .with_context(|| format!("plugin '{}' pre-action failed", p.name()))?;
            }

            if !ctx.dry_run {
                notify::send(&self.config.notify, &self.config, &result, lang).await?;
            }

            let outcome = action::execute(&self.config, &result, ctx.dry_run, lang).await?;
            tracing::info!(
                "{}",
                i18n::msg(lang, "match_found", &[&self.config.id, &result.summary])
            );
            match &outcome {
                action::ActionOutcome::Executed { action_type, detail, success } => {
                    tracing::info!("Action '{}': {} (success: {})", action_type, detail, success);
                }
                action::ActionOutcome::Denied => {
                    tracing::info!("Action denied by user");
                }
                _ => {}
            }
        } else {
            tracing::info!("{}", i18n::msg(lang, "no_match", &[&self.config.id]));
        }

        Ok(())
    }

    /// Dispatch a backfill request to the right module.
    fn dispatch_backfill(&self, path: &str, staging_dir: &str) -> Result<()> {
        match &self.config.hat_type {
            HatType::ClinVar => clinvar::backfill::run_backfill(path, staging_dir),
            HatType::LiteratureAlert => anyhow::bail!(
                "Backfill not yet implemented for LiteratureAlert."
            ),
            HatType::VariantClassifier => anyhow::bail!(
                "Backfill not yet implemented for VariantClassifier."
            ),
            other => anyhow::bail!(
                "Backfill not supported for nano type '{}'. \
                 Only data-heavy nano types support --backfill.",
                other
            ),
        }
    }

    /// Run finish hooks. Called regardless of success.
    fn finalize(&self, ctx: &mut PluginContext, success: bool) -> Result<()> {
        for p in &self.plugins {
            p.on_finish(ctx, success)
                .with_context(|| format!("plugin '{}' finish failed", p.name()))?;
        }
        Ok(())
    }
}
