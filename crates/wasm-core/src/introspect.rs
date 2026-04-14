//! # Introspection — machine-readable description of the WASM SDK surface
//!
//! Mirrors `nano-zyrkel-core::introspect` but lists everything that
//! lives on the browser side: data primitives, config helpers,
//! visualization layers and UI components.
//!
//! Used by the browser-based nano-zyrkel builder to discover what is
//! available before rendering a form for the user. The same data is
//! also useful for documentation generators and tooling that wants
//! to enumerate the SDK without parsing Rust source.

use serde::Serialize;
use serde_json::{json, Value};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Clone)]
pub struct WasmEntry {
    pub id: &'static str,
    pub label: &'static str,
    pub help: &'static str,
    pub layer: &'static str,
}

#[derive(Serialize, Clone)]
pub struct WasmSdkSchema {
    pub version: &'static str,
    pub schema: &'static str,
    pub features: Vec<&'static str>,
    pub primitives: Vec<WasmEntry>,
}

/// Build the WASM SDK schema for the current bundle.
pub fn schema() -> WasmSdkSchema {
    WasmSdkSchema {
        version: env!("CARGO_PKG_VERSION"),
        schema: "nano-zyrkel-wasm-sdk/v1",
        features: features_enabled(),
        primitives: catalog(),
    }
}

/// Convenience: render the WASM SDK schema as a JSON object.
#[wasm_bindgen(js_name = wasmSdkSchema)]
pub fn schema_js() -> Result<JsValue, JsValue> {
    let value: Value = serde_json::to_value(schema())
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    serde_wasm_bindgen::to_value(&value).map_err(|e| JsValue::from_str(&e.to_string()))
}

fn features_enabled() -> Vec<&'static str> {
    #[allow(unused_mut)]
    let mut out: Vec<&'static str> = Vec::new();
    #[cfg(feature = "data")]
    out.push("data");
    #[cfg(feature = "config")]
    out.push("config");
    #[cfg(feature = "viz-basic")]
    out.push("viz-basic");
    #[cfg(feature = "viz-advanced")]
    out.push("viz-advanced");
    #[cfg(feature = "viz-spatial")]
    out.push("viz-spatial");
    #[cfg(feature = "viz-ui")]
    out.push("viz-ui");
    #[cfg(feature = "tools")]
    out.push("tools");
    out
}

