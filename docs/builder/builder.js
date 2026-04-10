/* ═══════════════════════════════════════════════════════════════
   nano-zyrkel Project Studio — builder.js
   Complete single-page app logic for creating autonomous agents.
   ═══════════════════════════════════════════════════════════════ */

// ─── A. State Engine ───────────────────────────────────────────
const state = {
  mode: 'showcase',
  inputMode: 'chat',
  zyrkelPort: null,
  wizardStep: 0,
  capabilities: new Set(),
  config: {
    id: '', description: '',
    type: '',
    scaffold: '',
    source: { url: '', method: 'GET', needs_browser: false },
    condition: { type: '', value: '', path: '', selector: '', regex: '', question: '', date: '', remind_at_days: [30,14,7,3,1], threshold: {}, key_field: '', min_changes: 1, max_age_hours: 24 },
    schedule: '0 8 * * *',
    silence_confirm: true,
    silence_freq: 'daily',
    notify: { telegram: true, discord: false, slack: false, email: false, message: '' },
    actions: [],
    approval: 'log_only',
    has_gui: false,
    theme: null,
    wasm_features: [],
    need_plugin: false,
    literature: null,
    maildesk: null,
    clinvar: null,
    variant_classifier: null,
    lang: 'de', ttl: null
  },
  chatHistory: [],
  generatedFiles: {},
  activeConfigTab: 'hats/config.json',
  fleetNanos: []
};

// ─── B. Showcase Data ──────────────────────────────────────────
const SHOWCASES = [
  { id: 'helix', repo: 'schlein-lab/nano-zyrkel-helix',
    live: 'https://schlein-lab.github.io/nano-zyrkel-helix/',
    title: 'Genetik-Lernplattform',
    desc: '10 interaktive Module mit echten Genomdaten \u2014 Hardy-Weinberg, Pedigree, Karyotyp, Tumor-Genetik, Pharmakogenetik. Alles im Browser, kein Server.',
    stack: ['wasm'], metrics: '10 Module \u00b7 gnomAD + ClinVar + COSMIC + PharmGKB',
    wow: 'L\u00e4uft komplett im Browser mit echten wissenschaftlichen Datenbanken',
    caps: ['visualize', 'compute', 'learn'] },
  { id: 'vusTracker', repo: 'schlein-lab/nano-zyrkel-vusTracker',
    live: 'https://schlein-lab.github.io/nano-zyrkel-vusTracker/',
    title: 'Variant Intelligence Platform',
    desc: 'Trackt 4.4M ClinVar-Varianten, erkennt Reklassifikationen in Echtzeit, Kaplan-Meier Survival-Kurven, VCF-Import per Drag & Drop.',
    stack: ['binary', 'wasm'], metrics: '4.4M Varianten \u00b7 alle 3h aktualisiert \u00b7 21.000+ Gene',
    wow: 'Verarbeitet Millionen Datens\u00e4tze alle 3 Stunden \u2014 kostenlos auf GitHub Actions',
    caps: ['fetch', 'compute', 'visualize', 'notify'] },
  { id: 'literatureAlert', repo: 'schlein-lab/nano-zyrkel-literatureAlert',
    title: 'Literature Research Bot',
    desc: 'Email-gesteuerter Recherche-Bot: Themen per Email einreichen, automatische Suche in PubMed, bioRxiv, medRxiv, CrossRef. T\u00e4glicher Digest.',
    stack: ['binary'], metrics: '4 Datenbanken \u00b7 t\u00e4glicher Digest \u00b7 Email + Telegram',
    wow: 'Durchsucht vier wissenschaftliche Datenbanken t\u00e4glich per Email-Auftrag',
    caps: ['fetch', 'email', 'notify'] },
  { id: 'maildesk', repo: 'schlein-lab/nano-zyrkel-maildesk',
    title: 'LLM Email-Agent',
    desc: 'Liest eingehende Emails, analysiert sie mit Claude, schl\u00e4gt Antworten vor und fragt per Telegram um Genehmigung bevor er antwortet.',
    stack: ['binary'], metrics: 'IMAP + SMTP + Claude + Telegram Approval',
    wow: 'Beantwortet Emails autonom, fragt bei Unsicherheit nach',
    caps: ['email', 'notify', 'compute'] },
  { id: 'showcase', repo: 'schlein-lab/nano-zyrkel-showcase',
    live: 'https://schlein-lab.github.io/nano-zyrkel-showcase/',
    title: 'Cinematic Portal Hub',
    desc: 'Animiertes Portal das alle nano-zyrkel-Projekte als interaktive Karten zeigt. Pure WASM, kein Backend.',
    stack: ['wasm'], metrics: 'Null Backend \u00b7 WASM Animation \u00b7 GitHub Pages',
    wow: 'Null Backend, pure WASM-Animation auf GitHub Pages',
    caps: ['visualize'] },
  { id: 'svLandscape', repo: 'schlein-lab/nano-zyrkel-svLandscape',
    title: 'Strukturvarianten-Visualisierung',
    desc: 'Interaktive Genom-Tracks mit animierten Ref\u2192Alt Ansichten und LLM-generierten Reports f\u00fcr strukturelle Varianten.',
    stack: ['binary', 'wasm'], metrics: 'Genom-Tracks \u00b7 LLM-Reports \u00b7 Animierte Visualisierung',
    wow: 'Interaktive Genom-Visualisierung mit KI-generierten Berichten',
    caps: ['fetch', 'compute', 'visualize'] }
];

// ─── C. Capabilities ──────────────────────────────────────────
const CAPABILITIES = [
  { id: 'fetch', icon: '\ud83d\udce1', label: 'Daten abrufen', hint: 'URLs, APIs, RSS, Datenbanken' },
  { id: 'store', icon: '\ud83d\udcbe', label: 'Daten speichern', hint: 'Git, S3, JSONL, API' },
  { id: 'visualize', icon: '\ud83d\udcca', label: 'Daten visualisieren', hint: 'Charts, Dashboards, Tracks' },
  { id: 'compute', icon: '\u26a1', label: 'Berechnen', hint: 'Statistik, Analyse, Transformation' },
  { id: 'notify', icon: '\ud83d\udd14', label: 'Benachrichtigen', hint: 'Telegram, Discord, Slack, Email' },
  { id: 'email', icon: '\ud83d\udce7', label: 'Emails verarbeiten', hint: 'IMAP lesen, SMTP senden, LLM' },
  { id: 'monitor', icon: '\ud83d\udc41', label: '\u00dcberwachen', hint: 'URLs, APIs, Cron-Jobs, AWS' },
  { id: 'api', icon: '\ud83d\udd0c', label: 'API bereitstellen', hint: 'JSON-Endpunkte auf GitHub Pages' },
  { id: 'learn', icon: '\ud83c\udf93', label: 'Lerninhalte', hint: 'Module, Quizze, interaktiv' },
  { id: 'cloud', icon: '\u2601\ufe0f', label: 'S3 / Cloud', hint: 'AWS, S3-Buckets, Cloud-Pipelines' },
  { id: 'actions', icon: '\u2699\ufe0f', label: 'GitHub Actions', hint: 'Workflows, CI/CD, Automation' },
  { id: 'webhooks', icon: '\ud83e\ude9d', label: 'Webhooks', hint: 'Eingehende Daten empfangen' }
];

// ─── D. Conditions ─────────────────────────────────────────────
const CONDITIONS = [
  { type: 'contains', name: 'Text-Suche', desc: 'Ein bestimmtes Wort taucht auf', example: '"freie Pl\u00e4tze"', free: true },
  { type: 'regex', name: 'Regul\u00e4rer Ausdruck', desc: 'Komplexes Muster erkennen', example: 'Preis: \\d+,\\d+ EUR', free: true },
  { type: 'css_selector', name: 'HTML-Element', desc: 'Element erscheint/verschwindet', example: '.registration-open', free: true },
  { type: 'json_path', name: 'JSON-Pfad', desc: 'Wert in API-Antwort pr\u00fcfen', example: '$.data.status == "open"', free: true },
  { type: 'rss_new_entry', name: 'RSS/Atom Feed', desc: 'Neue Eintr\u00e4ge im Feed', example: 'Automatisch erkannt', free: true },
  { type: 'changed', name: '\u00c4nderungs-Erkennung', desc: 'Irgendwas \u00e4ndert sich', example: 'Baseline-Vergleich', free: true },
  { type: 'threshold', name: 'Schwellwert', desc: 'Wert \u00fcber/unter Grenze', example: 'json:price > 50000', free: true },
  { type: 'stale', name: 'Alter pr\u00fcfen', desc: 'Feed \u00e4lter als X Stunden', example: 'max_age_hours: 24', free: true },
  { type: 'diff', name: 'Struktur-Diff', desc: 'Hinzugef\u00fcgt/entfernt/ge\u00e4ndert', example: 'min_changes: 10', free: true },
  { type: 'llm', name: 'KI-Frage', desc: 'Nat\u00fcrliche Sprache an die Seite', example: '"Ist die Anmeldung offen?"', free: false }
];

