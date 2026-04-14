//! # ToolRegistry — register, load and execute WASM CLI tools in the browser
//!
//! A generic tool router that lets any nano-zyrkel load third-party WASM
//! tools (minimap2, samtools, bedtools, …) via [Aioli](https://biowasm.com)
//! and run them from JavaScript with a unified API.
//!
//! The registry handles lazy loading (tools are fetched only on first use),
//! file mounting (virtual FS for tool input/output), and pipeline execution
//! (chain multiple tools with stdout→stdin piping).
//!
//! ## Example
//!
//! ```js
//! import init, { ToolRegistry } from './core/wasm/nano_zyrkel_wasm_core.js';
//! await init();
//!
//! const tools = new ToolRegistry();
//! await tools.register('minimap2', '2.22', 'biowasm');
//! await tools.register('samtools', '1.17', 'biowasm');
//!
//! // Mount files, run a command, get stdout
//! const result = await tools.exec('minimap2', ['-a', 'ref.fa', 'query.fa'], {
//!   'ref.fa': refText,
//!   'query.fa': queryText,
//! });
//! console.log(result.stdout);
//!
//! // Pipeline: minimap2 | samtools view -bS -
//! const bam = await tools.pipe([
//!   { tool: 'minimap2', args: ['-a', 'ref.fa', 'query.fa'] },
//!   { tool: 'samtools', args: ['view', '-bS', '-'] },
//! ], { 'ref.fa': refText, 'query.fa': queryText });
//! ```
//!
//! ## Design decisions
//!
//! - **Aioli compatibility**: The registry wraps Aioli rather than replacing
//!   it. Aioli is the de-facto standard for running bioinformatics WASM tools
//!   and handles SharedArrayBuffer, COOP/COEP, and tool-specific quirks.
//!
//! - **Lazy loading**: Tools are fetched from the CDN only when first needed.
//!   This keeps the initial page load fast.
//!
//! - **CDN abstraction**: Currently only `biowasm` is supported as a CDN
//!   provider. The `cdn` parameter exists so future providers (e.g. a self-
//!   hosted mirror) can be added without API changes.
//!
//! - **Feature-gated**: Behind the `tools` feature so nano-zyrkels that do
//!   not need tool execution pay zero cost.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

// ── Types ──────────────────────────────────────────────────────────────

/// Descriptor for a registered tool. Stored until the tool is actually
/// needed; only then do we call `Aioli([ { tool, version } ])` to load
/// the WASM module.
#[derive(Clone, Debug)]
#[allow(dead_code)] // cdn reserved for future CDN providers
struct ToolDescriptor {
    name: String,
    version: String,
    cdn: String,
    /// The live Aioli instance (created on first exec). We store it as a
    /// `JsValue` because the concrete type lives in JS land.
    instance: Option<JsValue>,
}

/// Result of a single tool invocation.
#[wasm_bindgen]
pub struct ToolResult {
    stdout: String,
    stderr: String,
    elapsed_ms: f64,
}

#[wasm_bindgen]
impl ToolResult {
    /// Standard output of the tool.
    #[wasm_bindgen(getter)]
    pub fn stdout(&self) -> String {
        self.stdout.clone()
    }

    /// Standard error of the tool.
    #[wasm_bindgen(getter)]
    pub fn stderr(&self) -> String {
        self.stderr.clone()
    }

    /// Wall-clock time in milliseconds.
    #[wasm_bindgen(getter, js_name = elapsedMs)]
    pub fn elapsed_ms(&self) -> f64 {
        self.elapsed_ms
    }
}

/// Status of a single registered tool.
#[wasm_bindgen]
pub struct ToolStatus {
    name: String,
    version: String,
    loaded: bool,
}

