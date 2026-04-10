// nano-zyrkel SDK · Live Builder
//
// Single-page app that fetches the SDK template manifest from GitHub raw,
// renders a form per template based on its declared slots, and produces a
// downloadable zip of the materialised repo. Pure browser, no backend.

const RAW_BASE = "https://raw.githubusercontent.com/schlein-lab/nano-zyrkel/master";
const TPL_BASE = `${RAW_BASE}/templates`;

const state = {
  manifest: null,
  currentKind: "scaffold",
  currentTemplate: null,        // template.json contents
  currentTemplateMeta: null,    // entry from manifest.json
  fileCache: new Map(),         // raw template file -> body
  generatedFiles: new Map(),    // output path -> rendered body
  selectedFile: null,
};

const els = {
  status: document.getElementById("status"),
  list: document.getElementById("template-list"),
  tabs: document.querySelectorAll(".kind-tab"),
  formEmpty: document.getElementById("form-empty"),
  formHost: document.getElementById("form-host"),
  tplName: document.getElementById("tpl-name"),
  tplDescription: document.getElementById("tpl-description"),
  tplTags: document.getElementById("tpl-tags"),
  tplRequires: document.getElementById("tpl-requires"),
  slotsForm: document.getElementById("slots-form"),
  btnPreview: document.getElementById("btn-preview"),
  btnDownload: document.getElementById("btn-download"),
  preview: document.getElementById("preview"),
  previewCount: document.getElementById("preview-count"),
  fileList: document.getElementById("file-list"),
  fileContent: document.getElementById("file-content").querySelector("code"),
};

