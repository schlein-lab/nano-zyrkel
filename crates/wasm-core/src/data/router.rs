//! # Router — hash-based client-side router
//!
//! A minimal `#/route` router for multi-section nano-zyrkels (helix
//! has 10 modules; vusTracker has gene / variant / detail views).
//! No regex, no nested routes — just exact matches against the URL
//! fragment plus a single optional `:param`.
//!
//! Two ways to use it:
//!
//! 1. Register routes once at startup with [`Router::on`], then call
//!    [`Router::start`] to handle the initial route + future
//!    `hashchange` events.
//! 2. Treat it as plain navigation helpers via [`Router::navigate`]
//!    and [`Router::current`].
//!
//! ## Example
//!
//! ```js
//! import { Router } from './core/wasm/nano_zyrkel_wasm_core.js';
//!
//! const router = new Router();
//! router.on('/',          ()    => render_home());
//! router.on('/gene/:id',  (p)  => render_gene(p.id));
//! router.on('/about',     ()    => render_about());
//! router.start();
//!
//! // Programmatic navigation
//! Router.navigate('/gene/BRCA1');
//! ```

use serde_json::{Map, Value};
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::Event;

struct Route {
    pattern: Vec<String>,
    has_param: Option<usize>,
    handler: js_sys::Function,
}

#[wasm_bindgen]
pub struct Router {
    routes: Rc<RefCell<Vec<Route>>>,
    fallback: Rc<RefCell<Option<js_sys::Function>>>,
}

#[wasm_bindgen]
impl Router {
    /// Build an empty router.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Router {
        Router {
            routes: Rc::new(RefCell::new(Vec::new())),
            fallback: Rc::new(RefCell::new(None)),
        }
    }

    /// Register a route. The pattern may contain a single `:param`
    /// segment (e.g. `/gene/:id`); the captured value is passed to the
    /// handler as `{ id: "BRCA1" }`.
    #[wasm_bindgen]
    pub fn on(&self, pattern: &str, handler: js_sys::Function) {
        let segments: Vec<String> = split_pattern(pattern);
        let has_param = segments.iter().position(|s| s.starts_with(':'));
        self.routes.borrow_mut().push(Route {
            pattern: segments,
            has_param,
            handler,
        });
    }

    /// Register a fallback handler used when no route matches.
    #[wasm_bindgen(js_name = onNotFound)]
    pub fn on_not_found(&self, handler: js_sys::Function) {
        *self.fallback.borrow_mut() = Some(handler);
    }

    /// Start the router: dispatch the current route immediately and
    /// listen for `hashchange` events thereafter.
    #[wasm_bindgen]
    pub fn start(&self) -> Result<(), JsValue> {
        let routes = Rc::clone(&self.routes);
        let fallback = Rc::clone(&self.fallback);
        let window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;

        // Initial dispatch.
        let initial_path = current_path()?;
        dispatch(&routes, &fallback, &initial_path);

        // Listen for hashchange.
        let routes_for_listener = Rc::clone(&self.routes);
        let fallback_for_listener = Rc::clone(&self.fallback);
        let listener = Closure::wrap(Box::new(move |_: Event| {
            if let Ok(p) = current_path() {
                dispatch(&routes_for_listener, &fallback_for_listener, &p);
            }
        }) as Box<dyn FnMut(Event)>);
        window
            .add_event_listener_with_callback("hashchange", listener.as_ref().unchecked_ref())?;
        listener.forget();
        Ok(())
    }

    /// Programmatically navigate to a path. Updates the URL fragment;
    /// the registered handler fires via `hashchange`.
    #[wasm_bindgen]
    pub fn navigate(path: &str) -> Result<(), JsValue> {
        let window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
        window.location().set_hash(path)?;
        Ok(())
    }

    /// Return the current route fragment (without the leading `#`).
    #[wasm_bindgen]
    pub fn current() -> Result<String, JsValue> {
        current_path()
    }
}

impl Default for Router {
    fn default() -> Self {
        Self::new()
    }
}

fn current_path() -> Result<String, JsValue> {
    let window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
    let raw = window.location().hash()?;
    let trimmed = raw.trim_start_matches('#').to_string();
    Ok(if trimmed.is_empty() { "/".to_string() } else { trimmed })
}

fn dispatch(
    routes: &Rc<RefCell<Vec<Route>>>,
    fallback: &Rc<RefCell<Option<js_sys::Function>>>,
    path: &str,
) {
    let path_segments = split_pattern(path);
    let routes_borrow = routes.borrow();
    for route in routes_borrow.iter() {
        if route.pattern.len() != path_segments.len() {
            continue;
        }
        let mut params = Map::new();
        let mut matched = true;
        for (i, seg) in route.pattern.iter().enumerate() {
            if Some(i) == route.has_param {
                let key = seg.trim_start_matches(':').to_string();
                params.insert(key, Value::String(path_segments[i].clone()));
            } else if seg != &path_segments[i] {
                matched = false;
                break;
            }
        }
        if matched {
            let params_value = serde_wasm_bindgen::to_value(&Value::Object(params))
                .unwrap_or(JsValue::NULL);
            let _ = route.handler.call1(&JsValue::NULL, &params_value);
            return;
        }
    }
    if let Some(handler) = fallback.borrow().as_ref() {
        let _ = handler.call1(&JsValue::NULL, &JsValue::from_str(path));
    }
}

fn split_pattern(s: &str) -> Vec<String> {
    let trimmed = s.trim_start_matches('/').trim_end_matches('/');
    if trimmed.is_empty() {
        Vec::new()
    } else {
        trimmed.split('/').map(|s| s.to_string()).collect()
    }
}