// ─── E. Schedules, Channels, Themes, WASM Features, Actions ───
const SCHEDULES = [
  { id: '5min', label: 'Alle 5 Min', cron: '*/5 * * * *', icon: '\u23f1' },
  { id: 'hourly', label: 'St\u00fcndlich', cron: '0 * * * *', icon: '\ud83d\udd50' },
  { id: '3hourly', label: 'Alle 3 Std', cron: '0 */3 * * *', icon: '\ud83d\udd52' },
  { id: 'daily8am', label: 'T\u00e4glich 8 Uhr', cron: '0 8 * * *', icon: '\ud83c\udf05' },
  { id: 'weekly_monday', label: 'Montags', cron: '0 8 * * 1', icon: '\ud83d\udcc5' },
  { id: 'custom', label: 'Eigener Cron', cron: '', icon: '\u270f\ufe0f' }
];

const CHANNELS = [
  { id: 'telegram', icon: '\u2708\ufe0f', label: 'Telegram' },
  { id: 'discord', icon: '\ud83d\udc7e', label: 'Discord' },
  { id: 'slack', icon: '\ud83d\udcac', label: 'Slack' },
  { id: 'email', icon: '\ud83d\udce8', label: 'Email' }
];

const THEMES = [
  { id: 'clinical', name: 'Clinical', colors: { bg: '#ffffff', text: '#1a1a2e', accent: '#2563eb', accent2: '#06b6d4', card: '#f8fafc' } },
  { id: 'dashboard', name: 'Dashboard', colors: { bg: '#0f172a', text: '#e2e8f0', accent: '#22d3ee', accent2: '#a78bfa', card: '#1e293b' } },
  { id: 'magazine', name: 'Magazine', colors: { bg: '#fefce8', text: '#1c1917', accent: '#b45309', accent2: '#059669', card: '#fffbeb' } },
  { id: 'minimal', name: 'Minimal', colors: { bg: '#ffffff', text: '#000000', accent: '#000000', accent2: '#666666', card: '#f5f5f5' } },
  { id: 'cinematic', name: 'Cinematic', colors: { bg: '#0a0a0a', text: '#fafafa', accent: '#8b5cf6', accent2: '#ec4899', card: '#171717' } },
  { id: 'multipage', name: 'Multipage', colors: { bg: '#f1f5f9', text: '#0f172a', accent: '#3b82f6', accent2: '#f97316', card: '#ffffff' } },
  { id: 'report', name: 'Report', colors: { bg: '#ffffff', text: '#1e293b', accent: '#0f766e', accent2: '#7c3aed', card: '#f8fafc' } },
  { id: 'card-grid', name: 'Card Grid', colors: { bg: '#18181b', text: '#fafafa', accent: '#f59e0b', accent2: '#06b6d4', card: '#27272a' } }
];

const WASM_FEATURES = [
  { id: 'data', name: 'Daten-Layer', desc: 'Fetch, parse, cache im Browser', components: 'fetch, JSON, CSV, IndexedDB' },
  { id: 'config', name: 'Konfiguration', desc: 'Einstellungen + Secrets-UI', components: 'settings, secrets, export' },
  { id: 'viz-basic', name: 'Basis-Charts', desc: 'Balken, Linien, Kreise', components: 'bar, line, pie, legend' },
  { id: 'viz-advanced', name: 'Erweiterte Charts', desc: 'Heatmaps, Sankey, Treemaps', components: 'heatmap, sankey, treemap' },
  { id: 'viz-spatial', name: 'Genom / Spatial', desc: 'Genom-Tracks, Karten, Karyotypen', components: 'tracks, ideogram, map' },
  { id: 'viz-ui', name: 'UI Widgets', desc: 'Tabellen, Filter, Drag & Drop', components: 'table, filter, dnd, tabs' }
];

const ACTION_TYPES = [
  { id: 'http_request', name: 'HTTP Request', desc: 'Webhook / API aufrufen', icon: '\ud83c\udf10' },
  { id: 'github_issue', name: 'GitHub Issue', desc: 'Issue erstellen', icon: '\ud83d\udcdd' },
  { id: 'github_pr', name: 'GitHub PR', desc: 'Pull Request erstellen', icon: '\ud83d\udd00' },
  { id: 'shell', name: 'Shell-Befehl', desc: 'Kommando ausf\u00fchren', icon: '\ud83d\udcbb' },
  { id: 'trigger_hat', name: 'Hat triggern', desc: 'Anderen nano-zyrkel starten', icon: '\ud83c\udfa9' },
  { id: 'publish_api', name: 'API publizieren', desc: 'JSON auf GitHub Pages', icon: '\ud83d\udce4' }
];

// ─── Builder System Prompt (for Chat) ──────────────────────────
const BUILDER_SYSTEM_PROMPT = `Du bist der nano-zyrkel Bauassistent. Du hilfst Nutzern, autonome Agenten (nano-zyrkels) zu konfigurieren.

Ein nano-zyrkel ist ein autonomer Agent der als GitHub-Repo lebt. Eine Rust-Binary (~5 MB) laeuft per Cron auf GitHub Actions. Optional: WASM-Dashboard im Browser.

TYPEN:
- watcher: URL/API ueberwachen, bei Aenderung benachrichtigen
- tracker: Daten regelmaessig sammeln und speichern
- deadline: Termine/Fristen ueberwachen mit Countdown
- crawler: Mehrere Seiten systematisch durchsuchen
- guardian: System-Health / Uptime Monitor
- maildesk: Emails mit LLM analysieren und beantworten
- literature_alert: Wissenschaftliche Literatur durchsuchen
- variant_classifier: Genetische Varianten klassifizieren
- clinvar: ClinVar-Datenbank ueberwachen
- data_pipeline: Daten verarbeiten und transformieren

BEDINGUNGEN: contains, regex, css_selector, json_path, rss_new_entry, changed, threshold, stale, diff, llm

AKTIONEN: http_request, github_issue, github_pr, shell, trigger_hat, publish_api

SCAFFOLDS: data-pipeline, monitor, interactive-app, showcase, newsletter

SCHEDULE: Cron-Syntax (z.B. "0 8 * * *" = taeglich 8 Uhr)

BENACHRICHTIGUNGEN: telegram, discord, slack, email

WASM FEATURES: data, config, viz-basic, viz-advanced, viz-spatial, viz-ui

THEMES: clinical, dashboard, magazine, minimal, cinematic, multipage, report, card-grid

Wenn du Konfigurationsfelder setzen willst, nutze HTML-Kommentare im Format:
<!-- FIELD:id=mein-watcher -->
<!-- FIELD:type=watcher -->
<!-- FIELD:description=Ueberwacht die Schwimmkurs-Seite -->
<!-- FIELD:source.url=https://example.com -->
<!-- FIELD:condition.type=contains -->
<!-- FIELD:condition.value=freie Plaetze -->
<!-- FIELD:schedule=0 */2 * * * -->
<!-- FIELD:scaffold=monitor -->
<!-- FIELD:has_gui=false -->
<!-- FIELD:notify.telegram=true -->

Antworte immer auf Deutsch. Sei kurz und hilfreich. Frage nach fehlenden Details.`;

// ─── F. Functions ──────────────────────────────────────────────

/* 1. init() */
function init() {
  renderShowcase();
  renderCapabilities();
  renderConditions();
  renderSchedule();
  renderChannels();
  renderThemes();
  renderFeatures();
  renderWizardProgress();
  updatePreviews();

  // Header nav tabs
  document.querySelectorAll('.header-nav .mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.disabled) return;
      switchMode(tab.dataset.mode);
    });
  });

  // Input mode tabs (chat/wizard)
  document.getElementById('input-tab-chat').addEventListener('click', () => switchInputMode('chat'));
  document.getElementById('input-tab-wizard').addEventListener('click', () => switchInputMode('wizard'));

  // Chat send
  document.getElementById('chat-send').addEventListener('click', handleChatSend);
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
  });

  // Auto-resize chat input
  const chatInput = document.getElementById('chat-input');
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  // Wizard navigation
  document.getElementById('wizard-next').addEventListener('click', wizardNext);
  document.getElementById('wizard-back').addEventListener('click', wizardBack);

  // Toggles
  document.getElementById('toggle-silence').addEventListener('click', function() {
    this.classList.toggle('on');
    state.config.silence_confirm = this.classList.contains('on');
    updatePreviews();
  });
  document.getElementById('toggle-plugin').addEventListener('click', function() {
    this.classList.toggle('on');
    state.config.need_plugin = this.classList.contains('on');
    updatePreviews();
  });

  // Approval select
  document.getElementById('approval-select').addEventListener('change', function() {
    state.config.approval = this.value;
    updatePreviews();
  });

  // Notification template
  document.getElementById('notify-template').addEventListener('input', function() {
    state.config.notify.message = this.value;
    updatePreviews();
  });

  // Config copy
  document.getElementById('config-copy').addEventListener('click', () => {
    const body = document.getElementById('config-body');
    navigator.clipboard.writeText(body.textContent).then(() => {
      const btn = document.getElementById('config-copy');
      btn.textContent = 'Kopiert!';
      setTimeout(() => btn.textContent = 'Kopieren', 1500);
    });
  });

  // Action add
  document.getElementById('action-add').addEventListener('click', showActionPicker);

  // Detect Zyrkel
  detectZyrkel();
}

