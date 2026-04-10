//! Optional domain plugin for `{{NANO_ID}}`.
//!
//! Implement [`Plugin`] from `nano-zyrkel-core` to inject custom logic
//! into the standard fetch → condition → notify → act pipeline.
//! Remove this crate entirely if you do not need it.

use nano_zyrkel_core::{Plugin, PluginContext};
use serde_json::Value;

#[derive(Default)]
pub struct DomainPlugin;

impl Plugin for DomainPlugin {
    fn name(&self) -> &str {
        "{{NANO_ID}}-plugin"
    }

    fn on_record(&self, _ctx: &mut PluginContext, _record: &mut Value) -> bool {
        // Return false to drop a record, mutate it in place to enrich,
        // or leave it as-is and just return true.
        true
    }
}
