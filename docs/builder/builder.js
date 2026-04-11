/* ═══════════════════════════════════════════════════════════════
   nano-zyrkel Visual Studio — builder.js
   Loads real nano-zyrkel templates into iframe for visual editing.
   Includes data-binding layer for connecting elements to data sources.
   ═══════════════════════════════════════════════════════════════ */

(function() {
'use strict';

// ─── CONSTANTS ──────────────────────────────────────────────────

var RAW_BASE = 'https://raw.githubusercontent.com/schlein-lab/nano-zyrkel/master';
var WASM_BASE = 'https://github.com/schlein-lab/nano-zyrkel/releases/download/wasm-v0.1.0';

var SCAFFOLDS = [
  { id: 'interactive-app', name: 'Dashboard + Pipeline', files: ['index.html', 'style.css', 'app.js'] },
  { id: 'monitor', name: 'Status-Monitor', files: ['index.html', 'style.css', 'app.js'] },
  { id: 'showcase', name: 'Portal / Showcase', files: ['index.html', 'style.css', 'app.js'] },
  { id: 'newsletter', name: 'Newsletter / Digest', files: ['index.html', 'style.css', 'app.js'] },
  { id: 'data-pipeline', name: 'Headless Pipeline', files: [] }
];

var THEMES = [
  { id: 'dashboard', name: 'Dashboard', desc: 'Dunkel, Neon-Akzente' },
  { id: 'clinical', name: 'Clinical', desc: 'Medizinisch, blau/weiss' },
  { id: 'magazine', name: 'Magazine', desc: 'Editorial, warm' },
  { id: 'minimal', name: 'Minimal', desc: 'Schwarz/Weiss' },
  { id: 'cinematic', name: 'Cinematic', desc: 'Dunkel, Gradient' },
  { id: 'multipage', name: 'Multipage', desc: 'Mit Navigation' },
  { id: 'report', name: 'Report', desc: 'Formal, strukturiert' },
  { id: 'card-grid', name: 'Card Grid', desc: 'Karten-Layout' }
];

// ─── DATA SOURCE TYPES ─────────────────────────────────────────

var DATA_SOURCE_TYPES = [
  { id: 'api', name: 'URL / API', icon: '\uD83C\uDF10', desc: 'REST API oder JSON-Endpunkt' },
  { id: 'rss', name: 'RSS Feed', icon: '\uD83D\uDCE1', desc: 'RSS/Atom Feed' },
  { id: 'clinvar', name: 'ClinVar', icon: '\uD83E\uDDEC', desc: 'NCBI ClinVar Datenbank' },
  { id: 'pubmed', name: 'PubMed', icon: '\uD83D\uDCDA', desc: 'PubMed Literatur-Suche' },
  { id: 'github', name: 'GitHub API', icon: '\uD83D\uDC19', desc: 'GitHub Repository-Daten' },
  { id: 'email', name: 'Email', icon: '\uD83D\uDCE7', desc: 'IMAP/SMTP Eingang' },
  { id: 's3', name: 'S3 / Storage', icon: '\uD83D\uDCC1', desc: 'S3-kompatibler Speicher' },
  { id: 'database', name: 'Database', icon: '\uD83D\uDDC4', desc: 'SQL/NoSQL Datenbank' },
  { id: 'staging', name: 'Staging (intern)', icon: '\uD83D\uDCE6', desc: 'Lokale staging/ Daten' }
];

var SCHEDULE_PRESETS = [
  { label: 'Jede Minute', cron: '* * * * *' },
  { label: 'Alle 5 Minuten', cron: '*/5 * * * *' },
  { label: 'Alle 15 Minuten', cron: '*/15 * * * *' },
  { label: 'Stuendlich', cron: '0 * * * *' },
  { label: 'Alle 3 Stunden', cron: '0 */3 * * *' },
  { label: 'Taeglich 8 Uhr', cron: '0 8 * * *' },
  { label: 'Woechentlich', cron: '0 8 * * 1' }
];

var TOOLBOX = [
  {
    group: 'Datenquellen',
    isDataSources: true,
    items: [
      { id: 'add-datasource', label: 'Datenquelle hinzufuegen', icon: '\u2795', action: 'open-datasource-modal' }
    ]
  },
  {
    group: 'Layout',
    items: [
      { id: 'insert-header', label: 'Header', icon: '\u25AC', html: '<header class="card" style="grid-column:1/-1;"><h1>Titel</h1><p class="subtitle">Untertitel</p></header>' },
      { id: 'insert-section', label: 'Abschnitt', icon: '\u25AD', html: '<section><h2>Abschnitt</h2><div class="grid"></div></section>' },
      { id: 'insert-grid2', label: '2-Spalten', icon: '\u25EB', html: '<div class="grid" style="grid-template-columns:1fr 1fr;gap:1rem;"><div class="card"><p>Spalte 1</p></div><div class="card"><p>Spalte 2</p></div></div>' },
      { id: 'insert-grid3', label: '3-Spalten', icon: '\u229E', html: '<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:1rem;"><div class="card"><p>1</p></div><div class="card"><p>2</p></div><div class="card"><p>3</p></div></div>' },
      { id: 'insert-footer', label: 'Footer', icon: '\u25AC', html: '<footer style="grid-column:1/-1; text-align:center; padding:1rem; opacity:0.5;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>' }
    ]
  },
  {
    group: 'Inhalt',
    items: [
      { id: 'insert-h1', label: 'Ueberschrift H1', icon: 'H1', html: '<h1>Ueberschrift</h1>' },
      { id: 'insert-h2', label: 'Ueberschrift H2', icon: 'H2', html: '<h2>Abschnitt</h2>' },
      { id: 'insert-p', label: 'Text-Absatz', icon: '\u00B6', html: '<p>Hier steht Text. Klicke um zu bearbeiten.</p>' },
      { id: 'insert-button', label: 'Button', icon: '\u25A2', html: '<button style="padding:8px 20px; border-radius:6px; background:var(--accent,#8B5CF6); color:white; border:none; cursor:pointer; font-size:14px;">Aktion</button>' },
      { id: 'insert-stat', label: 'Statistik-Karte', icon: '#', bindable: 'stat', html: '' },
      { id: 'insert-badge', label: 'Badge', icon: '\u25CF', html: '<span style="display:inline-block; padding:2px 10px; border-radius:999px; font-size:12px; background:rgba(139,92,246,0.15); color:#8B5CF6; font-weight:600;">Label</span>' },
      { id: 'insert-status', label: 'Status-Indikator', icon: '\u25C9', html: '<div class="card" style="display:flex; align-items:center; gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block;"></span><span>Online</span></div>' }
    ]
  },
  {
    group: 'Charts',
    items: [
      { id: 'insert-line', label: 'Line Chart', icon: '\uD83D\uDCC8', bindable: 'line-chart', html: '' },
      { id: 'insert-bar', label: 'Bar Chart', icon: '\uD83D\uDCCA', bindable: 'bar-chart', html: '' },
      { id: 'insert-donut', label: 'Donut Chart', icon: '\uD83C\uDF69', html: '<div class="card" style="text-align:center;"><h3>Anteil</h3><svg viewBox="0 0 100 100" style="width:150px;height:150px;margin:auto;"><circle cx="50" cy="50" r="35" fill="none" stroke="#1e293b" stroke-width="12"/><circle cx="50" cy="50" r="35" fill="none" stroke="#8B5CF6" stroke-width="12" stroke-dasharray="140 220" stroke-linecap="round" transform="rotate(-90 50 50)"/><text x="50" y="54" text-anchor="middle" fill="currentColor" font-size="16" font-weight="700">64%</text></svg></div>' },
      { id: 'insert-table', label: 'Tabelle', icon: '\u25A6', bindable: 'table', html: '' },
      { id: 'insert-heatmap', label: 'Heatmap', icon: '\uD83D\uDFE7', html: '<div class="card"><h3>Heatmap</h3><div style="display:grid;grid-template-columns:repeat(12,1fr);gap:2px;padding:8px;">' + (function(){ var s=''; for(var i=0;i<48;i++){s+='<div style="aspect-ratio:1;border-radius:2px;background:hsl('+Math.floor(Math.random()*360)+',60%,'+(20+Math.floor(Math.random()*40))+'%)"></div>';} return s; })() + '</div></div>' }
    ]
  },
  {
    group: 'Interaktiv',
    items: [
      { id: 'insert-search', label: 'Suchfeld', icon: '\uD83D\uDD0D', html: '<div style="position:relative;"><input type="text" placeholder="Suchen..." style="width:100%;padding:10px 14px;font-size:14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:inherit;outline:none;font-family:inherit;"></div>' },
      { id: 'insert-tabs', label: 'Tab-Navigation', icon: '\u229F', html: '<div class="card" style="padding:0;overflow:hidden;"><div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.1);"><button style="flex:1;padding:10px;background:rgba(139,92,246,0.1);color:#8B5CF6;border:none;border-bottom:2px solid #8B5CF6;cursor:pointer;font-family:inherit;">Tab 1</button><button style="flex:1;padding:10px;background:transparent;color:inherit;border:none;opacity:0.5;cursor:pointer;font-family:inherit;">Tab 2</button><button style="flex:1;padding:10px;background:transparent;color:inherit;border:none;opacity:0.5;cursor:pointer;font-family:inherit;">Tab 3</button></div><div style="padding:16px;"><p>Inhalt von Tab 1</p></div></div>' },
      { id: 'insert-toggle', label: 'Toggle', icon: '\u2298', html: '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;"><span style="width:40px;height:22px;border-radius:11px;background:#8B5CF6;position:relative;display:inline-block;"><span style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:3px;left:21px;transition:left 0.2s;"></span></span><span>Option aktiviert</span></label>' }
    ]
  },
  {
    group: 'nano-zyrkel',
    items: [
      { id: 'insert-tg-preview', label: 'Telegram Alert', icon: '\uD83D\uDCAC', html: '<div class="card" style="background:#1b2836;border:1px solid rgba(0,136,204,0.2);"><div style="background:#2b5278;border-radius:12px 12px 12px 2px;padding:10px 14px;font-size:13px;color:#e1e8ed;line-height:1.5;">\uD83D\uDD14 <b>Aenderung erkannt!</b><br>Die Seite wurde aktualisiert.<div style="font-size:11px;color:rgba(255,255,255,0.3);text-align:right;margin-top:4px;">14:32</div></div></div>' },
      { id: 'insert-email-preview', label: 'Email Alert', icon: '\uD83D\uDCE7', html: '<div class="card" style="background:#1c1f2a;border:1px solid rgba(139,92,246,0.2);"><div style="font-weight:600;margin-bottom:6px;">Betreff: Aenderung erkannt</div><div style="font-size:13px;opacity:0.7;line-height:1.6;">Hallo,<br><br>dein Tracker hat eine Aenderung erkannt.<br><br>Viele Gruesse,<br>nano-zyrkel</div></div>' },
      { id: 'insert-silence', label: 'Stille-Bestaetigung', icon: '\u2705', html: '<div class="card" style="text-align:center;background:rgba(34,197,94,0.04);border:1px solid rgba(34,197,94,0.15);"><div style="font-size:28px;margin-bottom:6px;">\u2705</div><div style="font-weight:600;color:#22c55e;">Alles ruhig</div><div style="font-size:12px;opacity:0.6;margin-top:4px;">Letzte Pruefung: 14:32</div></div>' },
      { id: 'insert-cron-badge', label: 'Cron-Schedule', icon: '\u23F0', html: '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.05);font-size:13px;">\u23F0 Stuendlich</div>' },
      { id: 'insert-source-badge', label: 'Datenquelle', icon: '\uD83D\uDCE1', html: '<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);font-size:13px;color:#06b6d4;">\uD83D\uDCE1 https://api.example.com</div>' },
      { id: 'insert-feed', label: 'Feed-Liste', icon: '\uD83D\uDCF0', bindable: 'feed', html: '' }
    ]
  }
];

// ─── STATE ──────────────────────────────────────────────────────

var state = {
  scaffold: 'interactive-app',
  theme: 'dashboard',
  pages: [{ id: 'index', title: 'index.html', html: '', css: '', js: '' }],
  activePage: 'index',
  selectedElement: null,
  templateCache: {},
  themeCache: {},
  codeVisible: false,
  activeCodeTab: 'config',
  propertiesVisible: false,
  zyrkelPort: null,
  chatOpen: false,
  loading: true,
  exportedHtml: '',
  exportedCss: '',
  // Data binding layer
  dataSources: [],
  bindings: {},           // elementId -> { sourceId, field, type, options }
  propsTab: 'stil',       // 'stil' | 'daten'
  dsModalOpen: false,
  dsModalEdit: null       // null = new, string = editing id
};

// ─── DOM REFS ───────────────────────────────────────────────────

var $ = function(id) { return document.getElementById(id); };

var canvas = $('canvas');
var canvasLoader = $('canvas-loader');
var studioEl = $('studio');
var propertiesEl = $('properties');
var toolboxEl = $('toolbox');
var pageTabs = $('page-tabs');
var codeDrawer = $('code-drawer');
var drawerCode = $('drawer-code');
var chatOverlay = $('chat-overlay');
var chatMessages = $('chat-messages');
var chatInput = $('chat-input');
var scaffoldMenu = $('scaffold-menu');
var themeMenu = $('theme-menu');
var btnScaffold = $('btn-scaffold');
var btnTheme = $('btn-theme');
var statusDot = document.querySelector('.status-dot');
var statusLabel = $('status-label');

// ─── EDITOR OVERLAY SOURCE ─────────────────────────────────────

var editorOverlayJs = '';
var sampleDataJs = '';

function loadEditorAssets() {
  var p1 = fetch('editor-overlay.js').then(function(r) { return r.text(); }).then(function(t) { editorOverlayJs = t; });
  var p2 = fetch('sample-data.js').then(function(r) { return r.text(); }).then(function(t) { sampleDataJs = t; });
  return Promise.all([p1, p2]);
}

// ─── DATA-AWARE RENDERING ──────────────────────────────────────

function renderChartFromData(type, data, options) {
  options = options || {};
  var w = 400, h = 200;

  if (type === 'line-chart') {
    var points = data || SAMPLE_DATA.trend;
    if (!points || !points.length) return '<svg viewBox="0 0 ' + w + ' ' + h + '"><text x="200" y="100" text-anchor="middle" fill="#94a3b8" font-size="14">Keine Daten</text></svg>';
    var maxVal = 0;
    points.forEach(function(p) { var v = typeof p === 'number' ? p : (p.value || p.y || 0); if (v > maxVal) maxVal = v; });
    if (maxVal === 0) maxVal = 1;
    var pad = 10;
    var stepX = (w - pad * 2) / Math.max(points.length - 1, 1);
    var linePoints = '';
    var fillPoints = '';
    points.forEach(function(p, i) {
      var v = typeof p === 'number' ? p : (p.value || p.y || 0);
      var x = pad + i * stepX;
      var y = h - pad - ((v / maxVal) * (h - pad * 3));
      linePoints += x + ',' + y + ' ';
      fillPoints += x + ',' + y + ' ';
    });
    fillPoints += (pad + (points.length - 1) * stepX) + ',' + (h - pad) + ' ' + pad + ',' + (h - pad);
    var color = options.color || '#8B5CF6';
    var gradId = 'lg-' + Math.random().toString(36).substr(2, 6);
    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:200px;">';
    svg += '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.3"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>';
    svg += '<polyline points="' + fillPoints + '" fill="url(#' + gradId + ')"/>';
    svg += '<polyline points="' + linePoints.trim() + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    // data point dots
    points.forEach(function(p, i) {
      var v = typeof p === 'number' ? p : (p.value || p.y || 0);
      var x = pad + i * stepX;
      var y = h - pad - ((v / maxVal) * (h - pad * 3));
      svg += '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="' + color + '" stroke="#0f172a" stroke-width="1.5"/>';
    });
    // x-axis labels if data has labels
    if (points[0] && (points[0].date || points[0].label || points[0].x !== undefined)) {
      var labelStep = Math.max(1, Math.floor(points.length / 6));
      points.forEach(function(p, i) {
        if (i % labelStep !== 0 && i !== points.length - 1) return;
        var lbl = p.date || p.label || (p.x !== undefined ? p.x : '');
        if (typeof lbl === 'string' && lbl.length > 7) lbl = lbl.substr(lbl.length - 5);
        var x = pad + i * stepX;
        svg += '<text x="' + x + '" y="' + (h - 1) + '" text-anchor="middle" fill="#64748b" font-size="9" font-family="Inter,sans-serif">' + escapeHtml(String(lbl)) + '</text>';
      });
    }
    svg += '</svg>';
    return svg;
  }

  if (type === 'bar-chart') {
    var bars = data || SAMPLE_DATA.distribution;
    if (!bars || !bars.length) return '<svg viewBox="0 0 ' + w + ' ' + h + '"><text x="200" y="100" text-anchor="middle" fill="#94a3b8" font-size="14">Keine Daten</text></svg>';
    var bMax = 0;
    bars.forEach(function(b) { var v = b.value || b.count || b.y || 0; if (v > bMax) bMax = v; });
    if (bMax === 0) bMax = 1;
    var bPad = 20;
    var gap = 8;
    var bw = (w - bPad * 2 - gap * (bars.length - 1)) / bars.length;
    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:200px;">';
    bars.forEach(function(b, i) {
      var v = b.value || b.count || b.y || 0;
      var bh = (v / bMax) * (h - bPad * 2 - 16);
      var x = bPad + i * (bw + gap);
      var y = h - bPad - bh;
      var c = b.color || options.color || '#8B5CF6';
      svg += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="' + c + '" opacity="0.85"/>';
      // label
      var lbl = b.label || b.name || '';
      if (lbl.length > 8) lbl = lbl.substr(0, 7) + '.';
      svg += '<text x="' + (x + bw / 2) + '" y="' + (h - 5) + '" text-anchor="middle" fill="#64748b" font-size="9" font-family="Inter,sans-serif">' + escapeHtml(lbl) + '</text>';
      // value on top
      svg += '<text x="' + (x + bw / 2) + '" y="' + (y - 4) + '" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="Inter,sans-serif">' + v + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  return '';
}

function renderTableFromData(data, columns) {
  data = data || SAMPLE_DATA.table;
  if (!data || !data.length) return '<p style="opacity:0.5;font-size:13px;">Keine Daten</p>';

  // Auto-detect columns from first row if not provided
  if (!columns || !columns.length) {
    columns = Object.keys(data[0]).map(function(k) { return { field: k, header: k.charAt(0).toUpperCase() + k.slice(1) }; });
  }

  var html = '<table style="width:100%;border-collapse:collapse;">';
  html += '<thead><tr>';
  columns.forEach(function(col) {
    html += '<th style="text-align:left;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.1);font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.03em;">' + escapeHtml(col.header || col.field) + '</th>';
  });
  html += '</tr></thead><tbody>';
  data.forEach(function(row, ri) {
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04);' + (ri % 2 === 1 ? 'background:rgba(255,255,255,0.02);' : '') + '">';
    columns.forEach(function(col) {
      var val = getNestedValue(row, col.field);
      if (val === undefined || val === null) val = '';
      html += '<td style="padding:8px 10px;font-size:13px;">' + escapeHtml(String(val)) + '</td>';
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function renderStatFromData(stat) {
  stat = stat || (SAMPLE_DATA.stats && SAMPLE_DATA.stats[0]) || { value: '0', label: 'Wert', trend: '--', color: '#8B5CF6' };
  var color = stat.color || '#8B5CF6';
  return '<div class="stat-value" style="font-size:2rem;font-weight:700;color:' + color + ';">' + escapeHtml(String(stat.value)) + '</div>' +
    '<div class="stat-label" style="font-size:0.85rem;opacity:0.7;margin-top:4px;">' + escapeHtml(String(stat.label)) + '</div>' +
    '<div class="stat-trend" style="font-size:0.8rem;color:#22c55e;margin-top:2px;">' + escapeHtml(String(stat.trend || '')) + '</div>';
}

function renderFeedFromData(feeds) {
  feeds = feeds || SAMPLE_DATA.feeds;
  if (!feeds || !feeds.length) return '<p style="opacity:0.5;font-size:13px;">Keine Eintraege</p>';
  var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
  feeds.forEach(function(f) {
    var isNew = f.isNew || f.is_new;
    html += '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px;border-radius:6px;' +
      (isNew ? 'background:rgba(6,182,212,0.06);border-left:3px solid #06b6d4;' : 'opacity:0.6;border-left:3px solid transparent;') + '">';
    if (isNew) {
      html += '<span style="font-size:10px;font-weight:700;color:#06b6d4;flex-shrink:0;margin-top:2px;">NEU</span>';
    }
    html += '<div style="flex:1;min-width:0;">';
    html += '<div style="font-size:13px;line-height:1.4;">' + escapeHtml(f.title || '') + '</div>';
    if (f.source || f.date) {
      html += '<div style="font-size:11px;opacity:0.5;margin-top:2px;">';
      if (f.source) html += escapeHtml(f.source);
      if (f.source && f.date) html += ' \u2022 ';
      if (f.date) html += escapeHtml(f.date);
      html += '</div>';
    }
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

function getBindableHtml(bindableType, data) {
  if (bindableType === 'line-chart') {
    return '<div class="card"><h3>Trend</h3>' + renderChartFromData('line-chart', data || SAMPLE_DATA.trend) + '</div>';
  }
  if (bindableType === 'bar-chart') {
    return '<div class="card"><h3>Verteilung</h3>' + renderChartFromData('bar-chart', data || SAMPLE_DATA.distribution) + '</div>';
  }
  if (bindableType === 'table') {
    return '<div class="card" style="overflow-x:auto;"><h3>Daten</h3>' + renderTableFromData(data || SAMPLE_DATA.table) + '</div>';
  }
  if (bindableType === 'stat') {
    var s = data || (SAMPLE_DATA.stats && SAMPLE_DATA.stats[0]) || { value: '42', label: 'Eintraege', trend: '+12%', color: '#8B5CF6' };
    return '<div class="card stat">' + renderStatFromData(s) + '</div>';
  }
  if (bindableType === 'feed') {
    return '<div class="card"><h3>Neueste Eintraege</h3>' + renderFeedFromData(data || SAMPLE_DATA.feeds) + '</div>';
  }
  return '';
}

function getNestedValue(obj, path) {
  if (!obj || !path) return obj;
  // Support JSONPath-like: $.trend, $.table[*].gene, or simple dot-path
  var p = path.replace(/^\$\.?/, '');
  if (!p) return obj;
  var parts = p.split('.');
  var current = obj;
  for (var i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) return undefined;
    var part = parts[i];
    // Handle array notation like items[0] or items[*]
    var arrMatch = part.match(/^(\w+)\[(\d+|\*)\]$/);
    if (arrMatch) {
      current = current[arrMatch[1]];
      if (arrMatch[2] === '*') {
        // Return array of values from remaining path
        if (!Array.isArray(current)) return undefined;
        var rest = parts.slice(i + 1).join('.');
        if (!rest) return current;
        return current.map(function(item) { return getNestedValue(item, rest); });
      } else {
        current = current ? current[parseInt(arrMatch[2])] : undefined;
      }
    } else {
      current = current[part];
    }
  }
  return current;
}

// ─── DATA SOURCE MANAGEMENT ────────────────────────────────────

function addDataSource(config) {
  var ds = {
    id: 'ds-' + Date.now(),
    name: config.name || 'Neue Quelle',
    type: config.type || 'api',
    url: config.url || '',
    schedule: config.schedule || '0 */3 * * *',
    method: config.method || 'GET',
    headers: config.headers || {},
    sampleData: config.sampleData || null
  };
  state.dataSources.push(ds);
  renderToolbox();
  return ds;
}

function removeDataSource(id) {
  state.dataSources = state.dataSources.filter(function(ds) { return ds.id !== id; });
  // Unbind all elements using this source
  Object.keys(state.bindings).forEach(function(elId) {
    if (state.bindings[elId].sourceId === id) {
      unbindElement(elId);
    }
  });
  renderToolbox();
}

function testDataSource(url, method) {
  method = method || 'GET';
  return fetch(url, { method: method, signal: AbortSignal.timeout(8000) })
    .then(function(r) {
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('json') !== -1) return r.json();
      return r.text();
    });
}

// ─── DATA BINDING ──────────────────────────────────────────────

function bindElement(elementId, sourceId, fieldPath, options) {
  options = options || {};
  var ds = state.dataSources.find(function(d) { return d.id === sourceId; });
  if (!ds) return;

  var bindingType = options.type || 'auto';
  state.bindings[elementId] = {
    sourceId: sourceId,
    field: fieldPath || '',
    type: bindingType,
    options: options
  };

  // Determine the data to render
  var sampleRoot = ds.sampleData || SAMPLE_DATA;
  var data = fieldPath ? getNestedValue(sampleRoot, fieldPath) : sampleRoot;

  // Re-render the element in the iframe with the bound data
  var html = '';
  if (bindingType === 'line-chart') {
    html = renderChartFromData('line-chart', data, options);
  } else if (bindingType === 'bar-chart') {
    html = renderChartFromData('bar-chart', data, options);
  } else if (bindingType === 'table') {
    html = renderTableFromData(data, options.columns);
  } else if (bindingType === 'stat') {
    html = renderStatFromData(data);
  } else if (bindingType === 'feed') {
    html = renderFeedFromData(data);
  }

  if (html && canvas.contentWindow) {
    canvas.contentWindow.postMessage({
      type: 'nz-update-binding',
      id: elementId,
      html: html,
      binding: JSON.stringify({ source: sourceId, field: fieldPath, type: bindingType })
    }, '*');
  }
}

function unbindElement(elementId) {
  delete state.bindings[elementId];
  // Optionally notify iframe to remove binding attribute
  if (canvas.contentWindow) {
    canvas.contentWindow.postMessage({
      type: 'nz-remove-binding',
      id: elementId
    }, '*');
  }
}

// ─── TEMPLATE LOADING ───────────────────────────────────────────

function fetchFile(url) {
  return fetch(url).then(function(r) {
    if (!r.ok) return '';
    return r.text();
  }).catch(function() { return ''; });
}

function loadScaffold(id) {
  var scaffold = SCAFFOLDS.find(function(s) { return s.id === id; });
  if (!scaffold || scaffold.files.length === 0) {
    renderIframeWithContent('<html><body style="background:#0b0d12;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h2>Headless Pipeline</h2><p style="opacity:0.6;margin-top:8px;">Kein Frontend-Template verfuegbar</p></div></body></html>', '', '');
    return Promise.resolve();
  }

  if (state.templateCache[id]) {
    var cached = state.templateCache[id];
    renderIframeWithContent(cached.html, cached.css, cached.js);
    return Promise.resolve();
  }

  state.loading = true;
  canvasLoader.classList.remove('hidden');

  var base = RAW_BASE + '/scaffold-' + id;
  var promises = scaffold.files.map(function(f) { return fetchFile(base + '/' + f); });

  return Promise.all(promises).then(function(results) {
    var data = { html: '', css: '', js: '' };
    scaffold.files.forEach(function(f, i) {
      if (f === 'index.html') data.html = results[i];
      else if (f === 'style.css') data.css = results[i];
      else if (f === 'app.js') data.js = results[i];
    });

    // If fetch failed (empty), use a meaningful fallback
    if (!data.html) {
      data.html = generateFallbackHtml(id);
      data.css = generateFallbackCss();
      data.js = '';
    }

    state.templateCache[id] = data;
    renderIframeWithContent(data.html, data.css, data.js);
  });
}

function generateFallbackHtml(scaffoldId) {
  var name = SCAFFOLDS.find(function(s) { return s.id === scaffoldId; });
  var title = name ? name.name : scaffoldId;
  return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + escapeHtml(title) + '</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n' +
    '<header class="card" style="grid-column:1/-1;">\n  <h1>' + escapeHtml(title) + '</h1>\n  <p class="subtitle">Erstellt mit nano-zyrkel Visual Studio</p>\n</header>\n' +
    '<main class="grid">\n' +
    '  <div class="card stat">\n    <div class="stat-value">42</div>\n    <div class="stat-label">Eintraege</div>\n    <div class="stat-trend" style="color:#22c55e;">+12%</div>\n  </div>\n' +
    '  <div class="card stat">\n    <div class="stat-value">21,847</div>\n    <div class="stat-label">Datenpunkte</div>\n    <div class="stat-trend" style="color:#06b6d4;">aktiv</div>\n  </div>\n' +
    '  <div class="card stat">\n    <div class="stat-value">14:32</div>\n    <div class="stat-label">Letzte Pruefung</div>\n    <div class="stat-trend" style="color:#22c55e;">OK</div>\n  </div>\n' +
    '  <div class="card">\n    <h3>Trend</h3>\n    <svg viewBox="0 0 400 200" style="width:100%;height:200px;">\n      <defs><linearGradient id="lg-fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.3"/><stop offset="100%" stop-color="#8B5CF6" stop-opacity="0"/></linearGradient></defs>\n      <polyline points="0,180 50,150 100,160 150,120 200,100 250,80 300,90 350,60 400,70 400,200 0,200" fill="url(#lg-fb)"/>\n      <polyline points="0,180 50,150 100,160 150,120 200,100 250,80 300,90 350,60 400,70" fill="none" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round"/>\n    </svg>\n  </div>\n' +
    '  <div class="card">\n    <h3>Status</h3>\n    <div style="display:flex;align-items:center;gap:8px;margin-top:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block;"></span><span>Alle Systeme aktiv</span></div>\n    <div style="display:flex;align-items:center;gap:8px;margin-top:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block;"></span><span>Letzte Pruefung erfolgreich</span></div>\n  </div>\n' +
    '</main>\n' +
    '<footer style="grid-column:1/-1; text-align:center; padding:1rem; opacity:0.5;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>\n' +
    '</body>\n</html>';
}

function generateFallbackCss() {
  return '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    'body { font-family: "Inter", sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; min-height: 100vh; }\n' +
    '.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; max-width: 1200px; margin: 16px auto; }\n' +
    '.card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.06); }\n' +
    '.stat { text-align: center; }\n' +
    '.stat-value { font-size: 2rem; font-weight: 700; }\n' +
    '.stat-label { font-size: 0.85rem; opacity: 0.7; margin-top: 4px; }\n' +
    '.stat-trend { font-size: 0.8rem; margin-top: 4px; }\n' +
    'h1 { font-size: 1.8rem; font-weight: 700; }\n' +
    'h2, h3 { font-weight: 600; }\n' +
    '.subtitle { opacity: 0.6; margin-top: 4px; }\n' +
    'header.card { padding: 32px; margin-bottom: 8px; max-width: 1200px; margin-left: auto; margin-right: auto; }\n' +
    'footer { max-width: 1200px; margin: 16px auto; }\n' +
    'a { color: #8B5CF6; text-decoration: none; }\n' +
    'a:hover { text-decoration: underline; }\n';
}

function renderIframeWithContent(html, css, js) {
  // Parse the HTML to inject CSS, JS, sample-data, and editor-overlay
  var doc = html;

  // If the HTML has a <head>, inject the CSS there
  if (css && doc.indexOf('</head>') !== -1) {
    doc = doc.replace('</head>', '<style>' + css + '</style>\n</head>');
  } else if (css) {
    doc = '<style>' + css + '</style>\n' + doc;
  }

  // Store the template CSS for export
  state.exportedCss = css;

  // Inject sample-data.js before closing body
  var injectScripts = '';
  if (sampleDataJs) {
    injectScripts += '<script>' + sampleDataJs + '<\/script>\n';
  }
  if (js) {
    injectScripts += '<script>' + js + '<\/script>\n';
  }

  // Inject data-binding handler into iframe
  injectScripts += '<script data-nz-overlay="true">\n' + generateIframeBindingHandler() + '\n<\/script>\n';

  // Editor overlay goes last
  if (editorOverlayJs) {
    injectScripts += '<script data-nz-overlay="true">' + editorOverlayJs + '<\/script>\n';
  }

  if (doc.indexOf('</body>') !== -1) {
    doc = doc.replace('</body>', injectScripts + '</body>');
  } else {
    doc += injectScripts;
  }

  canvas.srcdoc = doc;

  // Store current page content
  var page = state.pages.find(function(p) { return p.id === state.activePage; });
  if (page) {
    page.html = html;
    page.css = css;
    page.js = js;
  }
}

function generateIframeBindingHandler() {
  return '(function() {\n' +
    '  window.addEventListener("message", function(e) {\n' +
    '    var msg = e.data;\n' +
    '    if (!msg || !msg.type) return;\n' +
    '    if (msg.type === "nz-update-binding") {\n' +
    '      var el = document.querySelector(\'[data-nz-id="\' + msg.id + \'"]\');\n' +
    '      if (el) {\n' +
    '        // Keep the h3 title if present\n' +
    '        var title = el.querySelector("h3");\n' +
    '        var titleText = title ? title.textContent : null;\n' +
    '        el.innerHTML = msg.html;\n' +
    '        if (msg.binding) el.setAttribute("data-nz-binding", msg.binding);\n' +
    '      }\n' +
    '    }\n' +
    '    if (msg.type === "nz-remove-binding") {\n' +
    '      var el2 = document.querySelector(\'[data-nz-id="\' + msg.id + \'"]\');\n' +
    '      if (el2) el2.removeAttribute("data-nz-binding");\n' +
    '    }\n' +
    '  });\n' +
    '})();\n';
}

// ─── THEME LOADING ──────────────────────────────────────────────

function loadTheme(id) {
  state.theme = id;
  btnTheme.innerHTML = THEMES.find(function(t) { return t.id === id; }).name + ' <span class="chevron">\u25BE</span>';
  renderThemeMenu();

  if (state.themeCache[id]) {
    sendThemeCss(state.themeCache[id]);
    return;
  }

  var url = RAW_BASE + '/themes/' + id + '.css';
  fetchFile(url).then(function(css) {
    if (!css) {
      css = generateThemeFallback(id);
    }
    state.themeCache[id] = css;
    sendThemeCss(css);
  });
}

function generateThemeFallback(id) {
  var themes = {
    dashboard: ':root{--accent:#8B5CF6;--accent2:#06b6d4;}body{background:#0f172a;color:#e2e8f0;}.card{background:#1e293b;border:1px solid rgba(255,255,255,0.06);}',
    clinical: ':root{--accent:#3b82f6;--accent2:#06b6d4;}body{background:#f8fafc;color:#1e293b;}.card{background:white;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.08);}h1,h2,h3{color:#1e293b;}a{color:#3b82f6;}',
    magazine: ':root{--accent:#d97706;--accent2:#ea580c;}body{background:#fdf6e3;color:#3d3929;font-family:Georgia,serif;}.card{background:#fffdf5;border:1px solid #e8dfc4;}h1,h2,h3{font-family:Georgia,serif;}a{color:#d97706;}',
    minimal: ':root{--accent:#18181b;--accent2:#71717a;}body{background:#ffffff;color:#18181b;}.card{background:#fafafa;border:1px solid #e4e4e7;}a{color:#18181b;}',
    cinematic: ':root{--accent:#a855f7;--accent2:#ec4899;}body{background:linear-gradient(135deg,#0c0a1a 0%,#1a0e2e 50%,#0c0a1a 100%);color:#e2e8f0;min-height:100vh;}.card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(10px);}a{color:#a855f7;}',
    multipage: ':root{--accent:#8B5CF6;--accent2:#06b6d4;}body{background:#0f172a;color:#e2e8f0;}.card{background:#1e293b;border:1px solid rgba(255,255,255,0.06);}nav{display:flex;gap:16px;padding:12px 24px;background:#1e293b;border-bottom:1px solid rgba(255,255,255,0.06);}',
    report: ':root{--accent:#1e40af;--accent2:#0369a1;}body{background:#ffffff;color:#1e293b;font-family:"Times New Roman",serif;max-width:800px;margin:0 auto;}.card{background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #1e40af;}h1{font-size:2rem;border-bottom:2px solid #1e40af;padding-bottom:8px;}a{color:#1e40af;}',
    'card-grid': ':root{--accent:#8B5CF6;--accent2:#06b6d4;}body{background:#0f172a;color:#e2e8f0;}.card{background:#1e293b;border:1px solid rgba(255,255,255,0.06);border-radius:16px;}.grid{grid-template-columns:repeat(auto-fill,minmax(300px,1fr))!important;}'
  };
  return themes[id] || themes.dashboard;
}

function sendThemeCss(css) {
  if (canvas.contentWindow) {
    canvas.contentWindow.postMessage({ type: 'nz-set-theme-css', css: css }, '*');
  }
}

// ─── IFRAME COMMUNICATION ───────────────────────────────────────

window.addEventListener('message', function(e) {
  var msg = e.data;
  if (!msg || !msg.type) return;

  if (msg.type === 'nz-ready') {
    state.loading = false;
    canvasLoader.classList.add('hidden');
    // Apply current theme
    if (state.themeCache[state.theme]) {
      sendThemeCss(state.themeCache[state.theme]);
    }
  }

  if (msg.type === 'nz-select') {
    state.selectedElement = {
      id: msg.id,
      tag: msg.tag,
      classes: msg.classes,
      text: msg.text,
      rect: msg.rect,
      styles: msg.styles
    };
    state.propertiesVisible = true;
    studioEl.classList.add('props-open');
    propertiesEl.classList.remove('hidden');
    renderProperties();
  }

  if (msg.type === 'nz-deselect') {
    state.selectedElement = null;
    state.propertiesVisible = false;
    studioEl.classList.remove('props-open');
    propertiesEl.classList.add('hidden');
  }

  if (msg.type === 'nz-edit') {
    // Track text changes — already reflected in iframe
  }

  if (msg.type === 'nz-reorder') {
    // Track element order changes — already reflected in iframe
  }

  if (msg.type === 'nz-html-export') {
    state.exportedHtml = msg.html;
    if (state.codeVisible && state.activeCodeTab === 'html') {
      drawerCode.textContent = msg.html;
    }
  }
});

// ─── TOOLBOX RENDERING ──────────────────────────────────────────

function renderToolbox() {
  var html = '';
  TOOLBOX.forEach(function(group) {
    html += '<div class="toolbox-group">';
    html += '<div class="toolbox-group-header" data-group="' + group.group + '">';
    html += '<span>' + group.group + '</span>';
    html += '<span class="toolbox-group-chevron">\u25BE</span>';
    html += '</div>';
    html += '<div class="toolbox-group-items">';

    if (group.isDataSources) {
      // "Add data source" button
      html += '<div class="toolbox-item" data-action="open-datasource-modal" title="Datenquelle hinzufuegen">';
      html += '<span class="toolbox-item-icon" style="background:rgba(139,92,246,0.15);border-color:rgba(139,92,246,0.3);color:#8B5CF6;">\u2795</span>';
      html += '<span class="toolbox-item-label" style="color:#8B5CF6;font-weight:500;">Datenquelle hinzufuegen</span>';
      html += '</div>';

      // List existing data sources
      state.dataSources.forEach(function(ds) {
        var typeInfo = DATA_SOURCE_TYPES.find(function(t) { return t.id === ds.type; }) || DATA_SOURCE_TYPES[0];
        html += '<div class="toolbox-item toolbox-ds-item" data-ds-id="' + ds.id + '" title="' + escapeAttr(ds.name) + '">';
        html += '<span class="toolbox-item-icon" style="font-size:13px;">' + typeInfo.icon + '</span>';
        html += '<span class="toolbox-item-label" style="font-size:12px;">' + escapeHtml(ds.name) + '</span>';
        html += '<span class="toolbox-ds-remove" data-ds-remove="' + ds.id + '" title="Entfernen" style="margin-left:auto;opacity:0.4;cursor:pointer;font-size:14px;padding:0 4px;">\u00D7</span>';
        html += '</div>';
      });
    } else {
      group.items.forEach(function(item) {
        html += '<div class="toolbox-item" data-insert-id="' + item.id + '" title="' + escapeHtml(item.label) + '">';
        html += '<span class="toolbox-item-icon">' + item.icon + '</span>';
        html += '<span class="toolbox-item-label">' + escapeHtml(item.label) + '</span>';
        html += '</div>';
      });
    }

    html += '</div>';
    html += '</div>';
  });
  toolboxEl.innerHTML = html;

  // Group collapse toggle
  toolboxEl.querySelectorAll('.toolbox-group-header').forEach(function(header) {
    header.addEventListener('click', function() {
      header.parentElement.classList.toggle('collapsed');
    });
  });

  // Item click -> insert into iframe
  toolboxEl.querySelectorAll('.toolbox-item').forEach(function(itemEl) {
    if (itemEl.dataset.action === 'open-datasource-modal') {
      itemEl.addEventListener('click', function(e) {
        e.stopPropagation();
        openDataSourceModal();
      });
      return;
    }
    if (itemEl.dataset.dsId) {
      itemEl.addEventListener('click', function(e) {
        if (e.target.closest('[data-ds-remove]')) return;
        // Clicking a data source opens it for editing
        openDataSourceModal(itemEl.dataset.dsId);
      });
      return;
    }
    itemEl.addEventListener('click', function() {
      var insertId = itemEl.dataset.insertId;
      insertElement(insertId);
    });
  });

  // Remove data source buttons
  toolboxEl.querySelectorAll('[data-ds-remove]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      removeDataSource(btn.dataset.dsRemove);
    });
  });
}

function insertElement(insertId) {
  var item = null;
  TOOLBOX.forEach(function(group) {
    if (group.isDataSources) return;
    group.items.forEach(function(it) {
      if (it.id === insertId) item = it;
    });
  });
  if (!item) return;

  var htmlToInsert = item.html;

  // For bindable items, generate data-aware HTML from sample data
  if (item.bindable) {
    htmlToInsert = getBindableHtml(item.bindable);
  }

  if (canvas.contentWindow) {
    canvas.contentWindow.postMessage({
      type: 'nz-insert',
      html: htmlToInsert,
      targetId: state.selectedElement ? state.selectedElement.id : null
    }, '*');
  }
}

// ─── DATA SOURCE MODAL ─────────────────────────────────────────

function openDataSourceModal(editId) {
  state.dsModalOpen = true;
  state.dsModalEdit = editId || null;

  var existing = editId ? state.dataSources.find(function(ds) { return ds.id === editId; }) : null;

  var modal = document.getElementById('ds-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ds-modal';
    document.body.appendChild(modal);
  }

  var currentType = existing ? existing.type : 'api';
  var currentName = existing ? existing.name : '';
  var currentUrl = existing ? existing.url : '';
  var currentSchedule = existing ? existing.schedule : '0 */3 * * *';

  var html = '<div class="ds-modal-backdrop" id="ds-modal-backdrop"></div>';
  html += '<div class="ds-modal-content">';
  html += '<div class="ds-modal-header">';
  html += '<span class="ds-modal-title">' + (existing ? 'Datenquelle bearbeiten' : 'Datenquelle hinzufuegen') + '</span>';
  html += '<button class="ds-modal-close" id="ds-modal-close">\u00D7</button>';
  html += '</div>';

  // Name
  html += '<div class="ds-modal-section">';
  html += '<label class="ds-modal-label">Name</label>';
  html += '<input class="ds-modal-input" id="ds-name" placeholder="z.B. ClinVar API" value="' + escapeAttr(currentName) + '">';
  html += '</div>';

  // Type selector — visual cards
  html += '<div class="ds-modal-section">';
  html += '<label class="ds-modal-label">Typ</label>';
  html += '<div class="ds-type-grid" id="ds-type-grid">';
  DATA_SOURCE_TYPES.forEach(function(t) {
    var sel = t.id === currentType ? ' ds-type-card-selected' : '';
    html += '<div class="ds-type-card' + sel + '" data-type-id="' + t.id + '">';
    html += '<span class="ds-type-icon">' + t.icon + '</span>';
    html += '<span class="ds-type-name">' + escapeHtml(t.name) + '</span>';
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';

  // URL / Connection
  html += '<div class="ds-modal-section">';
  html += '<label class="ds-modal-label">URL / Verbindung</label>';
  html += '<input class="ds-modal-input" id="ds-url" placeholder="https://eutils.ncbi.nlm.nih.gov/..." value="' + escapeAttr(currentUrl) + '">';
  html += '</div>';

  // Schedule
  html += '<div class="ds-modal-section">';
  html += '<label class="ds-modal-label">Zeitplan (Cron)</label>';
  html += '<div style="display:flex;gap:8px;align-items:center;">';
  html += '<input class="ds-modal-input" id="ds-schedule" value="' + escapeAttr(currentSchedule) + '" style="flex:1;">';
  html += '<select class="ds-modal-select" id="ds-schedule-preset">';
  html += '<option value="">Preset...</option>';
  SCHEDULE_PRESETS.forEach(function(p) {
    html += '<option value="' + escapeAttr(p.cron) + '"' + (p.cron === currentSchedule ? ' selected' : '') + '>' + escapeHtml(p.label) + '</option>';
  });
  html += '</select>';
  html += '</div>';
  html += '</div>';

  // Test area
  html += '<div class="ds-modal-section">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
  html += '<button class="ds-modal-btn ds-modal-btn-test" id="ds-test-btn">Testen</button>';
  html += '<span class="ds-test-status" id="ds-test-status"></span>';
  html += '</div>';
  html += '<div class="ds-test-preview" id="ds-test-preview" style="display:none;"></div>';
  html += '</div>';

  // Actions
  html += '<div class="ds-modal-actions">';
  if (existing) {
    html += '<button class="ds-modal-btn ds-modal-btn-danger" id="ds-delete-btn">Loeschen</button>';
  }
  html += '<div style="flex:1;"></div>';
  html += '<button class="ds-modal-btn ds-modal-btn-cancel" id="ds-cancel-btn">Abbrechen</button>';
  html += '<button class="ds-modal-btn ds-modal-btn-save" id="ds-save-btn">Speichern</button>';
  html += '</div>';

  html += '</div>'; // .ds-modal-content

  modal.innerHTML = html;
  modal.style.display = 'block';

  // Inject modal CSS if not present
  injectModalStyles();

  // Event handlers
  var selectedType = currentType;

  document.getElementById('ds-modal-backdrop').addEventListener('click', closeDataSourceModal);
  document.getElementById('ds-modal-close').addEventListener('click', closeDataSourceModal);
  document.getElementById('ds-cancel-btn').addEventListener('click', closeDataSourceModal);

  // Type selection
  document.querySelectorAll('.ds-type-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.ds-type-card').forEach(function(c) { c.classList.remove('ds-type-card-selected'); });
      card.classList.add('ds-type-card-selected');
      selectedType = card.dataset.typeId;
    });
  });

  // Schedule preset
  document.getElementById('ds-schedule-preset').addEventListener('change', function() {
    if (this.value) {
      document.getElementById('ds-schedule').value = this.value;
    }
  });

  // Test button
  document.getElementById('ds-test-btn').addEventListener('click', function() {
    var url = document.getElementById('ds-url').value.trim();
    if (!url) {
      document.getElementById('ds-test-status').textContent = 'Bitte URL eingeben';
      document.getElementById('ds-test-status').style.color = '#ef4444';
      return;
    }
    document.getElementById('ds-test-status').textContent = 'Lade...';
    document.getElementById('ds-test-status').style.color = '#94a3b8';
    var previewEl = document.getElementById('ds-test-preview');

    testDataSource(url).then(function(data) {
      document.getElementById('ds-test-status').textContent = 'Erfolgreich';
      document.getElementById('ds-test-status').style.color = '#22c55e';
      previewEl.style.display = 'block';
      var preview = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      if (preview.length > 2000) preview = preview.substr(0, 2000) + '\n... (gekuerzt)';
      previewEl.textContent = preview;
    }).catch(function(err) {
      document.getElementById('ds-test-status').textContent = 'Fehler: ' + err.message;
      document.getElementById('ds-test-status').style.color = '#ef4444';
      previewEl.style.display = 'none';
    });
  });

  // Delete
  var deleteBtn = document.getElementById('ds-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      removeDataSource(editId);
      closeDataSourceModal();
    });
  }

  // Save
  document.getElementById('ds-save-btn').addEventListener('click', function() {
    var name = document.getElementById('ds-name').value.trim() || 'Neue Quelle';
    var url = document.getElementById('ds-url').value.trim();
    var schedule = document.getElementById('ds-schedule').value.trim() || '0 */3 * * *';

    // Determine sample data based on type
    var sampleData = null;
    if (selectedType === 'clinvar' || selectedType === 'database') sampleData = SAMPLE_DATA.table;
    else if (selectedType === 'rss' || selectedType === 'pubmed') sampleData = SAMPLE_DATA.feeds;
    else if (selectedType === 'github') sampleData = SAMPLE_DATA.trend;
    else if (selectedType === 'staging') sampleData = SAMPLE_DATA;

    if (existing) {
      existing.name = name;
      existing.type = selectedType;
      existing.url = url;
      existing.schedule = schedule;
      if (sampleData) existing.sampleData = sampleData;
    } else {
      addDataSource({ name: name, type: selectedType, url: url, schedule: schedule, sampleData: sampleData });
    }
    renderToolbox();
    closeDataSourceModal();
  });
}

function closeDataSourceModal() {
  state.dsModalOpen = false;
  state.dsModalEdit = null;
  var modal = document.getElementById('ds-modal');
  if (modal) modal.style.display = 'none';
}

function injectModalStyles() {
  if (document.getElementById('ds-modal-styles')) return;
  var style = document.createElement('style');
  style.id = 'ds-modal-styles';
  style.textContent =
    '#ds-modal { position:fixed; inset:0; z-index:500; display:none; }' +
    '.ds-modal-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); }' +
    '.ds-modal-content { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:520px; max-height:85vh; overflow-y:auto; background:var(--bg-elevated,#111520); border:1px solid var(--border,#1e2336); border-radius:12px; padding:0; box-shadow:0 24px 64px rgba(0,0,0,0.6); }' +
    '.ds-modal-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--border,#1e2336); }' +
    '.ds-modal-title { font-size:16px; font-weight:600; }' +
    '.ds-modal-close { background:none; border:none; color:var(--text-muted,#94a3b8); font-size:22px; cursor:pointer; padding:0 4px; line-height:1; }' +
    '.ds-modal-close:hover { color:var(--text,#e2e8f0); }' +
    '.ds-modal-section { padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.04); }' +
    '.ds-modal-label { display:block; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-muted,#94a3b8); margin-bottom:8px; }' +
    '.ds-modal-input { width:100%; padding:8px 12px; background:var(--bg-card,#161a24); border:1px solid var(--border,#1e2336); border-radius:6px; color:var(--text,#e2e8f0); font-size:13px; font-family:var(--font,Inter,sans-serif); outline:none; }' +
    '.ds-modal-input:focus { border-color:var(--accent,#8B5CF6); }' +
    '.ds-modal-select { padding:8px 10px; background:var(--bg-card,#161a24); border:1px solid var(--border,#1e2336); border-radius:6px; color:var(--text,#e2e8f0); font-size:12px; font-family:var(--font,Inter,sans-serif); outline:none; cursor:pointer; }' +
    '.ds-modal-select:focus { border-color:var(--accent,#8B5CF6); }' +
    '.ds-type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }' +
    '.ds-type-card { display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 6px; border-radius:8px; border:1px solid var(--border,#1e2336); background:var(--bg-card,#161a24); cursor:pointer; transition:all 0.15s; }' +
    '.ds-type-card:hover { border-color:var(--accent,#8B5CF6); background:rgba(139,92,246,0.05); }' +
    '.ds-type-card-selected { border-color:var(--accent,#8B5CF6) !important; background:rgba(139,92,246,0.1) !important; box-shadow:0 0 0 1px var(--accent,#8B5CF6); }' +
    '.ds-type-icon { font-size:20px; }' +
    '.ds-type-name { font-size:11px; text-align:center; color:var(--text,#e2e8f0); }' +
    '.ds-modal-btn { padding:7px 16px; border-radius:6px; font-size:13px; font-family:var(--font,Inter,sans-serif); cursor:pointer; border:1px solid var(--border,#1e2336); background:var(--bg-card,#161a24); color:var(--text,#e2e8f0); transition:all 0.15s; }' +
    '.ds-modal-btn:hover { border-color:var(--text-muted,#94a3b8); }' +
    '.ds-modal-btn-test { background:rgba(6,182,212,0.1); border-color:rgba(6,182,212,0.3); color:#06b6d4; }' +
    '.ds-modal-btn-test:hover { background:rgba(6,182,212,0.2); }' +
    '.ds-modal-btn-save { background:var(--accent,#8B5CF6); border-color:var(--accent,#8B5CF6); color:white; font-weight:600; }' +
    '.ds-modal-btn-save:hover { opacity:0.9; }' +
    '.ds-modal-btn-cancel { background:transparent; }' +
    '.ds-modal-btn-danger { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.25); color:#ef4444; }' +
    '.ds-modal-btn-danger:hover { background:rgba(239,68,68,0.2); }' +
    '.ds-modal-actions { display:flex; align-items:center; gap:8px; padding:14px 20px; }' +
    '.ds-test-status { font-size:12px; }' +
    '.ds-test-preview { max-height:180px; overflow:auto; background:var(--bg-card,#161a24); border:1px solid var(--border,#1e2336); border-radius:6px; padding:10px 12px; font-size:11px; font-family:var(--mono,"JetBrains Mono",monospace); white-space:pre-wrap; word-break:break-all; color:var(--text-muted,#94a3b8); }' +
    // Properties panel tab bar
    '.props-tab-bar { display:flex; border-bottom:1px solid var(--border,#1e2336); }' +
    '.props-tab-btn { flex:1; padding:9px 0; background:none; border:none; border-bottom:2px solid transparent; color:var(--text-muted,#94a3b8); font-size:12px; font-weight:600; font-family:var(--font,Inter,sans-serif); cursor:pointer; text-align:center; transition:all 0.15s; }' +
    '.props-tab-btn:hover { color:var(--text,#e2e8f0); }' +
    '.props-tab-btn.active { color:var(--accent,#8B5CF6); border-bottom-color:var(--accent,#8B5CF6); }' +
    '.ds-preview-box { margin-top:8px; background:var(--bg-card,#161a24); border:1px solid var(--border,#1e2336); border-radius:6px; padding:8px 10px; max-height:120px; overflow:auto; font-size:11px; font-family:var(--mono,"JetBrains Mono",monospace); color:var(--text-muted,#94a3b8); white-space:pre-wrap; word-break:break-all; }';
  document.head.appendChild(style);
}

// ─── PROPERTIES PANEL ───────────────────────────────────────────

function renderProperties() {
  var el = state.selectedElement;
  if (!el) {
    propertiesEl.innerHTML = '';
    return;
  }

  var tag = el.tag;
  var styles = el.styles || {};
  var isText = ['h1','h2','h3','h4','p','span','a','button','label','td','th'].indexOf(tag) !== -1;
  var isContainer = ['div','section','header','footer','main','article','nav'].indexOf(tag) !== -1;
  var isSvg = tag === 'svg' || tag === 'canvas';

  // Determine binding type for this element
  var binding = state.bindings[el.id] || null;
  var elementType = detectElementType(el);

  var html = '';

  // Header
  html += '<div class="props-header">';
  html += '<span>Eigenschaften <span class="props-tag">&lt;' + tag + '&gt;</span></span>';
  html += '<button class="props-close" id="props-close">\u00D7</button>';
  html += '</div>';

  // Tab bar: Stil | Daten
  html += '<div class="props-tab-bar">';
  html += '<button class="props-tab-btn' + (state.propsTab === 'stil' ? ' active' : '') + '" data-props-tab="stil">Stil</button>';
  html += '<button class="props-tab-btn' + (state.propsTab === 'daten' ? ' active' : '') + '" data-props-tab="daten">Daten</button>';
  html += '</div>';

  if (state.propsTab === 'stil') {
    html += renderStilTab(el, tag, styles, isText, isContainer, isSvg);
  } else {
    html += renderDataTab(el.id, elementType, binding);
  }

  propertiesEl.innerHTML = html;

  // Event listeners for properties
  bindPropertyEvents();
  bindPropsTabEvents();

  if (state.propsTab === 'daten') {
    bindDataTabEvents(el.id, elementType);
  }
}

function renderStilTab(el, tag, styles, isText, isContainer, isSvg) {
  var html = '';

  // Element info
  html += '<div class="props-section">';
  html += '<div class="props-section-title">Element</div>';
  html += '<div class="props-row"><span class="props-label">ID</span><span style="font-size:12px;font-family:var(--mono);color:var(--accent2);">' + escapeHtml(el.id) + '</span></div>';
  if (el.classes) {
    html += '<div class="props-row"><span class="props-label">Klassen</span><input class="props-input" id="prop-classes" value="' + escapeAttr(el.classes) + '"></div>';
  }
  html += '</div>';

  // Text properties
  if (isText) {
    html += '<div class="props-section">';
    html += '<div class="props-section-title">Typografie</div>';

    var fontSize = parseInt(styles.fontSize) || 16;
    html += '<div class="props-row"><span class="props-label">Groesse</span><input type="range" class="props-input" id="prop-font-size" min="10" max="72" value="' + fontSize + '"><span style="font-size:11px;min-width:30px;text-align:right;" id="prop-font-size-val">' + fontSize + 'px</span></div>';

    html += '<div class="props-row"><span class="props-label">Gewicht</span><select class="props-select" id="prop-font-weight">';
    ['400', '500', '600', '700'].forEach(function(w) {
      var sel = styles.fontWeight === w ? ' selected' : '';
      var label = w === '400' ? 'Normal' : w === '500' ? 'Medium' : w === '600' ? 'Semibold' : 'Bold';
      html += '<option value="' + w + '"' + sel + '>' + label + ' (' + w + ')</option>';
    });
    html += '</select></div>';

    html += '<div class="props-row"><span class="props-label">Farbe</span><input type="color" class="props-input" id="prop-color" value="' + rgbToHex(styles.color) + '"></div>';

    html += '<div class="props-row"><span class="props-label">Ausrichtung</span><select class="props-select" id="prop-text-align">';
    ['left', 'center', 'right'].forEach(function(a) {
      var sel = styles.textAlign === a ? ' selected' : '';
      var label = a === 'left' ? 'Links' : a === 'center' ? 'Mitte' : 'Rechts';
      html += '<option value="' + a + '"' + sel + '>' + label + '</option>';
    });
    html += '</select></div>';

    html += '</div>';
  }

  // Container properties
  if (isContainer) {
    html += '<div class="props-section">';
    html += '<div class="props-section-title">Layout</div>';

    html += '<div class="props-row"><span class="props-label">Hintergrund</span><input type="color" class="props-input" id="prop-bg-color" value="' + rgbToHex(styles.backgroundColor) + '"></div>';

    var padding = parseInt(styles.padding) || 0;
    html += '<div class="props-row"><span class="props-label">Innenabstand</span><input type="range" class="props-input" id="prop-padding" min="0" max="60" value="' + padding + '"><span style="font-size:11px;min-width:30px;text-align:right;" id="prop-padding-val">' + padding + 'px</span></div>';

    html += '<div class="props-row"><span class="props-label">Eckenradius</span><input type="range" class="props-input" id="prop-border-radius" min="0" max="30" value="' + (parseInt(styles.borderRadius) || 0) + '"><span style="font-size:11px;min-width:30px;text-align:right;" id="prop-border-radius-val">' + (parseInt(styles.borderRadius) || 0) + 'px</span></div>';

    if (styles.gridColumn && styles.gridColumn !== 'auto') {
      html += '<div class="props-row"><span class="props-label">Grid-Spalte</span><input class="props-input" id="prop-grid-column" value="' + escapeAttr(styles.gridColumn) + '"></div>';
    }

    html += '</div>';
  }

  // SVG/Canvas properties
  if (isSvg) {
    html += '<div class="props-section">';
    html += '<div class="props-section-title">Groesse</div>';
    html += '<div class="props-row"><span class="props-label">Breite</span><input class="props-input" id="prop-width" value="' + (el.rect ? Math.round(el.rect.w) + 'px' : 'auto') + '"></div>';
    html += '<div class="props-row"><span class="props-label">Hoehe</span><input class="props-input" id="prop-height" value="' + (el.rect ? Math.round(el.rect.h) + 'px' : 'auto') + '"></div>';
    html += '</div>';
  }

  // Delete button
  html += '<div class="props-section">';
  html += '<button class="props-btn-delete" id="prop-delete">Element entfernen</button>';
  html += '</div>';

  return html;
}

function detectElementType(el) {
  var classes = (el.classes || '').toLowerCase();
  var tag = el.tag || '';
  var text = (el.text || '').toLowerCase();

  if (classes.indexOf('stat') !== -1) return 'stat';
  if (tag === 'table' || tag === 'thead' || tag === 'tbody') return 'table';
  if (tag === 'svg') return 'chart';

  // Check if parent card contains chart-like content
  if (classes.indexOf('card') !== -1) {
    if (text.indexOf('trend') !== -1) return 'line-chart';
    if (text.indexOf('verteilung') !== -1) return 'bar-chart';
    if (text.indexOf('eintraege') !== -1 || text.indexOf('feed') !== -1 || text.indexOf('neueste') !== -1) return 'feed';
  }

  return 'generic';
}

function renderDataTab(elementId, elementType, binding) {
  var html = '';

  html += '<div class="props-section">';
  html += '<div class="props-section-title">Datenanbindung</div>';

  // Data source selector
  html += '<div class="props-row"><span class="props-label">Datenquelle</span>';
  html += '<select class="props-select" id="data-source-select">';
  html += '<option value="">Datenquelle waehlen...</option>';
  state.dataSources.forEach(function(ds) {
    var sel = binding && binding.sourceId === ds.id ? ' selected' : '';
    html += '<option value="' + ds.id + '"' + sel + '>' + escapeHtml(ds.name) + '</option>';
  });
  html += '</select></div>';

  if (state.dataSources.length === 0) {
    html += '<div style="font-size:12px;color:var(--text-muted);padding:4px 0;">Noch keine Datenquellen definiert. Nutze die Toolbox links.</div>';
  }

  // Field path
  html += '<div class="props-row"><span class="props-label">Feld / Pfad</span>';
  html += '<input class="props-input" id="data-field-path" placeholder="z.B. $.trend, value, gene" value="' + escapeAttr(binding ? binding.field : '') + '">';
  html += '</div>';

  // Binding type
  html += '<div class="props-row"><span class="props-label">Darstellung</span>';
  html += '<select class="props-select" id="data-bind-type">';
  var bindTypes = [
    { id: 'auto', label: 'Automatisch' },
    { id: 'line-chart', label: 'Liniendiagramm' },
    { id: 'bar-chart', label: 'Balkendiagramm' },
    { id: 'table', label: 'Tabelle' },
    { id: 'stat', label: 'Statistik-Karte' },
    { id: 'feed', label: 'Feed-Liste' }
  ];
  bindTypes.forEach(function(bt) {
    var sel = binding && binding.type === bt.id ? ' selected' : '';
    html += '<option value="' + bt.id + '"' + sel + '>' + escapeHtml(bt.label) + '</option>';
  });
  html += '</select></div>';
  html += '</div>';

  // Type-specific options
  var bType = binding ? binding.type : 'auto';
  if (bType === 'line-chart' || bType === 'bar-chart' || elementType === 'line-chart' || elementType === 'bar-chart') {
    html += '<div class="props-section">';
    html += '<div class="props-section-title">Chart-Optionen</div>';
    var opts = binding && binding.options ? binding.options : {};
    html += '<div class="props-row"><span class="props-label">X-Achse</span><input class="props-input" id="data-chart-x" placeholder="date, label, x" value="' + escapeAttr(opts.xField || '') + '"></div>';
    html += '<div class="props-row"><span class="props-label">Y-Achse</span><input class="props-input" id="data-chart-y" placeholder="value, count, y" value="' + escapeAttr(opts.yField || '') + '"></div>';
    html += '<div class="props-row"><span class="props-label">Farbe</span><input type="color" class="props-input" id="data-chart-color" value="' + (opts.color || '#8B5CF6') + '"></div>';
    html += '</div>';
  }

  if (bType === 'table' || elementType === 'table') {
    html += '<div class="props-section">';
    html += '<div class="props-section-title">Spalten</div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">Format: feld:Titel (pro Zeile)</div>';
    var colDef = '';
    if (binding && binding.options && binding.options.columns) {
      colDef = binding.options.columns.map(function(c) { return c.field + ':' + (c.header || c.field); }).join('\n');
    }
    html += '<textarea class="props-input" id="data-table-cols" rows="4" style="resize:vertical;font-family:var(--mono);font-size:11px;" placeholder="gene:Gen\nvariant:Variante\nclassification:Status">' + escapeHtml(colDef) + '</textarea>';
    html += '</div>';
  }

  if (bType === 'stat' || elementType === 'stat') {
    html += '<div class="props-section">';
    html += '<div class="props-section-title">Stat-Felder</div>';
    var opts = binding && binding.options ? binding.options : {};
    html += '<div class="props-row"><span class="props-label">Wert</span><input class="props-input" id="data-stat-value" placeholder="value" value="' + escapeAttr(opts.valueField || '') + '"></div>';
    html += '<div class="props-row"><span class="props-label">Label</span><input class="props-input" id="data-stat-label" placeholder="label" value="' + escapeAttr(opts.labelField || '') + '"></div>';
    html += '<div class="props-row"><span class="props-label">Trend</span><input class="props-input" id="data-stat-trend" placeholder="trend" value="' + escapeAttr(opts.trendField || '') + '"></div>';
    html += '</div>';
  }

  // Apply / Unbind buttons
  html += '<div class="props-section" style="display:flex;gap:8px;">';
  html += '<button class="ds-modal-btn ds-modal-btn-save" id="data-apply-btn" style="flex:1;">Anwenden</button>';
  if (binding) {
    html += '<button class="ds-modal-btn ds-modal-btn-danger" id="data-unbind-btn">Trennen</button>';
  }
  html += '</div>';

  // Preview
  if (binding) {
    var ds = state.dataSources.find(function(d) { return d.id === binding.sourceId; });
    if (ds) {
      html += '<div class="props-section">';
      html += '<div class="props-section-title">Vorschau</div>';
      var sampleRoot = ds.sampleData || SAMPLE_DATA;
      var previewData = binding.field ? getNestedValue(sampleRoot, binding.field) : sampleRoot;
      var previewStr = typeof previewData === 'string' ? previewData : JSON.stringify(previewData, null, 2);
      if (previewStr && previewStr.length > 500) previewStr = previewStr.substr(0, 500) + '\n...';
      html += '<div class="ds-preview-box">' + escapeHtml(previewStr || 'null') + '</div>';
      html += '</div>';
    }
  }

  return html;
}

function bindPropsTabEvents() {
  document.querySelectorAll('.props-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.propsTab = btn.dataset.propsTab;
      renderProperties();
    });
  });
}

