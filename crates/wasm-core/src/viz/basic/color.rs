//! # ColorPalette — categorical, sequential and diverging palettes
//!
//! Three flavors of palette covering nearly every chart use-case:
//!
//! - **Categorical** — qualitative colors for discrete categories. Wraps
//!   around for indices > palette length.
//! - **Sequential** — interpolates linearly between two endpoint colors.
//!   Use it for heatmaps and continuous scales.
//! - **Diverging** — interpolates through a center color (e.g. red → white →
//!   blue) for values that diverge from a midpoint.
//!
//! Hex parsing is intentionally minimal: `#RRGGBB` only.

use wasm_bindgen::prelude::*;

const DEFAULT_CATEGORICAL: &[&str] = &[
    "#8B5CF6", "#06B6D4", "#22C55E", "#F59E0B", "#EF4444",
    "#3B82F6", "#EAB308", "#EC4899", "#14B8A6", "#A855F7",
    "#F97316", "#84CC16",
];

/// Categorical palette: ordered list of colors that wraps around.
#[wasm_bindgen]
pub struct CategoricalPalette {
    colors: Vec<String>,
}

#[wasm_bindgen]
impl CategoricalPalette {
    /// Built-in 12-color qualitative palette tuned for the Zyrkel brand.
    #[wasm_bindgen(js_name = zyrkelDefault)]
    pub fn zyrkel_default() -> CategoricalPalette {
        Self {
            colors: DEFAULT_CATEGORICAL.iter().map(|s| s.to_string()).collect(),
        }
    }

    /// Build a palette from an explicit list of `#RRGGBB` strings.
    #[wasm_bindgen(constructor)]
    pub fn new(colors: Vec<JsValue>) -> CategoricalPalette {
        let parsed: Vec<String> = colors
            .into_iter()
            .filter_map(|v| v.as_string())
            .collect();
        let colors = if parsed.is_empty() {
            DEFAULT_CATEGORICAL.iter().map(|s| s.to_string()).collect()
        } else {
            parsed
        };
        Self { colors }
    }

    /// Pick the color at `index`, wrapping around for values >= length.
    #[wasm_bindgen]
    pub fn get(&self, index: usize) -> String {
        if self.colors.is_empty() {
            return "#000000".to_string();
        }
        self.colors[index % self.colors.len()].clone()
    }

    /// Number of colors in the palette.
    #[wasm_bindgen]
    pub fn len(&self) -> usize {
        self.colors.len()
    }
}

/// Two-color sequential palette interpolating from `start` to `end`.
#[wasm_bindgen]
pub struct SequentialPalette {
    start: (u8, u8, u8),
    end: (u8, u8, u8),
}

#[wasm_bindgen]
impl SequentialPalette {
    /// Build a sequential palette from two `#RRGGBB` endpoints.
    #[wasm_bindgen(constructor)]
    pub fn new(start: &str, end: &str) -> SequentialPalette {
        Self {
            start: parse_hex(start).unwrap_or((255, 255, 255)),
            end: parse_hex(end).unwrap_or((0, 0, 0)),
        }
    }

    /// Sample the palette at `t` in `[0, 1]`. Returns an `#RRGGBB` string.
    #[wasm_bindgen]
    pub fn sample(&self, t: f64) -> String {
        let t = t.clamp(0.0, 1.0);
        let r = lerp(self.start.0 as f64, self.end.0 as f64, t) as u8;
        let g = lerp(self.start.1 as f64, self.end.1 as f64, t) as u8;
        let b = lerp(self.start.2 as f64, self.end.2 as f64, t) as u8;
        format!("#{:02X}{:02X}{:02X}", r, g, b)
    }
}

/// Three-stop diverging palette through a center color.
#[wasm_bindgen]
pub struct DivergingPalette {
    low: (u8, u8, u8),
    mid: (u8, u8, u8),
    high: (u8, u8, u8),
}

#[wasm_bindgen]
impl DivergingPalette {
    /// Build a diverging palette from three `#RRGGBB` stops.
    #[wasm_bindgen(constructor)]
    pub fn new(low: &str, mid: &str, high: &str) -> DivergingPalette {
        Self {
            low: parse_hex(low).unwrap_or((255, 0, 0)),
            mid: parse_hex(mid).unwrap_or((255, 255, 255)),
            high: parse_hex(high).unwrap_or((0, 0, 255)),
        }
    }

    /// Sample at `t` in `[-1, 1]` where `0` is the center.
    #[wasm_bindgen]
    pub fn sample(&self, t: f64) -> String {
        let t = t.clamp(-1.0, 1.0);
        let (a, b, k) = if t < 0.0 {
            (self.low, self.mid, t + 1.0) // -1 → low, 0 → mid
        } else {
            (self.mid, self.high, t)      // 0 → mid, 1 → high
        };
        let r = lerp(a.0 as f64, b.0 as f64, k) as u8;
        let g = lerp(a.1 as f64, b.1 as f64, k) as u8;
        let bl = lerp(a.2 as f64, b.2 as f64, k) as u8;
        format!("#{:02X}{:02X}{:02X}", r, g, bl)
    }
}

fn parse_hex(s: &str) -> Option<(u8, u8, u8)> {
    let s = s.trim_start_matches('#');
    if s.len() != 6 {
        return None;
    }
    let r = u8::from_str_radix(&s[0..2], 16).ok()?;
    let g = u8::from_str_radix(&s[2..4], 16).ok()?;
    let b = u8::from_str_radix(&s[4..6], 16).ok()?;
    Some((r, g, b))
}

fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}
