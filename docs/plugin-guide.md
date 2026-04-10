# Plugin guide

The binary core stays generic by design. Domain-specific behavior
belongs in your nano-zyrkel's own crate, registered with the runtime
through the `Plugin` trait.

## When to write a plugin

If your needs are covered by `hats/config.json` alone, **do not**
write a plugin. The condition + action vocabulary in the schema
covers most use cases.

Reach for a plugin only when you need to:

- Reshape every record before downstream processing
  (deduplication, normalization, scoring).
- Inject custom domain logic that the generic types do not express
  (ACMG classification, anomaly detection, etc.).
- Run side effects at well-defined lifecycle points
  (telemetry, dashboards, audit logs).

## Layout

Add a crate under `crates/plugin/` in your nano-zyrkel repo:

```
my-nano/
├── crates/plugin/
│   ├── Cargo.toml
│   └── src/lib.rs
└── ...
```

`Cargo.toml`:

```toml
[package]
name = "my-nano-plugin"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["lib"]

[dependencies]
nano-zyrkel-core = { git = "https://github.com/schlein-lab/nano-zyrkel", tag = "bin-v0.1.0" }
serde = "1"
serde_json = "1"
```

`src/lib.rs`:

```rust
use nano_zyrkel_core::{Plugin, PluginContext};
use serde_json::Value;

#[derive(Default)]
pub struct AcmgClassifier;

impl Plugin for AcmgClassifier {
    fn name(&self) -> &str { "acmg-classifier" }

    fn on_record(&self, _ctx: &mut PluginContext, record: &mut Value) -> bool {
        // mutate `record` in place, return false to drop it
        true
    }
}
```

## Lifecycle

The runtime calls four hooks in this order:

1. `on_init(ctx)` — once at startup.
2. `on_record(ctx, record)` — for every record produced by the fetcher.
   Return `false` to drop a record from the pipeline.
3. `on_pre_action(ctx)` — once before any notification or action runs.
4. `on_finish(ctx, success)` — once at the very end.

All hooks have default no-op implementations so you only override what
you need.

## Using your plugin from a custom binary

If you decide to ship your own binary instead of the generic CLI
(rare), depend on `nano-zyrkel-core` directly:

```rust
use nano_zyrkel_core::{HatConfig, Runtime, RunOptions};
use my_nano_plugin::AcmgClassifier;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = HatConfig::load("hats/config.json".as_ref())?;
    let mut runtime = Runtime::new(config);
    runtime.register_plugin(Box::new(AcmgClassifier::default()));
    runtime.run(RunOptions::default()).await
}
```

In most cases the generic CLI in this repo is enough — your plugin
crate just needs to be picked up by the workspace it lives in. Most
users never write a plugin at all.