function bindDataTabEvents(elementId, elementType) {
  var applyBtn = document.getElementById('data-apply-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', function() {
      var sourceId = (document.getElementById('data-source-select') || {}).value || '';
      var field = (document.getElementById('data-field-path') || {}).value || '';
      var bindType = (document.getElementById('data-bind-type') || {}).value || 'auto';

      if (!sourceId) {
        return; // no source selected
      }

      // Resolve 'auto' type
      if (bindType === 'auto') {
        bindType = elementType;
        if (bindType === 'generic' || bindType === 'chart') bindType = 'line-chart';
      }

      var options = { type: bindType };

      // Collect type-specific options
      var chartX = document.getElementById('data-chart-x');
      var chartY = document.getElementById('data-chart-y');
      var chartColor = document.getElementById('data-chart-color');
      if (chartX) options.xField = chartX.value;
      if (chartY) options.yField = chartY.value;
      if (chartColor) options.color = chartColor.value;

      var tableCols = document.getElementById('data-table-cols');
      if (tableCols && tableCols.value.trim()) {
        options.columns = tableCols.value.trim().split('\n').map(function(line) {
          var parts = line.split(':');
          return { field: parts[0].trim(), header: (parts[1] || parts[0]).trim() };
        });
      }

      var statValue = document.getElementById('data-stat-value');
      var statLabel = document.getElementById('data-stat-label');
      var statTrend = document.getElementById('data-stat-trend');
      if (statValue) options.valueField = statValue.value;
      if (statLabel) options.labelField = statLabel.value;
      if (statTrend) options.trendField = statTrend.value;

      bindElement(elementId, sourceId, field, options);
      renderProperties(); // refresh to show preview
    });
  }

  var unbindBtn = document.getElementById('data-unbind-btn');
  if (unbindBtn) {
    unbindBtn.addEventListener('click', function() {
      unbindElement(elementId);
      renderProperties();
    });
  }
}