#[wasm_bindgen]
impl ToolStatus {
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn version(&self) -> String {
        self.version.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn loaded(&self) -> bool {
        self.loaded
    }
}

// ── Registry ───────────────────────────────────────────────────────────

/// Central registry for WASM CLI tools. Create one per nano-zyrkel and
/// register the tools it needs; they are lazy-loaded on first use.
#[wasm_bindgen]
pub struct ToolRegistry {
    tools: Rc<RefCell<HashMap<String, ToolDescriptor>>>,
}

#[wasm_bindgen]
impl ToolRegistry {
    /// Create an empty registry.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            tools: Rc::new(RefCell::new(HashMap::new())),
        }
    }

    /// Declare a tool. It is **not** loaded yet — only on first `exec`.
    ///
    /// - `name`: Tool name as known by the CDN (e.g. `"minimap2"`).
    /// - `version`: Exact version string (e.g. `"2.22"`).
    /// - `cdn`: CDN provider. Currently only `"biowasm"` is supported.
    #[wasm_bindgen]
    pub fn register(&self, name: &str, version: &str, cdn: &str) {
        self.tools.borrow_mut().insert(
            name.to_string(),
            ToolDescriptor {
                name: name.to_string(),
                version: version.to_string(),
                cdn: cdn.to_string(),
                instance: None,
            },
        );
    }

    /// Register multiple tools from a JS array of `{name, version, cdn?}` objects.
    /// Convenience for reading the tool list from `hats/config.json`.
    #[wasm_bindgen(js_name = registerAll)]
    pub fn register_all(&self, tools_array: JsValue) -> Result<(), JsValue> {
        let arr: js_sys::Array = tools_array.dyn_into().map_err(|_| {
            JsValue::from_str("registerAll expects an array of {name, version, cdn?}")
        })?;
        for item in arr.iter() {
            let name = js_sys::Reflect::get(&item, &"name".into())?
                .as_string()
                .ok_or_else(|| JsValue::from_str("tool.name must be a string"))?;
            let version = js_sys::Reflect::get(&item, &"version".into())?
                .as_string()
                .ok_or_else(|| JsValue::from_str("tool.version must be a string"))?;
            let cdn = js_sys::Reflect::get(&item, &"cdn".into())
                .ok()
                .and_then(|v| v.as_string())
                .unwrap_or_else(|| "biowasm".to_string());
            self.register(&name, &version, &cdn);
        }
        Ok(())
    }

    /// Ensure a tool's WASM module is loaded. Called automatically by
    /// `exec`, but can be called explicitly for eager loading.
    #[wasm_bindgen(js_name = ensureLoaded)]
    pub async fn ensure_loaded(&self, name: &str) -> Result<(), JsValue> {
        // Check if already loaded.
        {
            let tools = self.tools.borrow();
            let desc = tools
                .get(name)
                .ok_or_else(|| JsValue::from_str(&format!("tool '{}' not registered", name)))?;
            if desc.instance.is_some() {
                return Ok(());
            }
        }

        // Load via Aioli.
        let (tool_name, tool_version) = {
            let tools = self.tools.borrow();
            let desc = &tools[name];
            (desc.name.clone(), desc.version.clone())
        };

        let window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
        let aioli_ctor = js_sys::Reflect::get(&window, &"Aioli".into()).map_err(|_| {
            JsValue::from_str(
                "Aioli not found. Load it first: <script src='https://biowasm.com/cdn/v3/aioli.js'></script>",
            )
        })?;

        if !aioli_ctor.is_function() {
            return Err(JsValue::from_str("window.Aioli is not a constructor"));
        }

        // Build the tool spec: [{ tool: name, version: version }]
        let spec = js_sys::Object::new();
        js_sys::Reflect::set(&spec, &"tool".into(), &JsValue::from_str(&tool_name))?;
        js_sys::Reflect::set(&spec, &"version".into(), &JsValue::from_str(&tool_version))?;
        let spec_array = js_sys::Array::new();
        spec_array.push(&spec);

        // Aioli opts
        let opts = js_sys::Object::new();
        js_sys::Reflect::set(&opts, &"printInterleaved".into(), &JsValue::FALSE)?;

        // new Aioli([{ tool, version }], opts) — use low-level JS interop
        let ctor_args = js_sys::Array::of2(&spec_array, &opts);
        let aioli_fn: js_sys::Function = aioli_ctor.dyn_into()?;
        let instance_promise = js_sys::Reflect::construct(&aioli_fn, &ctor_args)
            .map_err(|e| JsValue::from_str(&format!("Aioli construct failed: {:?}", e)))?;
        let instance = JsFuture::from(js_sys::Promise::from(instance_promise)).await?;

        self.tools.borrow_mut().get_mut(name).unwrap().instance = Some(instance);
        Ok(())
    }

    /// Mount files into a tool's virtual filesystem, run a command, and
    /// return the result.
    ///
    /// - `name`: Registered tool name.
    /// - `args`: Command-line arguments as a JS array of strings.
    /// - `files`: Optional object `{ filename: content_string }` to mount
    ///   before execution.
    #[wasm_bindgen]
    pub async fn exec(
        &self,
        name: &str,
        args: JsValue,
        files: JsValue,
    ) -> Result<ToolResult, JsValue> {
        let t0 = now_ms();

        // Ensure loaded.
        self.ensure_loaded(name).await?;

        let instance = {
            let tools = self.tools.borrow();
            tools[name]
                .instance
                .clone()
                .ok_or_else(|| JsValue::from_str("tool not loaded"))?
        };

        // Mount files if provided.
        if !files.is_null() && !files.is_undefined() {
            let entries = js_sys::Object::entries(&files.dyn_into::<js_sys::Object>()?);
            let mount_array = js_sys::Array::new();
            for entry in entries.iter() {
                let pair: js_sys::Array = entry.dyn_into()?;
                let filename = pair.get(0).as_string().unwrap_or_default();
                let content = pair.get(1);
                let file_obj = js_sys::Object::new();
                js_sys::Reflect::set(&file_obj, &"name".into(), &JsValue::from_str(&filename))?;
                js_sys::Reflect::set(&file_obj, &"data".into(), &content)?;
                mount_array.push(&file_obj);
            }

            let mount_fn = js_sys::Reflect::get(&instance, &"mount".into())?;
            let mount_fn: js_sys::Function = mount_fn.dyn_into()?;
            let mount_promise = mount_fn.call1(&instance, &mount_array)?;
            JsFuture::from(js_sys::Promise::from(mount_promise)).await?;
        }

        // Build the command string: "toolname arg1 arg2 …"
        let tool_name = {
            let tools = self.tools.borrow();
            tools[name].name.clone()
        };

        let cmd = if let Some(arr) = args.dyn_ref::<js_sys::Array>() {
            let parts: Vec<String> = arr
                .iter()
                .filter_map(|v| v.as_string())
                .collect();
            format!("{} {}", tool_name, parts.join(" "))
        } else if let Some(s) = args.as_string() {
            if s.starts_with(&tool_name) {
                s
            } else {
                format!("{} {}", tool_name, s)
            }
        } else {
            tool_name.clone()
        };

        // Execute.
        let exec_fn = js_sys::Reflect::get(&instance, &"exec".into())?;
        let exec_fn: js_sys::Function = exec_fn.dyn_into()?;
        let result_promise = exec_fn.call1(&instance, &JsValue::from_str(&cmd))?;
        let result = JsFuture::from(js_sys::Promise::from(result_promise)).await?;

        // Parse result. Aioli returns either a string or { stdout, stderr }.
        let (stdout, stderr) = if let Some(s) = result.as_string() {
            (s, String::new())
        } else {
            let stdout = js_sys::Reflect::get(&result, &"stdout".into())
                .ok()
                .and_then(|v| v.as_string())
                .unwrap_or_default();
            let stderr = js_sys::Reflect::get(&result, &"stderr".into())
                .ok()
                .and_then(|v| v.as_string())
                .unwrap_or_default();
            (stdout, stderr)
        };

        let elapsed_ms = now_ms() - t0;

        Ok(ToolResult {
            stdout,
            stderr,
            elapsed_ms,
        })
    }

    /// Run a pipeline of tools. Each step's stdout is piped to the next
    /// step's stdin via a temporary file.
    ///
    /// `steps` is a JS array of `{ tool: string, args: string[] }` objects.
    /// `files` are mounted before the first step.
    #[wasm_bindgen]
    pub async fn pipe(
        &self,
        steps: JsValue,
        files: JsValue,
    ) -> Result<ToolResult, JsValue> {
        let t0 = now_ms();
        let steps_arr: js_sys::Array = steps.dyn_into().map_err(|_| {
            JsValue::from_str("pipe expects an array of {tool, args}")
        })?;

        if steps_arr.length() == 0 {
            return Err(JsValue::from_str("pipe needs at least one step"));
        }

        let mut last_stdout = String::new();
        let mut last_stderr = String::new();

        for (i, step) in steps_arr.iter().enumerate() {
            let tool = js_sys::Reflect::get(&step, &"tool".into())?
                .as_string()
                .ok_or_else(|| JsValue::from_str("step.tool must be a string"))?;
            let args = js_sys::Reflect::get(&step, &"args".into())
                .unwrap_or(JsValue::NULL);

            // For the first step, mount the user-provided files.
            // For subsequent steps, mount the previous stdout as "stdin.txt"
            // and replace any "-" arg with "stdin.txt".
            let step_files = if i == 0 {
                files.clone()
            } else {
                let obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &obj,
                    &"_pipe_stdin".into(),
                    &JsValue::from_str(&last_stdout),
                )?;
                obj.into()
            };

            // Rewrite "-" in args to "_pipe_stdin" for piped steps.
            let final_args = if i > 0 {
                if let Some(arr) = args.dyn_ref::<js_sys::Array>() {
                    let rewritten = js_sys::Array::new();
                    for a in arr.iter() {
                        if a.as_string().as_deref() == Some("-") {
                            rewritten.push(&JsValue::from_str("_pipe_stdin"));
                        } else {
                            rewritten.push(&a);
                        }
                    }
                    rewritten.into()
                } else {
                    args
                }
            } else {
                args
            };

            let result = self.exec(&tool, final_args, step_files).await?;
            last_stdout = result.stdout;
            last_stderr = result.stderr;
        }

        Ok(ToolResult {
            stdout: last_stdout,
            stderr: last_stderr,
            elapsed_ms: now_ms() - t0,
        })
    }

    /// Return the status of all registered tools.
    #[wasm_bindgen]
    pub fn status(&self) -> Vec<ToolStatus> {
        self.tools
            .borrow()
            .values()
            .map(|d| ToolStatus {
                name: d.name.clone(),
                version: d.version.clone(),
                loaded: d.instance.is_some(),
            })
            .collect()
    }

    /// Check whether a specific tool is loaded.
    #[wasm_bindgen(js_name = isLoaded)]
    pub fn is_loaded(&self, name: &str) -> bool {
        self.tools
            .borrow()
            .get(name)
            .map_or(false, |d| d.instance.is_some())
    }

    /// Unload a tool, freeing its WASM instance. The tool can be
    /// re-loaded later via `exec` or `ensureLoaded`.
    #[wasm_bindgen]
    pub fn unload(&self, name: &str) {
        if let Some(desc) = self.tools.borrow_mut().get_mut(name) {
            desc.instance = None;
        }
    }

    /// Number of registered tools.
    #[wasm_bindgen(getter)]
    pub fn count(&self) -> usize {
        self.tools.borrow().len()
    }
}

impl Default for ToolRegistry {
    fn default() -> Self {
        Self::new()
    }
}

// ── Helpers ────────────────────────────────────────────────────────────

fn now_ms() -> f64 {
    web_sys::window()
        .and_then(|w| w.performance())
        .map_or(0.0, |p| p.now())
}
