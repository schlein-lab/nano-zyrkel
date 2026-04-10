//! # Data layer — generic data plumbing for browser-side nano-zyrkels
//!
//! Every nano-zyrkel that runs in the browser needs the same boring
//! plumbing: fetch JSON, filter it, group it, cache it, search it.
//! This module provides those primitives once so user repos do not have
//! to re-implement them.
//!
//! All types are exposed via `#[wasm_bindgen]` and meant to be called
//! directly from the JavaScript glue layer in a user repo.

pub mod aggregator;
pub mod cache;
pub mod diff;
pub mod filter;
pub mod loader;
pub mod retry;
pub mod search;
pub mod stats;