function bindPropertyEvents() {
  var el = state.selectedElement;
  if (!el) return;

  // Close button
  var closeBtn = document.getElementById('props-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      state.propertiesVisible = false;
      studioEl.classList.remove('props-open');
      propertiesEl.classList.add('hidden');
      if (canvas.contentWindow) {
        canvas.contentWindow.postMessage({ type: 'nz-deselect-cmd' }, '*');
      }
    });
  }

  // Delete
  var deleteBtn = document.getElementById('prop-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      if (canvas.contentWindow) {
        canvas.contentWindow.postMessage({ type: 'nz-delete', id: el.id }, '*');
      }
      // Clean up binding
      if (state.bindings[el.id]) {
        delete state.bindings[el.id];
      }
      state.selectedElement = null;
      state.propertiesVisible = false;
      studioEl.classList.remove('props-open');
      propertiesEl.classList.add('hidden');
    });
  }

  // Font size
  var fontSizeInput = document.getElementById('prop-font-size');
  var fontSizeVal = document.getElementById('prop-font-size-val');
  if (fontSizeInput) {
    fontSizeInput.addEventListener('input', function() {
      if (fontSizeVal) fontSizeVal.textContent = fontSizeInput.value + 'px';
      sendStyleUpdate({ fontSize: fontSizeInput.value + 'px' });
    });
  }

  // Font weight
  var fontWeightInput = document.getElementById('prop-font-weight');
  if (fontWeightInput) {
    fontWeightInput.addEventListener('change', function() {
      sendStyleUpdate({ fontWeight: fontWeightInput.value });
    });
  }

  // Color
  var colorInput = document.getElementById('prop-color');
  if (colorInput) {
    colorInput.addEventListener('input', function() {
      sendStyleUpdate({ color: colorInput.value });
    });
  }

  // Text align
  var textAlignInput = document.getElementById('prop-text-align');
  if (textAlignInput) {
    textAlignInput.addEventListener('change', function() {
      sendStyleUpdate({ textAlign: textAlignInput.value });
    });
  }

  // Background color
  var bgColorInput = document.getElementById('prop-bg-color');
  if (bgColorInput) {
    bgColorInput.addEventListener('input', function() {
      sendStyleUpdate({ backgroundColor: bgColorInput.value });
    });
  }

  // Padding
  var paddingInput = document.getElementById('prop-padding');
  var paddingVal = document.getElementById('prop-padding-val');
  if (paddingInput) {
    paddingInput.addEventListener('input', function() {
      if (paddingVal) paddingVal.textContent = paddingInput.value + 'px';
      sendStyleUpdate({ padding: paddingInput.value + 'px' });
    });
  }

  // Border radius
  var borderRadiusInput = document.getElementById('prop-border-radius');
  var borderRadiusVal = document.getElementById('prop-border-radius-val');
  if (borderRadiusInput) {
    borderRadiusInput.addEventListener('input', function() {
      if (borderRadiusVal) borderRadiusVal.textContent = borderRadiusInput.value + 'px';
      sendStyleUpdate({ borderRadius: borderRadiusInput.value + 'px' });
    });
  }

  // Grid column
  var gridColInput = document.getElementById('prop-grid-column');
  if (gridColInput) {
    gridColInput.addEventListener('change', function() {
      sendStyleUpdate({ gridColumn: gridColInput.value });
    });
  }

  // SVG width/height
  var widthInput = document.getElementById('prop-width');
  if (widthInput) {
    widthInput.addEventListener('change', function() {
      sendStyleUpdate({ width: widthInput.value });
    });
  }
  var heightInput = document.getElementById('prop-height');
  if (heightInput) {
    heightInput.addEventListener('change', function() {
      sendStyleUpdate({ height: heightInput.value });
    });
  }
}

