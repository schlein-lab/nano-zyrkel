# example-plugin

End-to-end walkthrough for the `Plugin` trait. Shows how a user repo
can extend the central `nano-zyrkel-core` runtime with custom domain
logic without forking the binary.

## What it shows

- **`Plugin` trait** — implementing every lifecycle hook
  (`on_init`, `on_record`, `on_pre_action`, `on_finish`).
- **Plugin state** — a thread-safe `Arc<AtomicUsize>` counter that
  records how many records were kept versus dropped.
- **`PluginContext::scratch`** — stashing a value at init time and
  reading it from later hooks within the same run.
- **`Runtime::register_plugin`** — wiring the plugin into the
  pipeline before calling `Runtime::run`.
- **Dry-run mode** — running the full pipeline without firing any
  side effects, the recommended way to iterate on plugin code.

## Build it

In a real user repo you would depend on the central crate via Cargo:

```toml
[dependencies]
nano-zyrkel-core = { git = "https://github.com/schlein-lab/nano-zyrkel", tag = "bin-v0.2.0" }
```

Inside this monorepo the dependency is resolved via a relative
`path = "../../../crates/core"` so the example builds without a
network round trip. Switch the dep when you copy the file into your
own repo.

Then:

```bash
cargo run -- --config hats/config.json
```