/* 2. switchMode(mode) */
function switchMode(mode) {
  state.mode = mode;
  document.getElementById('section-showcase').classList.toggle('hidden', mode !== 'showcase');
  document.getElementById('section-showcase').style.display = mode === 'showcase' ? '' : 'none';
  document.getElementById('section-creator').classList.toggle('hidden', mode !== 'creator');
  document.getElementById('section-fleet').classList.toggle('visible', mode === 'fleet');
  document.getElementById('section-fleet').style.display = mode === 'fleet' ? 'block' : 'none';

  document.querySelectorAll('.header-nav .mode-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode);
  });

  if (mode === 'fleet' && state.zyrkelPort) loadFleet();
  if (mode === 'creator') updatePreviews();
}

/* 3. switchInputMode(mode) */
function switchInputMode(mode) {
  state.inputMode = mode;
  document.getElementById('chat-panel').classList.toggle('hidden', mode !== 'chat');
  document.getElementById('wizard-panel').classList.toggle('hidden', mode !== 'wizard');
  document.getElementById('input-tab-chat').classList.toggle('active', mode === 'chat');
  document.getElementById('input-tab-wizard').classList.toggle('active', mode === 'wizard');
}

/* 4. detectZyrkel() */
async function detectZyrkel() {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-text');
  dot.className = 'status-dot detecting';
  txt.textContent = 'Suche lokalen Zyrkel...';

  const ports = [37848, 37849, 37850, 37851, 37852, 37853];
  for (const port of ports) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(`http://localhost:${port}/api/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        state.zyrkelPort = port;
        dot.className = 'status-dot connected';
        txt.textContent = `Zyrkel verbunden (Port ${port})`;
        document.getElementById('tab-fleet').disabled = false;
        return;
      }
    } catch (_) { /* next port */ }
  }
  dot.className = 'status-dot';
  txt.textContent = 'Kein Zyrkel gefunden';
  if (state.inputMode === 'chat') {
    renderChatMsg('system', 'Kein lokaler Zyrkel erreichbar. Der KI-Assistent ben\u00f6tigt einen laufenden Zyrkel. Du kannst stattdessen den Schritt-f\u00fcr-Schritt Wizard nutzen.');
  }
}

/* 5. renderShowcase() */
function renderShowcase() {
  const grid = document.getElementById('showcase-grid');
  grid.innerHTML = SHOWCASES.map(s => {
    const badges = s.stack.map(b => `<span class="badge badge-${b}">${b}</span>`).join('');
    const liveBtn = s.live
      ? `<a href="${s.live}" target="_blank" class="btn-ghost">Live ansehen</a>`
      : `<a href="https://github.com/${s.repo}" target="_blank" class="btn-ghost">Repository</a>`;
    return `
    <div class="showcase-card" data-id="${s.id}">
      <div class="showcase-card-header">
        <span class="showcase-card-title">${s.title}</span>
        <div class="showcase-card-badges">${badges}</div>
      </div>
      <div class="showcase-card-desc">${s.desc}</div>
      <div class="showcase-card-metrics">${s.metrics}</div>
      <div class="showcase-card-wow">${s.wow}</div>
      <div class="showcase-card-actions">
        ${liveBtn}
        <button class="btn-accent2" onclick="buildLike('${s.id}')">So etwas bauen</button>
      </div>
    </div>`;
  }).join('');
}

/* buildLike — enter creator with caps from a showcase */
function buildLike(showcaseId) {
  const s = SHOWCASES.find(x => x.id === showcaseId);
  if (!s) return;
  state.capabilities = new Set(s.caps);
  autoDetectType();
  switchMode('creator');
  switchInputMode('wizard');
  renderCapabilities();
  updateMatchingProjects();
  updatePreviews();
}

/* 6. renderCapabilities() */
function renderCapabilities() {
  const grid = document.getElementById('cap-grid');
  grid.innerHTML = CAPABILITIES.map(c => {
    const sel = state.capabilities.has(c.id) ? ' selected' : '';
    return `<div class="cap-tag${sel}" data-cap="${c.id}">
      <span class="cap-icon">${c.icon}</span>
      <div>
        <div class="cap-label">${c.label}</div>
        <div class="cap-hint">${c.hint}</div>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.cap-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const id = tag.dataset.cap;
      if (state.capabilities.has(id)) state.capabilities.delete(id);
      else state.capabilities.add(id);
      tag.classList.toggle('selected');
      autoDetectType();
      updateMatchingProjects();
      updatePreviews();
    });
  });
}

/* 7. updateMatchingProjects() */
function updateMatchingProjects() {
  const strip = document.getElementById('match-strip');
  const list = document.getElementById('match-list');
  if (state.capabilities.size === 0) {
    strip.classList.remove('visible');
    return;
  }
  const matches = SHOWCASES.filter(s =>
    s.caps.some(c => state.capabilities.has(c))
  );
  if (matches.length === 0) {
    strip.classList.remove('visible');
    return;
  }
  strip.classList.add('visible');
  list.innerHTML = matches.map(m =>
    `<span class="match-chip">${m.title}</span>`
  ).join('');
}

/* 8. autoDetectType() */
function autoDetectType() {
  const caps = state.capabilities;
  const has = id => caps.has(id);

  if (has('email') && has('notify')) {
    state.config.type = 'maildesk';
    state.config.scaffold = 'data-pipeline';
  } else if (has('monitor') && has('notify')) {
    state.config.type = 'watcher';
    state.config.scaffold = 'data-pipeline';
  } else if (has('monitor') && has('fetch')) {
    state.config.type = 'guardian';
    state.config.scaffold = 'monitor';
  } else if (has('fetch') && has('compute') && has('visualize')) {
    state.config.type = 'data_pipeline';
    state.config.scaffold = 'interactive-app';
    state.config.has_gui = true;
  } else if (has('learn') && (has('compute') || has('visualize'))) {
    state.config.type = 'data_pipeline';
    state.config.scaffold = 'interactive-app';
    state.config.has_gui = true;
  } else if (has('fetch') && has('compute')) {
    state.config.type = 'data_pipeline';
    state.config.scaffold = 'data-pipeline';
  } else if (has('fetch') && has('notify')) {
    state.config.type = 'tracker';
    state.config.scaffold = 'data-pipeline';
  } else if (has('visualize') && caps.size === 1) {
    state.config.type = 'data_pipeline';
    state.config.scaffold = 'showcase';
    state.config.has_gui = true;
  } else if (has('monitor')) {
    state.config.type = 'watcher';
    state.config.scaffold = 'monitor';
  } else if (has('fetch')) {
    state.config.type = 'crawler';
    state.config.scaffold = 'data-pipeline';
  } else if (has('notify')) {
    state.config.type = 'watcher';
    state.config.scaffold = 'data-pipeline';
  } else if (has('cloud') || has('store')) {
    state.config.type = 'data_pipeline';
    state.config.scaffold = 'data-pipeline';
  } else if (has('actions') || has('webhooks')) {
    state.config.type = 'data_pipeline';
    state.config.scaffold = 'data-pipeline';
  } else if (has('api')) {
    state.config.type = 'data_pipeline';
    state.config.scaffold = 'data-pipeline';
  } else {
    state.config.type = 'watcher';
    state.config.scaffold = 'data-pipeline';
  }

  if (has('visualize') || has('learn')) {
    state.config.has_gui = true;
  }

  // Show/hide dashboard preview
  const dashSection = document.getElementById('preview-dashboard');
  if (dashSection) {
    dashSection.classList.toggle('hidden', !state.config.has_gui);
  }
}

