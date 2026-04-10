//! # Config + i18n layer
//!
//! Reads the same `hats/config.json` schema that the binary core understands
//! and exposes translation lookups based on the `lang` field. This is the
//! second of the two layers that *every* browser-side nano-zyrkel needs:
//! the data layer fetches data, this layer tells the app how to brand and
//! localize itself.

pub mod i18n;
pub mod reader;
