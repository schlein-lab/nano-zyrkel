//! # Scale — map data values to pixel coordinates
//!
//! Three flavors that cover the vast majority of dashboards:
//!
//! - **Linear** — `y = a * x + b` between two domain/range pairs.
//! - **Log** — log10 of the domain mapped linearly into the range.
//! - **Time** — same as linear but treats the domain as Unix milliseconds for
//!   convenience when wiring up tick formatting.
//!
//! All scales are immutable, cheap to clone and `#[wasm_bindgen]`.

use wasm_bindgen::prelude::*;

#[derive(Clone, Copy)]
enum Kind {
    Linear,
    Log,
    Time,
}

/// Maps a domain `(d0, d1)` onto a range `(r0, r1)` using a configurable
/// function. Inverted ranges are supported (useful when mapping to canvas
/// Y coordinates which grow downwards).
#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Scale {
    kind: Kind,
    domain_min: f64,
    domain_max: f64,
    range_min: f64,
    range_max: f64,
}

#[wasm_bindgen]
impl Scale {
    /// Linear scale.
    #[wasm_bindgen]
    pub fn linear(domain_min: f64, domain_max: f64, range_min: f64, range_max: f64) -> Scale {
        Scale { kind: Kind::Linear, domain_min, domain_max, range_min, range_max }
    }

    /// Logarithmic (base 10) scale. Domain values must be positive; values
    /// `<= 0` map to `range_min`.
    #[wasm_bindgen]
    pub fn log(domain_min: f64, domain_max: f64, range_min: f64, range_max: f64) -> Scale {
        Scale { kind: Kind::Log, domain_min, domain_max, range_min, range_max }
    }

    /// Time scale. Identical math to linear; the type is kept distinct so
    /// downstream code (axes, formatters) can treat it differently.
    #[wasm_bindgen]
    pub fn time(domain_min: f64, domain_max: f64, range_min: f64, range_max: f64) -> Scale {
        Scale { kind: Kind::Time, domain_min, domain_max, range_min, range_max }
    }

    /// Project a single domain value onto the configured range.
    #[wasm_bindgen]
    pub fn map(&self, value: f64) -> f64 {
        match self.kind {
            Kind::Linear | Kind::Time => {
                let span = self.domain_max - self.domain_min;
                if span == 0.0 {
                    return self.range_min;
                }
                let t = (value - self.domain_min) / span;
                self.range_min + t * (self.range_max - self.range_min)
            }
            Kind::Log => {
                if value <= 0.0 || self.domain_min <= 0.0 {
                    return self.range_min;
                }
                let lo = self.domain_min.log10();
                let hi = self.domain_max.log10();
                let span = hi - lo;
                if span == 0.0 {
                    return self.range_min;
                }
                let t = (value.log10() - lo) / span;
                self.range_min + t * (self.range_max - self.range_min)
            }
        }
    }

    /// Inverse projection: given a pixel coordinate, return the data value
    /// it would correspond to. Useful for tooltips and click handlers.
    #[wasm_bindgen]
    pub fn invert(&self, pixel: f64) -> f64 {
        let span = self.range_max - self.range_min;
        if span == 0.0 {
            return self.domain_min;
        }
        let t = (pixel - self.range_min) / span;
        match self.kind {
            Kind::Linear | Kind::Time => {
                self.domain_min + t * (self.domain_max - self.domain_min)
            }
            Kind::Log => {
                let lo = self.domain_min.log10();
                let hi = self.domain_max.log10();
                10f64.powf(lo + t * (hi - lo))
            }
        }
    }

    /// Compute `count` evenly spaced "nice" tick values across the domain.
    /// Currently a simple linear distribution; the API leaves room for
    /// smarter tick selection later.
    #[wasm_bindgen]
    pub fn ticks(&self, count: u32) -> Vec<f64> {
        let count = count.max(1);
        let mut out = Vec::with_capacity(count as usize);
        for i in 0..count {
            let t = i as f64 / (count.saturating_sub(1).max(1) as f64);
            out.push(self.domain_min + t * (self.domain_max - self.domain_min));
        }
        out
    }
}