/* 9. renderStep1Dynamic(container) — step 2 dynamic fields */
function renderStep1Dynamic(container) {
  const caps = state.capabilities;
  let html = '';

  html += `<div class="form-group">
    <label class="form-label">Projekt-ID</label>
    <input class="form-input" id="field-id" placeholder="z.B. mein-watcher" value="${esc(state.config.id)}">
    <div class="form-hint">Wird als Repository-Name und Binary-Name verwendet</div>
  </div>`;

  html += `<div class="form-group">
    <label class="form-label">Beschreibung</label>
    <textarea class="form-textarea" id="field-desc" rows="2" placeholder="Was macht dieser nano-zyrkel?">${esc(state.config.description)}</textarea>
  </div>`;

  if (caps.has('fetch') || caps.has('monitor') || caps.has('api') || caps.has('webhooks')) {
    html += `<div class="form-group">
      <label class="form-label">Quell-URL</label>
      <input class="form-input" id="field-url" placeholder="https://example.com/api/data" value="${esc(state.config.source.url)}">
    </div>`;
    html += `<div class="form-group">
      <label class="form-label">HTTP-Methode</label>
      <select class="form-select" id="field-method">
        <option value="GET" ${state.config.source.method==='GET'?'selected':''}>GET</option>
        <option value="POST" ${state.config.source.method==='POST'?'selected':''}>POST</option>
        <option value="HEAD" ${state.config.source.method==='HEAD'?'selected':''}>HEAD</option>
      </select>
    </div>`;
    html += `<div class="toggle-row">
      <span>Browser ben\u00f6tigt (JavaScript-Rendering)</span>
      <div class="toggle${state.config.source.needs_browser?' on':''}" id="toggle-browser"></div>
    </div>`;
  }

  if (caps.has('email')) {
    html += `<div class="form-group">
      <label class="form-label">IMAP Server</label>
      <input class="form-input" id="field-imap" placeholder="imap.gmail.com:993" value="">
    </div>`;
    html += `<div class="form-group">
      <label class="form-label">SMTP Server</label>
      <input class="form-input" id="field-smtp" placeholder="smtp.gmail.com:587" value="">
    </div>`;
  }

  if (caps.has('store') || caps.has('cloud')) {
    html += `<div class="form-group">
      <label class="form-label">Speicher-Ziel</label>
      <select class="form-select" id="field-store-target">
        <option value="git">Git Repository</option>
        <option value="s3">S3 Bucket</option>
        <option value="jsonl">JSONL Datei</option>
        <option value="api">Externe API</option>
      </select>
    </div>`;
  }

  if (caps.has('visualize') || caps.has('learn')) {
    html += `<div class="form-group">
      <label class="form-label">Dashboard-Typ</label>
      <select class="form-select" id="field-dash-type">
        <option value="single-page">Single Page Dashboard</option>
        <option value="multi-page">Multi Page App</option>
        <option value="report">Report / PDF-Stil</option>
        <option value="card-grid">Card Grid</option>
      </select>
    </div>`;
  }

  container.innerHTML = html;

  // Attach listeners
  const fieldId = container.querySelector('#field-id');
  if (fieldId) fieldId.addEventListener('input', () => { state.config.id = fieldId.value; updatePreviews(); });
  const fieldDesc = container.querySelector('#field-desc');
  if (fieldDesc) fieldDesc.addEventListener('input', () => { state.config.description = fieldDesc.value; updatePreviews(); });
  const fieldUrl = container.querySelector('#field-url');
  if (fieldUrl) fieldUrl.addEventListener('input', () => { state.config.source.url = fieldUrl.value; updatePreviews(); });
  const fieldMethod = container.querySelector('#field-method');
  if (fieldMethod) fieldMethod.addEventListener('change', () => { state.config.source.method = fieldMethod.value; updatePreviews(); });
  const toggleBrowser = container.querySelector('#toggle-browser');
  if (toggleBrowser) toggleBrowser.addEventListener('click', function() {
    this.classList.toggle('on');
    state.config.source.needs_browser = this.classList.contains('on');
    updatePreviews();
  });
}

