//! # Visualization — spatial layer
//!
//! Higher-level primitives for non-cartesian data. Each one is generic
//! enough to ship in core but solves a recurring problem that vanilla JS
//! gets verbose:
//!
//! - **`linear_track`** — `LinearTrack`: 1D coordinate viewer with markers.
//!   Generalization of vusTracker's genome browser; works for time, index,
//!   genomic position, anything one-dimensional.
//! - **`network`** — `NetworkGraph`: nodes + edges with a small force
//!   layout. Pedigrees, gene interaction maps, citation graphs.
//! - **`world_map`** — `WorldMap`: simple country choropleth. Population
//!   frequencies, prevalence maps, user distributions.
//!
//! All three accept a `ChartCanvas` and a JSON payload from the consumer.

pub mod linear_track;
pub mod network;
pub mod world_map;