function sendStyleUpdate(styles) {
  if (!state.selectedElement || !canvas.contentWindow) return;
  canvas.contentWindow.postMessage({
    type: 'nz-update-style',
    id: state.selectedElement.id,
    styles: styles
  }, '*');
}

// ─── SCAFFOLD SELECTOR ──────────────────────────────────────────

function renderScaffoldMenu() {
  var html = '';
  SCAFFOLDS.forEach(function(s) {
    var activeClass = s.id === state.scaffold ? ' active' : '';
    html += '<div class="dropdown-item' + activeClass + '" data-scaffold="' + s.id + '">';
    html += '<span class="dropdown-item-name">' + escapeHtml(s.name) + '</span>';
    html += '<span class="dropdown-item-desc">scaffold-' + s.id + '</span>';
    html += '</div>';
  });
  scaffoldMenu.innerHTML = html;

  scaffoldMenu.querySelectorAll('.dropdown-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var id = item.dataset.scaffold;
      state.scaffold = id;
      var scaffold = SCAFFOLDS.find(function(s) { return s.id === id; });
      btnScaffold.innerHTML = escapeHtml(scaffold.name) + ' <span class="chevron">\u25BE</span>';
      scaffoldMenu.classList.remove('open');
      loadScaffold(id);
    });
  });
}

