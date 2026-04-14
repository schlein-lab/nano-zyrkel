//! # nano-zyrkel-core
//!
//! Core library for nano-zyrkel — autonomous GitHub-native agents.
//!
//! This crate provides the building blocks that every nano-zyrkel agent needs:
//! config parsing, fetchers, condition matching, action dispatch, notifications,
//! and a runtime that wires them together.
//!
//! ## Architecture
//!
//! The core is a **library** intended to be consumed by either the bundled
//! `nano-zyrkel` CLI or by user repos that want to extend it with custom plugins.
//!
//! ## Stable API Promise
//!
//! Items re-exported at the crate root form the **stable v1 API**. They follow
//! semver: breaking changes only happen on major version bumps and are listed in
//! the repo's `compatibility.json`.
//!
//! ## Adaptability
//!
//! Domain-specific behavior should NOT live in this crate. Instead, user repos
//! implement the [`Plugin`] trait in their own crate and register it with the
//! [`runtime::Runtime`] before calling `run()`. The core stays generic and
//! reusable across many independent nano-zyrkel agents.

#![doc(html_root_url = "https://docs.rs/nano-zyrkel-core/0.2.0")]

// ── Public modules (stable API surface) ──
pub mod action;
pub mod clinvar;
pub mod condition;
pub mod config;
pub mod fetch;
pub mod headless;
pub mod i18n;
pub mod introspect;
pub mod literature;
pub mod maildesk;
pub mod notify;
pub mod output;
pub mod pipeline;
pub mod plugin;
pub mod runtime;
pub mod variant_classifier;

// ── Re-exports (the canonical entry points) ──
pub use config::{HatConfig, HatType};
pub use plugin::{Plugin, PluginContext};
pub use runtime::{Runtime, RunOptions};
