//! # Visualization — advanced layer
//!
//! Additional chart types built on top of `viz::basic`. Pulled in via the
//! `viz-advanced` feature so consumers that only need the basics do not pay
//! for the extra code in their bundle.
//!
//! - **`scatter`** — `ScatterPlot`: cloud of points with optional colors and sizes.
//! - **`histogram`** — `Histogram`: distribution of a numeric series.
//! - **`heatmap`** — `Heatmap`: row × column color matrix.
//! - **`sorted_bar`** — `SortedBar`: top-N bar chart sorted by value.
//! - **`legend`** — `Legend`: small DOM helper for color → label mappings.
//! - **`empty`** — `EmptyState`: shared placeholder for "no data" / "loading".

pub mod empty;
pub mod heatmap;
pub mod histogram;
pub mod legend;
pub mod scatter;
pub mod sorted_bar;