function renderThemeMenu() {
  var html = '';
  THEMES.forEach(function(t) {
    var activeClass = t.id === state.theme ? ' active' : '';
    html += '<div class="dropdown-item' + activeClass + '" data-theme="' + t.id + '">';
    html += '<span class="dropdown-item-name">' + escapeHtml(t.name) + '</span>';
    html += '<span class="dropdown-item-desc">' + escapeHtml(t.desc) + '</span>';
    html += '</div>';
  });
  themeMenu.innerHTML = html;

  themeMenu.querySelectorAll('.dropdown-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var id = item.dataset.theme;
      themeMenu.classList.remove('open');
      loadTheme(id);
    });
  });
}

// Dropdown toggle
btnScaffold.addEventListener('click', function(e) {
  e.stopPropagation();
  themeMenu.classList.remove('open');
  scaffoldMenu.classList.toggle('open');
});

btnTheme.addEventListener('click', function(e) {
  e.stopPropagation();
  scaffoldMenu.classList.remove('open');
  themeMenu.classList.toggle('open');
});

document.addEventListener('click', function() {
  scaffoldMenu.classList.remove('open');
  themeMenu.classList.remove('open');
});

// ─── PAGE SYSTEM ────────────────────────────────────────────────

function renderPageTabs() {
  var html = '';
  state.pages.forEach(function(page) {
    var activeClass = page.id === state.activePage ? ' active' : '';
    html += '<button class="page-tab' + activeClass + '" data-page="' + page.id + '">' + escapeHtml(page.title) + '</button>';
  });
  pageTabs.innerHTML = html;

  pageTabs.querySelectorAll('.page-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      switchPage(tab.dataset.page);
    });
  });
}