/* 10. renderConditions() */
function renderConditions() {
  const grid = document.getElementById('condition-grid');
  grid.innerHTML = CONDITIONS.map(c => {
    const sel = state.config.condition.type === c.type ? ' selected' : '';
    const freeTag = c.free ? '' : '<span style="color:var(--warn);font-size:10px;margin-left:4px">(KI)</span>';
    return `<div class="condition-card${sel}" data-type="${c.type}">
      <div class="condition-card-name">${c.name}${freeTag}</div>
      <div class="condition-card-desc">${c.desc}</div>
      <div class="condition-card-example">${c.example}</div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.condition-card').forEach(card => {
    card.addEventListener('click', () => {
      grid.querySelectorAll('.condition-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.config.condition.type = card.dataset.type;
      renderConditionDetail();
      updatePreviews();
    });
  });
}

/* renderConditionDetail() */
function renderConditionDetail() {
  const detail = document.getElementById('condition-detail');
  const t = state.config.condition.type;
  let html = '';

  if (t === 'contains') {
    html = `<div class="form-group mt-md">
      <label class="form-label">Suchbegriff</label>
      <input class="form-input" id="cond-value" placeholder="z.B. freie Pl\u00e4tze" value="${esc(state.config.condition.value)}">
    </div>`;
  } else if (t === 'regex') {
    html = `<div class="form-group mt-md">
      <label class="form-label">Regex-Pattern</label>
      <input class="form-input" id="cond-regex" placeholder="z.B. Preis:\\s*\\d+" value="${esc(state.config.condition.regex)}">
    </div>`;
  } else if (t === 'css_selector') {
    html = `<div class="form-group mt-md">
      <label class="form-label">CSS Selector</label>
      <input class="form-input" id="cond-selector" placeholder="z.B. .registration-open" value="${esc(state.config.condition.selector)}">
    </div>`;
  } else if (t === 'json_path') {
    html = `<div class="form-group mt-md">
      <label class="form-label">JSON Path + Bedingung</label>
      <input class="form-input" id="cond-path" placeholder='z.B. $.data.status == "open"' value="${esc(state.config.condition.path)}">
    </div>`;
  } else if (t === 'threshold') {
    html = `<div class="form-group mt-md">
      <label class="form-label">Feld</label>
      <input class="form-input" id="cond-keyfield" placeholder="z.B. price" value="${esc(state.config.condition.key_field)}">
    </div>
    <div class="form-group">
      <label class="form-label">Schwellwert</label>
      <input class="form-input" id="cond-threshval" placeholder="z.B. 50000" value="${esc(state.config.condition.value)}">
    </div>`;
  } else if (t === 'stale') {
    html = `<div class="form-group mt-md">
      <label class="form-label">Max. Alter (Stunden)</label>
      <input class="form-input" type="number" id="cond-maxage" placeholder="24" value="${state.config.condition.max_age_hours}">
    </div>`;
  } else if (t === 'diff') {
    html = `<div class="form-group mt-md">
      <label class="form-label">Min. \u00c4nderungen</label>
      <input class="form-input" type="number" id="cond-minchanges" placeholder="1" value="${state.config.condition.min_changes}">
    </div>`;
  } else if (t === 'llm') {
    html = `<div class="form-group mt-md">
      <label class="form-label">Frage an die KI</label>
      <textarea class="form-textarea" id="cond-question" rows="2" placeholder='z.B. "Ist die Anmeldung offen?"'>${esc(state.config.condition.question)}</textarea>
    </div>`;
  } else if (t === 'rss_new_entry' || t === 'changed') {
    html = `<div class="form-group mt-md">
      <div class="form-hint">Keine weiteren Einstellungen n\u00f6tig \u2014 wird automatisch erkannt.</div>
    </div>`;
  }

  detail.innerHTML = html;

  // Attach condition detail listeners
  const condVal = detail.querySelector('#cond-value');
  if (condVal) condVal.addEventListener('input', () => { state.config.condition.value = condVal.value; updatePreviews(); });
  const condRegex = detail.querySelector('#cond-regex');
  if (condRegex) condRegex.addEventListener('input', () => { state.config.condition.regex = condRegex.value; updatePreviews(); });
  const condSel = detail.querySelector('#cond-selector');
  if (condSel) condSel.addEventListener('input', () => { state.config.condition.selector = condSel.value; updatePreviews(); });
  const condPath = detail.querySelector('#cond-path');
  if (condPath) condPath.addEventListener('input', () => { state.config.condition.path = condPath.value; updatePreviews(); });
  const condKey = detail.querySelector('#cond-keyfield');
  if (condKey) condKey.addEventListener('input', () => { state.config.condition.key_field = condKey.value; updatePreviews(); });
  const condThresh = detail.querySelector('#cond-threshval');
  if (condThresh) condThresh.addEventListener('input', () => { state.config.condition.value = condThresh.value; updatePreviews(); });
  const condAge = detail.querySelector('#cond-maxage');
  if (condAge) condAge.addEventListener('input', () => { state.config.condition.max_age_hours = parseInt(condAge.value) || 24; updatePreviews(); });
  const condMinCh = detail.querySelector('#cond-minchanges');
  if (condMinCh) condMinCh.addEventListener('input', () => { state.config.condition.min_changes = parseInt(condMinCh.value) || 1; updatePreviews(); });
  const condQ = detail.querySelector('#cond-question');
  if (condQ) condQ.addEventListener('input', () => { state.config.condition.question = condQ.value; updatePreviews(); });
}

/* 11. renderSchedule() */
function renderSchedule() {
  const grid = document.getElementById('schedule-grid');
  grid.innerHTML = SCHEDULES.map(s => {
    const sel = state.config.schedule === s.cron ? ' selected' : '';
    return `<div class="schedule-card${sel}" data-cron="${s.cron}" data-sid="${s.id}">
      <div class="schedule-card-icon">${s.icon}</div>
      <div class="schedule-card-label">${s.label}</div>
      <div class="schedule-card-cron">${s.cron || 'benutzerdefiniert'}</div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.schedule-card').forEach(card => {
    card.addEventListener('click', () => {
      grid.querySelectorAll('.schedule-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const sid = card.dataset.sid;
      if (sid === 'custom') {
        const cron = prompt('Cron-Ausdruck eingeben:', state.config.schedule);
        if (cron) state.config.schedule = cron;
      } else {
        state.config.schedule = card.dataset.cron;
      }
      renderNextRuns();
      updatePreviews();
    });
  });
  renderNextRuns();
}

/* renderNextRuns */
function renderNextRuns() {
  const el = document.getElementById('next-runs');
  const runs = computeNextRuns(state.config.schedule, 3);
  if (runs.length > 0) {
    el.innerHTML = 'N\u00e4chste L\u00e4ufe: ' + runs.join(' \u00b7 ');
  } else {
    el.innerHTML = '';
  }
}

/* 12. computeNextRuns(cron, n) */
function computeNextRuns(cron, n) {
  if (!cron) return [];
  const parts = cron.split(/\s+/);
  if (parts.length < 5) return [];

  const results = [];
  const now = new Date();
  let cursor = new Date(now.getTime());
  cursor.setSeconds(0, 0);

  const minutePart = parts[0];
  const hourPart = parts[1];
  const domPart = parts[2];
  const monthPart = parts[3];
  const dowPart = parts[4];

  function matchField(field, value, max) {
    if (field === '*') return true;
    if (field.startsWith('*/')) {
      const step = parseInt(field.slice(2));
      return step > 0 && value % step === 0;
    }
    const nums = field.split(',').map(Number);
    return nums.includes(value);
  }

  // Advance minute by minute (up to 30 days)
  const limit = now.getTime() + 30 * 24 * 60 * 60 * 1000;
  cursor.setMinutes(cursor.getMinutes() + 1);

  while (results.length < n && cursor.getTime() < limit) {
    const m = cursor.getMinutes();
    const h = cursor.getHours();
    const dom = cursor.getDate();
    const mon = cursor.getMonth() + 1;
    const dow = cursor.getDay();

    if (matchField(minutePart, m, 59) &&
        matchField(hourPart, h, 23) &&
        matchField(domPart, dom, 31) &&
        matchField(monthPart, mon, 12) &&
        matchField(dowPart, dow, 6)) {
      results.push(formatDateDE(cursor));
      // Skip to next minute to avoid duplicates
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return results;
}

function formatDateDE(d) {
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const pad = n => String(n).padStart(2, '0');
  return `${days[d.getDay()]} ${pad(d.getDate())}.${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* 13. renderChannels() */
function renderChannels() {
  const grid = document.getElementById('channel-grid');
  grid.innerHTML = CHANNELS.map(c => {
    const sel = state.config.notify[c.id] ? ' selected' : '';
    return `<div class="channel-card${sel}" data-channel="${c.id}">
      <span>${c.icon}</span>
      <span>${c.label}</span>
    </div>`;
  }).join('');
  grid.querySelectorAll('.channel-card').forEach(card => {
    card.addEventListener('click', () => {
      const ch = card.dataset.channel;
      state.config.notify[ch] = !state.config.notify[ch];
      card.classList.toggle('selected');
      updatePreviews();
    });
  });
}

/* 14. renderThemes() */
function renderThemes() {
  const gallery = document.getElementById('theme-gallery');
  gallery.innerHTML = THEMES.map(t => {
    const sel = state.config.theme === t.id ? ' selected' : '';
    const c = t.colors;
    return `<div class="theme-card${sel}" data-theme="${t.id}">
      <div class="theme-preview" style="background:${c.bg}">
        <div class="theme-preview-bar" style="background:${c.accent}"></div>
        <div class="theme-preview-row">
          <div class="theme-preview-col" style="background:${c.card}; border:1px solid ${c.accent}20"></div>
          <div class="theme-preview-col" style="background:${c.accent2}"></div>
        </div>
        <div class="theme-preview-row">
          <div class="theme-preview-col" style="background:${c.card}"></div>
          <div class="theme-preview-col" style="background:${c.card}"></div>
          <div class="theme-preview-col" style="background:${c.accent}40"></div>
        </div>
      </div>
      <div class="theme-name" style="color:${c.text};background:${c.bg}">${t.name}</div>
    </div>`;
  }).join('');
  gallery.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      gallery.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.config.theme = card.dataset.theme;
      updatePreviews();
    });
  });
}

/* 15. renderFeatures() */
function renderFeatures() {
  const grid = document.getElementById('feature-grid');
  grid.innerHTML = WASM_FEATURES.map(f => {
    const sel = state.config.wasm_features.includes(f.id) ? ' selected' : '';
    return `<div class="feature-card${sel}" data-feature="${f.id}">
      <div class="feature-card-name">${f.name}</div>
      <div class="feature-card-desc">${f.desc}</div>
      <div class="feature-card-components">${f.components}</div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
      const fid = card.dataset.feature;
      const idx = state.config.wasm_features.indexOf(fid);
      if (idx >= 0) state.config.wasm_features.splice(idx, 1);
      else state.config.wasm_features.push(fid);
      card.classList.toggle('selected');
      updatePreviews();
    });
  });
}

/* renderWizardProgress */
function renderWizardProgress() {
  const prog = document.getElementById('wizard-progress');
  const totalSteps = 6;
  let dots = '';
  for (let i = 0; i < totalSteps; i++) {
    const cls = i < state.wizardStep ? 'done' : i === state.wizardStep ? 'active' : '';
    dots += `<div class="wizard-step-dot ${cls}"></div>`;
  }
  prog.innerHTML = dots;
}

/* 16. renderResult() */
function renderResult() {
  generateAllFiles();
  const container = document.getElementById('result-content');
  let html = '';

  // Summary card
  const idStr = state.config.id || 'nano-zyrkel';
  const descStr = state.config.description || 'Kein Beschreibung angegeben';
  html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:20px;">
    <h3 style="font-size:16px;margin-bottom:8px;">${esc(idStr)}</h3>
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${esc(descStr)}</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      <span class="badge badge-binary">${state.config.type}</span>
      <span class="badge badge-wasm">${state.config.scaffold}</span>
      ${state.config.has_gui ? '<span class="badge badge-wasm">GUI</span>' : ''}
    </div>
  </div>`;

  // File list
  const files = Object.keys(state.generatedFiles);
  html += `<div class="preview-label">Generierte Dateien (${files.length})</div>`;
  html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;">`;
  files.forEach(f => {
    html += `<span class="form-chip" style="cursor:default">${f}</span>`;
  });
  html += `</div>`;

  container.innerHTML = html;
  updatePreviews();
}

/* 17. generateConfig() */
function generateConfig() {
  const c = state.config;
  const config = {
    id: c.id || 'my-nano-zyrkel',
    description: c.description || '',
    type: c.type || 'watcher',
    scaffold: c.scaffold || 'data-pipeline',
    source: {
      url: c.source.url || '',
      method: c.source.method || 'GET',
      needs_browser: c.source.needs_browser
    },
    condition: buildCondition(),
    schedule: c.schedule,
    silence: {
      confirm: c.silence_confirm,
      frequency: c.silence_freq
    },
    notify: {
      channels: Object.entries(c.notify)
        .filter(([k,v]) => v === true && k !== 'message')
        .map(([k]) => k),
      message: c.notify.message || '{id}: {summary}'
    },
    actions: c.actions.length > 0 ? c.actions : [{ type: 'log', detail: 'stdout' }],
    approval: c.approval,
    has_gui: c.has_gui,
    lang: c.lang,
    ttl: c.ttl
  };

  if (c.has_gui) {
    config.theme = c.theme || 'clinical';
    config.wasm_features = c.wasm_features;
  }

  if (c.need_plugin) config.plugin = true;

  if (c.type === 'literature_alert' && c.literature) config.literature = c.literature;
  if (c.type === 'maildesk' && c.maildesk) config.maildesk = c.maildesk;
  if (c.type === 'clinvar' && c.clinvar) config.clinvar = c.clinvar;
  if (c.type === 'variant_classifier' && c.variant_classifier) config.variant_classifier = c.variant_classifier;

  return JSON.stringify(config, null, 2);
}

