//! # Visualization layer
//!
//! Generic, opinionated chart primitives that every browser-side
//! nano-zyrkel can compose. Three sub-layers, each gated by its own feature
//! flag so a consumer that only needs basic charts does not pay for the
//! advanced or spatial code in its bundle:
//!
//! - **`basic`** — foundation: canvas setup, scales, axes, colors, formats,
//!   plus the core `LineChart`, `BarChart` and `Donut` widgets and a small
//!   `Tooltip` helper. Most dashboards stop here.
//! - **`advanced`** — additional chart types built on top of `basic`:
//!   `ScatterPlot`, `Histogram`, `Heatmap`, `SortedBar`, `Legend` and a
//!   shared `EmptyState` placeholder.
//! - **`spatial`** — higher-level primitives for non-cartesian data:
//!   `LinearTrack` (1D coordinate viewer), `NetworkGraph` (force-directed
//!   nodes + edges) and `WorldMap` (country choropleth).
//!
//! Anything that is not generic enough to ship in *every* nano-zyrkel
//! belongs in the consuming repo's own crate, not here.

#[cfg(feature = "viz-basic")]
pub mod basic;

#[cfg(feature = "viz-advanced")]
pub mod advanced;

#[cfg(feature = "viz-spatial")]
pub mod spatial;

#[cfg(feature = "viz-ui")]
pub mod ui;