function switchPage(pageId) {
  if (pageId === state.activePage) return;

  // Save current page content by requesting HTML export
  if (canvas.contentWindow) {
    canvas.contentWindow.postMessage({ type: 'nz-get-html' }, '*');
  }

  state.activePage = pageId;
  var page = state.pages.find(function(p) { return p.id === pageId; });
  if (page && page.html) {
    renderIframeWithContent(page.html, page.css, page.js);
  }
  renderPageTabs();
}

$('page-add').addEventListener('click', function() {
  var num = state.pages.length + 1;
  var id = 'page-' + num;
  var page = { id: id, title: 'seite-' + num + '.html', html: '', css: '', js: '' };

  // New page gets a blank template with the same scaffold structure
  page.html = '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<title>Seite ' + num + '</title>\n</head>\n<body>\n' +
    '<main class="grid">\n  <div class="card"><h2>Seite ' + num + '</h2><p>Inhalt hier einfuegen</p></div>\n</main>\n</body>\n</html>';
  page.css = state.exportedCss;

  state.pages.push(page);
  switchPage(id);
});

// ─── CODE DRAWER ────────────────────────────────────────────────

$('btn-code').addEventListener('click', function() {
  state.codeVisible = !state.codeVisible;
  if (state.codeVisible) {
    codeDrawer.classList.remove('hidden');
    updateCodeDrawer();
  } else {
    codeDrawer.classList.add('hidden');
  }
});

