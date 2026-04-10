//! # Stats — descriptive statistics on numeric arrays
//!
//! Pure functions over `Vec<f64>` that every browser-side nano-zyrkel can
//! reuse: mean, median, percentile, stddev, variance, min, max, linear
//! regression, correlation, chi-square. Implemented in Rust so dashboards
//! that aggregate large numeric series stay smooth.
//!
//! ## Example
//!
//! ```js
//! import { Stats } from './core/wasm/nano_zyrkel_wasm_core.js';
//!
//! const allele_freqs = [0.21, 0.18, 0.34, 0.05];
//! const median = Stats.median(allele_freqs);
//! const stddev = Stats.std_dev(allele_freqs);
//! ```

use wasm_bindgen::prelude::*;

/// Namespace struct for descriptive statistics. All methods are static and
/// take a JavaScript array of numbers as input.
#[wasm_bindgen]
pub struct Stats;

#[wasm_bindgen]
impl Stats {
    /// Arithmetic mean. Returns 0 for empty input.
    #[wasm_bindgen]
    pub fn mean(values: Vec<f64>) -> f64 {
        if values.is_empty() {
            return 0.0;
        }
        values.iter().sum::<f64>() / values.len() as f64
    }

    /// Median. Returns 0 for empty input. For even-length input the average
    /// of the two middle elements is returned.
    #[wasm_bindgen]
    pub fn median(values: Vec<f64>) -> f64 {
        let mut sorted = values;
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let n = sorted.len();
        if n == 0 {
            return 0.0;
        }
        if n % 2 == 1 {
            sorted[n / 2]
        } else {
            0.5 * (sorted[n / 2 - 1] + sorted[n / 2])
        }
    }

    /// Population standard deviation. Returns 0 for n < 2.
    #[wasm_bindgen(js_name = stdDev)]
    pub fn std_dev(values: Vec<f64>) -> f64 {
        Self::variance(values).sqrt()
    }

    /// Population variance. Returns 0 for n < 2.
    #[wasm_bindgen]
    pub fn variance(values: Vec<f64>) -> f64 {
        let n = values.len();
        if n < 2 {
            return 0.0;
        }
        let mean = values.iter().sum::<f64>() / n as f64;
        let sum_sq = values.iter().map(|v| (v - mean).powi(2)).sum::<f64>();
        sum_sq / n as f64
    }

    /// Quantile / percentile (linear interpolation between closest ranks).
    /// `p` is in `[0, 1]`. Returns 0 for empty input.
    #[wasm_bindgen]
    pub fn percentile(values: Vec<f64>, p: f64) -> f64 {
        if values.is_empty() {
            return 0.0;
        }
        let mut sorted = values;
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let p = p.clamp(0.0, 1.0);
        let pos = p * (sorted.len() as f64 - 1.0);
        let lo = pos.floor() as usize;
        let hi = pos.ceil() as usize;
        if lo == hi {
            sorted[lo]
        } else {
            sorted[lo] + (pos - lo as f64) * (sorted[hi] - sorted[lo])
        }
    }

    /// Minimum value. Returns `NaN` for empty input.
    #[wasm_bindgen]
    pub fn min(values: Vec<f64>) -> f64 {
        values
            .into_iter()
            .fold(f64::NAN, |acc, v| if acc.is_nan() || v < acc { v } else { acc })
    }

    /// Maximum value. Returns `NaN` for empty input.
    #[wasm_bindgen]
    pub fn max(values: Vec<f64>) -> f64 {
        values
            .into_iter()
            .fold(f64::NAN, |acc, v| if acc.is_nan() || v > acc { v } else { acc })
    }

    /// Sum of all values.
    #[wasm_bindgen]
    pub fn sum(values: Vec<f64>) -> f64 {
        values.iter().sum()
    }

    /// Pearson correlation coefficient. `xs` and `ys` must have the same
    /// length. Returns 0 for length-mismatched or constant input.
    #[wasm_bindgen]
    pub fn correlation(xs: Vec<f64>, ys: Vec<f64>) -> f64 {
        if xs.len() != ys.len() || xs.is_empty() {
            return 0.0;
        }
        let n = xs.len() as f64;
        let mx = xs.iter().sum::<f64>() / n;
        let my = ys.iter().sum::<f64>() / n;
        let mut num = 0.0;
        let mut dx2 = 0.0;
        let mut dy2 = 0.0;
        for i in 0..xs.len() {
            let dx = xs[i] - mx;
            let dy = ys[i] - my;
            num += dx * dy;
            dx2 += dx * dx;
            dy2 += dy * dy;
        }
        let den = (dx2 * dy2).sqrt();
        if den == 0.0 { 0.0 } else { num / den }
    }

    /// Ordinary least-squares linear regression. Returns `[slope, intercept]`
    /// as a two-element array. Returns `[0, 0]` for length-mismatched input.
    #[wasm_bindgen(js_name = linearRegression)]
    pub fn linear_regression(xs: Vec<f64>, ys: Vec<f64>) -> Vec<f64> {
        if xs.len() != ys.len() || xs.is_empty() {
            return vec![0.0, 0.0];
        }
        let n = xs.len() as f64;
        let sum_x: f64 = xs.iter().sum();
        let sum_y: f64 = ys.iter().sum();
        let sum_xy: f64 = xs.iter().zip(ys.iter()).map(|(x, y)| x * y).sum();
        let sum_xx: f64 = xs.iter().map(|x| x * x).sum();
        let denom = n * sum_xx - sum_x * sum_x;
        if denom == 0.0 {
            return vec![0.0, sum_y / n];
        }
        let slope = (n * sum_xy - sum_x * sum_y) / denom;
        let intercept = (sum_y - slope * sum_x) / n;
        vec![slope, intercept]
    }

    /// Chi-square goodness-of-fit between observed and expected frequencies.
    #[wasm_bindgen(js_name = chiSquare)]
    pub fn chi_square(observed: Vec<f64>, expected: Vec<f64>) -> f64 {
        if observed.len() != expected.len() {
            return 0.0;
        }
        let mut chi = 0.0;
        for i in 0..observed.len() {
            if expected[i] > 0.0 {
                let diff = observed[i] - expected[i];
                chi += (diff * diff) / expected[i];
            }
        }
        chi
    }
}