function buildCondition() {
  const c = state.config.condition;
  const base = { type: c.type || 'changed' };
  switch (c.type) {
    case 'contains': base.value = c.value; break;
    case 'regex': base.regex = c.regex; break;
    case 'css_selector': base.selector = c.selector; break;
    case 'json_path': base.path = c.path; break;
    case 'threshold': base.key_field = c.key_field; base.value = c.value; break;
    case 'stale': base.max_age_hours = c.max_age_hours; break;
    case 'diff': base.min_changes = c.min_changes; break;
    case 'llm': base.question = c.question; break;
  }
  return base;
}

/* 18. generateWorkflow() */
function generateWorkflow() {
  const id = state.config.id || 'nano-zyrkel';
  const schedule = state.config.schedule || '0 8 * * *';
  return `name: "${id} Run"

on:
  schedule:
    - cron: "${schedule}"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download binary
        run: |
          curl -sL "https://github.com/schlein-lab/nano-zyrkel-${id}/releases/latest/download/${id}-linux-x86_64" -o ./${id}
          chmod +x ./${id}

      - name: Execute
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: \${{ secrets.TELEGRAM_CHAT_ID }}
          DISCORD_WEBHOOK_URL: \${{ secrets.DISCORD_WEBHOOK_URL }}
        run: ./${id} --config hats/config.json

      - name: Commit data changes
        run: |
          git config user.name "nano-zyrkel[bot]"
          git config user.email "nano-zyrkel[bot]@users.noreply.github.com"
          git add -A
          git diff --cached --quiet || git commit -m "chore: auto-update $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push
`;
}

/* 19. generateDeployWorkflow() */
function generateDeployWorkflow() {
  return `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
    paths: ["web/**", "data/**"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build WASM
        run: |
          curl -sL https://github.com/nickel-org/nickel.rs/releases/latest/download/wasm-pack-v0.12.1-x86_64-unknown-linux-musl.tar.gz | tar xz
          cd web && wasm-pack build --target web --release

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "web/dist"

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;
}

/* 20. generateVersions() */
function generateVersions() {
  const now = new Date().toISOString().split('T')[0];
  return JSON.stringify({
    schema: 1,
    id: state.config.id || 'nano-zyrkel',
    created: now,
    binary: '0.1.0',
    wasm: state.config.has_gui ? '0.1.0' : null,
    rust: '1.77.0',
    last_update: now
  }, null, 2);
}

/* 21. generateFrontend() */
function generateFrontend() {
  const t = THEMES.find(x => x.id === state.config.theme) || THEMES[0];
  const c = t.colors;
  const title = state.config.id || 'nano-zyrkel';
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <style>
    :root {
      --bg: ${c.bg}; --text: ${c.text}; --accent: ${c.accent};
      --accent2: ${c.accent2}; --card: ${c.card};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 1.8rem; margin-bottom: 1rem; }
    .card { background: var(--card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
    .accent { color: var(--accent); }
    .btn { background: var(--accent); color: white; border: none; padding: 0.5rem 1rem;
           border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${esc(title)}</h1>
    <p>${esc(state.config.description || 'Dashboard')}</p>
    <div class="card">
      <h2 class="accent">Status</h2>
      <p id="status">Lade Daten...</p>
    </div>
    <div class="card" id="data-view"></div>
  </div>
  <script type="module">
    // WASM init goes here
    async function init() {
      document.getElementById('status').textContent = 'Bereit';
    }
    init();
  </script>
</body>
</html>`;
}

/* 22. generatePlugin() */
function generatePlugin() {
  const id = (state.config.id || 'nano_zyrkel').replace(/-/g, '_');
  return `//! Custom plugin for ${id}
//! Compile with: cargo build --target wasm32-unknown-unknown --release

use std::collections::HashMap;

#[no_mangle]
pub extern "C" fn process(input_ptr: *const u8, input_len: usize) -> i32 {
    // Parse input
    let input = unsafe { std::slice::from_raw_parts(input_ptr, input_len) };
    let data: &str = std::str::from_utf8(input).unwrap_or("");

    // --- Custom logic here ---
    // Return 0 for success, non-zero for error
    0
}

#[no_mangle]
pub extern "C" fn version() -> u32 {
    1
}
`;
}

/* 23. generateReadme() */
function generateReadme() {
  const id = state.config.id || 'nano-zyrkel';
  const desc = state.config.description || 'Ein autonomer nano-zyrkel Agent.';
  const caps = [...state.capabilities];
  const capLabels = caps.map(c => {
    const cap = CAPABILITIES.find(x => x.id === c);
    return cap ? `${cap.icon} ${cap.label}` : c;
  });

  let features = capLabels.map(l => `- ${l}`).join('\n');
  let setup = `## Setup

1. Repository forken/klonen
2. Secrets in GitHub Settings setzen:`;

  if (state.config.notify.telegram) setup += '\n   - `TELEGRAM_BOT_TOKEN`\n   - `TELEGRAM_CHAT_ID`';
  if (state.config.notify.discord) setup += '\n   - `DISCORD_WEBHOOK_URL`';
  if (state.config.notify.slack) setup += '\n   - `SLACK_WEBHOOK_URL`';
  if (state.config.notify.email) setup += '\n   - `SMTP_USER`\n   - `SMTP_PASS`';

  setup += `\n3. GitHub Actions aktivieren
4. Fertig! Der nano-zyrkel l\u00e4uft automatisch nach Zeitplan.`;

  return `# ${id}

${desc}

## F\u00e4higkeiten

${features}

## Typ

**${state.config.type}** auf Scaffold **${state.config.scaffold}**

## Zeitplan

\`${state.config.schedule}\`

${setup}

## Technologie

- Rust Binary (~5 MB)
${state.config.has_gui ? '- WASM Dashboard (~80 KB)\n- GitHub Pages f\u00fcr Frontend' : ''}
- GitHub Actions f\u00fcr Automation
- Keine Server-Kosten

---
*Erstellt mit dem [nano-zyrkel Project Studio](https://schlein-lab.github.io/nano-zyrkel-showcase/)*
`;
}

/* 24. generateAllFiles() */
function generateAllFiles() {
  state.generatedFiles = {};
  state.generatedFiles['hats/config.json'] = generateConfig();
  state.generatedFiles['.github/workflows/run.yml'] = generateWorkflow();
  state.generatedFiles['.nano-zyrkel-versions.json'] = generateVersions();
  state.generatedFiles['README.md'] = generateReadme();

  if (state.config.has_gui) {
    state.generatedFiles['.github/workflows/deploy.yml'] = generateDeployWorkflow();
    state.generatedFiles['web/index.html'] = generateFrontend();
  }

  if (state.config.need_plugin) {
    state.generatedFiles['src/lib.rs'] = generatePlugin();
  }
}

/* 25. renderConfigBlock() */
function renderConfigBlock() {
  generateAllFiles();
  const tabs = document.getElementById('config-tabs');
  const body = document.getElementById('config-body');
  const files = Object.keys(state.generatedFiles);

  if (!files.includes(state.activeConfigTab)) {
    state.activeConfigTab = files[0] || 'hats/config.json';
  }

  tabs.innerHTML = files.map(f => {
    const short = f.split('/').pop();
    const active = f === state.activeConfigTab ? ' active' : '';
    return `<button class="config-tab${active}" data-file="${f}">${short}</button>`;
  }).join('');

  tabs.querySelectorAll('.config-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.activeConfigTab = tab.dataset.file;
      renderConfigBlock();
    });
  });

  const content = state.generatedFiles[state.activeConfigTab] || '';
  const isJson = state.activeConfigTab.endsWith('.json');
  body.innerHTML = isJson ? syntaxHighlight(content) : escHtml(content);
}

/* 26. syntaxHighlight(json) */
function syntaxHighlight(json) {
  if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
  json = escHtml(json);
  return json
    .replace(/"([^"]+)"(?=\s*:)/g, '<span class="key">"$1"</span>')
    .replace(/:\s*"([^"]*)"/g, ': <span class="str">"$1"</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="num">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="bool">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="bool">$1</span>');
}