fn catalog() -> Vec<WasmEntry> {
    let mut entries: Vec<WasmEntry> = Vec::new();

    // ── data ──
    #[cfg(feature = "data")]
    entries.extend([
        WasmEntry { id: "DataLoader", label: "Data loader", help: "Fetch JSON / text from the network with a friendly wrapper.", layer: "data" },
        WasmEntry { id: "Filter", label: "Filter", help: "SQL-WHERE-like predicates over a JSON array.", layer: "data" },
        WasmEntry { id: "Aggregator", label: "Aggregator", help: "GROUP BY with count / sum / avg / min / max.", layer: "data" },
        WasmEntry { id: "Stats", label: "Stats", help: "Mean / median / stddev / percentiles / linear regression / chi-square.", layer: "data" },
        WasmEntry { id: "SearchIndex", label: "Search index", help: "Substring + fuzzy lookup over a JSON array.", layer: "data" },
        WasmEntry { id: "Diff", label: "Diff", help: "Compare two JSON snapshots and return added / removed / modified records.", layer: "data" },
        WasmEntry { id: "Cache", label: "Cache", help: "Persistent localStorage cache with TTLs.", layer: "data" },
        WasmEntry { id: "Retry", label: "Retry", help: "Exponential backoff fetch wrapper.", layer: "data" },
        WasmEntry { id: "Csv", label: "Csv", help: "JSON ⇄ CSV conversion + browser download helper.", layer: "data" },
        WasmEntry { id: "DateTime", label: "DateTime", help: "Date arithmetic, formatting and ranges.", layer: "data" },
        WasmEntry { id: "UrlState", label: "UrlState", help: "Read / write the URL query string for shareable filters.", layer: "data" },
        WasmEntry { id: "Router", label: "Router", help: "Hash-based client-side router with `:param` segments.", layer: "data" },
        WasmEntry { id: "WebSocketClient", label: "WebSocketClient", help: "WebSocket wrapper with onOpen / onClose / onJson / sendJson.", layer: "data" },
    ]);

    // ── config ──
    #[cfg(feature = "config")]
    entries.extend([
        WasmEntry { id: "ConfigReader", label: "Config reader", help: "Read hats/config.json the same way the binary core does.", layer: "config" },
        WasmEntry { id: "I18n", label: "I18n", help: "Tiny translation catalog with substitution.", layer: "config" },
    ]);

    // ── viz-basic ──
    #[cfg(feature = "viz-basic")]
    entries.extend([
        WasmEntry { id: "ChartCanvas", label: "Chart canvas", help: "DPR-aware Canvas2D wrapper with padding + plot area.", layer: "viz-basic" },
        WasmEntry { id: "Scale", label: "Scale", help: "Linear / log / time scales with map and invert.", layer: "viz-basic" },
        WasmEntry { id: "draw_y_grid", label: "Y grid", help: "Draw a horizontal grid + Y axis labels.", layer: "viz-basic" },
        WasmEntry { id: "draw_x_axis", label: "X axis", help: "Draw a vertical grid + X axis labels.", layer: "viz-basic" },
        WasmEntry { id: "CategoricalPalette", label: "Categorical palette", help: "Built-in 12-color qualitative palette.", layer: "viz-basic" },
        WasmEntry { id: "SequentialPalette", label: "Sequential palette", help: "Two-color interpolation for heatmaps.", layer: "viz-basic" },
        WasmEntry { id: "DivergingPalette", label: "Diverging palette", help: "Three-stop interpolation through a center color.", layer: "viz-basic" },
        WasmEntry { id: "Format", label: "Format", help: "Number / percent / SI / date formatters.", layer: "viz-basic" },
        WasmEntry { id: "LineChart", label: "Line chart", help: "Single-series line chart with optional fill.", layer: "viz-basic" },
        WasmEntry { id: "BarChart", label: "Bar chart", help: "Single + stacked bar charts.", layer: "viz-basic" },
        WasmEntry { id: "Donut", label: "Donut", help: "Donut / pie chart with center label.", layer: "viz-basic" },
        WasmEntry { id: "Tooltip", label: "Tooltip", help: "Floating tooltip helper.", layer: "viz-basic" },
    ]);

    // ── viz-advanced ──
    #[cfg(feature = "viz-advanced")]
    entries.extend([
        WasmEntry { id: "ScatterPlot", label: "Scatter plot", help: "Point cloud with optional colors and sizes.", layer: "viz-advanced" },
        WasmEntry { id: "Histogram", label: "Histogram", help: "Distribution of a numeric series.", layer: "viz-advanced" },
        WasmEntry { id: "Heatmap", label: "Heatmap", help: "Row × column color matrix.", layer: "viz-advanced" },
        WasmEntry { id: "SortedBar", label: "Sorted bar", help: "Top-N sorted bar chart.", layer: "viz-advanced" },
        WasmEntry { id: "Legend", label: "Legend", help: "DOM helper for color → label mappings.", layer: "viz-advanced" },
        WasmEntry { id: "EmptyState", label: "Empty state", help: "Shared placeholder for no-data / loading.", layer: "viz-advanced" },
    ]);

    // ── viz-spatial ──
    #[cfg(feature = "viz-spatial")]
    entries.extend([
        WasmEntry { id: "LinearTrack", label: "Linear track", help: "1D coordinate viewer with markers.", layer: "viz-spatial" },
        WasmEntry { id: "NetworkGraph", label: "Network graph", help: "Force-directed nodes + edges.", layer: "viz-spatial" },
        WasmEntry { id: "WorldMap", label: "World map", help: "Country choropleth with custom outlines.", layer: "viz-spatial" },
    ]);

    // ── viz-ui ──
    #[cfg(feature = "viz-ui")]
    entries.extend([
        WasmEntry { id: "Toast", label: "Toast", help: "Short-lived floating notifications.", layer: "viz-ui" },
        WasmEntry { id: "Modal", label: "Modal", help: "Backdrop dialog with focus trap.", layer: "viz-ui" },
        WasmEntry { id: "Tabs", label: "Tabs", help: "Tabbed section switcher.", layer: "viz-ui" },
        WasmEntry { id: "Accordion", label: "Accordion", help: "Collapsible panels.", layer: "viz-ui" },
        WasmEntry { id: "Icons", label: "Icons", help: "Built-in inline SVG icon set.", layer: "viz-ui" },
        WasmEntry { id: "TextInput", label: "Text input", help: "Bind a JS callback to a text field with debouncing.", layer: "viz-ui" },
        WasmEntry { id: "Select", label: "Select", help: "Bind a JS callback to a `<select>` change.", layer: "viz-ui" },
        WasmEntry { id: "Range", label: "Range", help: "Bind a JS callback to a range slider.", layer: "viz-ui" },
        WasmEntry { id: "Sortable", label: "Sortable", help: "Drag-to-reorder list with HTML5 drag and drop.", layer: "viz-ui" },
        WasmEntry { id: "Markdown", label: "Markdown", help: "pulldown-cmark backed Markdown → HTML renderer.", layer: "viz-ui" },
        WasmEntry { id: "Easing", label: "Easing", help: "Standard easing functions for tweens.", layer: "viz-ui" },
        WasmEntry { id: "Tween", label: "Tween", help: "Tiny request-animation-frame tween helper.", layer: "viz-ui" },
    ]);

    // ── tools ──
    #[cfg(feature = "tools")]
    entries.extend([
        WasmEntry { id: "ToolRegistry", label: "Tool registry", help: "Register, lazy-load, exec and pipe WASM CLI tools (e.g. minimap2, samtools via biowasm/Aioli).", layer: "tools" },
    ]);

    let _ = json!(()); // keep `serde_json::json` import alive in trimmed builds
    entries
}