$('btn-close-drawer').addEventListener('click', function() {
  state.codeVisible = false;
  codeDrawer.classList.add('hidden');
});

// Drawer tab switching
document.getElementById('drawer-tabs').addEventListener('click', function(e) {
  var tab = e.target.closest('.drawer-tab');
  if (!tab) return;
  var tabName = tab.dataset.tab;
  state.activeCodeTab = tabName;

  document.querySelectorAll('.drawer-tab').forEach(function(t) { t.classList.remove('active'); });
  tab.classList.add('active');
  updateCodeDrawer();
});

function updateCodeDrawer() {
  var content = '';
  switch (state.activeCodeTab) {
    case 'config':
      content = generateConfig();
      break;
    case 'html':
      // Request clean HTML from iframe
      if (canvas.contentWindow) {
        canvas.contentWindow.postMessage({ type: 'nz-get-html' }, '*');
      }
      content = state.exportedHtml || '<!-- HTML wird geladen... -->';
      break;
    case 'css':
      content = state.exportedCss || state.themeCache[state.theme] || '/* Kein Theme-CSS geladen */';
      break;
    case 'workflow':
      content = generateWorkflow();
      break;
    case 'readme':
      content = generateReadme();
      break;
  }
  drawerCode.textContent = content;
}

$('btn-copy').addEventListener('click', function() {
  var text = drawerCode.textContent;
  navigator.clipboard.writeText(text).then(function() {
    var btn = $('btn-copy');
    btn.textContent = 'Kopiert!';
    setTimeout(function() { btn.textContent = 'Kopieren'; }, 1500);
  });
});

// ─── CONFIG GENERATION ──────────────────────────────────────────

function generateConfig() {
  var config = {
    name: state.pages[0].title.replace('.html', '') || 'mein-nano-zyrkel',
    scaffold: state.scaffold,
    theme: state.theme,
    hats: {
      schedule: { cron: '0 8 * * *' },
      wasm_features: ['data', 'viz-basic']
    }
  };

  // Include data sources
  if (state.dataSources.length > 0) {
    config.sources = state.dataSources.map(function(ds) {
      var src = { type: ds.type, name: ds.name };
      if (ds.url) src.url = ds.url;
      if (ds.method && ds.method !== 'GET') src.method = ds.method;
      return src;
    });
    // Use the first source's schedule, or aggregated
    var schedules = state.dataSources.filter(function(ds) { return ds.schedule; }).map(function(ds) { return ds.schedule; });
    if (schedules.length > 0) {
      config.schedule = { cron: schedules[0] };
      if (schedules.length > 1) {
        config.schedule.all = schedules;
      }
    }
  }

  // Include bindings summary
  if (Object.keys(state.bindings).length > 0) {
    config.bindings = {};
    Object.keys(state.bindings).forEach(function(elId) {
      var b = state.bindings[elId];
      config.bindings[elId] = { source: b.sourceId, field: b.field, type: b.type };
    });
  }

  return JSON.stringify(config, null, 2);
}

function generateWorkflow() {
  return 'name: nano-zyrkel run\non:\n  schedule:\n    - cron: \'0 8 * * *\'\n  workflow_dispatch:\npermissions:\n  contents: write\njobs:\n  run:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Install\n        run: |\n          curl -sL https://github.com/schlein-lab/nano-zyrkel/releases/latest/download/nano-zyrkel-linux -o nano-zyrkel\n          chmod +x nano-zyrkel\n      - name: Run\n        run: ./nano-zyrkel run --config hats/config.json\n      - name: Commit\n        run: |\n          git config user.name "nano-zyrkel"\n          git config user.email "bot@nano-zyrkel"\n          git add -A\n          git diff --staged --quiet || git commit -m "state update"\n          git push\n';
}

