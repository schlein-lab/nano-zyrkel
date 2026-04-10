/* ═══════════════════════════════════════════════════════════════
   nano-zyrkel Project Studio — builder.js
   Two-panel Baukasten + Vorschau builder.
   ═══════════════════════════════════════════════════════════════ */

// ─── CATEGORIES & BLOCKS ─────────────────────────────────────

const CATEGORIES = [
  {
    id: 'showcase', name: 'Inspiration', icon: '\u2728', desc: 'Echte Projekte als Startpunkt',
    blocks: [
      { id: 'start-helix', name: 'Lernplattform', desc: '10-Modul Genetik-Suite (wie helix)', appliesAll: true,
        autoBlocks: ['src-api', 'cond-changed', 'sched-daily', 'notify-email', 'theme-clinical', 'feat-viz-basic'] },
      { id: 'start-tracker', name: 'Daten-Tracker', desc: '4.4M Varianten tracken (wie vusTracker)', appliesAll: true,
        autoBlocks: ['src-clinvar', 'cond-changed', 'sched-3h', 'notify-telegram', 'theme-dashboard', 'feat-data'] },
      { id: 'start-alert', name: 'Alert-Bot', desc: 'Email-Recherche-Bot (wie literatureAlert)', appliesAll: true,
        autoBlocks: ['src-pubmed', 'cond-rss', 'sched-daily', 'notify-email'] },
      { id: 'start-mailbot', name: 'Email-Agent', desc: 'LLM-Email mit Telegram-Approval (wie maildesk)', appliesAll: true,
        autoBlocks: ['src-imap', 'cond-llm', 'sched-5min', 'notify-telegram'] },
      { id: 'start-portal', name: 'Portal / Showcase', desc: 'Animiertes Projekt-Hub (wie showcase)', appliesAll: true,
        autoBlocks: ['src-github', 'sched-daily', 'theme-cinematic', 'act-publish'] },
      { id: 'start-watcher', name: 'Webseiten-Watcher', desc: 'URL ueberwachen + benachrichtigen', appliesAll: true,
        autoBlocks: ['src-url', 'cond-contains', 'sched-hourly', 'notify-telegram'] },
    ]
  },
  {
    id: 'sources', name: 'Datenquellen', icon: '\uD83D\uDCE1', desc: 'Woher kommen die Daten?',
    blocks: [
      { id: 'src-url', name: 'URL / Webseite', desc: 'HTML-Seite abrufen', configKey: 'source',
        fields: [{ name: 'url', label: 'URL', type: 'url', placeholder: 'https://vhs-hamburg.de/kurse' }] },
      { id: 'src-api', name: 'REST API', desc: 'JSON API abfragen', configKey: 'source',
        fields: [{ name: 'url', label: 'API URL', type: 'url', placeholder: 'https://api.example.com/data' }, { name: 'method', label: 'Methode', type: 'select', options: ['GET', 'POST'] }] },
      { id: 'src-rss', name: 'RSS / Atom Feed', desc: 'Feed-Eintraege ueberwachen', configKey: 'source',
        fields: [{ name: 'url', label: 'Feed URL', type: 'url', placeholder: 'https://example.com/feed.xml' }] },
      { id: 'src-imap', name: 'Email-Postfach', desc: 'IMAP Inbox lesen', configKey: 'maildesk',
        fields: [{ name: 'host', label: 'IMAP Host', placeholder: 'imap.gmail.com' }, { name: 'user', label: 'Benutzer', placeholder: 'user@example.com' }] },
      { id: 'src-pubmed', name: 'PubMed', desc: 'Biomedizinische Literatur', configKey: 'literature', preset: true,
        fields: [{ name: 'query', label: 'Suchbegriff', placeholder: 'structural variants AND segmental duplications' }] },
      { id: 'src-clinvar', name: 'ClinVar', desc: 'Varianten-Datenbank', configKey: 'clinvar', preset: true,
        fields: [{ name: 'gene', label: 'Gen', placeholder: 'BRCA1' }] },
      { id: 'src-github', name: 'GitHub API', desc: 'Repos, Issues, PRs', configKey: 'source', preset: true,
        fields: [{ name: 'repo', label: 'Repository', placeholder: 'user/repo' }] },
      { id: 'src-aws', name: 'AWS CloudWatch', desc: 'AWS Metriken + Logs', configKey: 'source', preset: true,
        fields: [{ name: 'metric', label: 'Metrik', placeholder: 'CPUUtilization' }] },
      { id: 'src-s3', name: 'S3 Bucket', desc: 'Dateien aus S3 lesen', configKey: 'source', preset: true,
        fields: [{ name: 'bucket', label: 'Bucket', placeholder: 'my-data-bucket' }, { name: 'prefix', label: 'Prefix', placeholder: 'data/' }] },
    ]
  },
  {
    id: 'conditions', name: 'Bedingungen', icon: '\uD83D\uDD0D', desc: 'Wann soll etwas passieren?',
    blocks: [
      { id: 'cond-contains', name: 'Text-Suche', desc: '"freie Plaetze" taucht auf', configKey: 'condition',
        fields: [{ name: 'value', label: 'Suchtext', placeholder: 'freie Plaetze' }] },
      { id: 'cond-changed', name: 'Aenderung erkannt', desc: 'Irgendwas aendert sich', configKey: 'condition' },
      { id: 'cond-css', name: 'HTML-Element', desc: 'CSS-Selector erscheint', configKey: 'condition',
        fields: [{ name: 'selector', label: 'CSS Selector', placeholder: '.registration-open' }] },
      { id: 'cond-json', name: 'JSON-Wert', desc: 'API-Feld pruefen', configKey: 'condition',
        fields: [{ name: 'path', label: 'JSON Path', placeholder: '$.data.status' }, { name: 'value', label: 'Erwarteter Wert', placeholder: 'open' }] },
      { id: 'cond-threshold', name: 'Schwellwert', desc: 'Wert ueber/unter X', configKey: 'condition',
        fields: [{ name: 'path', label: 'Pfad zum Wert' }, { name: 'operator', label: 'Operator', type: 'select', options: ['>', '<', '>=', '<=', '=='] }, { name: 'value', label: 'Grenzwert', type: 'number' }] },
      { id: 'cond-rss', name: 'Neue Feed-Eintraege', desc: 'Neue Items im RSS', configKey: 'condition' },
      { id: 'cond-llm', name: 'KI-Frage', desc: 'Natuerliche Sprache (~$0.001/Check)', configKey: 'condition',
        fields: [{ name: 'question', label: 'Frage', type: 'textarea', placeholder: 'Ist die Anmeldung zum Schwimmkurs geoeffnet?' }] },
      { id: 'cond-regex', name: 'Regex', desc: 'Regulaerer Ausdruck', configKey: 'condition',
        fields: [{ name: 'regex', label: 'Pattern', placeholder: 'Preis:\\s*\\d+,\\d+\\s*EUR' }] },
      { id: 'cond-stale', name: 'Alter pruefen', desc: 'Daten aelter als X Stunden', configKey: 'condition',
        fields: [{ name: 'max_age_hours', label: 'Max. Alter (Std.)', type: 'number', placeholder: '24' }] },
    ]
  },
  {
    id: 'schedule', name: 'Zeitplan', icon: '\u23F0', desc: 'Wie oft pruefen?',
    blocks: [
      { id: 'sched-5min', name: 'Alle 5 Minuten', desc: '*/5 * * * *', cron: '*/5 * * * *' },
      { id: 'sched-hourly', name: 'Stuendlich', desc: '0 * * * *', cron: '0 * * * *' },
      { id: 'sched-3h', name: 'Alle 3 Stunden', desc: '0 */3 * * *', cron: '0 */3 * * *' },
      { id: 'sched-daily', name: 'Taeglich (8 Uhr)', desc: '0 8 * * *', cron: '0 8 * * *' },
      { id: 'sched-weekly', name: 'Woechentlich (Mo)', desc: '0 8 * * 1', cron: '0 8 * * 1' },
    ]
  },
  {
    id: 'notify', name: 'Benachrichtigungen', icon: '\uD83D\uDD14', desc: 'Wohin melden?',
    blocks: [
      { id: 'notify-telegram', name: 'Telegram', desc: 'Bot-Nachricht', icon: '\uD83D\uDCAC',
        fields: [{ name: 'bot_token', label: 'Bot Token', placeholder: '123456:ABC-DEF...' }, { name: 'chat_id', label: 'Chat ID', placeholder: '-100123456789' }] },
      { id: 'notify-discord', name: 'Discord', desc: 'Webhook', icon: '\uD83C\uDFAE',
        fields: [{ name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://discord.com/api/webhooks/...' }] },
      { id: 'notify-slack', name: 'Slack', desc: 'Webhook', icon: '\uD83D\uDCBC',
        fields: [{ name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/services/...' }] },
      { id: 'notify-email', name: 'Email', desc: 'SMTP', icon: '\uD83D\uDCE7',
        fields: [{ name: 'to', label: 'Empfaenger', placeholder: 'user@example.com' }, { name: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' }] },
      { id: 'notify-silence', name: 'Stille-Bestaetigung', desc: '"Tracker laeuft noch" Meldung', icon: '\u2705' },
    ]
  },
  {
    id: 'actions', name: 'Aktionen', icon: '\u26A1', desc: 'Was soll passieren?',
    blocks: [
      { id: 'act-webhook', name: 'Webhook aufrufen', desc: 'HTTP POST an URL',
        fields: [{ name: 'url', label: 'Webhook URL', type: 'url' }] },
      { id: 'act-github-issue', name: 'GitHub Issue', desc: 'Issue erstellen',
        fields: [{ name: 'repo', label: 'Repo', placeholder: 'user/repo' }] },
      { id: 'act-github-pr', name: 'GitHub PR', desc: 'Pull Request erstellen',
        fields: [{ name: 'repo', label: 'Repo', placeholder: 'user/repo' }] },
      { id: 'act-shell', name: 'Shell-Befehl', desc: 'Command ausfuehren',
        fields: [{ name: 'command', label: 'Befehl', placeholder: 'echo "done"' }] },
      { id: 'act-s3', name: 'Nach S3 pushen', desc: 'Daten in S3-Bucket',
        fields: [{ name: 'bucket', label: 'Bucket' }, { name: 'path', label: 'Pfad' }] },
      { id: 'act-trigger', name: 'Nano-Zyrkel triggern', desc: 'Anderes Projekt starten',
        fields: [{ name: 'repo', label: 'Repo' }] },
      { id: 'act-publish', name: 'API veroeffentlichen', desc: 'JSON auf GitHub Pages' },
    ]
  },
  {
    id: 'gui', name: 'Oberflaeche', icon: '\uD83C\uDFA8', desc: 'Browser-Dashboard?',
    blocks: [
      { id: 'theme-clinical', name: 'Clinical', desc: 'Medizinisch, blau/weiss', colors: { bg: '#ffffff', accent: '#2563eb', card: '#f8fafc' } },
      { id: 'theme-dashboard', name: 'Dashboard', desc: 'Dunkel, Neon-Akzente', colors: { bg: '#0f172a', accent: '#22d3ee', card: '#1e293b' } },
      { id: 'theme-magazine', name: 'Magazine', desc: 'Editorial, Serif', colors: { bg: '#fefce8', accent: '#b45309', card: '#fffbeb' } },
      { id: 'theme-minimal', name: 'Minimal', desc: 'Schwarz/Weiss, Helvetica', colors: { bg: '#ffffff', accent: '#000000', card: '#f5f5f5' } },
      { id: 'theme-cinematic', name: 'Cinematic', desc: 'Dunkel, Gradient', colors: { bg: '#0a0a0a', accent: '#8b5cf6', card: '#171717' } },
    ]
  },
  {
    id: 'compute', name: 'Berechnung', icon: '\u2699\uFE0F', desc: 'Daten verarbeiten',
    blocks: [
      { id: 'feat-data', name: 'DataLoader + Filter', desc: 'Laden, Filtern, Aggregieren', wasmFeature: 'data' },
      { id: 'feat-viz-basic', name: 'Charts (Line, Bar, Donut)', desc: 'Basis-Visualisierungen', wasmFeature: 'viz-basic' },
      { id: 'feat-viz-advanced', name: 'Charts (Heatmap, Scatter)', desc: 'Erweiterte Visualisierungen', wasmFeature: 'viz-advanced' },
      { id: 'feat-viz-spatial', name: 'Genom-Tracks + Karten', desc: 'LinearTrack, NetworkGraph, WorldMap', wasmFeature: 'viz-spatial' },
      { id: 'feat-plugin', name: 'Custom Rust Plugin', desc: 'Eigene Logik in Rust \u2192 WASM' },
    ]
  }
];

// Flat lookup
const BLOCK_MAP = {};
CATEGORIES.forEach(cat => cat.blocks.forEach(b => { b.category = cat.id; BLOCK_MAP[b.id] = b; }));

// ─── STATE ───────────────────────────────────────────────────

const state = {
  blocks: [],
  blockConfig: {},
  dragging: null,
  codeVisible: false,
  activeTab: 'config',
  zyrkelPort: null,
  chatOpen: false,
};

// ─── DOM REFS ────────────────────────────────────────────────

const $categories = document.getElementById('categories');
const $vorschau = document.getElementById('vorschau');
const $vorschauEmpty = document.getElementById('vorschau-empty');
const $vorschauContent = document.getElementById('vorschau-content');
const $searchInput = document.getElementById('search-input');
const $codeDrawer = document.getElementById('code-drawer');
const $drawerCode = document.getElementById('drawer-code');
const $nextSteps = document.getElementById('next-steps');
const $btnCode = document.getElementById('btn-code');
const $btnDeploy = document.getElementById('btn-deploy');
const $btnCopy = document.getElementById('btn-copy');
const $btnCloseDrawer = document.getElementById('btn-close-drawer');
const $statusDot = document.querySelector('.status-dot');
const $statusLabel = document.getElementById('status-label');
const $chatFab = document.getElementById('chat-fab');
const $chatOverlay = document.getElementById('chat-overlay');
const $chatClose = document.getElementById('chat-close');
const $chatMessages = document.getElementById('chat-messages');
const $chatInput = document.getElementById('chat-input');
const $chatSend = document.getElementById('chat-send');

// ─── HELPER: Category badge class ───────────────────────────

function badgeClass(blockId) {
  if (blockId.startsWith('start-')) return 'showcase';
  if (blockId.startsWith('src-')) return 'source';
  if (blockId.startsWith('cond-')) return 'condition';
  if (blockId.startsWith('sched-')) return 'schedule';
  if (blockId.startsWith('notify-')) return 'notify';
  if (blockId.startsWith('act-')) return 'action';
  if (blockId.startsWith('theme-')) return 'theme';
  if (blockId.startsWith('feat-')) return 'compute';
  return '';
}

function badgeLabel(blockId) {
  const map = {
    showcase: 'Inspiration', source: 'Datenquelle', condition: 'Bedingung',
    schedule: 'Zeitplan', notify: 'Benachrichtigung', action: 'Aktion',
    theme: 'Oberflaeche', compute: 'Berechnung'
  };
  return map[badgeClass(blockId)] || '';
}

function categoryIcon(blockId) {
  const block = BLOCK_MAP[blockId];
  if (!block) return '';
  const cat = CATEGORIES.find(c => c.id === block.category);
  return cat ? cat.icon : '';
}

// ─── RENDER BAUKASTEN ────────────────────────────────────────

function renderBaukasten() {
  $categories.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const catEl = document.createElement('div');
    catEl.className = 'category';
    catEl.innerHTML = `
      <div class="category-header">
        <span class="category-icon">${cat.icon}</span>
        <span class="category-name">${cat.name}</span>
        <span class="category-desc">${cat.desc}</span>
      </div>
      <div class="category-blocks" id="cat-${cat.id}"></div>
    `;
    $categories.appendChild(catEl);

    const blocksContainer = catEl.querySelector('.category-blocks');
    cat.blocks.forEach(block => {
      const inUse = state.blocks.includes(block.id);
      const card = document.createElement('div');
      card.className = 'block-card' + (inUse ? ' in-use' : '');
      card.draggable = true;
      card.dataset.blockId = block.id;
      card.innerHTML = `
        <span class="block-card-icon">${block.icon || cat.icon}</span>
        <div class="block-card-text">
          <div class="block-card-name">${block.name}</div>
          <div class="block-card-desc">${block.desc}</div>
        </div>
        <button class="block-card-add" title="Hinzufuegen">+</button>
      `;

      card.addEventListener('dragstart', (e) => {
        state.dragging = block.id;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', block.id);
        card.style.opacity = '0.5';
      });
      card.addEventListener('dragend', () => {
        state.dragging = null;
        card.style.opacity = '';
      });

      // Click to add
      card.addEventListener('click', (e) => {
        if (e.target.closest('.block-card-add') || e.target === card || card.contains(e.target)) {
          if (!inUse) addBlock(block.id);
        }
      });

      blocksContainer.appendChild(card);
    });
  });
}

// ─── SEARCH / FILTER ─────────────────────────────────────────

$searchInput.addEventListener('input', () => {
  const q = $searchInput.value.toLowerCase().trim();
  document.querySelectorAll('.block-card').forEach(card => {
    const block = BLOCK_MAP[card.dataset.blockId];
    if (!block) return;
    const text = (block.name + ' ' + block.desc).toLowerCase();
    card.classList.toggle('filter-hidden', q.length > 0 && !text.includes(q));
  });
  // Hide empty categories
  document.querySelectorAll('.category').forEach(cat => {
    const visible = cat.querySelectorAll('.block-card:not(.filter-hidden)');
    cat.style.display = visible.length === 0 && q.length > 0 ? 'none' : '';
  });
});

// ─── DRAG & DROP ON VORSCHAU ─────────────────────────────────

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  $vorschau.classList.add('drag-over');
}

function handleDragLeave(e) {
  if (!$vorschau.contains(e.relatedTarget)) {
    $vorschau.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  $vorschau.classList.remove('drag-over');
  const blockId = e.dataTransfer.getData('text/plain') || state.dragging;
  if (blockId && !state.blocks.includes(blockId)) {
    addBlock(blockId);
  }
}

// Expose to inline handlers
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;

// ─── ADD / REMOVE BLOCK ──────────────────────────────────────

function addBlock(blockId) {
  if (state.blocks.includes(blockId)) return;
  const block = BLOCK_MAP[blockId];
  if (!block) return;

  // Showcase blocks auto-add their sub-blocks
  if (block.appliesAll && block.autoBlocks) {
    state.blocks.push(blockId);
    state.blockConfig[blockId] = {};
    block.autoBlocks.forEach(subId => {
      if (!state.blocks.includes(subId)) {
        state.blocks.push(subId);
        state.blockConfig[subId] = {};
      }
    });
  } else {
    state.blocks.push(blockId);
    state.blockConfig[blockId] = {};
  }

  renderAll();
}

function removeBlock(blockId) {
  state.blocks = state.blocks.filter(id => id !== blockId);
  delete state.blockConfig[blockId];
  renderAll();
}

function updateFieldValue(blockId, fieldName, value) {
  if (!state.blockConfig[blockId]) state.blockConfig[blockId] = {};
  state.blockConfig[blockId][fieldName] = value;
  // Re-render notification previews only (avoid full re-render to keep focus)
  updateNotificationPreviews();
  if (state.codeVisible) renderCodeDrawer();
}

// ─── RENDER VORSCHAU ─────────────────────────────────────────

function renderVorschau() {
  const hasBlocks = state.blocks.length > 0;
  $vorschauEmpty.style.display = hasBlocks ? 'none' : 'flex';
  $vorschauContent.style.display = hasBlocks ? 'block' : 'none';

  if (!hasBlocks) {
    $vorschauContent.innerHTML = '';
    return;
  }

  $vorschauContent.innerHTML = '';
  state.blocks.forEach(blockId => {
    const block = BLOCK_MAP[blockId];
    if (!block) return;
    const el = createPreviewBlock(blockId, block);
    $vorschauContent.appendChild(el);
  });
}

function createPreviewBlock(blockId, block) {
  const div = document.createElement('div');
  div.className = 'preview-block';
  div.dataset.blockId = blockId;

  const badge = badgeClass(blockId);
  const label = badgeLabel(blockId);

  let bodyHtml = '';

  if (blockId.startsWith('start-')) {
    bodyHtml = renderShowcaseBody(blockId, block);
  } else if (blockId.startsWith('src-')) {
    bodyHtml = renderSourceBody(blockId, block);
  } else if (blockId.startsWith('cond-')) {
    bodyHtml = renderConditionBody(blockId, block);
  } else if (blockId.startsWith('sched-')) {
    bodyHtml = renderScheduleBody(blockId, block);
  } else if (blockId.startsWith('notify-')) {
    bodyHtml = renderNotifyBody(blockId, block);
  } else if (blockId.startsWith('act-')) {
    bodyHtml = renderActionBody(blockId, block);
  } else if (blockId.startsWith('theme-')) {
    bodyHtml = renderThemeBody(blockId, block);
  } else if (blockId.startsWith('feat-')) {
    bodyHtml = renderComputeBody(blockId, block);
  }

  div.innerHTML = `
    <button class="remove-btn" onclick="removeBlock('${blockId}')" title="Entfernen">&times;</button>
    <div class="preview-block-header">
      <span class="preview-block-badge ${badge}">${label}</span>
      <span class="preview-block-title">${categoryIcon(blockId)} ${block.name}</span>
    </div>
    <div class="preview-block-body">${bodyHtml}</div>
  `;

  // Bind field inputs after inserting
  setTimeout(() => {
    div.querySelectorAll('.field-input').forEach(input => {
      input.addEventListener('input', (e) => {
        updateFieldValue(blockId, e.target.dataset.field, e.target.value);
      });
    });
  }, 0);

  return div;
}

// ─── BLOCK BODY RENDERERS ────────────────────────────────────

function renderShowcaseBody(blockId, block) {
  const autoNames = (block.autoBlocks || []).map(id => {
    const b = BLOCK_MAP[id];
    return b ? b.name : id;
  });
  return `
    <div class="showcase-info">${block.desc}</div>
    <div class="showcase-includes">
      ${autoNames.map(n => `<span class="showcase-chip">${n}</span>`).join('')}
    </div>
    <div class="showcase-info" style="margin-top:8px; opacity:0.7;">
      Alle enthaltenen Bausteine wurden automatisch hinzugefuegt. Du kannst sie einzeln anpassen oder entfernen.
    </div>
  `;
}

function renderSourceBody(blockId, block) {
  return `
    <div style="margin-bottom:4px; color:var(--text-muted); font-size:12px;">${block.desc}</div>
    ${renderFields(blockId, block)}
  `;
}

function renderConditionBody(blockId, block) {
  const config = state.blockConfig[blockId] || {};
  let preview = '';

  if (blockId === 'cond-contains') {
    const val = config.value || 'freie Plaetze';
    const srcUrl = getSourceUrl();
    preview = `<div style="margin-top:10px; padding:8px 12px; background:rgba(34,197,94,0.08); border-radius:8px; font-size:12px; color:var(--success);">
      \u2705 Gefunden: "${val}" auf ${srcUrl || '[URL]'}
    </div>`;
  } else if (blockId === 'cond-llm') {
    const q = config.question || 'Ist die Anmeldung geoeffnet?';
    preview = `<div style="margin-top:10px; padding:8px 12px; background:var(--accent-glow-strong); border-radius:8px; font-size:12px; color:var(--accent);">
      KI antwortet: "Ja, die Anmeldung ist geoeffnet." (~$0.001 pro Pruefung)
    </div>`;
  } else if (blockId === 'cond-changed') {
    preview = `<div style="margin-top:10px; padding:8px 12px; background:rgba(245,158,11,0.08); border-radius:8px; font-size:12px; color:var(--warning);">
      Vergleicht den aktuellen Inhalt mit dem letzten Snapshot. Aenderungen loesen Aktionen aus.
    </div>`;
  } else if (blockId === 'cond-rss') {
    preview = `<div style="margin-top:10px; padding:8px 12px; background:rgba(6,182,212,0.08); border-radius:8px; font-size:12px; color:var(--accent2);">
      Neue Feed-Eintraege seit dem letzten Check werden erkannt.
    </div>`;
  }

  return `
    <div style="margin-bottom:4px; color:var(--text-muted); font-size:12px;">${block.desc}</div>
    ${renderFields(blockId, block)}
    ${preview}
  `;
}

function renderScheduleBody(blockId, block) {
  const cron = block.cron || '0 * * * *';
  const nextTimes = getNextCronTimes(cron, 3);
  return `
    <div style="font-family:'Courier New',monospace; font-size:13px; color:var(--accent2); margin-bottom:8px;">${cron}</div>
    <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Naechste 3 Ausfuehrungen:</div>
    <ul class="schedule-times">
      ${nextTimes.map(t => `<li>${t}</li>`).join('')}
    </ul>
  `;
}

function renderNotifyBody(blockId, block) {
  return `
    <div style="margin-bottom:4px; color:var(--text-muted); font-size:12px;">${block.desc}</div>
    ${renderFields(blockId, block)}
    <div class="notify-preview-container" data-notify-id="${blockId}">
      ${renderNotificationPreview(blockId)}
    </div>
  `;
}

function renderActionBody(blockId, block) {
  return `
    <div style="margin-bottom:4px; color:var(--text-muted); font-size:12px;">${block.desc}</div>
    ${renderFields(blockId, block)}
  `;
}

function renderThemeBody(blockId, block) {
  const c = block.colors || { bg: '#0a0a0a', accent: '#8b5cf6', card: '#171717' };
  return `
    <div style="margin-bottom:4px; color:var(--text-muted); font-size:12px;">${block.desc}</div>
    <div class="theme-mini" style="background:${c.bg}; border:1px solid ${c.accent}33;">
      <div class="theme-mini-bar" style="background:${c.card};">
        <span style="background:#ef4444;"></span>
        <span style="background:#f59e0b;"></span>
        <span style="background:#22c55e;"></span>
      </div>
      <div class="theme-mini-body">
        <div class="theme-mini-card" style="background:${c.card};"></div>
        <div class="theme-mini-card" style="background:${c.accent}33;"></div>
        <div class="theme-mini-card" style="background:${c.card};"></div>
        <div class="theme-mini-card" style="background:${c.accent}22;"></div>
        <div class="theme-mini-card" style="background:${c.card};"></div>
        <div class="theme-mini-card" style="background:${c.accent}44;"></div>
      </div>
    </div>
  `;
}

function renderComputeBody(blockId, block) {
  const featureDescriptions = {
    'feat-data': ['Daten laden', 'Filtern', 'Aggregieren', 'CSV/JSON Import'],
    'feat-viz-basic': ['Line Chart', 'Bar Chart', 'Donut Chart', 'Tabelle'],
    'feat-viz-advanced': ['Heatmap', 'Scatter Plot', 'Violin Plot', 'Box Plot'],
    'feat-viz-spatial': ['Genom-Track (LinearTrack)', 'Netzwerkgraph', 'Weltkarte'],
    'feat-plugin': ['Eigene Rust-Logik', 'WASM kompiliert', 'Sandbox-Ausfuehrung'],
  };
  const features = featureDescriptions[blockId] || [block.desc];
  return `
    <div style="margin-bottom:4px; color:var(--text-muted); font-size:12px;">${block.desc}</div>
    <div class="compute-features">
      ${features.map(f => `<span class="compute-chip">${f}</span>`).join('')}
    </div>
  `;
}

// ─── FIELD RENDERING ─────────────────────────────────────────

function renderFields(blockId, block) {
  if (!block.fields || block.fields.length === 0) return '';
  const config = state.blockConfig[blockId] || {};
  return `<div class="field-group">
    ${block.fields.map(f => {
      const val = config[f.name] || '';
      if (f.type === 'select') {
        return `<div class="field-row">
          <span class="field-label">${f.label}</span>
          <select class="field-input" data-field="${f.name}">
            ${(f.options || []).map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>`;
      }
      if (f.type === 'textarea') {
        return `<div class="field-row">
          <span class="field-label">${f.label}</span>
          <textarea class="field-input" data-field="${f.name}" placeholder="${f.placeholder || ''}">${escHtml(val)}</textarea>
        </div>`;
      }
      return `<div class="field-row">
        <span class="field-label">${f.label}</span>
        <input class="field-input" type="${f.type || 'text'}" data-field="${f.name}" value="${escHtml(val)}" placeholder="${f.placeholder || ''}">
      </div>`;
    }).join('')}
  </div>`;
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── NOTIFICATION PREVIEW ────────────────────────────────────

function getSourceUrl() {
  for (const id of state.blocks) {
    if (id.startsWith('src-')) {
      const cfg = state.blockConfig[id] || {};
      return cfg.url || cfg.query || cfg.gene || cfg.repo || '';
    }
  }
  return '';
}

function getConditionText() {
  for (const id of state.blocks) {
    if (id.startsWith('cond-')) {
      const cfg = state.blockConfig[id] || {};
      const block = BLOCK_MAP[id];
      if (id === 'cond-contains') return cfg.value || 'freie Plaetze';
      if (id === 'cond-llm') return cfg.question || 'KI-Bedingung erfuellt';
      if (id === 'cond-css') return 'Element ' + (cfg.selector || '.selector') + ' gefunden';
      if (id === 'cond-json') return (cfg.path || '$.status') + ' == ' + (cfg.value || 'true');
      if (id === 'cond-regex') return 'Regex: ' + (cfg.regex || '.*');
      if (id === 'cond-threshold') return (cfg.path || 'Wert') + ' ' + (cfg.operator || '>') + ' ' + (cfg.value || '0');
      return block ? block.desc : 'Bedingung erfuellt';
    }
  }
  return 'Aenderung erkannt';
}

function getScheduleLabel() {
  for (const id of state.blocks) {
    if (id.startsWith('sched-')) {
      const block = BLOCK_MAP[id];
      return block ? block.name : 'Zeitplan';
    }
  }
  return '';
}

function renderNotificationPreview(notifyId) {
  const srcUrl = getSourceUrl() || 'https://example.com';
  const condText = getConditionText();
  const now = new Date();
  const timeStr = now.toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

  if (notifyId === 'notify-telegram') {
    return `
      <div class="notify-preview telegram">
        <div class="notify-preview-label">Telegram Vorschau</div>
        <div class="notify-preview-msg">\uD83D\uDD14 <b>Aenderung erkannt!</b>\n\nDie Seite <b>${escHtml(srcUrl)}</b> enthaelt jetzt "${escHtml(condText)}".\n\nErkannt: ${timeStr}</div>
      </div>`;
  }
  if (notifyId === 'notify-discord') {
    return `
      <div class="notify-preview discord">
        <div class="notify-preview-label">Discord Vorschau</div>
        <div class="notify-preview-msg">\uD83D\uDD14 **Aenderung erkannt!**\nSeite: ${escHtml(srcUrl)}\nBedingung: "${escHtml(condText)}"\nZeit: ${timeStr}</div>
      </div>`;
  }
  if (notifyId === 'notify-slack') {
    return `
      <div class="notify-preview slack">
        <div class="notify-preview-label">Slack Vorschau</div>
        <div class="notify-preview-msg">\uD83D\uDD14 *Aenderung erkannt!*\n> Seite: ${escHtml(srcUrl)}\n> Bedingung: "${escHtml(condText)}"\n> ${timeStr}</div>
      </div>`;
  }
  if (notifyId === 'notify-email') {
    return `
      <div class="notify-preview email">
        <div class="notify-preview-label">Email Vorschau</div>
        <div style="font-weight:600; margin-bottom:4px;">Betreff: Aenderung erkannt auf ${escHtml(srcUrl)}</div>
        <div class="notify-preview-msg">Hallo,\n\ndein Tracker hat eine Aenderung erkannt:\n\n  Seite: ${escHtml(srcUrl)}\n  Bedingung: "${escHtml(condText)}"\n  Zeitpunkt: ${timeStr}\n\nViele Gruesse,\ndein nano-zyrkel</div>
      </div>`;
  }
  if (notifyId === 'notify-silence') {
    const schedLabel = getScheduleLabel() || 'stuendlich';
    return `
      <div class="notify-preview silence">
        <div class="notify-preview-label">Stille-Bestaetigung</div>
        <div class="notify-preview-msg">\u2705 Alles ruhig. Letzte Pruefung: ${timeStr}.\nDein Tracker laeuft seit 3 Tagen. Naechste Pruefung: ${schedLabel}.</div>
      </div>`;
  }
  return '';
}

function updateNotificationPreviews() {
  document.querySelectorAll('.notify-preview-container').forEach(container => {
    const notifyId = container.dataset.notifyId;
    if (notifyId) {
      container.innerHTML = renderNotificationPreview(notifyId);
    }
  });
}

// ─── SCHEDULE HELPERS ────────────────────────────────────────

function getNextCronTimes(cron, count) {
  // Simple cron approximation for display
  const parts = cron.split(' ');
  const now = new Date();
  const results = [];

  for (let i = 0; i < count; i++) {
    const next = new Date(now.getTime() + (i + 1) * estimateCronIntervalMs(parts));
    // Snap to the hour/minute specified
    if (parts[1] !== '*' && !parts[1].startsWith('*/')) {
      next.setHours(parseInt(parts[1]) || 8);
    }
    if (parts[0] !== '*' && !parts[0].startsWith('*/')) {
      next.setMinutes(parseInt(parts[0]) || 0);
    }
    results.push(next.toLocaleString('de-DE', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }));
  }
  return results;
}

function estimateCronIntervalMs(parts) {
  const min = parts[0], hour = parts[1], dom = parts[2], mon = parts[3], dow = parts[4];
  if (min.startsWith('*/')) return parseInt(min.slice(2)) * 60000;
  if (hour.startsWith('*/')) return parseInt(hour.slice(2)) * 3600000;
  if (dow !== '*') return 7 * 86400000;
  if (dom !== '*') return 30 * 86400000;
  if (hour !== '*') return 86400000;
  return 3600000;
}

// ─── CODE GENERATION ─────────────────────────────────────────

function generateConfig() {
  const config = { name: 'mein-nano-zyrkel', version: '1.0.0', hats: {} };
  const sources = [];
  const conditions = [];
  const notifications = [];
  const actions = [];
  const schedCron = [];
  let theme = null;
  const wasmFeatures = [];

  state.blocks.forEach(id => {
    const block = BLOCK_MAP[id];
    const cfg = state.blockConfig[id] || {};
    if (!block) return;

    if (id.startsWith('src-')) {
      const src = { type: id.replace('src-', ''), ...cfg };
      sources.push(src);
    } else if (id.startsWith('cond-')) {
      const cond = { type: id.replace('cond-', ''), ...cfg };
      conditions.push(cond);
    } else if (id.startsWith('sched-')) {
      schedCron.push(block.cron);
    } else if (id.startsWith('notify-')) {
      const n = { type: id.replace('notify-', ''), ...cfg };
      notifications.push(n);
    } else if (id.startsWith('act-')) {
      const a = { type: id.replace('act-', ''), ...cfg };
      actions.push(a);
    } else if (id.startsWith('theme-')) {
      theme = { id: id.replace('theme-', ''), colors: block.colors };
    } else if (id.startsWith('feat-')) {
      if (block.wasmFeature) wasmFeatures.push(block.wasmFeature);
    }
  });

  if (sources.length) config.hats.sources = sources;
  if (conditions.length) config.hats.conditions = conditions;
  if (schedCron.length) config.hats.schedule = { cron: schedCron[0] };
  if (notifications.length) config.hats.notifications = notifications;
  if (actions.length) config.hats.actions = actions;
  if (theme) config.hats.theme = theme;
  if (wasmFeatures.length) config.hats.wasm_features = wasmFeatures;

  return JSON.stringify(config, null, 2);
}

function generateWorkflow() {
  let cronLine = '0 * * * *';
  state.blocks.forEach(id => {
    const block = BLOCK_MAP[id];
    if (block && block.cron) cronLine = block.cron;
  });

  return `name: nano-zyrkel run
on:
  schedule:
    - cron: '${cronLine}'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Cache nano-zyrkel binary
        uses: actions/cache@v4
        with:
          path: ~/.nano-zyrkel/bin
          key: nano-zyrkel-v1

      - name: Install nano-zyrkel
        run: |
          if [ ! -f ~/.nano-zyrkel/bin/nano-zyrkel ]; then
            mkdir -p ~/.nano-zyrkel/bin
            curl -sL https://github.com/schlein-lab/nano-zyrkel/releases/latest/download/nano-zyrkel-linux -o ~/.nano-zyrkel/bin/nano-zyrkel
            chmod +x ~/.nano-zyrkel/bin/nano-zyrkel
          fi

      - name: Run
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: \${{ secrets.TELEGRAM_CHAT_ID }}
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
        run: ~/.nano-zyrkel/bin/nano-zyrkel run --config hats/config.json

      - name: Commit state
        run: |
          git config user.name "nano-zyrkel[bot]"
          git config user.email "bot@nano-zyrkel.dev"
          git add -A
          git diff --cached --quiet || git commit -m "state update [skip ci]"
          git push
`;
}

function generateReadme() {
  const blockNames = state.blocks.map(id => {
    const b = BLOCK_MAP[id];
    return b ? b.name : id;
  });
  return `# mein-nano-zyrkel

Automatisch generiert mit dem [nano-zyrkel Project Studio](https://schlein-lab.github.io/nano-zyrkel/).

## Bausteine

${blockNames.map(n => `- ${n}`).join('\n')}

## Setup

1. Repository forken/klonen
2. Secrets in GitHub Actions setzen (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, etc.)
3. GitHub Actions aktivieren
4. Fertig — der Workflow laeuft automatisch nach Zeitplan.

## Lokal testen

\`\`\`bash
nano-zyrkel run --config hats/config.json
\`\`\`
`;
}

function generateAllFiles() {
  return {
    config: generateConfig(),
    workflow: generateWorkflow(),
    readme: generateReadme(),
  };
}

// ─── CODE DRAWER ─────────────────────────────────────────────

function toggleCodeDrawer() {
  state.codeVisible = !state.codeVisible;
  $codeDrawer.classList.toggle('visible', state.codeVisible);
  if (state.codeVisible) renderCodeDrawer();
}

function renderCodeDrawer() {
  const files = generateAllFiles();
  const tabContent = {
    config: files.config,
    workflow: files.workflow,
    readme: files.readme,
  };
  $drawerCode.textContent = tabContent[state.activeTab] || '';

  // Next steps
  const steps = [];
  steps.push('Erstelle ein neues GitHub Repository');
  steps.push('Kopiere config.json nach <code>hats/config.json</code>');
  steps.push('Kopiere run.yml nach <code>.github/workflows/run.yml</code>');

  const hasNotify = state.blocks.some(id => id.startsWith('notify-'));
  if (hasNotify) {
    steps.push('Setze Secrets in GitHub Actions (z.B. TELEGRAM_BOT_TOKEN)');
  }
  steps.push('Aktiviere GitHub Actions — fertig!');

  $nextSteps.innerHTML = steps.map(s => `<li>${s}</li>`).join('');
}

$btnCode.addEventListener('click', toggleCodeDrawer);
$btnCloseDrawer.addEventListener('click', () => {
  state.codeVisible = false;
  $codeDrawer.classList.remove('visible');
});

// Tab switching
document.querySelectorAll('.drawer-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeTab = tab.dataset.tab;
    renderCodeDrawer();
  });
});

// Copy
$btnCopy.addEventListener('click', () => {
  const text = $drawerCode.textContent;
  navigator.clipboard.writeText(text).then(() => {
    $btnCopy.textContent = 'Kopiert!';
    setTimeout(() => { $btnCopy.textContent = 'Kopieren'; }, 1500);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    $btnCopy.textContent = 'Kopiert!';
    setTimeout(() => { $btnCopy.textContent = 'Kopieren'; }, 1500);
  });
});

// ─── RENDER ALL ──────────────────────────────────────────────

function renderAll() {
  renderBaukasten();
  renderVorschau();
  if (state.codeVisible) renderCodeDrawer();
}

// ─── ZYRKEL DETECTION ────────────────────────────────────────

async function detectZyrkel() {
  const ports = [37848, 37849, 37850, 37851, 37852, 37853];
  for (const port of ports) {
    try {
      const resp = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(800)
      });
      if (resp.ok) {
        state.zyrkelPort = port;
        $statusDot.classList.add('online');
        $statusDot.classList.remove('offline');
        $statusLabel.textContent = `Port ${port}`;
        $btnDeploy.classList.remove('hidden');
        return;
      }
    } catch (_) { /* next port */ }
  }
  state.zyrkelPort = null;
  $statusDot.classList.remove('online');
  $statusLabel.textContent = 'Offline';
  $btnDeploy.classList.add('hidden');
}

// Deploy button
$btnDeploy.addEventListener('click', async () => {
  if (!state.zyrkelPort) return;
  const config = generateConfig();
  try {
    $btnDeploy.textContent = 'Deploying...';
    const resp = await fetch(`http://127.0.0.1:${state.zyrkelPort}/api/nanos/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: JSON.parse(config) })
    });
    if (resp.ok) {
      $btnDeploy.textContent = 'Deployed!';
      setTimeout(() => { $btnDeploy.textContent = 'Jetzt deployen'; }, 2000);
    } else {
      $btnDeploy.textContent = 'Fehler';
      setTimeout(() => { $btnDeploy.textContent = 'Jetzt deployen'; }, 2000);
    }
  } catch (e) {
    $btnDeploy.textContent = 'Fehler';
    setTimeout(() => { $btnDeploy.textContent = 'Jetzt deployen'; }, 2000);
  }
});

// ─── LLM CHAT ────────────────────────────────────────────────

$chatFab.addEventListener('click', () => {
  state.chatOpen = !state.chatOpen;
  $chatOverlay.classList.toggle('hidden', !state.chatOpen);
  if (state.chatOpen) $chatInput.focus();
});

$chatClose.addEventListener('click', () => {
  state.chatOpen = false;
  $chatOverlay.classList.add('hidden');
});

function addChatMessage(role, text) {
  const div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.textContent = text;
  $chatMessages.appendChild(div);
  $chatMessages.scrollTop = $chatMessages.scrollHeight;
}

function parseLLMBlockCommands(text) {
  // Pattern: <!-- ADD:blockId --> or <!-- REMOVE:blockId -->
  const addPattern = /<!--\s*ADD:(\S+)\s*-->/g;
  const removePattern = /<!--\s*REMOVE:(\S+)\s*-->/g;
  let match;
  let changed = false;

  while ((match = addPattern.exec(text)) !== null) {
    const blockId = match[1];
    if (BLOCK_MAP[blockId] && !state.blocks.includes(blockId)) {
      addBlock(blockId);
      changed = true;
    }
  }
  while ((match = removePattern.exec(text)) !== null) {
    const blockId = match[1];
    if (state.blocks.includes(blockId)) {
      removeBlock(blockId);
      changed = true;
    }
  }

  // Also handle field setting: <!-- FIELD:blockId:fieldName=value -->
  const fieldPattern = /<!--\s*FIELD:(\S+?):(\S+?)=(.+?)\s*-->/g;
  while ((match = fieldPattern.exec(text)) !== null) {
    const [, blockId, fieldName, value] = match;
    if (state.blockConfig[blockId]) {
      state.blockConfig[blockId][fieldName] = value;
      changed = true;
    }
  }

  if (changed) renderAll();
}

async function sendChatMessage() {
  const text = $chatInput.value.trim();
  if (!text) return;
  $chatInput.value = '';
  addChatMessage('user', text);

  // Try to use local Zyrkel for LLM
  if (state.zyrkelPort) {
    try {
      const systemPrompt = `Du bist ein Assistent im nano-zyrkel Project Studio. Der Nutzer beschreibt was er bauen will, und du fuegst Bausteine hinzu.
Verfuegbare Bausteine: ${Object.keys(BLOCK_MAP).join(', ')}.
Aktuell aktive Bausteine: ${state.blocks.join(', ') || 'keine'}.
Um Bausteine hinzuzufuegen, schreibe <!-- ADD:blockId --> im Text.
Um zu entfernen: <!-- REMOVE:blockId -->.
Um Felder zu setzen: <!-- FIELD:blockId:fieldName=wert -->.
Antworte kurz und auf Deutsch.`;

      const resp = await fetch(`http://127.0.0.1:${state.zyrkelPort}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ]
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (resp.ok) {
        const data = await resp.json();
        const reply = data.reply || data.content || data.message || 'Keine Antwort.';
        // Strip command tags for display
        const display = reply.replace(/<!--.*?-->/g, '').trim();
        addChatMessage('assistant', display || 'Bausteine aktualisiert.');
        parseLLMBlockCommands(reply);
        return;
      }
    } catch (_) { /* fallback below */ }
  }

  // Offline fallback: keyword matching
  const reply = offlineChatFallback(text);
  addChatMessage('assistant', reply.display);
  if (reply.commands) parseLLMBlockCommands(reply.commands);
}

function offlineChatFallback(text) {
  const t = text.toLowerCase();
  const commands = [];
  let display = '';

  if (t.includes('watcher') || t.includes('webseite') || t.includes('ueberwach')) {
    commands.push('<!-- ADD:src-url -->', '<!-- ADD:cond-contains -->', '<!-- ADD:sched-hourly -->', '<!-- ADD:notify-telegram -->');
    display = 'Ich habe einen Webseiten-Watcher eingerichtet: URL-Quelle, Text-Suche, stuendlicher Check und Telegram-Benachrichtigung.';
  } else if (t.includes('email') || t.includes('mail')) {
    commands.push('<!-- ADD:src-imap -->', '<!-- ADD:cond-llm -->', '<!-- ADD:sched-5min -->', '<!-- ADD:notify-telegram -->');
    display = 'Email-Agent eingerichtet: IMAP-Postfach, KI-Analyse, alle 5 Minuten, Telegram-Benachrichtigung.';
  } else if (t.includes('pubmed') || t.includes('literatur') || t.includes('paper')) {
    commands.push('<!-- ADD:src-pubmed -->', '<!-- ADD:cond-rss -->', '<!-- ADD:sched-daily -->', '<!-- ADD:notify-email -->');
    display = 'Literatur-Alert eingerichtet: PubMed-Suche, neue Eintraege erkennen, taeglich, Email-Benachrichtigung.';
  } else if (t.includes('github') || t.includes('repo')) {
    commands.push('<!-- ADD:src-github -->', '<!-- ADD:cond-changed -->', '<!-- ADD:sched-3h -->', '<!-- ADD:notify-discord -->');
    display = 'GitHub-Tracker eingerichtet: Repo ueberwachen, Aenderungen erkennen, alle 3 Stunden, Discord-Benachrichtigung.';
  } else if (t.includes('dashboard') || t.includes('chart') || t.includes('visualis')) {
    commands.push('<!-- ADD:src-api -->', '<!-- ADD:feat-data -->', '<!-- ADD:feat-viz-basic -->', '<!-- ADD:theme-dashboard -->');
    display = 'Dashboard eingerichtet: API-Datenquelle, DataLoader, Basis-Charts, Dashboard-Theme.';
  } else if (t.includes('tracker') || t.includes('clinvar') || t.includes('variant')) {
    commands.push('<!-- ADD:start-tracker -->');
    display = 'Daten-Tracker (wie vusTracker) mit allen Bausteinen eingerichtet.';
  } else if (t.includes('telegram')) {
    commands.push('<!-- ADD:notify-telegram -->');
    display = 'Telegram-Benachrichtigung hinzugefuegt.';
  } else if (t.includes('discord')) {
    commands.push('<!-- ADD:notify-discord -->');
    display = 'Discord-Benachrichtigung hinzugefuegt.';
  } else if (t.includes('entfern') || t.includes('loesch') || t.includes('alles weg') || t.includes('reset')) {
    const removeAll = state.blocks.map(id => `<!-- REMOVE:${id} -->`);
    return { display: 'Alle Bausteine entfernt.', commands: removeAll.join('\n') };
  } else {
    display = 'Beschreibe genauer, was du bauen willst. Z.B.: "Webseite ueberwachen", "Email-Bot", "PubMed-Alert", "Dashboard mit Charts".';
    if (!state.zyrkelPort) {
      display += ' (Tipp: Starte Zyrkel fuer volle KI-Unterstuetzung.)';
    }
  }

  return { display, commands: commands.join('\n') };
}

$chatSend.addEventListener('click', sendChatMessage);
$chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

// ─── INIT ────────────────────────────────────────────────────

renderAll();
detectZyrkel();
// Re-detect every 30s
setInterval(detectZyrkel, 30000);

// Welcome chat message
setTimeout(() => {
  addChatMessage('assistant', 'Willkommen! Beschreibe was du bauen willst, oder ziehe Bausteine aus dem Baukasten in die Vorschau.');
}, 500);
