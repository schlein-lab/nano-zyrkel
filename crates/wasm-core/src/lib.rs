//! # nano-zyrkel-wasm-core
//!
//! Generic, browser-side building blocks for nano-zyrkel apps. Compiles to
//! WebAssembly via `wasm-pack` and is consumed by user repos through
//! `import init, { ... } from './core/wasm/...'` in their JavaScript glue.
//!
//! ## Why this crate exists
//!
//! Every browser-facing nano-zyrkel needs to do the same handful of things:
//!
//! 1. Load `staging/latest.json` written by the binary core.
//! 2. Read its own `hats/config.json` for branding, language and feature flags.
//! 3. Filter / aggregate / search the loaded data.
//! 4. Cache things in IndexedDB so reloads stay fast.
//! 5. Render charts, axes and basic visualizations.
//!
//! Doing all of this in hand-written JavaScript per repo means that fixes,
//! performance work and new features have to be re-applied N times. Doing it
//! once in Rust + WebAssembly means: a single update bumps every consuming
//! repo, and the heavy compute (filter, aggregate, stats) runs much faster
//! than equivalent vanilla JS on the user's CPU.
//!
//! ## Layered modules
//!
//! - **`data`** — `DataLoader`, `Filter`, `Aggregator`, `Stats`, `Search`,
//!   `Diff`, `Cache`, `Retry`. The non-visual core that every consumer needs.
//! - **`config`** — `ConfigReader`, `I18n`. Reads the same `hats/config.json`
//!   that the binary core understands.
//! - **`viz::basic`** — `ChartCanvas`, `Scale`, `Axis`, `ColorPalette`,
//!   `Format`, `LineChart`, `BarChart`, `Donut`, `Tooltip`. The smallest
//!   possible chart kit.
//! - **`viz::advanced`** — `ScatterPlot`, `Histogram`, `Heatmap`, `SortedBar`,
//!   `Legend`, `EmptyState`. Reuses the foundation from `viz::basic`.
//! - **`viz::spatial`** — `LinearTrack`, `NetworkGraph`, `WorldMap`. The
//!   higher-level primitives that are still generic enough to ship in core.
//!
//! Each layer is feature-gated so consumers only pull in what they need.
//! See `Cargo.toml` for the available `[features]`.
//!
//! ## What does NOT belong here
//!
//! Anything domain-specific belongs in the user repo's own crate, not in this
//! library. Examples that should never end up in `wasm-core`:
//!
//! - ACMG variant classification logic (vusTracker)
//! - Hardy-Weinberg calculations or pedigree drawing (helix)
//! - Particle systems or cinematic animations (showcase)
//!
//! Those crates can still depend on `wasm-core` and reuse its primitives,
//! they just stay outside.
//!
//! ## Stable API promise
//!
//! Items exported under the `prelude` re-exports are part of the **wasm-v1**
//! API. Breaking changes only happen on a major version bump and are listed
//! in `compatibility.json` at the repo root.

#![doc(html_root_url = "https://docs.rs/nano-zyrkel-wasm-core/0.1.0")]

use wasm_bindgen::prelude::*;

// ── Optional layers, gated by features ─────────────────────────────────

#[cfg(feature = "data")]
pub mod data;

#[cfg(feature = "config")]
pub mod config;

#[cfg(any(feature = "viz-basic", feature = "viz-advanced", feature = "viz-spatial"))]
pub mod viz;

// ── One-time module init ───────────────────────────────────────────────

/// Install the panic hook so Rust panics show up in the browser console as
/// readable stack traces. Call this once at startup from JavaScript:
///
/// ```js
/// import init, { install_panic_hook } from './core/wasm/nano_zyrkel_wasm_core.js';
/// await init();
/// install_panic_hook();
/// ```
#[wasm_bindgen]
pub fn install_panic_hook() {
    console_error_panic_hook::set_once();
}

/// Returns the semver string this WASM bundle was built with. Useful for
/// runtime version pinning checks in user-repo glue code.
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