function setStatus(text, kind = "") {
  els.status.textContent = text;
  els.status.className = "status" + (kind ? " " + kind : "");
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function fetchText(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

async function loadManifest() {
  setStatus("loading manifest…");
  try {
    state.manifest = await fetchJson(`${TPL_BASE}/manifest.json`);
    setStatus(`v${state.manifest.version}`, "ok");
    renderList();
  } catch (e) {
    setStatus("manifest load failed", "error");
    console.error(e);
  }
}

function entriesForKind(kind) {
  if (!state.manifest) return [];
  if (kind === "scaffold") return state.manifest.scaffolds || [];
  if (kind === "theme") return state.manifest.themes || [];
  if (kind === "example") return state.manifest.examples || [];
  return [];
}

function renderList() {
  const entries = entriesForKind(state.currentKind);
  els.list.innerHTML = "";
  for (const entry of entries) {
    const li = document.createElement("li");
    li.dataset.id = entry.id;
    li.innerHTML = `
      <span class="tpl-name">${entry.id}</span>
      <span class="tpl-meta">${entry.path}</span>
    `;
    li.addEventListener("click", () => selectTemplate(entry));
    els.list.appendChild(li);
  }
}

async function selectTemplate(entry) {
  setStatus(`loading ${entry.id}…`);
  try {
    const tpl = await fetchJson(`${TPL_BASE}/${entry.manifest.replace(/^templates\//, "")}`);
    state.currentTemplate = tpl;
    state.currentTemplateMeta = entry;
    state.fileCache.clear();
    state.generatedFiles.clear();
    state.selectedFile = null;
    renderForm();
    setStatus(`ready: ${entry.id}`, "ok");

    document.querySelectorAll("#template-list li").forEach(li => {
      li.classList.toggle("active", li.dataset.id === entry.id);
    });
  } catch (e) {
    setStatus(`failed: ${entry.id}`, "error");
    console.error(e);
  }
}

function renderForm() {
  const tpl = state.currentTemplate;
  els.formEmpty.hidden = true;
  els.formHost.hidden = false;
  els.preview.hidden = true;

  els.tplName.textContent = tpl.name || tpl.id;
  els.tplDescription.textContent = tpl.description || "";

  els.tplTags.innerHTML = "";
  for (const tag of tpl.tags || []) {
    const li = document.createElement("li");
    li.textContent = tag;
    els.tplTags.appendChild(li);
  }

  els.tplRequires.innerHTML = "";
  if (tpl.requires) {
    for (const [k, v] of Object.entries(tpl.requires)) {
      const div = document.createElement("div");
      div.textContent = `${k}: ${Array.isArray(v) ? v.join(", ") : v}`;
      els.tplRequires.appendChild(div);
    }
  }

  els.slotsForm.innerHTML = "";
  for (const slot of tpl.slots || []) {
    els.slotsForm.appendChild(renderSlot(slot));
  }
}

function renderSlot(slot) {
  const wrap = document.createElement("div");
  wrap.className = "slot" + (slot.kind === "boolean" ? " checkbox" : "");

  const label = document.createElement("label");
  label.htmlFor = `slot-${slot.name}`;
  label.innerHTML = `${slot.label || slot.name}${slot.required ? ' <span class="req">required</span>' : ""}`;

  let input;
  switch (slot.kind) {
    case "multiline":
      input = document.createElement("textarea");
      input.value = slot.default ?? "";
      break;
    case "enum":
      input = document.createElement("select");
      for (const opt of slot.options || []) {
        const o = document.createElement("option");
        o.value = typeof opt === "string" ? opt : opt.value;
        o.textContent = typeof opt === "string" ? opt : (opt.label || opt.value);
        if (o.value === slot.default) o.selected = true;
        input.appendChild(o);
      }
      break;
    case "boolean":
      input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!slot.default;
      break;
    case "number":
      input = document.createElement("input");
      input.type = "number";
      input.value = slot.default ?? "";
      break;
    case "color":
      input = document.createElement("input");
      input.type = "color";
      input.value = slot.default || "#8B5CF6";
      break;
    case "url":
      input = document.createElement("input");
      input.type = "url";
      input.value = slot.default ?? "";
      input.placeholder = "https://…";
      break;
    case "slug":
    case "string":
    default:
      input = document.createElement("input");
      input.type = "text";
      input.value = slot.default ?? "";
      if (slot.kind === "slug") input.pattern = "[a-z0-9-]+";
      break;
  }
  input.id = `slot-${slot.name}`;
  input.name = slot.name;
  if (slot.required) input.required = true;

  wrap.appendChild(label);
  wrap.appendChild(input);

  if (slot.help) {
    const help = document.createElement("div");
    help.className = "help";
    help.textContent = slot.help;
    wrap.appendChild(help);
  }
  return wrap;
}

function collectSlotValues() {
  const values = {};
  for (const slot of state.currentTemplate.slots || []) {
    const el = document.getElementById(`slot-${slot.name}`);
    if (!el) continue;
    if (slot.kind === "boolean") values[slot.name] = el.checked ? "true" : "false";
    else values[slot.name] = el.value;
  }
  return values;
}

function substitute(text, values) {
  return text.replace(/\{\{([A-Z_][A-Z0-9_]*)\}\}/g, (_, key) => {
    return key in values ? values[key] : `{{${key}}}`;
  });
}

async function materialise() {
  const tpl = state.currentTemplate;
  const meta = state.currentTemplateMeta;
  const values = collectSlotValues();

  state.generatedFiles.clear();

  // Always include the template.json itself for traceability.
  const files = tpl.files || [];

  for (const relPath of files) {
    const url = `${TPL_BASE}/${meta.path.replace(/^templates\//, "")}/${relPath}`;
    let body;
    if (state.fileCache.has(url)) {
      body = state.fileCache.get(url);
    } else {
      try {
        body = await fetchText(url);
        state.fileCache.set(url, body);
      } catch (e) {
        body = `// missing in template: ${relPath}\n// ${e.message}`;
      }
    }
    state.generatedFiles.set(relPath, substitute(body, values));
  }

  // Include a minimal README pointer if not already present.
  if (!state.generatedFiles.has("README.md")) {
    const slug = values.NANO_ID || tpl.id;
    state.generatedFiles.set("README.md", `# ${slug}\n\nGenerated with the nano-zyrkel SDK live builder from \`${meta.id}\`.\n`);
  }

  return state.generatedFiles;
}

async function onPreview() {
  setStatus("materialising…");
  try {
    await materialise();
    renderPreview();
    setStatus(`${state.generatedFiles.size} files ready`, "ok");
  } catch (e) {
    setStatus("preview failed", "error");
    console.error(e);
  }
}

function renderPreview() {
  els.preview.hidden = false;
  els.previewCount.textContent = `${state.generatedFiles.size} files`;
  els.fileList.innerHTML = "";

  const paths = [...state.generatedFiles.keys()].sort();
  for (const path of paths) {
    const li = document.createElement("li");
    li.textContent = path;
    li.dataset.path = path;
    li.addEventListener("click", () => selectFile(path));
    els.fileList.appendChild(li);
  }

  if (paths.length > 0) selectFile(paths[0]);
}

function selectFile(path) {
  state.selectedFile = path;
  els.fileContent.textContent = state.generatedFiles.get(path) || "";
  document.querySelectorAll("#file-list li").forEach(li => {
    li.classList.toggle("active", li.dataset.path === path);
  });
}

async function onDownload() {
  setStatus("packaging zip…");
  try {
    if (state.generatedFiles.size === 0) await materialise();
    const zip = new JSZip();
    const slug = collectSlotValues().NANO_ID || state.currentTemplate.id;
    const root = zip.folder(slug);
    for (const [path, body] of state.generatedFiles) {
      root.file(path, body);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    setStatus(`downloaded ${slug}.zip`, "ok");
  } catch (e) {
    setStatus("download failed", "error");
    console.error(e);
  }
}

// Wire up
els.tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    state.currentKind = tab.dataset.kind;
    els.tabs.forEach(t => t.classList.toggle("active", t === tab));
    renderList();
  });
});
els.btnPreview.addEventListener("click", onPreview);
els.btnDownload.addEventListener("click", onDownload);

loadManifest();