function generateReadme() {
  var scaffold = SCAFFOLDS.find(function(s) { return s.id === state.scaffold; });
  return '# ' + (state.pages[0].title.replace('.html', '') || 'mein-nano-zyrkel') + '\n\n' +
    'Erstellt mit dem nano-zyrkel Visual Studio.\n\n' +
    '## Scaffold\n\n' +
    '**' + scaffold.name + '** (`scaffold-' + state.scaffold + '`)\n\n' +
    '## Theme\n\n' +
    '**' + state.theme + '**\n\n' +
    '## Setup\n\n' +
    '```bash\n' +
    'curl -sL https://github.com/schlein-lab/nano-zyrkel/releases/latest/download/nano-zyrkel-linux -o nano-zyrkel\n' +
    'chmod +x nano-zyrkel\n' +
    './nano-zyrkel run --config hats/config.json\n' +
    '```\n\n' +
    '## Lizenz\n\nMIT\n';
}

// ─── DEPLOY ─────────────────────────────────────────────────────

$('btn-deploy').addEventListener('click', function() {
  if (!state.zyrkelPort) {
    addChatMessage('bot', 'Kein Zyrkel verbunden. Starte zuerst eine Zyrkel-Instanz.');
    state.chatOpen = true;
    chatOverlay.classList.remove('hidden');
    return;
  }

  // Request clean HTML
  if (canvas.contentWindow) {
    canvas.contentWindow.postMessage({ type: 'nz-get-html' }, '*');
  }

  setTimeout(function() {
    var payload = {
      scaffold: state.scaffold,
      theme: state.theme,
      config: generateConfig(),
      html: state.exportedHtml,
      css: state.exportedCss
    };

    fetch('http://localhost:' + state.zyrkelPort + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Deploy nano-zyrkel: ' + JSON.stringify(payload)
      })
    }).then(function(r) { return r.json(); }).then(function(data) {
      addChatMessage('bot', 'Deploy gestartet: ' + (data.response || 'OK'));
      state.chatOpen = true;
      chatOverlay.classList.remove('hidden');
    }).catch(function(err) {
      addChatMessage('bot', 'Deploy fehlgeschlagen: ' + err.message);
      state.chatOpen = true;
      chatOverlay.classList.remove('hidden');
    });
  }, 300);
});

// ─── LLM CHAT ───────────────────────────────────────────────────

$('chat-fab').addEventListener('click', function() {
  state.chatOpen = !state.chatOpen;
  chatOverlay.classList.toggle('hidden', !state.chatOpen);
  if (state.chatOpen) chatInput.focus();
});

$('chat-close').addEventListener('click', function() {
  state.chatOpen = false;
  chatOverlay.classList.add('hidden');
});

$('chat-send').addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendChatMessage();
});

function sendChatMessage() {
  var text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  addChatMessage('user', text);

  if (state.zyrkelPort) {
    // Send to Zyrkel LLM
    fetch('http://localhost:' + state.zyrkelPort + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        context: 'nano-zyrkel-visual-studio',
        system: 'Du bist ein Assistent im nano-zyrkel Visual Studio. Du hilfst beim Erstellen und Bearbeiten von nano-zyrkel Templates. Wenn du ein Element einfuegen willst, antworte mit <!-- INSERT:element-id --> (z.B. <!-- INSERT:insert-line -->). Verfuegbare IDs: ' + getAllInsertIds().join(', ')
      })
    }).then(function(r) { return r.json(); }).then(function(data) {
      var response = data.response || data.message || 'Keine Antwort';
      processLlmResponse(response);
    }).catch(function() {
      // Offline fallback
      processOfflineFallback(text);
    });
  } else {
    // Offline fallback
    processOfflineFallback(text);
  }
}

function processLlmResponse(response) {
  // Check for INSERT commands
  var insertRegex = /<!-- INSERT:(\S+) -->/g;
  var match;
  var cleanResponse = response;
  while ((match = insertRegex.exec(response)) !== null) {
    insertElement(match[1]);
    cleanResponse = cleanResponse.replace(match[0], '');
  }
  cleanResponse = cleanResponse.trim();
  if (cleanResponse) {
    addChatMessage('bot', cleanResponse);
  } else {
    addChatMessage('bot', 'Element eingefuegt.');
  }
}

function processOfflineFallback(text) {
  var lower = text.toLowerCase();

  // Keyword matching for common requests
  var keywords = {
    'chart': 'insert-line',
    'diagramm': 'insert-line',
    'trend': 'insert-line',
    'linie': 'insert-line',
    'balken': 'insert-bar',
    'bar': 'insert-bar',
    'donut': 'insert-donut',
    'kreis': 'insert-donut',
    'tabelle': 'insert-table',
    'table': 'insert-table',
    'heatmap': 'insert-heatmap',
    'header': 'insert-header',
    'kopfzeile': 'insert-header',
    'footer': 'insert-footer',
    'fusszeile': 'insert-footer',
    'text': 'insert-p',
    'absatz': 'insert-p',
    'button': 'insert-button',
    'knopf': 'insert-button',
    'statistik': 'insert-stat',
    'stat': 'insert-stat',
    'karte': 'insert-stat',
    'suche': 'insert-search',
    'such': 'insert-search',
    'tabs': 'insert-tabs',
    'toggle': 'insert-toggle',
    'schalter': 'insert-toggle',
    'telegram': 'insert-tg-preview',
    'email': 'insert-email-preview',
    'mail': 'insert-email-preview',
    'feed': 'insert-feed',
    'liste': 'insert-feed',
    'cron': 'insert-cron-badge',
    'zeitplan': 'insert-cron-badge',
    'schedule': 'insert-cron-badge',
    'quelle': 'insert-source-badge',
    'source': 'insert-source-badge',
    'datenquelle': 'insert-source-badge',
    'status': 'insert-status',
    'badge': 'insert-badge',
    'spalte': 'insert-grid2',
    'grid': 'insert-grid2',
    'abschnitt': 'insert-section',
    'section': 'insert-section',
    'ueberschrift': 'insert-h1',
    'titel': 'insert-h1',
    'h1': 'insert-h1',
    'h2': 'insert-h2',
    'stille': 'insert-silence',
    'ruhe': 'insert-silence',
    'ok': 'insert-silence'
  };

  var matched = null;
  Object.keys(keywords).forEach(function(kw) {
    if (lower.indexOf(kw) !== -1 && !matched) {
      matched = keywords[kw];
    }
  });

  if (matched) {
    insertElement(matched);
    var itemLabel = '';
    TOOLBOX.forEach(function(g) {
      if (g.isDataSources) return;
      g.items.forEach(function(it) {
        if (it.id === matched) itemLabel = it.label;
      });
    });
    addChatMessage('bot', '"' + itemLabel + '" eingefuegt. Du kannst es im Canvas anklicken und die Eigenschaften rechts bearbeiten.');
  } else if (lower.indexOf('theme') !== -1 || lower.indexOf('design') !== -1) {
    addChatMessage('bot', 'Du kannst das Theme oben in der Kopfleiste aendern. Verfuegbare Themes: ' + THEMES.map(function(t) { return t.name; }).join(', '));
  } else if (lower.indexOf('scaffold') !== -1 || lower.indexOf('vorlage') !== -1 || lower.indexOf('template') !== -1) {
    addChatMessage('bot', 'Waehle ein Scaffold oben in der Kopfleiste: ' + SCAFFOLDS.map(function(s) { return s.name; }).join(', '));
  } else if (lower.indexOf('export') !== -1 || lower.indexOf('code') !== -1) {
    addChatMessage('bot', 'Klicke auf "Code anzeigen" in der Kopfleiste, um den generierten Code zu sehen und zu kopieren.');
  } else if (lower.indexOf('deploy') !== -1) {
    addChatMessage('bot', 'Verbinde zuerst einen laufenden Zyrkel (Ports 37848-37853), dann klicke "Jetzt deployen".');
  } else {
    addChatMessage('bot', 'Ich verstehe. Versuche es mit konkreteren Begriffen wie "Chart einfuegen", "Tabelle", "Header", "Statistik-Karte" oder "Theme wechseln". Oder verbinde einen Zyrkel fuer volle KI-Unterstuetzung.');
  }
}

function getAllInsertIds() {
  var ids = [];
  TOOLBOX.forEach(function(g) {
    if (g.isDataSources) return;
    g.items.forEach(function(it) {
      ids.push(it.id);
    });
  });
  return ids;
}

function addChatMessage(role, text) {
  var div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── ZYRKEL DETECTION ───────────────────────────────────────────

function detectZyrkel() {
  var ports = [37848, 37849, 37850, 37851, 37852, 37853];
  var found = false;

  ports.forEach(function(port) {
    if (found) return;
    fetch('http://localhost:' + port + '/api/health', { signal: AbortSignal.timeout(2000) })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!found && data && (data.ok || data.status === 'ok')) {
          found = true;
          state.zyrkelPort = port;
          statusDot.classList.add('online');
          statusLabel.textContent = 'Zyrkel :' + port;
        }
      })
      .catch(function() {});
  });

  // Retry every 15s
  setTimeout(function() {
    if (!state.zyrkelPort) detectZyrkel();
  }, 15000);
}

// ─── UTILITIES ──────────────────────────────────────────────────

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent' || rgb.indexOf('rgba') === 0 && rgb.indexOf(', 0)') !== -1) return '#000000';
  if (rgb.charAt(0) === '#') return rgb;
  var match = rgb.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return '#000000';
  var r = parseInt(match[1]);
  var g = parseInt(match[2]);
  var b = parseInt(match[3]);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ─── KEYBOARD SHORTCUTS ─────────────────────────────────────────

document.addEventListener('keydown', function(e) {
  // Delete selected element
  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElement && document.activeElement === document.body) {
    e.preventDefault();
    if (canvas.contentWindow) {
      canvas.contentWindow.postMessage({ type: 'nz-delete', id: state.selectedElement.id }, '*');
    }
    if (state.bindings[state.selectedElement.id]) {
      delete state.bindings[state.selectedElement.id];
    }
    state.selectedElement = null;
    state.propertiesVisible = false;
    studioEl.classList.remove('props-open');
    propertiesEl.classList.add('hidden');
  }

  // Toggle code drawer with Ctrl+Shift+C
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    $('btn-code').click();
  }

  // Escape closes modals/properties/chat/code
  if (e.key === 'Escape') {
    if (state.dsModalOpen) {
      closeDataSourceModal();
    } else if (state.chatOpen) {
      state.chatOpen = false;
      chatOverlay.classList.add('hidden');
    } else if (state.codeVisible) {
      state.codeVisible = false;
      codeDrawer.classList.add('hidden');
    } else if (state.propertiesVisible) {
      state.propertiesVisible = false;
      studioEl.classList.remove('props-open');
      propertiesEl.classList.add('hidden');
    }
  }
});

// ─── INIT ───────────────────────────────────────────────────────

function init() {
  // Inject modal styles early
  injectModalStyles();

  // Load editor overlay and sample data scripts
  loadEditorAssets().then(function() {
    // Render UI
    renderToolbox();
    renderScaffoldMenu();
    renderThemeMenu();
    renderPageTabs();

    // Load the initial theme into cache first
    var themeUrl = RAW_BASE + '/themes/' + state.theme + '.css';
    fetchFile(themeUrl).then(function(css) {
      if (!css) css = generateThemeFallback(state.theme);
      state.themeCache[state.theme] = css;

      // Load initial scaffold
      loadScaffold(state.scaffold);
    });
  });

  // Detect Zyrkel
  detectZyrkel();
}

init();

})();
