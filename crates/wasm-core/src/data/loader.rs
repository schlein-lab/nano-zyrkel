//! # DataLoader — fetch JSON from the network
//!
//! Wraps the browser `fetch` API in a small, ergonomic class that the user
//! repo's JavaScript glue can call without thinking about response handling
//! or JSON parsing. The typical use-case is loading
//! `staging/{nano_id}/latest.json` written by the binary core.
//!
//! ## Example
//!
//! ```js
//! import init, { DataLoader } from './core/wasm/nano_zyrkel_wasm_core.js';
//! await init();
//!
//! const loader = new DataLoader();
//! const data = await loader.fetch('staging/literature-alert/latest.json');
//! console.log(data.matches.length);
//! ```

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, RequestMode, Response};

/// Generic JSON loader.
///
/// All methods return the parsed JSON as a `JsValue` so the calling code can
/// either use it directly or run it through `serde-wasm-bindgen` to convert
/// into typed structs.
#[wasm_bindgen]
pub struct DataLoader {
    base_url: String,
}

#[wasm_bindgen]
impl DataLoader {
    /// Create a new loader with no base URL prefix. Paths passed to
    /// [`DataLoader::fetch`] are resolved against the document's origin.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { base_url: String::new() }
    }

    /// Create a loader that prefixes every relative path with `base`.
    /// Useful when the data lives on a different host or under a CDN path.
    #[wasm_bindgen(js_name = withBase)]
    pub fn with_base(base: &str) -> Self {
        Self { base_url: base.trim_end_matches('/').to_string() }
    }

    /// Fetch a JSON document and return it as a `JsValue`.
    ///
    /// Throws a JS error on network failure or non-2xx response.
    #[wasm_bindgen]
    pub async fn fetch(&self, path: &str) -> Result<JsValue, JsValue> {
        let url = self.resolve(path);
        let value = fetch_json(&url).await?;
        Ok(value)
    }

    /// Fetch text content (any MIME type) and return it as a string.
    #[wasm_bindgen(js_name = fetchText)]
    pub async fn fetch_text(&self, path: &str) -> Result<String, JsValue> {
        let url = self.resolve(path);
        let text = fetch_text_inner(&url).await?;
        Ok(text)
    }

    fn resolve(&self, path: &str) -> String {
        if self.base_url.is_empty() || path.starts_with("http://") || path.starts_with("https://") {
            path.to_string()
        } else {
            format!("{}/{}", self.base_url, path.trim_start_matches('/'))
        }
    }
}

impl Default for DataLoader {
    fn default() -> Self {
        Self::new()
    }
}

/// Internal: perform a GET request and parse the body as JSON.
pub(crate) async fn fetch_json(url: &str) -> Result<JsValue, JsValue> {
    let opts = RequestInit::new();
    opts.set_method("GET");
    opts.set_mode(RequestMode::Cors);

    let request = Request::new_with_str_and_init(url, &opts)?;
    request.headers().set("Accept", "application/json")?;

    let window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
    let resp: Response = resp_value.dyn_into()?;

    if !resp.ok() {
        return Err(JsValue::from_str(&format!(
            "HTTP {} for {}",
            resp.status(),
            url
        )));
    }

    let json = JsFuture::from(resp.json()?).await?;
    Ok(json)
}

/// Internal: perform a GET request and return the body as text.
pub(crate) async fn fetch_text_inner(url: &str) -> Result<String, JsValue> {
    let opts = RequestInit::new();
    opts.set_method("GET");
    opts.set_mode(RequestMode::Cors);

    let request = Request::new_with_str_and_init(url, &opts)?;

    let window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
    let resp: Response = resp_value.dyn_into()?;

    if !resp.ok() {
        return Err(JsValue::from_str(&format!(
            "HTTP {} for {}",
            resp.status(),
            url
        )));
    }

    let text_value = JsFuture::from(resp.text()?).await?;
    Ok(text_value.as_string().unwrap_or_default())
}