/* 27. renderEmailPreviews() */
function renderEmailPreviews() {
  const container = document.getElementById('email-previews');
  const id = state.config.id || 'nano-zyrkel';
  const desc = state.config.description || 'Dein autonomer Agent';
  const url = state.config.source.url || 'https://example.com';
  const condType = state.config.condition.type || 'changed';
  const condVal = state.config.condition.value || state.config.condition.regex || state.config.condition.selector || state.config.condition.question || 'Bedingung erf\u00fcllt';

  const condLabel = CONDITIONS.find(c => c.type === condType)?.name || condType;

  container.innerHTML = `
  <div class="email-card">
    <div class="email-card-header alert">\u26a0\ufe0f Alert: ${esc(id)}</div>
    <div class="email-card-body">
      <strong>${esc(desc)}</strong><br><br>
      Bedingung <strong>${esc(condLabel)}</strong> ausgel\u00f6st.<br>
      ${condVal ? `Wert: <code>${esc(condVal)}</code><br>` : ''}
      Quelle: <a href="#">${esc(url)}</a>
    </div>
    <div class="email-card-footer">${id} \u00b7 ${new Date().toLocaleString('de-DE')}</div>
  </div>
  <div class="email-card">
    <div class="email-card-header ok">\u2714 Stille-Best\u00e4tigung: ${esc(id)}</div>
    <div class="email-card-body">
      <strong>${esc(id)}</strong> l\u00e4uft normal.<br><br>
      Letzte Pr\u00fcfung: ${new Date().toLocaleString('de-DE')}<br>
      Bedingung "${esc(condLabel)}" wurde <strong>nicht</strong> ausgel\u00f6st.<br>
      N\u00e4chster Lauf gem\u00e4\u00df Zeitplan.
    </div>
    <div class="email-card-footer">${id} \u00b7 Stille-Report \u00b7 ${state.config.silence_freq}</div>
  </div>`;
}

/* 28. renderDashboardPreview() */
function renderDashboardPreview() {
  const container = document.getElementById('dashboard-preview');
  if (!state.config.has_gui) {
    container.innerHTML = '';
    return;
  }
  const t = THEMES.find(x => x.id === state.config.theme) || THEMES[0];
  const c = t.colors;
  const id = state.config.id || 'nano-zyrkel';

  container.innerHTML = `
  <div class="dashboard-preview-header" style="border-color:${c.accent}30">
    <div class="dashboard-preview-title" style="color:${c.text}">${esc(id)}</div>
    <span style="font-size:10px;padding:3px 8px;border-radius:999px;background:${c.accent};color:white">${t.name}</span>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
    <div style="background:${c.card};border:1px solid ${c.accent}20;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:20px;font-weight:700;color:${c.accent}">42</div>
      <div style="font-size:10px;color:${c.text}80">Datenpunkte</div>
    </div>
    <div style="background:${c.card};border:1px solid ${c.accent2}20;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:20px;font-weight:700;color:${c.accent2}">98%</div>
      <div style="font-size:10px;color:${c.text}80">Uptime</div>
    </div>
    <div style="background:${c.card};border:1px solid ${c.accent}20;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:20px;font-weight:700;color:${c.accent}">3h</div>
      <div style="font-size:10px;color:${c.text}80">Intervall</div>
    </div>
  </div>
  <div class="dashboard-chart-placeholder" style="background:${c.bg};border-color:${c.accent}30">
    <div style="display:flex;align-items:flex-end;gap:6px;height:80px;">
      <div style="width:20px;background:${c.accent};border-radius:3px 3px 0 0;height:40%"></div>
      <div style="width:20px;background:${c.accent};border-radius:3px 3px 0 0;height:65%"></div>
      <div style="width:20px;background:${c.accent2};border-radius:3px 3px 0 0;height:80%"></div>
      <div style="width:20px;background:${c.accent};border-radius:3px 3px 0 0;height:55%"></div>
      <div style="width:20px;background:${c.accent};border-radius:3px 3px 0 0;height:90%"></div>
      <div style="width:20px;background:${c.accent2};border-radius:3px 3px 0 0;height:70%"></div>
      <div style="width:20px;background:${c.accent};border-radius:3px 3px 0 0;height:45%"></div>
      <div style="width:20px;background:${c.accent};border-radius:3px 3px 0 0;height:60%"></div>
    </div>
  </div>`;
}

/* 29. renderNextSteps() */
function renderNextSteps() {
  const list = document.getElementById('steps-list');
  const id = state.config.id || 'nano-zyrkel';
  const hasGUI = state.config.has_gui;
  const hasZyrkel = !!state.zyrkelPort;

  let steps = [];

  if (hasZyrkel) {
    steps.push(`<strong>Jetzt erstellen</strong> \u2014 dein lokaler Zyrkel kann das Repo direkt anlegen.`);
  } else {
    steps.push(`Neues GitHub-Repository erstellen: <code>schlein-lab/nano-zyrkel-${esc(id)}</code>`);
  }

  steps.push(`Konfiguration speichern: <code>hats/config.json</code> ins Repo kopieren.`);
  steps.push(`GitHub Actions Workflow: <code>.github/workflows/run.yml</code> hinzuf\u00fcgen.`);

  const secrets = [];
  if (state.config.notify.telegram) secrets.push('TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID');
  if (state.config.notify.discord) secrets.push('DISCORD_WEBHOOK_URL');
  if (state.config.notify.slack) secrets.push('SLACK_WEBHOOK_URL');
  if (state.config.notify.email) secrets.push('SMTP_USER', 'SMTP_PASS');
  if (secrets.length > 0) {
    steps.push(`Secrets in Repository Settings setzen: ${secrets.map(s => `<code>${s}</code>`).join(', ')}`);
  }

  if (hasGUI) {
    steps.push(`GitHub Pages aktivieren und <code>.github/workflows/deploy.yml</code> hinzuf\u00fcgen.`);
  }

  steps.push(`GitHub Actions aktivieren \u2014 dein nano-zyrkel l\u00e4uft ab sofort automatisch!`);

  list.innerHTML = steps.map(s => `<li>${s}</li>`).join('');

  // Deploy button area
  const deployArea = document.getElementById('deploy-area');
  if (hasZyrkel) {
    deployArea.innerHTML = `<button class="btn-primary" style="width:100%;padding:14px;font-size:15px;border-radius:var(--radius);" onclick="deployNano()">Jetzt auf GitHub erstellen</button>`;
  } else {
    deployArea.innerHTML = '';
  }
}

/* 30. wizardGoto(step) */
function wizardGoto(step) {
  step = Math.max(0, Math.min(5, step));
  state.wizardStep = step;

  document.querySelectorAll('.wizard-step').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.step) === step);
  });

  renderWizardProgress();

  // Show/hide back/next
  const back = document.getElementById('wizard-back');
  const next = document.getElementById('wizard-next');
  back.classList.toggle('hidden', step === 0);
  next.textContent = step === 5 ? 'Fertig' : 'Weiter \u2192';

  // Render step-specific content
  if (step === 1) renderStep1Dynamic(document.getElementById('step1-dynamic'));
  if (step === 2) { renderConditions(); renderActionChain(); }
  if (step === 3) { renderSchedule(); renderChannels(); }
  if (step === 5) renderResult();

  updatePreviews();
}

/* 31. wizardNext() / wizardBack() */
function wizardNext() {
  if (state.wizardStep === 5) {
    // Final step — could trigger deploy or just stay
    return;
  }
  wizardGoto(state.wizardStep + 1);
}

function wizardBack() {
  wizardGoto(state.wizardStep - 1);
}

/* ─── Action Chain ──────────────────────────────────────────── */
function renderActionChain() {
  const chain = document.getElementById('action-chain');
  if (state.config.actions.length === 0) {
    chain.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px;">Noch keine Aktionen \u2014 klicke unten um eine hinzuzuf\u00fcgen.</div>';
    return;
  }
  chain.innerHTML = state.config.actions.map((a, i) => {
    const at = ACTION_TYPES.find(t => t.id === a.type) || { icon: '\u2699\ufe0f', name: a.type };
    return `<div class="action-item">
      <span class="action-item-handle">\u2261</span>
      <span class="action-item-type">${at.icon} ${at.name}</span>
      <span class="action-item-detail">${esc(a.detail || '')}</span>
      <button class="action-item-remove" data-idx="${i}">\u00d7</button>
    </div>`;
  }).join('');
  chain.querySelectorAll('.action-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      state.config.actions.splice(parseInt(btn.dataset.idx), 1);
      renderActionChain();
      updatePreviews();
    });
  });
}

