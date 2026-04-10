//! # WebSocketClient — wraps the browser WebSocket API
//!
//! Lets a browser-side nano-zyrkel hold a long-lived WebSocket
//! connection without having to know the imperative event-listener
//! pattern. The wrapper exposes constructor + per-event setters and
//! handles JSON parsing for both directions.
//!
//! ## Example
//!
//! ```js
//! import { WebSocketClient } from './core/wasm/nano_zyrkel_wasm_core.js';
//!
//! const ws = new WebSocketClient('wss://api.example.com/stream');
//! ws.onOpen(() => console.log('connected'));
//! ws.onJson(payload => render(payload));
//! ws.onClose(() => reconnect_later());
//!
//! ws.sendJson({ subscribe: 'events' });
//! ```

use wasm_bindgen::closure::Closure;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{CloseEvent, Event, MessageEvent, WebSocket};

#[wasm_bindgen]
pub struct WebSocketClient {
    socket: WebSocket,
}

#[wasm_bindgen]
impl WebSocketClient {
    /// Open a new WebSocket connection. The handshake completes
    /// asynchronously — register an `onOpen` handler to be notified.
    #[wasm_bindgen(constructor)]
    pub fn new(url: &str) -> Result<WebSocketClient, JsValue> {
        let socket = WebSocket::new(url)?;
        Ok(WebSocketClient { socket })
    }

    /// Register a handler fired when the connection opens.
    #[wasm_bindgen(js_name = onOpen)]
    pub fn on_open(&self, callback: js_sys::Function) {
        let cb = callback.clone();
        let listener = Closure::wrap(Box::new(move |_: Event| {
            let _ = cb.call0(&JsValue::NULL);
        }) as Box<dyn FnMut(Event)>);
        self.socket
            .set_onopen(Some(listener.as_ref().unchecked_ref()));
        listener.forget();
    }

    /// Register a handler fired when the connection closes.
    #[wasm_bindgen(js_name = onClose)]
    pub fn on_close(&self, callback: js_sys::Function) {
        let cb = callback.clone();
        let listener = Closure::wrap(Box::new(move |event: CloseEvent| {
            let _ = cb.call1(&JsValue::NULL, &JsValue::from_f64(event.code() as f64));
        }) as Box<dyn FnMut(CloseEvent)>);
        self.socket
            .set_onclose(Some(listener.as_ref().unchecked_ref()));
        listener.forget();
    }

    /// Register a handler fired when an error occurs on the socket.
    #[wasm_bindgen(js_name = onError)]
    pub fn on_error(&self, callback: js_sys::Function) {
        let cb = callback.clone();
        let listener = Closure::wrap(Box::new(move |_: Event| {
            let _ = cb.call0(&JsValue::NULL);
        }) as Box<dyn FnMut(Event)>);
        self.socket
            .set_onerror(Some(listener.as_ref().unchecked_ref()));
        listener.forget();
    }

    /// Register a handler that receives every text message as a string.
    #[wasm_bindgen(js_name = onText)]
    pub fn on_text(&self, callback: js_sys::Function) {
        let cb = callback.clone();
        let listener = Closure::wrap(Box::new(move |event: MessageEvent| {
            if let Some(text) = event.data().as_string() {
                let _ = cb.call1(&JsValue::NULL, &JsValue::from_str(&text));
            }
        }) as Box<dyn FnMut(MessageEvent)>);
        self.socket
            .set_onmessage(Some(listener.as_ref().unchecked_ref()));
        listener.forget();
    }

    /// Register a handler that parses every text message as JSON and
    /// forwards the parsed value. Messages that fail to parse are
    /// silently ignored — register `onText` for raw access.
    #[wasm_bindgen(js_name = onJson)]
    pub fn on_json(&self, callback: js_sys::Function) {
        let cb = callback.clone();
        let listener = Closure::wrap(Box::new(move |event: MessageEvent| {
            if let Some(text) = event.data().as_string() {
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let Ok(js) = serde_wasm_bindgen::to_value(&value) {
                        let _ = cb.call1(&JsValue::NULL, &js);
                    }
                }
            }
        }) as Box<dyn FnMut(MessageEvent)>);
        self.socket
            .set_onmessage(Some(listener.as_ref().unchecked_ref()));
        listener.forget();
    }

    /// Send a text frame to the server.
    #[wasm_bindgen(js_name = sendText)]
    pub fn send_text(&self, text: &str) -> Result<(), JsValue> {
        self.socket.send_with_str(text)
    }

    /// Serialize a JS value as JSON and send it as a text frame.
    #[wasm_bindgen(js_name = sendJson)]
    pub fn send_json(&self, value: JsValue) -> Result<(), JsValue> {
        let v: serde_json::Value = serde_wasm_bindgen::from_value(value)
            .map_err(|e| JsValue::from_str(&format!("websocket payload not parseable: {e}")))?;
        let text = serde_json::to_string(&v)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        self.socket.send_with_str(&text)
    }

    /// Close the connection cleanly.
    #[wasm_bindgen]
    pub fn close(&self) -> Result<(), JsValue> {
        self.socket.close()
    }

    /// Underlying ready state (`0=connecting`, `1=open`, `2=closing`,
    /// `3=closed`).
    #[wasm_bindgen(js_name = readyState)]
    pub fn ready_state(&self) -> u16 {
        self.socket.ready_state()
    }
}
