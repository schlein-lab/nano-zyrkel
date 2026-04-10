//! # Markdown — `pulldown-cmark`-backed Markdown → HTML renderer
//!
//! Wraps the popular `pulldown-cmark` parser in a single, ergonomic
//! `Markdown::to_html` call. Tables, footnotes, strikethrough and
//! task lists are enabled by default. The output is a plain HTML
//! string ready to assign to `innerHTML`.
//!
//! ## Example
//!
//! ```js
//! document.getElementById('out').innerHTML = Markdown.toHtml(text);
//! ```

use pulldown_cmark::{html, Options, Parser};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Markdown;

#[wasm_bindgen]
impl Markdown {
    /// Render `markdown` to HTML.
    #[wasm_bindgen(js_name = toHtml)]
    pub fn to_html(markdown: &str) -> String {
        let mut options = Options::empty();
        options.insert(Options::ENABLE_STRIKETHROUGH);
        options.insert(Options::ENABLE_TABLES);
        options.insert(Options::ENABLE_FOOTNOTES);
        options.insert(Options::ENABLE_TASKLISTS);
        options.insert(Options::ENABLE_SMART_PUNCTUATION);

        let parser = Parser::new_ext(markdown, options);
        let mut out = String::new();
        html::push_html(&mut out, parser);
        out
    }
}
