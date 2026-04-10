//! # Retry — exponential backoff for flaky network calls
//!
//! Wraps a fetch with retries when the underlying call throws or returns a
//! non-2xx response. The browser-side glue can call `Retry.fetchJson(url, 4)`
//! and get a JSON value back without writing the loop by hand.
//!
//! ## Example
//!
//! ```js
//! const data = await Retry.fetchJson('staging/.../latest.json', 4);
//! ```

use std::time::Duration;
use wasm_bindgen::prelude::*;

use super::loader::fetch_json;

/// Stateless namespace for retry helpers.
#[wasm_bindgen]
pub struct Retry;

#[wasm_bindgen]
impl Retry {
    /// Fetch a URL with exponential backoff. Doubles the delay between
    /// attempts starting at 200ms and capped at 5 seconds.
    #[wasm_bindgen(js_name = fetchJson)]
    pub async fn fetch_json(url: &str, max_attempts: u32) -> Result<JsValue, JsValue> {
        let attempts = max_attempts.max(1);
        let mut delay = Duration::from_millis(200);
        let mut last_err: Option<JsValue> = None;

        for attempt in 0..attempts {
            match fetch_json(url).await {
                Ok(v) => return Ok(v),
                Err(e) => last_err = Some(e),
            }
            if attempt + 1 < attempts {
                sleep(delay).await;
                delay = (delay * 2).min(Duration::from_secs(5));
            }
        }
        Err(last_err.unwrap_or_else(|| JsValue::from_str("retry exhausted")))
    }
}

/// Async sleep using `setTimeout`.
async fn sleep(duration: Duration) {
    let promise = js_sys::Promise::new(&mut |resolve, _reject| {
        let win = web_sys::window().expect("no window");
        let _ = win
            .set_timeout_with_callback_and_timeout_and_arguments_0(
                &resolve,
                duration.as_millis() as i32,
            );
    });
    let _ = wasm_bindgen_futures::JsFuture::from(promise).await;
}