function showActionPicker() {
  const chain = document.getElementById('action-chain');
  // Show picker inline
  const picker = document.createElement('div');
  picker.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;';
  picker.innerHTML = ACTION_TYPES.map(a =>
    `<div class="condition-card" data-action="${a.id}" style="cursor:pointer">
      <div class="condition-card-name">${a.icon} ${a.name}</div>
      <div class="condition-card-desc">${a.desc}</div>
    </div>`
  ).join('');
  picker.querySelectorAll('.condition-card').forEach(card => {
    card.addEventListener('click', () => {
      const actionId = card.dataset.action;
      let detail = '';
      if (actionId === 'http_request') detail = prompt('Webhook-URL:', 'https://') || '';
      else if (actionId === 'github_issue') detail = prompt('Repository:', 'owner/repo') || '';
      else if (actionId === 'github_pr') detail = prompt('Repository:', 'owner/repo') || '';
      else if (actionId === 'shell') detail = prompt('Befehl:', '') || '';
      else if (actionId === 'trigger_hat') detail = prompt('Hat-ID:', '') || '';
      else if (actionId === 'publish_api') detail = prompt('Pfad:', 'data/api.json') || 'data/api.json';
      state.config.actions.push({ type: actionId, detail });
      picker.remove();
      renderActionChain();
      updatePreviews();
    });
  });
  // Replace existing picker if any
  const existing = document.querySelector('.action-picker-temp');
  if (existing) existing.remove();
  picker.className = 'action-picker-temp';
  chain.parentNode.insertBefore(picker, document.getElementById('action-add'));
}

/* 32. Chat functions */
function handleChatSend() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  input.style.height = 'auto';

  renderChatMsg('user', msg);
  state.chatHistory.push({ role: 'user', content: msg });

  if (!state.zyrkelPort) {
    renderChatMsg('system', 'Kein Zyrkel verbunden. Bitte starte einen lokalen Zyrkel oder nutze den Wizard.');
    return;
  }

  sendChatSSE(msg);
}

async function sendChat(message) {
  const body = {
    system: BUILDER_SYSTEM_PROMPT,
    messages: state.chatHistory.map(m => ({ role: m.role, content: m.content }))
  };
  try {
    const res = await fetch(`http://localhost:${state.zyrkelPort}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    const raw = data.content || data.message || data.text || '';
    const clean = parseChatFields(raw);
    renderChatMsg('assistant', clean);
    state.chatHistory.push({ role: 'assistant', content: raw });
    updatePreviews();
  } catch (err) {
    renderChatMsg('system', 'Fehler bei der Kommunikation mit Zyrkel: ' + err.message);
  }
}

async function sendChatSSE(message) {
  const body = {
    system: BUILDER_SYSTEM_PROMPT,
    messages: state.chatHistory.map(m => ({ role: m.role, content: m.content }))
  };

  // Create placeholder message
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg assistant';
  msgEl.textContent = '';
  document.getElementById('chat-messages').appendChild(msgEl);
  scrollChat();

  let fullText = '';

  try {
    const res = await fetch(`http://localhost:${state.zyrkelPort}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      // Fallback to non-streaming
      msgEl.remove();
      return sendChat(message);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const token = parsed.content || parsed.delta || parsed.text || '';
            fullText += token;
            msgEl.textContent = parseChatFields(fullText);
            scrollChat();
          } catch (_) {
            fullText += data;
            msgEl.textContent = parseChatFields(fullText);
            scrollChat();
          }
        }
      }
    }

    const clean = parseChatFields(fullText);
    msgEl.innerHTML = escHtml(clean).replace(/\n/g, '<br>');
    state.chatHistory.push({ role: 'assistant', content: fullText });
    updatePreviews();
  } catch (err) {
    if (fullText) {
      const clean = parseChatFields(fullText);
      msgEl.innerHTML = escHtml(clean).replace(/\n/g, '<br>');
      state.chatHistory.push({ role: 'assistant', content: fullText });
    } else {
      msgEl.remove();
      // Fallback to non-streaming
      sendChat(message);
    }
  }
}

function renderChatMsg(role, content) {
  const container = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = `chat-msg ${role}`;
  el.innerHTML = escHtml(content).replace(/\n/g, '<br>');
  container.appendChild(el);
  scrollChat();
}

function scrollChat() {
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

function parseChatFields(text) {
  const regex = /<!--\s*FIELD:(\S+?)=(.+?)\s*-->/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const key = match[1];
    const val = match[2].trim();
    applyField(key, val);
  }
  return text.replace(regex, '').trim();
}

function applyField(key, val) {
  const parts = key.split('.');
  let target = state.config;
  for (let i = 0; i < parts.length - 1; i++) {
    if (target[parts[i]] !== undefined) target = target[parts[i]];
    else return;
  }
  const last = parts[parts.length - 1];
  if (target[last] === undefined && parts.length === 1 && state.config[last] === undefined) return;

  // Type coerce
  if (val === 'true') target[last] = true;
  else if (val === 'false') target[last] = false;
  else if (!isNaN(val) && val !== '') target[last] = Number(val);
  else target[last] = val;
}

/* 33. Fleet functions */
async function loadFleet() {
  if (!state.zyrkelPort) return;
  const grid = document.getElementById('fleet-grid');
  grid.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px;">Lade Fleet-Daten...</div>';

  try {
    const res = await fetch(`http://localhost:${state.zyrkelPort}/api/nanos`);
    const data = await res.json();
    state.fleetNanos = data.nanos || data || [];
    renderFleetGrid();
  } catch (err) {
    grid.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:20px;">Fehler: ${esc(err.message)}</div>`;
  }
}

function renderFleetGrid() {
  const grid = document.getElementById('fleet-grid');
  if (state.fleetNanos.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:40px;text-align:center;">Keine nano-zyrkels in der Fleet. Erstelle einen neuen!</div>';
    return;
  }
  grid.innerHTML = state.fleetNanos.map(n => renderFleetCard(n)).join('');
}

function renderFleetCard(nano) {
  const id = nano.id || nano.name || 'unknown';
  const status = nano.status || 'ok';
  const statusCls = status === 'ok' ? 'fleet-status-ok' : status === 'stale' ? 'fleet-status-stale' : 'fleet-status-error';
  const statusLabel = status === 'ok' ? 'Aktiv' : status === 'stale' ? 'Veraltet' : 'Fehler';
  const lastRun = nano.last_run ? new Date(nano.last_run).toLocaleString('de-DE') : 'Noch nie';
  const nextRun = nano.next_run ? new Date(nano.next_run).toLocaleString('de-DE') : '\u2014';

  return `<div class="fleet-card">
    <div class="fleet-card-header">
      <span class="fleet-card-name">${esc(id)}</span>
      <span class="fleet-card-status ${statusCls}">${statusLabel}</span>
    </div>
    <div class="fleet-card-meta">Letzter Lauf: ${lastRun} \u00b7 N\u00e4chster: ${nextRun}</div>
    <div class="fleet-card-actions">
      <button class="btn-ghost" onclick="triggerNano('${esc(id)}')">Jetzt ausf\u00fchren</button>
      <a href="https://github.com/schlein-lab/nano-zyrkel-${esc(id)}" target="_blank" class="btn-ghost">Repository</a>
    </div>
  </div>`;
}

async function triggerNano(id) {
  if (!state.zyrkelPort) return;
  try {
    await fetch(`http://localhost:${state.zyrkelPort}/api/nanos/${id}/trigger`, { method: 'POST' });
    renderChatMsg('system', `nano-zyrkel "${id}" wurde getriggert.`);
    setTimeout(loadFleet, 2000);
  } catch (err) {
    renderChatMsg('system', `Fehler beim Triggern: ${err.message}`);
  }
}

async function deployNano() {
  if (!state.zyrkelPort) return;
  generateAllFiles();
  const payload = {
    id: state.config.id || 'nano-zyrkel',
    config: state.config,
    files: state.generatedFiles
  };
  try {
    const res = await fetch(`http://localhost:${state.zyrkelPort}/api/nanos/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    const deployArea = document.getElementById('deploy-area');
    deployArea.innerHTML = `<div class="deploy-success">
      <div class="deploy-success-icon">\u2705</div>
      <h2>Erstellt!</h2>
      <p>${data.repo_url ? `<a href="${data.repo_url}" target="_blank">${data.repo_url}</a>` : 'Dein nano-zyrkel wurde erstellt.'}</p>
    </div>`;
  } catch (err) {
    const deployArea = document.getElementById('deploy-area');
    deployArea.innerHTML = `<div style="color:var(--danger);padding:16px;text-align:center;">Fehler: ${esc(err.message)}</div>`;
  }
}

/* 35. updatePreviews() */
function updatePreviews() {
  renderEmailPreviews();
  renderDashboardPreview();
  renderConfigBlock();
  renderNextSteps();
}

/* ─── Utilities ─────────────────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ─── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
