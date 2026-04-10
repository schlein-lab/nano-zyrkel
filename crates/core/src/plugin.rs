//! # Plugin trait — extension point for user repos
//!
//! The core stays generic on purpose. Domain-specific behavior — for example
//! ACMG variant classification, custom HPO mapping, or any other use-case
//! a particular nano-zyrkel needs — lives in a **separate crate inside the
//! user repo** and is registered with the [`Runtime`] at startup.
//!
//! This keeps the core small, stable and reusable across many independent
//! agents while still allowing each agent to be highly specialized.
//!
//! ## Lifecycle hooks
//!
//! A plugin can hook into three phases of the pipeline:
//!
//! 1. **Pre-fetch** — adjust the fetch source before the request is made
//!    (e.g. inject auth headers, rewrite URLs).
//! 2. **Per-record** — inspect or transform every record produced by the
//!    fetcher and decide whether it should pass downstream.
//! 3. **Pre-action** — inspect/modify the context just before an action is
//!    executed (e.g. enrich notifications, add metrics).
//!
//! All hooks have default no-op implementations so a plugin only overrides
//! what it needs.
//!
//! ## Example
//!
//! ```ignore
//! use nano_zyrkel_core::{Plugin, PluginContext, Runtime, HatConfig};
//!
//! #[derive(Default)]
//! pub struct MyDomainFilter;
//!
//! impl Plugin for MyDomainFilter {
//!     fn name(&self) -> &str { "my-domain-filter" }
//!     fn on_record(&self, ctx: &mut PluginContext, record: &mut serde_json::Value) -> bool {
//!         // Return false to drop the record
//!         record.get("score").and_then(|s| s.as_f64()).map(|s| s > 0.5).unwrap_or(false)
//!     }
//! }
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     let config = HatConfig::load("hats/config.json".as_ref())?;
//!     let mut runtime = Runtime::new(config);
//!     runtime.register_plugin(Box::new(MyDomainFilter::default()));
//!     runtime.run(Default::default()).await
//! }
//! ```

use anyhow::Result;
use serde_json::Value;

/// Mutable context passed to every plugin hook.
///
/// Plugins can stash state in [`PluginContext::scratch`] (a JSON object)
/// to communicate between hooks within a single run.
#[derive(Default)]
pub struct PluginContext {
    /// Free-form scratch space shared across hooks within one run.
    pub scratch: serde_json::Map<String, Value>,
    /// Run language for i18n decisions inside plugins.
    pub lang: String,
    /// Whether the run is in dry-run mode.
    pub dry_run: bool,
}

impl PluginContext {
    /// Convenience: read a stashed value by key.
    pub fn get(&self, key: &str) -> Option<&Value> {
        self.scratch.get(key)
    }

    /// Convenience: stash a value under a key.
    pub fn set(&mut self, key: &str, value: Value) {
        self.scratch.insert(key.to_string(), value);
    }
}

/// A plugin extends the core runtime with custom domain logic.
///
/// All hooks have default no-op implementations so an implementor only
/// needs to override what it cares about.
pub trait Plugin: Send + Sync {
    /// Stable identifier used in logs and diagnostics.
    fn name(&self) -> &str;

    /// Called once before the runtime starts processing.
    /// Use it for setup, validation or to stash data in `ctx`.
    fn on_init(&self, _ctx: &mut PluginContext) -> Result<()> {
        Ok(())
    }

    /// Called for every record produced by the fetcher.
    ///
    /// Return `true` to keep the record in the pipeline, `false` to drop it.
    /// Plugins may also mutate the record in place to enrich, normalize or
    /// reshape it before downstream processing.
    fn on_record(&self, _ctx: &mut PluginContext, _record: &mut Value) -> bool {
        true
    }

    /// Called once before any action is dispatched.
    /// Use it to enrich notifications, add metadata, run side effects.
    fn on_pre_action(&self, _ctx: &mut PluginContext) -> Result<()> {
        Ok(())
    }

    /// Called once after the run finishes (successfully or not).
    /// Use it for cleanup, telemetry or final reporting.
    fn on_finish(&self, _ctx: &mut PluginContext, _success: bool) -> Result<()> {
        Ok(())
    }
}
