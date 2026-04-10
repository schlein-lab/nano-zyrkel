//! # Visualization — UI layer
//!
//! Interactive UI components built on top of the DOM. None of these
//! draw to a canvas — they manage real HTML elements so the rest of
//! a nano-zyrkel's page can interact with them through the standard
//! DOM API.
//!
//! Pulled in via the `viz-ui` feature so consumers that only need
//! charts do not pay for the extra code in their bundle.
//!
//! Modules:
//!
//! - **`toast`** — short-lived floating notifications
//! - **`modal`** — backdrop dialogs with a focus trap
//! - **`tabs`** — tabbed section switcher
//! - **`accordion`** — collapsible panels
//! - **`icons`** — built-in inline SVG icon set (~30 icons)
//! - **`form`** — `TextInput`, `Select` and `Range` form helpers that
//!   round-trip to JS
//! - **`sortable`** — drag-to-reorder list
//! - **`markdown`** — `pulldown-cmark`-backed renderer
//! - **`animation`** — tween + easing functions for `requestAnimationFrame`

pub mod accordion;
pub mod animation;
pub mod form;
pub mod icons;
pub mod markdown;
pub mod modal;
pub mod sortable;
pub mod tabs;
pub mod toast;
