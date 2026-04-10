//! # Visualization — basic layer
//!
//! Foundation: canvas setup, scales, axes, colors and formats. Plus the
//! three chart types every dashboard ends up reimplementing: `LineChart`,
//! `BarChart` and `Donut`. The `Tooltip` helper rounds it off.
//!
//! Each chart accepts a [`ChartCanvas`] and one or more [`Scale`] instances,
//! draws into the underlying 2D context and returns nothing — the caller
//! controls layout via plain HTML.

pub mod axis;
pub mod bar;
pub mod canvas;
pub mod color;
pub mod donut;
pub mod format;
pub mod line;
pub mod scale;
pub mod tooltip;
