/* ═══════════════════════════════════════════════════════════════
   nano-zyrkel studio — builder.js
   Chat-first builder. User describes, LLM/templates build it.
   ═══════════════════════════════════════════════════════════════ */

(function() {
'use strict';

// ─── THEMES ────────────────────────────────────────────────────

var THEMES = [
  { id: 'dashboard', name: 'Dashboard', desc: 'Dunkel, Neon-Akzente' },
  { id: 'clinical', name: 'Clinical', desc: 'Hell, medizinisch' },
  { id: 'magazine', name: 'Magazine', desc: 'Warm, editorial' },
  { id: 'minimal', name: 'Minimal', desc: 'Schwarz/Weiss' },
  { id: 'cinematic', name: 'Cinematic', desc: 'Dunkel, Gradient' }
];

var THEME_CSS = {
  dashboard: ':root{--t-bg:#0f172a;--t-card:#1e293b;--t-accent:#8B5CF6;--t-accent2:#06b6d4;--t-text:#e2e8f0;--t-muted:#94a3b8;--t-border:rgba(255,255,255,0.06);--t-success:#22c55e;--t-danger:#ef4444;--t-warn:#f59e0b;}body{background:var(--t-bg);color:var(--t-text);}',
  clinical: ':root{--t-bg:#f0f4f8;--t-card:#ffffff;--t-accent:#2563eb;--t-accent2:#0891b2;--t-text:#1e293b;--t-muted:#64748b;--t-border:rgba(0,0,0,0.08);--t-success:#16a34a;--t-danger:#dc2626;--t-warn:#d97706;}body{background:var(--t-bg);color:var(--t-text);}',
  magazine: ':root{--t-bg:#faf7f2;--t-card:#ffffff;--t-accent:#b45309;--t-accent2:#0d9488;--t-text:#292524;--t-muted:#78716c;--t-border:rgba(0,0,0,0.06);--t-success:#16a34a;--t-danger:#dc2626;--t-warn:#d97706;}body{background:var(--t-bg);color:var(--t-text);}',
  minimal: ':root{--t-bg:#ffffff;--t-card:#f8fafc;--t-accent:#18181b;--t-accent2:#71717a;--t-text:#09090b;--t-muted:#a1a1aa;--t-border:rgba(0,0,0,0.08);--t-success:#16a34a;--t-danger:#dc2626;--t-warn:#d97706;}body{background:var(--t-bg);color:var(--t-text);}',
  cinematic: ':root{--t-bg:#09090b;--t-card:#18181b;--t-accent:#a855f7;--t-accent2:#ec4899;--t-text:#fafafa;--t-muted:#a1a1aa;--t-border:rgba(255,255,255,0.06);--t-success:#22c55e;--t-danger:#ef4444;--t-warn:#f59e0b;}body{background:var(--t-bg);color:var(--t-text);}'
};

// ─── EXAMPLE PROMPTS ───────────────────────────────────────────

var EXAMPLES = [
  'Dashboard das ClinVar-Varianten fuer BRCA1 trackt',
  'Webseiten-Watcher der mich per Telegram informiert wenn sich etwas aendert',
  'News-Digest der taeglich PubMed und bioRxiv zusammenfasst',
  'Status-Monitor fuer meine API mit Uptime-Chart',
  'Portal-Seite die meine GitHub-Projekte zeigt',
  'Email-Bot der Anfragen analysiert und per Telegram zur Freigabe schickt'
];

// ─── LLM SYSTEM PROMPT ────────────────────────────────────────

var LLM_SYSTEM_PROMPT = [
  'Du bist der nano-zyrkel Studio Assistent. Der Benutzer beschreibt was er bauen will.',
  '',
  'Deine Aufgabe:',
  '1. Verstehe was der Benutzer will',
  '2. Generiere ein komplettes HTML-Dashboard/Seite mit eingebetteten Daten',
  '3. Bette die generierte HTML in deiner Antwort ein:',
  '   <!-- NZ-HTML-START -->',
  '   <!DOCTYPE html>...komplettes HTML mit CSS und Daten...',
  '   <!-- NZ-HTML-END -->',
  '',
  'Du kannst auch Teilaenderungen machen wenn der Benutzer sagt "mach X groesser" oder "fuege Y hinzu":',
  '   <!-- NZ-PATCH:selector=.card:nth-child(2)|style=width:100% -->',
  '   <!-- NZ-INSERT:target=main|html=<div class="card">...</div> -->',
  '   <!-- NZ-THEME:dashboard -->',
  '',
  'VERFUEGBARE THEMES: dashboard (dunkel), clinical (hell/blau), magazine (warm), minimal (s/w), cinematic (dunkel/gradient)',
  '',
  'SAMPLE-DATEN (verwende diese fuer Previews):',
  '- Trend: [12, 18, 15, 24, 22, 31, 28, 35]',
  '- Verteilung: [{label:"Pathogenic",value:142}, {label:"VUS",value:312}, ...]',
  '- Tabelle: [{gene:"BRCA1",variant:"c.68_69del",status:"Pathogenic"}, ...]',
  '',
  'Antworte auf Deutsch. Beschreibe kurz was du gebaut hast, dann die HTML.'
].join('\n');

// ─── TEMPLATE ENGINE ───────────────────────────────────────────

function themeVars(themeId) {
  var t = THEME_CSS[themeId] || THEME_CSS.dashboard;
  return t;
}

function baseStyles(themeId) {
  var isDark = themeId === 'dashboard' || themeId === 'cinematic';
  var isWarm = themeId === 'magazine';
  return [
    themeVars(themeId),
    'body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:24px;min-height:100vh;}',
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;max-width:1200px;margin:0 auto;}',
    '.card{background:var(--t-card);border-radius:12px;padding:20px;border:1px solid var(--t-border);' + (isDark ? 'box-shadow:0 4px 16px rgba(0,0,0,0.2);' : 'box-shadow:0 2px 8px rgba(0,0,0,0.06);') + '}',
    '.stat-value{font-size:2rem;font-weight:700;line-height:1.2;}',
    '.stat-label{opacity:0.7;margin-top:4px;font-size:0.85rem;}',
    '.stat-trend{font-size:0.8rem;margin-top:4px;}',
    'table{width:100%;border-collapse:collapse;font-size:13px;}',
    'th{text-align:left;padding:10px 12px;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.6;border-bottom:2px solid var(--t-border);}',
    'td{padding:10px 12px;border-bottom:1px solid var(--t-border);}',
    'tr:hover td{background:' + (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') + ';}',
    '.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;}',
    '.badge-red{background:rgba(239,68,68,0.12);color:#ef4444;}',
    '.badge-yellow{background:rgba(234,179,8,0.12);color:#eab308;}',
    '.badge-green{background:rgba(34,197,94,0.12);color:#22c55e;}',
    '.badge-blue{background:rgba(59,130,246,0.12);color:#3b82f6;}',
    'h1{font-size:1.8rem;font-weight:700;margin:0;}',
    'h2{font-size:1.3rem;font-weight:600;margin:0 0 12px;}',
    'h3{font-size:1rem;font-weight:600;margin:0 0 12px;}',
    'a{color:var(--t-accent);text-decoration:none;}',
    '*{box-sizing:border-box;}'
  ].join('\n');
}

function svgLineChart(data, color, color2) {
  var w = 500, h = 180, pad = 30;
  var vals = data.map(function(d) { return typeof d === 'number' ? d : d.value; });
  var maxV = Math.max.apply(null, vals) || 1;
  var minV = Math.min.apply(null, vals);
  var range = maxV - minV || 1;
  var stepX = (w - pad * 2) / Math.max(vals.length - 1, 1);

  var pts = vals.map(function(v, i) {
    return (pad + i * stepX) + ',' + (h - pad - ((v - minV) / range) * (h - pad * 2));
  });

  var gridLines = '';
  for (var g = 0; g < 5; g++) {
    var gy = pad + g * ((h - pad * 2) / 4);
    var gval = Math.round(maxV - g * (range / 4));
    gridLines += '<line x1="' + pad + '" y1="' + gy + '" x2="' + (w - pad) + '" y2="' + gy + '" stroke="var(--t-border)" stroke-dasharray="4,4"/>';
    gridLines += '<text x="' + (pad - 5) + '" y="' + (gy + 4) + '" text-anchor="end" fill="var(--t-muted)" font-size="10">' + gval + '</text>';
  }

  var dots = vals.map(function(v, i) {
    var x = pad + i * stepX;
    var y = h - pad - ((v - minV) / range) * (h - pad * 2);
    return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + color + '" stroke="var(--t-card)" stroke-width="2"/>';
  }).join('');

  var fillPts = (pad + ',' + (h - pad)) + ' ' + pts.join(' ') + ' ' + (pad + (vals.length - 1) * stepX) + ',' + (h - pad);

  return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:' + h + 'px;">' +
    '<defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.3"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
    gridLines +
    '<polygon points="' + fillPts + '" fill="url(#lg1)"/>' +
    '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    dots +
    '</svg>';
}

function svgBarChart(data, colors) {
  var w = 500, h = 180, pad = 30;
  var vals = data.map(function(d) { return d.value; });
  var maxV = Math.max.apply(null, vals) || 1;
  var barW = Math.min(40, (w - pad * 2) / vals.length - 8);
  var bars = '';
  data.forEach(function(d, i) {
    var x = pad + i * ((w - pad * 2) / vals.length) + ((w - pad * 2) / vals.length - barW) / 2;
    var barH = (d.value / maxV) * (h - pad * 2);
    var y = h - pad - barH;
    var c = (colors && colors[i]) || d.color || '#8B5CF6';
    bars += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + barH + '" rx="4" fill="' + c + '"/>';
    bars += '<text x="' + (x + barW / 2) + '" y="' + (h - pad + 14) + '" text-anchor="middle" fill="var(--t-muted)" font-size="10">' + d.label + '</text>';
  });
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:' + h + 'px;">' + bars + '</svg>';
}

function classifBadge(cls) {
  var map = {
    'Pathogenic': 'badge-red', 'Likely Path.': 'badge-yellow',
    'VUS': 'badge-yellow', 'Likely Benign': 'badge-green',
    'Benign': 'badge-blue'
  };
  return '<span class="badge ' + (map[cls] || 'badge-blue') + '">' + cls + '</span>';
}

var TEMPLATES = {
  'clinvar-tracker': {
    keywords: ['clinvar', 'variante', 'variant', 'brca', 'gen', 'pathogenic', 'vus', 'reklassifikation', 'genetik', 'genom'],
    scaffold: 'interactive-app',
    theme: 'dashboard',
    title: 'Varianten-Tracker',
    description: 'ClinVar-Varianten Dashboard mit Reklassifikations-Tracking',
    dataSources: [{ type: 'clinvar', name: 'ClinVar API', schedule: '0 */3 * * *' }],
    generateHtml: function(params) {
      var gene = params.gene || 'BRCA1';
      var theme = params.theme || 'dashboard';
      var stats = SAMPLE_DATA.stats;
      var trend = SAMPLE_DATA.trend;
      var dist = SAMPLE_DATA.distribution;
      var table = SAMPLE_DATA.table;

      var statCards = stats.map(function(s) {
        return '<div class="card" data-nz-binding=\'{"source":"clinvar","field":"stats.' + s.label.toLowerCase() + '"}\'>' +
          '<div class="stat-value" style="color:' + s.color + ';">' + s.value + '</div>' +
          '<div class="stat-label">' + s.label + '</div>' +
          '<div class="stat-trend" style="color:var(--t-success);">' + s.trend + '</div>' +
          '</div>';
      }).join('\n      ');

      var tableRows = table.map(function(r) {
        return '<tr><td style="font-weight:600;">' + r.gene + '</td><td><code style="font-size:12px;background:rgba(139,92,246,0.1);padding:2px 6px;border-radius:4px;">' + r.variant + '</code></td><td>' + classifBadge(r.classification) + '</td><td>' + r.submissions + '</td><td style="opacity:0.6;">' + r.lastUpdate + '</td></tr>';
      }).join('\n          ');

      return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + gene + ' Varianten-Tracker</title>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n<style>\n' + baseStyles(theme) + '\n</style>\n</head>\n<body>\n' +
        '<header style="max-width:1200px;margin:0 auto 24px;display:flex;justify-content:space-between;align-items:center;">\n' +
        '  <div>\n    <h1 data-nz-binding=\'{"source":"clinvar","field":"title"}\'>' + gene + ' Varianten-Tracker</h1>\n' +
        '    <p style="opacity:0.6;margin-top:6px;" data-nz-binding=\'{"source":"clinvar","field":"description"}\'>ClinVar-Reklassifikationen fuer ' + gene + '</p>\n  </div>\n' +
        '  <div style="display:flex;align-items:center;gap:8px;padding:6px 16px;background:var(--t-card);border-radius:20px;font-size:13px;border:1px solid var(--t-border);">&#x23F0; Alle 3 Stunden</div>\n' +
        '</header>\n' +
        '<main class="grid" style="max-width:1200px;margin:0 auto;">\n' +
        '  ' + statCards + '\n' +
        '  <div class="card" style="grid-column:span 2;" data-nz-binding=\'{"source":"clinvar","field":"trend","type":"line-chart"}\'>\n' +
        '    <h3>Reklassifikationen ueber Zeit</h3>\n' +
        '    ' + svgLineChart(trend, '#8B5CF6', '#06b6d4') + '\n' +
        '  </div>\n' +
        '  <div class="card" data-nz-binding=\'{"source":"clinvar","field":"distribution","type":"bar-chart"}\'>\n' +
        '    <h3>Klassifikationsverteilung</h3>\n' +
        '    ' + svgBarChart(dist) + '\n' +
        '  </div>\n' +
        '  <div class="card" style="grid-column:1/-1;" data-nz-binding=\'{"source":"clinvar","field":"table","type":"table"}\'>\n' +
        '    <h3>Aktuelle Varianten</h3>\n' +
        '    <div style="overflow-x:auto;"><table>\n' +
        '      <thead><tr><th>Gen</th><th>Variante</th><th>Klassifikation</th><th>Einreichungen</th><th>Update</th></tr></thead>\n' +
        '      <tbody>' + tableRows + '</tbody>\n' +
        '    </table></div>\n' +
        '  </div>\n' +
        '  <div class="card" style="background:' + (theme === 'dashboard' || theme === 'cinematic' ? '#1b2836' : 'rgba(0,136,204,0.05)') + ';border:1px solid rgba(0,136,204,0.2);">\n' +
        '    <h4 style="color:#06b6d4;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Telegram Benachrichtigung</h4>\n' +
        '    <div style="background:' + (theme === 'dashboard' || theme === 'cinematic' ? '#2b5278' : 'rgba(0,136,204,0.1)') + ';border-radius:12px 12px 12px 2px;padding:12px 16px;font-size:13px;line-height:1.5;">\n' +
        '      &#x1F514; <b>Reklassifikation erkannt!</b><br>\n' +
        '      ' + gene + ' c.68_69del: VUS &#x2192; Pathogenic<br>\n' +
        '      <span style="font-size:11px;opacity:0.4;float:right;">14:32</span>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '  <div class="card" style="text-align:center;border:1px solid rgba(34,197,94,0.15);">\n' +
        '    <div style="font-size:28px;margin-bottom:6px;">&#x2705;</div>\n' +
        '    <div style="font-weight:600;color:var(--t-success);">Alles ruhig</div>\n' +
        '    <div style="font-size:12px;opacity:0.5;margin-top:4px;">Letzte Pruefung: 14:32 — Keine Aenderungen</div>\n' +
        '  </div>\n' +
        '</main>\n' +
        '<footer style="max-width:1200px;margin:32px auto 0;text-align:center;font-size:12px;opacity:0.4;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>\n' +
        '</body>\n</html>';
    }
  },

  'website-watcher': {
    keywords: ['webseite', 'website', 'url', 'ueberwach', 'watch', 'aender', 'change', 'preis', 'verfuegbar', 'seite'],
    scaffold: 'data-pipeline',
    theme: 'minimal',
    title: 'Webseiten-Watcher',
    description: 'Webseiten-Ueberwachung mit Aenderungs-Benachrichtigung',
    dataSources: [{ type: 'api', name: 'Webseite', url: '' }],
    generateHtml: function(params) {
      var theme = params.theme || 'dashboard';
      return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Webseiten-Watcher</title>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n<style>\n' + baseStyles(theme) + '\n.url-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);font-size:13px;color:var(--t-accent2);font-family:monospace;}\n.timeline-item{display:flex;gap:16px;padding:16px 0;border-bottom:1px solid var(--t-border);}\n.timeline-dot{width:12px;height:12px;border-radius:50%;margin-top:4px;flex-shrink:0;}\n.timeline-content{flex:1;}\n.timeline-time{font-size:11px;opacity:0.5;margin-top:4px;}\n.diff-block{background:rgba(0,0,0,0.1);border-radius:8px;padding:12px;margin-top:8px;font-family:monospace;font-size:12px;line-height:1.6;}\n.diff-add{color:var(--t-success);}\n.diff-del{color:var(--t-danger);text-decoration:line-through;opacity:0.7;}\n</style>\n</head>\n<body>\n' +
        '<header style="max-width:1200px;margin:0 auto 24px;display:flex;justify-content:space-between;align-items:center;">\n' +
        '  <div>\n    <h1>Webseiten-Watcher</h1>\n    <p style="opacity:0.6;margin-top:6px;">Aenderungen automatisch erkennen und benachrichtigen</p>\n  </div>\n' +
        '  <div style="display:flex;align-items:center;gap:8px;padding:6px 16px;background:var(--t-card);border-radius:20px;font-size:13px;border:1px solid var(--t-border);">&#x23F0; Alle 15 Min.</div>\n' +
        '</header>\n' +
        '<main class="grid" style="max-width:1200px;margin:0 auto;">\n' +
        '  <div class="card"><div class="stat-value" style="color:var(--t-accent);">3</div><div class="stat-label">Ueberwachte Seiten</div></div>\n' +
        '  <div class="card"><div class="stat-value" style="color:var(--t-success);">7</div><div class="stat-label">Aenderungen (7d)</div></div>\n' +
        '  <div class="card"><div class="stat-value" style="color:var(--t-accent2);">99.8%</div><div class="stat-label">Erreichbarkeit</div></div>\n' +
        '  <div class="card" style="grid-column:1/-1;">\n' +
        '    <h3>Ueberwachte Seiten</h3>\n' +
        '    <div style="overflow-x:auto;"><table>\n' +
        '      <thead><tr><th>URL</th><th>Status</th><th>Letzte Aenderung</th><th>Checks</th></tr></thead>\n' +
        '      <tbody>\n' +
        '        <tr><td><span class="url-badge">https://example.com/status</span></td><td><span class="badge badge-green">Online</span></td><td>vor 2h</td><td>1.247</td></tr>\n' +
        '        <tr><td><span class="url-badge">https://api.example.org/v2</span></td><td><span class="badge badge-green">Online</span></td><td>vor 1d</td><td>892</td></tr>\n' +
        '        <tr><td><span class="url-badge">https://shop.example.de/angebot</span></td><td><span class="badge badge-yellow">Geaendert</span></td><td>vor 15 Min.</td><td>2.103</td></tr>\n' +
        '      </tbody>\n' +
        '    </table></div>\n' +
        '  </div>\n' +
        '  <div class="card" style="grid-column:span 2;">\n' +
        '    <h3>Aenderungs-Timeline</h3>\n' +
        '    <div class="timeline-item"><div class="timeline-dot" style="background:var(--t-warn);"></div><div class="timeline-content"><b>Inhalt geaendert</b> — shop.example.de/angebot<div class="diff-block"><span class="diff-del">- Preis: 49,99 EUR</span><br><span class="diff-add">+ Preis: 39,99 EUR</span></div><div class="timeline-time">vor 15 Minuten</div></div></div>\n' +
        '    <div class="timeline-item"><div class="timeline-dot" style="background:var(--t-success);"></div><div class="timeline-content"><b>Neuer Inhalt</b> — example.com/status<div class="diff-block"><span class="diff-add">+ Wartung abgeschlossen. Alle Systeme operativ.</span></div><div class="timeline-time">vor 2 Stunden</div></div></div>\n' +
        '    <div class="timeline-item"><div class="timeline-dot" style="background:var(--t-danger);"></div><div class="timeline-content"><b>Seite nicht erreichbar</b> — api.example.org/v2<div class="timeline-time">vor 1 Tag — Dauer: 3 Minuten</div></div></div>\n' +
        '  </div>\n' +
        '  <div class="card" style="background:rgba(0,136,204,0.04);border:1px solid rgba(0,136,204,0.2);">\n' +
        '    <h4 style="color:#06b6d4;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Telegram Benachrichtigung</h4>\n' +
        '    <div style="background:rgba(43,82,120,0.3);border-radius:12px 12px 12px 2px;padding:12px 16px;font-size:13px;line-height:1.5;">\n' +
        '      &#x1F514; <b>Aenderung erkannt!</b><br>\n' +
        '      shop.example.de/angebot<br>\n' +
        '      Preis: 49,99 &#x2192; 39,99 EUR<br>\n' +
        '      <span style="font-size:11px;opacity:0.4;float:right;">14:32</span>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</main>\n' +
        '<footer style="max-width:1200px;margin:32px auto 0;text-align:center;font-size:12px;opacity:0.4;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>\n' +
        '</body>\n</html>';
    }
  },

  'news-digest': {
    keywords: ['news', 'digest', 'rss', 'feed', 'zusammenfass', 'pubmed', 'literatur', 'paper', 'biorxiv', 'medrxiv', 'arxiv', 'nachrichten'],
    scaffold: 'newsletter',
    theme: 'magazine',
    title: 'News-Digest',
    description: 'Automatischer News-Digest mit KI-Zusammenfassungen',
    dataSources: [{ type: 'rss', name: 'Feed' }],
    generateHtml: function(params) {
      var theme = params.theme || 'dashboard';
      var feeds = SAMPLE_DATA.feeds;
      var feedCards = feeds.map(function(f) {
        return '<article class="card" style="display:flex;gap:16px;align-items:flex-start;">' +
          '<div style="width:4px;height:100%;min-height:60px;border-radius:2px;background:' + (f.isNew ? 'var(--t-accent)' : 'var(--t-border)') + ';flex-shrink:0;"></div>' +
          '<div style="flex:1;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<span class="badge ' + (f.source === 'PubMed' ? 'badge-blue' : f.source === 'bioRxiv' ? 'badge-green' : 'badge-yellow') + '">' + f.source + '</span>' +
          (f.isNew ? '<span class="badge badge-red" style="font-size:10px;">NEU</span>' : '') +
          '</div>' +
          '<h3 style="font-size:15px;margin:0 0 6px;line-height:1.4;">' + f.title + '</h3>' +
          '<p style="font-size:12px;opacity:0.5;margin:0;">' + f.date + '</p>' +
          '</div></article>';
      }).join('\n      ');

      return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>News-Digest</title>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n<style>\n' + baseStyles(theme) + '\n.digest-grid{display:grid;grid-template-columns:1fr;gap:12px;max-width:800px;margin:0 auto;}\n.summary-box{background:rgba(139,92,246,0.05);border:1px solid rgba(139,92,246,0.15);border-radius:12px;padding:20px;margin-bottom:24px;max-width:800px;margin-left:auto;margin-right:auto;}\n.summary-box h3{margin:0 0 8px;color:var(--t-accent);}\n</style>\n</head>\n<body>\n' +
        '<header style="max-width:800px;margin:0 auto 24px;text-align:center;">\n' +
        '  <h1>News-Digest</h1>\n' +
        '  <p style="opacity:0.6;margin-top:6px;">Taeglich um 8:00 — PubMed, bioRxiv, medRxiv</p>\n' +
        '  <div style="display:flex;justify-content:center;gap:12px;margin-top:16px;">\n' +
        '    <div class="card" style="padding:12px 20px;text-align:center;"><div class="stat-value" style="color:var(--t-accent);font-size:1.4rem;">' + feeds.length + '</div><div class="stat-label" style="font-size:11px;">Neue Artikel</div></div>\n' +
        '    <div class="card" style="padding:12px 20px;text-align:center;"><div class="stat-value" style="color:var(--t-accent2);font-size:1.4rem;">3</div><div class="stat-label" style="font-size:11px;">Quellen</div></div>\n' +
        '    <div class="card" style="padding:12px 20px;text-align:center;"><div class="stat-value" style="color:var(--t-success);font-size:1.4rem;">' + feeds.filter(function(f) { return f.isNew; }).length + '</div><div class="stat-label" style="font-size:11px;">Ungelesen</div></div>\n' +
        '  </div>\n' +
        '</header>\n' +
        '<div class="summary-box">\n' +
        '  <h3>&#x1F916; KI-Zusammenfassung</h3>\n' +
        '  <p style="font-size:13px;line-height:1.6;margin:0;">Heute 4 neue Publikationen. Besonders relevant: Eine Studie zu Strukturvarianten in BRCA1 Intron 12 (bioRxiv) koennte Auswirkungen auf die Interpretation von VUS haben. ClinVar-Reklassifikationsraten 2020-2025 zeigen einen Anstieg bei BRCA-Genen.</p>\n' +
        '</div>\n' +
        '<div class="digest-grid">\n' +
        '  ' + feedCards + '\n' +
        '</div>\n' +
        '<div style="max-width:800px;margin:24px auto 0;">\n' +
        '  <div class="card" style="background:rgba(0,136,204,0.04);border:1px solid rgba(0,136,204,0.2);">\n' +
        '    <h4 style="color:#06b6d4;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Telegram Benachrichtigung</h4>\n' +
        '    <div style="background:rgba(43,82,120,0.3);border-radius:12px 12px 12px 2px;padding:12px 16px;font-size:13px;line-height:1.5;">\n' +
        '      &#x1F4F0; <b>News-Digest — ' + feeds.length + ' neue Artikel</b><br><br>\n' +
        '      1. ' + feeds[0].title + '<br>\n' +
        '      2. ' + feeds[1].title + '<br>\n' +
        '      <span style="font-size:11px;opacity:0.4;float:right;">08:00</span>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</div>\n' +
        '<footer style="max-width:800px;margin:32px auto 0;text-align:center;font-size:12px;opacity:0.4;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>\n' +
        '</body>\n</html>';
    }
  },

  'api-monitor': {
    keywords: ['api', 'monitor', 'status', 'uptime', 'health', 'endpunkt', 'endpoint', 'ueberwach', 'server', 'ping'],
    scaffold: 'monitor',
    theme: 'dashboard',
    title: 'API-Monitor',
    description: 'API-Status und Uptime-Monitoring',
    dataSources: [{ type: 'api', name: 'API Endpoint' }],
    generateHtml: function(params) {
      var theme = params.theme || 'dashboard';
      var uptimeData = [99.9, 100, 99.8, 100, 100, 99.5, 100, 99.9, 100, 100, 98.2, 100, 100, 99.9];
      var uptimeBars = uptimeData.map(function(v) {
        var color = v >= 99.9 ? 'var(--t-success)' : v >= 99 ? 'var(--t-warn)' : 'var(--t-danger)';
        return '<div style="flex:1;height:32px;background:' + color + ';border-radius:3px;opacity:0.8;" title="' + v + '%"></div>';
      }).join('');

      return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>API-Monitor</title>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n<style>\n' + baseStyles(theme) + '\n.uptime-bar{display:flex;gap:2px;margin:12px 0;}\n.endpoint-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--t-border);}\n.endpoint-row:last-child{border-bottom:none;}\n.ep-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}\n.ep-name{flex:1;font-weight:500;}\n.ep-latency{font-family:monospace;font-size:13px;opacity:0.7;}\n.ep-status{font-size:12px;}\n</style>\n</head>\n<body>\n' +
        '<header style="max-width:1200px;margin:0 auto 24px;display:flex;justify-content:space-between;align-items:center;">\n' +
        '  <div>\n    <h1>API-Monitor</h1>\n    <p style="opacity:0.6;margin-top:6px;">Echtzeit-Status und Uptime-Tracking</p>\n  </div>\n' +
        '  <div style="display:flex;gap:8px;">\n' +
        '    <div style="padding:6px 16px;background:var(--t-card);border-radius:20px;font-size:13px;border:1px solid var(--t-border);">&#x23F0; Jede Minute</div>\n' +
        '  </div>\n' +
        '</header>\n' +
        '<main class="grid" style="max-width:1200px;margin:0 auto;">\n' +
        '  <div class="card"><div class="stat-value" style="color:var(--t-success);font-size:2.5rem;">&#x2713;</div><div class="stat-label">Alle Systeme operativ</div></div>\n' +
        '  <div class="card"><div class="stat-value" style="color:var(--t-accent);">99.94%</div><div class="stat-label">Uptime (30d)</div><div class="stat-trend" style="color:var(--t-success);">+0.02%</div></div>\n' +
        '  <div class="card"><div class="stat-value" style="color:var(--t-accent2);">42ms</div><div class="stat-label">Avg. Latenz</div><div class="stat-trend" style="color:var(--t-success);">-3ms</div></div>\n' +
        '  <div class="card"><div class="stat-value" style="color:var(--t-warn);">1</div><div class="stat-label">Vorfall (30d)</div></div>\n' +
        '  <div class="card" style="grid-column:1/-1;">\n' +
        '    <h3>Uptime — letzte 14 Tage</h3>\n' +
        '    <div class="uptime-bar">' + uptimeBars + '</div>\n' +
        '    <div style="display:flex;justify-content:space-between;font-size:11px;opacity:0.4;"><span>vor 14d</span><span>heute</span></div>\n' +
        '  </div>\n' +
        '  <div class="card" style="grid-column:1/-1;">\n' +
        '    <h3>Endpunkte</h3>\n' +
        '    <div class="endpoint-row"><div class="ep-dot" style="background:var(--t-success);"></div><div class="ep-name">/api/v1/health</div><div class="ep-latency">23ms</div><div class="ep-status"><span class="badge badge-green">OK</span></div></div>\n' +
        '    <div class="endpoint-row"><div class="ep-dot" style="background:var(--t-success);"></div><div class="ep-name">/api/v1/data</div><div class="ep-latency">87ms</div><div class="ep-status"><span class="badge badge-green">OK</span></div></div>\n' +
        '    <div class="endpoint-row"><div class="ep-dot" style="background:var(--t-success);"></div><div class="ep-name">/api/v1/auth</div><div class="ep-latency">34ms</div><div class="ep-status"><span class="badge badge-green">OK</span></div></div>\n' +
        '    <div class="endpoint-row"><div class="ep-dot" style="background:var(--t-warn);"></div><div class="ep-name">/api/v1/export</div><div class="ep-latency">342ms</div><div class="ep-status"><span class="badge badge-yellow">Langsam</span></div></div>\n' +
        '  </div>\n' +
        '  <div class="card" style="grid-column:span 2;">\n' +
        '    <h3>Latenz (24h)</h3>\n' +
        '    ' + svgLineChart([23, 25, 22, 28, 45, 89, 342, 156, 67, 34, 29, 24], '#06b6d4') + '\n' +
        '  </div>\n' +
        '  <div class="card" style="background:rgba(0,136,204,0.04);border:1px solid rgba(0,136,204,0.2);">\n' +
        '    <h4 style="color:#06b6d4;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Telegram Alert</h4>\n' +
        '    <div style="background:rgba(43,82,120,0.3);border-radius:12px 12px 12px 2px;padding:12px 16px;font-size:13px;line-height:1.5;">\n' +
        '      &#x1F6A8; <b>API Warnung!</b><br>\n' +
        '      /api/v1/export — Latenz &gt;300ms<br>\n' +
        '      Status: 200 OK, aber langsam<br>\n' +
        '      <span style="font-size:11px;opacity:0.4;float:right;">14:32</span>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</main>\n' +
        '<footer style="max-width:1200px;margin:32px auto 0;text-align:center;font-size:12px;opacity:0.4;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>\n' +
        '</body>\n</html>';
    }
  },

  'project-portal': {
    keywords: ['portal', 'hub', 'projekt', 'showcase', 'sammlung', 'github', 'repo', 'repository', 'uebersicht'],
    scaffold: 'showcase',
    theme: 'cinematic',
    title: 'Projekt-Portal',
    description: 'GitHub-Projekte Showcase',
    dataSources: [{ type: 'github', name: 'GitHub' }],
    generateHtml: function(params) {
      var theme = params.theme || 'cinematic';
      var projects = [
        { name: 'nano-zyrkel', desc: 'Autonomer Agent als GitHub-Repo', lang: 'Rust', stars: 12, color: '#dea584' },
        { name: 'vusTracker', desc: 'Clinical Genetics VUS Tracking', lang: 'TypeScript', stars: 8, color: '#3178c6' },
        { name: 'svLandscape', desc: 'Structural Variant Visualization', lang: 'Python', stars: 5, color: '#3572a5' },
        { name: 'literatureAlert', desc: 'PubMed/bioRxiv Email-Bouncer', lang: 'Rust', stars: 3, color: '#dea584' },
        { name: 'segdup-pipeline', desc: 'Segmental Duplication Analysis', lang: 'Snakemake', stars: 7, color: '#22c55e' },
        { name: 'ighg-genotyper', desc: 'IGHG Haplotype Inference', lang: 'R', stars: 4, color: '#276dc3' }
      ];

      var cards = projects.map(function(p) {
        return '<div class="card" style="display:flex;flex-direction:column;gap:12px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<h3 style="margin:0;font-size:16px;">' + p.name + '</h3>' +
          '<span style="font-size:13px;opacity:0.5;">&#x2B50; ' + p.stars + '</span>' +
          '</div>' +
          '<p style="font-size:13px;opacity:0.7;margin:0;flex:1;">' + p.desc + '</p>' +
          '<div style="display:flex;align-items:center;gap:6px;font-size:12px;">' +
          '<span style="width:10px;height:10px;border-radius:50%;background:' + p.color + ';display:inline-block;"></span>' +
          '<span style="opacity:0.6;">' + p.lang + '</span>' +
          '</div>' +
          '</div>';
      }).join('\n      ');

      return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Projekt-Portal</title>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n<style>\n' + baseStyles(theme) + '\n.hero{text-align:center;padding:48px 24px 32px;max-width:800px;margin:0 auto;}\n.hero h1{font-size:2.4rem;background:linear-gradient(135deg,var(--t-accent),var(--t-accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}\n.hero p{opacity:0.6;margin-top:8px;font-size:16px;}\n.project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;max-width:1200px;margin:0 auto;}\n</style>\n</head>\n<body>\n' +
        '<div class="hero">\n  <h1>Meine Projekte</h1>\n  <p>Open-Source Tools fuer Humangenetik und Bioinformatik</p>\n' +
        '  <div style="display:flex;justify-content:center;gap:16px;margin-top:24px;">\n' +
        '    <div class="card" style="padding:12px 24px;text-align:center;"><div class="stat-value" style="color:var(--t-accent);font-size:1.6rem;">' + projects.length + '</div><div class="stat-label" style="font-size:11px;">Projekte</div></div>\n' +
        '    <div class="card" style="padding:12px 24px;text-align:center;"><div class="stat-value" style="color:var(--t-accent2);font-size:1.6rem;">' + projects.reduce(function(a, p) { return a + p.stars; }, 0) + '</div><div class="stat-label" style="font-size:11px;">Stars</div></div>\n' +
        '    <div class="card" style="padding:12px 24px;text-align:center;"><div class="stat-value" style="color:var(--t-success);font-size:1.6rem;">4</div><div class="stat-label" style="font-size:11px;">Sprachen</div></div>\n' +
        '  </div>\n' +
        '</div>\n' +
        '<div class="project-grid">\n' +
        '  ' + cards + '\n' +
        '</div>\n' +
        '<footer style="max-width:1200px;margin:48px auto 24px;text-align:center;font-size:12px;opacity:0.4;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>\n' +
        '</body>\n</html>';
    }
  },

  'email-bot': {
    keywords: ['email', 'mail', 'bot', 'antwort', 'reply', 'imap', 'postfach', 'inbox', 'anfrage', 'freigabe', 'genehmigung'],
    scaffold: 'data-pipeline',
    theme: 'minimal',
    title: 'Email-Assistent',
    description: 'Automatische Email-Analyse und Telegram-Freigabe',
    dataSources: [{ type: 'email', name: 'Postfach' }],
    generateHtml: function(params) {
      var theme = params.theme || 'dashboard';
      return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Email-Assistent</title>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n<style>\n' + baseStyles(theme) + '\n.flow-step{display:flex;align-items:center;gap:16px;padding:16px 0;}\n.flow-arrow{font-size:20px;opacity:0.3;}\n.flow-box{flex:1;background:var(--t-card);border:1px solid var(--t-border);border-radius:12px;padding:16px;}\n.flow-box h4{margin:0 0 4px;font-size:14px;}\n.flow-box p{margin:0;font-size:12px;opacity:0.6;}\n.email-card{background:var(--t-card);border:1px solid var(--t-border);border-radius:12px;padding:16px;margin-bottom:8px;}\n.email-meta{display:flex;gap:12px;font-size:12px;opacity:0.5;margin-bottom:8px;}\n</style>\n</head>\n<body>\n' +
        '<header style="max-width:1000px;margin:0 auto 24px;display:flex;justify-content:space-between;align-items:center;">\n' +
        '  <div>\n    <h1>Email-Assistent</h1>\n    <p style="opacity:0.6;margin-top:6px;">Eingehende Emails analysieren und per Telegram zur Freigabe schicken</p>\n  </div>\n' +
        '  <div style="padding:6px 16px;background:var(--t-card);border-radius:20px;font-size:13px;border:1px solid var(--t-border);">&#x23F0; Alle 5 Min.</div>\n' +
        '</header>\n' +
        '<main style="max-width:1000px;margin:0 auto;">\n' +
        '  <div class="grid" style="margin-bottom:24px;">\n' +
        '    <div class="card"><div class="stat-value" style="color:var(--t-accent);">14</div><div class="stat-label">Heute verarbeitet</div></div>\n' +
        '    <div class="card"><div class="stat-value" style="color:var(--t-warn);">3</div><div class="stat-label">Warten auf Freigabe</div></div>\n' +
        '    <div class="card"><div class="stat-value" style="color:var(--t-success);">11</div><div class="stat-label">Automatisch beantwortet</div></div>\n' +
        '  </div>\n' +
        '  <div class="card" style="margin-bottom:24px;">\n' +
        '    <h3>Pipeline-Ablauf</h3>\n' +
        '    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 0;">\n' +
        '      <div class="flow-box" style="flex:0 0 auto;text-align:center;padding:12px 20px;"><div style="font-size:24px;margin-bottom:4px;">&#x1F4E7;</div><h4 style="font-size:12px;">IMAP</h4></div>\n' +
        '      <div class="flow-arrow">&#x2192;</div>\n' +
        '      <div class="flow-box" style="flex:0 0 auto;text-align:center;padding:12px 20px;"><div style="font-size:24px;margin-bottom:4px;">&#x1F916;</div><h4 style="font-size:12px;">KI-Analyse</h4></div>\n' +
        '      <div class="flow-arrow">&#x2192;</div>\n' +
        '      <div class="flow-box" style="flex:0 0 auto;text-align:center;padding:12px 20px;"><div style="font-size:24px;margin-bottom:4px;">&#x1F4AC;</div><h4 style="font-size:12px;">Telegram</h4></div>\n' +
        '      <div class="flow-arrow">&#x2192;</div>\n' +
        '      <div class="flow-box" style="flex:0 0 auto;text-align:center;padding:12px 20px;"><div style="font-size:24px;margin-bottom:4px;">&#x2705;</div><h4 style="font-size:12px;">Antwort</h4></div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '  <h3 style="margin-bottom:12px;">Aktuelle Emails</h3>\n' +
        '  <div class="email-card">\n' +
        '    <div class="email-meta"><span>Von: Dr. Mueller</span><span>14:22</span><span class="badge badge-yellow">Freigabe noetig</span></div>\n' +
        '    <b>Anfrage: Zugang zu BRCA1-Daten</b>\n' +
        '    <p style="font-size:13px;opacity:0.7;margin:6px 0 0;">Bitte um Zugang zum ClinVar-Export fuer das gemeinsame Forschungsprojekt...</p>\n' +
        '  </div>\n' +
        '  <div class="email-card">\n' +
        '    <div class="email-meta"><span>Von: Uni-Verwaltung</span><span>11:05</span><span class="badge badge-green">Auto-beantwortet</span></div>\n' +
        '    <b>Terminbestaetigung: Seminar 15.04.</b>\n' +
        '    <p style="font-size:13px;opacity:0.7;margin:6px 0 0;">Hiermit bestaetigen wir Ihre Teilnahme am Seminar...</p>\n' +
        '  </div>\n' +
        '  <div class="email-card">\n' +
        '    <div class="email-meta"><span>Von: GitHub Notifications</span><span>09:30</span><span class="badge badge-blue">Archiviert</span></div>\n' +
        '    <b>[nano-zyrkel] Issue #42: Fleet routing fix</b>\n' +
        '    <p style="font-size:13px;opacity:0.7;margin:6px 0 0;">christian-schlein commented on this issue...</p>\n' +
        '  </div>\n' +
        '  <div class="card" style="margin-top:24px;background:rgba(0,136,204,0.04);border:1px solid rgba(0,136,204,0.2);">\n' +
        '    <h4 style="color:#06b6d4;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Telegram Freigabe</h4>\n' +
        '    <div style="background:rgba(43,82,120,0.3);border-radius:12px 12px 12px 2px;padding:12px 16px;font-size:13px;line-height:1.5;">\n' +
        '      &#x1F4E7; <b>Neue Anfrage</b><br>\n' +
        '      Von: Dr. Mueller<br>\n' +
        '      Betreff: Zugang zu BRCA1-Daten<br><br>\n' +
        '      <b>KI-Einschaetzung:</b> Legitime Forschungsanfrage, Kollaboation bekannt.<br>\n' +
        '      <b>Vorgeschlagene Antwort:</b> Zugang gewaehren + Datenschutzformular senden<br><br>\n' +
        '      <span style="padding:4px 12px;border-radius:6px;background:rgba(34,197,94,0.2);color:#22c55e;font-size:12px;margin-right:6px;">&#x2705; Freigeben</span>\n' +
        '      <span style="padding:4px 12px;border-radius:6px;background:rgba(239,68,68,0.2);color:#ef4444;font-size:12px;">&#x274C; Ablehnen</span>\n' +
        '      <span style="font-size:11px;opacity:0.4;float:right;">14:22</span>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</main>\n' +
        '<footer style="max-width:1000px;margin:32px auto 0;text-align:center;font-size:12px;opacity:0.4;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>\n' +
        '</body>\n</html>';
    }
  },

  'dashboard': {
    keywords: ['dashboard', 'chart', 'diagramm', 'visualis', 'daten', 'trend', 'statistik', 'auswertung', 'analytics'],
    scaffold: 'interactive-app',
    theme: 'dashboard',
    title: 'Daten-Dashboard',
    description: 'Allgemeines Dashboard mit Charts und Statistiken',
    dataSources: [{ type: 'api', name: 'Datenquelle' }],
    generateHtml: function(params) {
      var theme = params.theme || 'dashboard';
      var stats = SAMPLE_DATA.stats;
      var trend = SAMPLE_DATA.trend;
      var dist = SAMPLE_DATA.distribution;
      var table = SAMPLE_DATA.table;

      var statCards = stats.map(function(s) {
        return '<div class="card"><div class="stat-value" style="color:' + s.color + ';">' + s.value + '</div><div class="stat-label">' + s.label + '</div><div class="stat-trend" style="color:var(--t-success);">' + s.trend + '</div></div>';
      }).join('\n      ');

      var tableRows = table.map(function(r) {
        return '<tr><td style="font-weight:600;">' + r.gene + '</td><td><code style="font-size:12px;background:rgba(139,92,246,0.1);padding:2px 6px;border-radius:4px;">' + r.variant + '</code></td><td>' + classifBadge(r.classification) + '</td><td>' + r.submissions + '</td><td style="opacity:0.6;">' + r.lastUpdate + '</td></tr>';
      }).join('\n          ');

      return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Daten-Dashboard</title>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n<style>\n' + baseStyles(theme) + '\n</style>\n</head>\n<body>\n' +
        '<header style="max-width:1200px;margin:0 auto 24px;"><h1>Daten-Dashboard</h1><p style="opacity:0.6;margin-top:6px;">Live-Daten und Visualisierungen</p></header>\n' +
        '<main class="grid" style="max-width:1200px;margin:0 auto;">\n' +
        '  ' + statCards + '\n' +
        '  <div class="card" style="grid-column:span 2;"><h3>Trend</h3>' + svgLineChart(trend, '#8B5CF6') + '</div>\n' +
        '  <div class="card"><h3>Verteilung</h3>' + svgBarChart(dist) + '</div>\n' +
        '  <div class="card" style="grid-column:1/-1;"><h3>Datentabelle</h3><div style="overflow-x:auto;"><table><thead><tr><th>Gen</th><th>Variante</th><th>Klassifikation</th><th>Einreichungen</th><th>Update</th></tr></thead><tbody>' + tableRows + '</tbody></table></div></div>\n' +
        '</main>\n' +
        '<footer style="max-width:1200px;margin:32px auto 0;text-align:center;font-size:12px;opacity:0.4;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>\n' +
        '</body>\n</html>';
    }
  },

  'deadline-watcher': {
    keywords: ['frist', 'deadline', 'erinner', 'termin', 'ablauf', 'countdown', 'warten', 'bis', 'datum'],
    scaffold: 'data-pipeline',
    theme: 'minimal',
    title: 'Frist-Waechter',
    description: 'Fristen und Deadlines ueberwachen',
    dataSources: [{ type: 'api', name: 'Ziel-Seite' }],
    generateHtml: function(params) {
      var theme = params.theme || 'dashboard';
      var deadlines = [
        { name: 'DFG-Antrag einreichen', date: '2026-04-30', days: 20, status: 'warn' },
        { name: 'Paper-Revision Biology', date: '2026-05-15', days: 35, status: 'ok' },
        { name: 'Ethikvotum Verlaengerung', date: '2026-04-18', days: 8, status: 'danger' },
        { name: 'Konferenz-Abstract ESHG', date: '2026-06-01', days: 52, status: 'ok' }
      ];

      var dlCards = deadlines.map(function(d) {
        var col = d.status === 'danger' ? 'var(--t-danger)' : d.status === 'warn' ? 'var(--t-warn)' : 'var(--t-success)';
        var barWidth = Math.max(5, Math.min(100, 100 - d.days));
        return '<div class="card" style="position:relative;overflow:hidden;">' +
          '<div style="position:absolute;bottom:0;left:0;height:3px;width:' + barWidth + '%;background:' + col + ';border-radius:0 3px 0 0;"></div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<div><h3 style="margin:0;font-size:15px;">' + d.name + '</h3><p style="margin:4px 0 0;font-size:12px;opacity:0.5;">' + d.date + '</p></div>' +
          '<div style="text-align:right;"><div style="font-size:1.8rem;font-weight:700;color:' + col + ';">' + d.days + '</div><div style="font-size:11px;opacity:0.5;">Tage</div></div>' +
          '</div></div>';
      }).join('\n      ');

      return '<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Frist-Waechter</title>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n<style>\n' + baseStyles(theme) + '\n</style>\n</head>\n<body>\n' +
        '<header style="max-width:900px;margin:0 auto 24px;text-align:center;">\n' +
        '  <h1>Frist-Waechter</h1>\n' +
        '  <p style="opacity:0.6;margin-top:6px;">Deadlines im Blick — Erinnerung per Telegram</p>\n' +
        '</header>\n' +
        '<main style="max-width:900px;margin:0 auto;">\n' +
        '  <div class="grid" style="margin-bottom:24px;">\n' +
        '    <div class="card" style="text-align:center;"><div class="stat-value" style="color:var(--t-danger);">1</div><div class="stat-label">Kritisch (&lt;10 Tage)</div></div>\n' +
        '    <div class="card" style="text-align:center;"><div class="stat-value" style="color:var(--t-warn);">1</div><div class="stat-label">Bald (&lt;30 Tage)</div></div>\n' +
        '    <div class="card" style="text-align:center;"><div class="stat-value" style="color:var(--t-success);">2</div><div class="stat-label">Im Plan</div></div>\n' +
        '  </div>\n' +
        '  <div class="grid" style="grid-template-columns:1fr;gap:12px;">\n' +
        '    ' + dlCards + '\n' +
        '  </div>\n' +
        '  <div class="card" style="margin-top:24px;background:rgba(0,136,204,0.04);border:1px solid rgba(0,136,204,0.2);">\n' +
        '    <h4 style="color:#06b6d4;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Telegram Erinnerung</h4>\n' +
        '    <div style="background:rgba(43,82,120,0.3);border-radius:12px 12px 12px 2px;padding:12px 16px;font-size:13px;line-height:1.5;">\n' +
        '      &#x23F0; <b>Frist-Erinnerung</b><br><br>\n' +
        '      &#x1F534; Ethikvotum Verlaengerung — <b>8 Tage</b><br>\n' +
        '      &#x1F7E1; DFG-Antrag einreichen — <b>20 Tage</b><br>\n' +
        '      <span style="font-size:11px;opacity:0.4;float:right;">08:00</span>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '  <div class="card" style="margin-top:12px;text-align:center;border:1px solid rgba(34,197,94,0.15);">\n' +
        '    <div style="font-size:28px;margin-bottom:6px;">&#x2705;</div>\n' +
        '    <div style="font-weight:600;color:var(--t-success);">Alle Fristen erfasst</div>\n' +
        '    <div style="font-size:12px;opacity:0.5;margin-top:4px;">Naechste Erinnerung: morgen 08:00</div>\n' +
        '  </div>\n' +
        '</main>\n' +
        '<footer style="max-width:900px;margin:32px auto 0;text-align:center;font-size:12px;opacity:0.4;">powered by <a href="https://github.com/schlein-lab/nano-zyrkel">nano-zyrkel</a></footer>\n' +
        '</body>\n</html>';
    }
  }
};

// ─── STATE ──────────────────────────────────────────────────────

var state = {
  theme: 'dashboard',
  selectedElement: null,
  codeVisible: false,
  activeCodeTab: 'html',
  propertiesVisible: false,
  zyrkelPort: null,
  currentHtml: '',
  chatHistory: [],
  dataSources: [],
  scaffold: null
};

// ─── DOM REFS ───────────────────────────────────────────────────

var $ = function(id) { return document.getElementById(id); };

var canvas = $('canvas');
var canvasLoader = $('canvas-loader');
var canvasEmpty = $('canvas-empty');
var studioEl = $('studio');
var propertiesEl = $('properties');
var chatMessages = $('chat-messages');
var chatInput = $('chat-input');
var codeDrawer = $('code-drawer');
var drawerCode = $('drawer-code');
var themeMenu = $('theme-menu');
var btnTheme = $('btn-theme');
var statusDot = document.querySelector('.status-dot');
var statusLabel = $('status-label');

// ─── EDITOR OVERLAY ────────────────────────────────────────────

var editorOverlayJs = '';
var sampleDataJs = '';

function loadEditorAssets() {
  var p1 = fetch('editor-overlay.js').then(function(r) { return r.text(); }).then(function(t) { editorOverlayJs = t; });
  var p2 = fetch('sample-data.js').then(function(r) { return r.text(); }).then(function(t) { sampleDataJs = t; });
  return Promise.all([p1, p2]);
}

// ─── ZYRKEL DETECTION ──────────────────────────────────────────

function detectZyrkel() {
  var ports = [37848, 37849, 37850, 37851, 37852, 37853];
  var checks = ports.map(function(port) {
    return fetch('http://localhost:' + port + '/api/health', { signal: AbortSignal.timeout(2000) })
      .then(function(r) { return r.ok ? port : null; })
      .catch(function() { return null; });
  });
  return Promise.all(checks).then(function(results) {
    for (var i = 0; i < results.length; i++) {
      if (results[i]) return results[i];
    }
    return null;
  });
}

function updateZyrkelStatus(port) {
  state.zyrkelPort = port;
  if (port) {
    statusDot.classList.add('online');
    statusLabel.textContent = 'Zyrkel :' + port;
  } else {
    statusDot.classList.remove('online');
    statusLabel.textContent = 'Offline';
  }
}

// ─── THEME MENU ────────────────────────────────────────────────

function initThemeMenu() {
  THEMES.forEach(function(t) {
    var item = document.createElement('div');
    item.className = 'dropdown-item' + (t.id === state.theme ? ' active' : '');
    item.innerHTML = '<span class="dropdown-item-name">' + t.name + '</span><span class="dropdown-item-desc">' + t.desc + '</span>';
    item.addEventListener('click', function() {
      state.theme = t.id;
      btnTheme.innerHTML = 'Theme: ' + t.name + ' <span class="chevron">&#x25BE;</span>';
      themeMenu.classList.remove('open');
      themeMenu.querySelectorAll('.dropdown-item').forEach(function(el) { el.classList.remove('active'); });
      item.classList.add('active');
      updateStatusBar();
      // Apply theme change to iframe if we have content
      if (state.currentHtml) {
        applyThemeToIframe(t.id);
      }
    });
    themeMenu.appendChild(item);
  });

  btnTheme.addEventListener('click', function(e) {
    e.stopPropagation();
    themeMenu.classList.toggle('open');
  });
}

function applyThemeToIframe(themeId) {
  if (canvas.contentWindow) {
    canvas.contentWindow.postMessage({ type: 'nz-set-theme-css', css: THEME_CSS[themeId] || '' }, '*');
  }
}

// ─── CHAT ───────────────────────────────────────────────────────

function renderWelcome() {
  var html = '<div class="chat-welcome">';
  html += '<div class="chat-welcome-icon">&#x2B21;</div>';
  html += '<h2>Was moechtest du bauen?</h2>';
  html += '<p>Beschreibe dein Projekt und ich baue es fuer dich.</p>';
  html += '<div class="chat-examples">';
  EXAMPLES.forEach(function(ex) {
    html += '<button class="chat-example-chip">' + ex + '</button>';
  });
  html += '</div></div>';
  chatMessages.innerHTML = html;

  chatMessages.querySelectorAll('.chat-example-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      sendMessage(chip.textContent);
    });
  });
}

function addMessage(role, text) {
  // Remove welcome if present
  var welcome = chatMessages.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  state.chatHistory.push({ role: role, content: text });

  var div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.innerHTML = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(text) {
  var welcome = chatMessages.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  var div = document.createElement('div');
  div.className = 'chat-msg system';
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  var div = document.createElement('div');
  div.className = 'chat-typing';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  var el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function sendMessage(text) {
  if (!text || !text.trim()) return;
  text = text.trim();

  addMessage('user', escapeHtml(text));
  chatInput.value = '';
  chatInput.style.height = 'auto';

  if (state.zyrkelPort) {
    sendToZyrkel(text);
  } else {
    handleOffline(text);
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── LLM (ZYRKEL CONNECTED) ───────────────────────────────────

function sendToZyrkel(text) {
  showTyping();
  canvasLoader.classList.remove('hidden');

  var messages = state.chatHistory.map(function(m) {
    return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content };
  });

  fetch('http://localhost:' + state.zyrkelPort + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages,
      system: LLM_SYSTEM_PROMPT,
      stream: false
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    hideTyping();
    canvasLoader.classList.add('hidden');
    var reply = data.response || data.content || data.message || '';
    processAssistantReply(reply);
  })
  .catch(function(err) {
    hideTyping();
    canvasLoader.classList.add('hidden');
    addMessage('assistant', 'Fehler bei der Verbindung: ' + escapeHtml(err.message) + '. Verwende Offline-Templates...');
    handleOffline(text);
  });
}

// ─── OFFLINE TEMPLATE ENGINE ──────────────────────────────────

function handleOffline(text) {
  showTyping();

  setTimeout(function() {
    hideTyping();

    var lower = text.toLowerCase();
    var bestMatch = null;
    var bestScore = 0;

    Object.keys(TEMPLATES).forEach(function(key) {
      var tpl = TEMPLATES[key];
      var score = 0;
      tpl.keywords.forEach(function(kw) {
        if (lower.indexOf(kw) !== -1) score += kw.length;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = key;
      }
    });

    if (!bestMatch || bestScore < 3) {
      // Default to dashboard
      bestMatch = 'dashboard';
    }

    var tpl = TEMPLATES[bestMatch];
    var params = { theme: state.theme };

    // Extract gene names
    var geneMatch = text.match(/\b(BRCA[12]|TP53|MLH1|MSH[26]|PTEN|APC|RB1|NF[12]|CDH1)\b/i);
    if (geneMatch) params.gene = geneMatch[1].toUpperCase();

    // Extract URLs
    var urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) params.url = urlMatch[0];

    state.scaffold = tpl.scaffold;
    state.dataSources = tpl.dataSources;

    var html = tpl.generateHtml(params);
    state.currentHtml = html;

    var desc = '<b>' + tpl.title + '</b> erstellt! ';
    desc += tpl.description + '. ';
    desc += '<br><br>';
    desc += '<span style="font-size:12px;opacity:0.6;">Scaffold: ' + tpl.scaffold + ' | Theme: ' + state.theme + ' | ' + tpl.dataSources.length + ' Datenquelle(n)</span>';
    desc += '<br><span style="font-size:12px;opacity:0.6;">Du kannst jetzt Anpassungen beschreiben: "Mach den Chart groesser", "Aendere das Theme", etc.</span>';

    addMessage('assistant', desc);
    addSystemMessage(tpl.dataSources.length + ' Datenquelle(n) konfiguriert');
    loadHtmlIntoCanvas(html);
    updateStatusBar();
  }, 600);
}

// ─── PROCESS LLM REPLY ────────────────────────────────────────

function processAssistantReply(reply) {
  // Extract full HTML
  var htmlMatch = reply.match(/<!-- NZ-HTML-START -->\s*([\s\S]*?)\s*<!-- NZ-HTML-END -->/);
  if (htmlMatch) {
    var cleanReply = reply.replace(/<!-- NZ-HTML-START -->[\s\S]*?<!-- NZ-HTML-END -->/, '').trim();
    if (cleanReply) {
      addMessage('assistant', cleanReply);
    } else {
      addMessage('assistant', 'Fertig! Die Seite wurde aktualisiert.');
    }
    state.currentHtml = htmlMatch[1].trim();
    loadHtmlIntoCanvas(state.currentHtml);
    updateStatusBar();
    return;
  }

  // Extract patches
  var patchPattern = /<!-- NZ-PATCH:([^>]+) -->/g;
  var insertPattern = /<!-- NZ-INSERT:([^>]+) -->/g;
  var themePattern = /<!-- NZ-THEME:(\w+) -->/;
  var hadAction = false;

  var themeMatch = reply.match(themePattern);
  if (themeMatch) {
    state.theme = themeMatch[1];
    applyThemeToIframe(themeMatch[1]);
    btnTheme.innerHTML = 'Theme: ' + (THEMES.find(function(t) { return t.id === themeMatch[1]; }) || { name: themeMatch[1] }).name + ' <span class="chevron">&#x25BE;</span>';
    hadAction = true;
  }

  var match;
  while ((match = patchPattern.exec(reply)) !== null) {
    var parts = {};
    match[1].split('|').forEach(function(p) {
      var eq = p.indexOf('=');
      if (eq > 0) parts[p.substring(0, eq)] = p.substring(eq + 1);
    });
    if (parts.selector && parts.style && canvas.contentWindow) {
      canvas.contentWindow.postMessage({
        type: 'nz-update-style',
        selector: parts.selector,
        styles: parseStyleString(parts.style)
      }, '*');
    }
    hadAction = true;
  }

  while ((match = insertPattern.exec(reply)) !== null) {
    var parts2 = {};
    match[1].split('|').forEach(function(p) {
      var eq = p.indexOf('=');
      if (eq > 0) parts2[p.substring(0, eq)] = p.substring(eq + 1);
    });
    if (parts2.html && canvas.contentWindow) {
      canvas.contentWindow.postMessage({
        type: 'nz-insert',
        targetSelector: parts2.target || 'main',
        html: parts2.html
      }, '*');
    }
    hadAction = true;
  }

  var cleanReply2 = reply
    .replace(/<!-- NZ-PATCH:[^>]+ -->/g, '')
    .replace(/<!-- NZ-INSERT:[^>]+ -->/g, '')
    .replace(/<!-- NZ-THEME:\w+ -->/g, '')
    .trim();

  if (cleanReply2) {
    addMessage('assistant', cleanReply2);
  } else if (hadAction) {
    addMessage('assistant', 'Aenderungen angewendet!');
  } else {
    addMessage('assistant', reply);
  }
}

function parseStyleString(s) {
  var obj = {};
  s.split(';').forEach(function(pair) {
    var colon = pair.indexOf(':');
    if (colon > 0) {
      var key = pair.substring(0, colon).trim();
      var val = pair.substring(colon + 1).trim();
      // Convert kebab-case to camelCase
      key = key.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
      obj[key] = val;
    }
  });
  return obj;
}

// ─── LOAD HTML INTO CANVAS ────────────────────────────────────

function loadHtmlIntoCanvas(html) {
  canvasEmpty.classList.add('hidden');
  canvasLoader.classList.remove('hidden');

  // Inject editor overlay
  var overlayScript = '<script data-nz-overlay="true">\n' + editorOverlayJs + '\n<\/script>';
  var sampleScript = '<script data-nz-overlay="true">\n' + sampleDataJs + '\n<\/script>';

  // Insert before </body>
  if (html.indexOf('</body>') !== -1) {
    html = html.replace('</body>', sampleScript + '\n' + overlayScript + '\n</body>');
  } else {
    html += '\n' + sampleScript + '\n' + overlayScript;
  }

  canvas.srcdoc = html;

  canvas.onload = function() {
    canvasLoader.classList.add('hidden');
    updateStatusBar();
  };
}

// ─── PROPERTIES PANEL ──────────────────────────────────────────

function showProperties(data) {
  state.selectedElement = data;
  state.propertiesVisible = true;
  studioEl.classList.add('props-open');
  propertiesEl.classList.remove('hidden');

  var html = '<div class="props-header"><span>' + data.tag + (data.classes ? '.' + data.classes.split(' ')[0] : '') + '</span><button class="props-close" id="props-close-btn">&times;</button></div>';

  // Element info
  html += '<div class="props-section"><div class="props-section-title">Element</div>';
  html += '<div class="props-row"><span class="props-label">Tag</span><span class="props-tag">' + data.tag + '</span></div>';
  if (data.id) html += '<div class="props-row"><span class="props-label">ID</span><span class="props-tag">' + data.id + '</span></div>';
  html += '</div>';

  // Typography
  html += '<div class="props-section"><div class="props-section-title">Typografie</div>';
  html += '<div class="props-row"><span class="props-label">Groesse</span><input class="props-input" type="text" value="' + (data.styles.fontSize || '') + '" data-prop="fontSize"></div>';
  html += '<div class="props-row"><span class="props-label">Gewicht</span><select class="props-select" data-prop="fontWeight"><option value="400"' + (data.styles.fontWeight === '400' ? ' selected' : '') + '>Normal</option><option value="500"' + (data.styles.fontWeight === '500' ? ' selected' : '') + '>Medium</option><option value="600"' + (data.styles.fontWeight === '600' ? ' selected' : '') + '>Semi-Bold</option><option value="700"' + (data.styles.fontWeight === '700' ? ' selected' : '') + '>Bold</option></select></div>';
  html += '<div class="props-row"><span class="props-label">Farbe</span><input class="props-input" type="color" value="' + rgbToHex(data.styles.color) + '" data-prop="color"></div>';
  html += '<div class="props-row"><span class="props-label">Ausrichtung</span><select class="props-select" data-prop="textAlign"><option value="left"' + (data.styles.textAlign === 'left' ? ' selected' : '') + '>Links</option><option value="center"' + (data.styles.textAlign === 'center' ? ' selected' : '') + '>Mitte</option><option value="right"' + (data.styles.textAlign === 'right' ? ' selected' : '') + '>Rechts</option></select></div>';
  html += '</div>';

  // Spacing
  html += '<div class="props-section"><div class="props-section-title">Abstand</div>';
  html += '<div class="props-row"><span class="props-label">Padding</span><input class="props-input" type="text" value="' + (data.styles.padding || '') + '" data-prop="padding"></div>';
  html += '<div class="props-row"><span class="props-label">Margin</span><input class="props-input" type="text" value="' + (data.styles.margin || '') + '" data-prop="margin"></div>';
  html += '</div>';

  // Background
  html += '<div class="props-section"><div class="props-section-title">Hintergrund</div>';
  html += '<div class="props-row"><span class="props-label">Farbe</span><input class="props-input" type="color" value="' + rgbToHex(data.styles.backgroundColor) + '" data-prop="backgroundColor"></div>';
  html += '</div>';

  // Grid
  if (data.styles.gridColumn || data.styles.gridRow) {
    html += '<div class="props-section"><div class="props-section-title">Grid</div>';
    html += '<div class="props-row"><span class="props-label">Spalte</span><input class="props-input" type="text" value="' + (data.styles.gridColumn || '') + '" data-prop="gridColumn"></div>';
    html += '<div class="props-row"><span class="props-label">Zeile</span><input class="props-input" type="text" value="' + (data.styles.gridRow || '') + '" data-prop="gridRow"></div>';
    html += '</div>';
  }

  // Delete
  html += '<div class="props-section"><button class="props-btn-delete" id="props-delete-btn">Element loeschen</button></div>';

  propertiesEl.innerHTML = html;

  // Event listeners
  document.getElementById('props-close-btn').addEventListener('click', hideProperties);

  document.getElementById('props-delete-btn').addEventListener('click', function() {
    if (data.id && canvas.contentWindow) {
      canvas.contentWindow.postMessage({ type: 'nz-delete', id: data.id }, '*');
    }
    hideProperties();
  });

  propertiesEl.querySelectorAll('[data-prop]').forEach(function(input) {
    var eventType = input.type === 'color' ? 'input' : 'change';
    input.addEventListener(eventType, function() {
      var styles = {};
      styles[input.dataset.prop] = input.value;
      if (data.id && canvas.contentWindow) {
        canvas.contentWindow.postMessage({ type: 'nz-update-style', id: data.id, styles: styles }, '*');
      }
    });
  });
}

function hideProperties() {
  state.propertiesVisible = false;
  state.selectedElement = null;
  studioEl.classList.remove('props-open');
  propertiesEl.classList.add('hidden');
}

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
  if (rgb.startsWith('#')) return rgb;
  var match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';
  return '#' + [match[1], match[2], match[3]].map(function(x) {
    return parseInt(x).toString(16).padStart(2, '0');
  }).join('');
}

// ─── CODE DRAWER ───────────────────────────────────────────────

function toggleCodeDrawer() {
  state.codeVisible = !state.codeVisible;
  if (state.codeVisible) {
    codeDrawer.classList.remove('hidden');
    if (canvas.contentWindow) {
      canvas.contentWindow.postMessage({ type: 'nz-get-html' }, '*');
    }
    updateCodeTab();
  } else {
    codeDrawer.classList.add('hidden');
  }
}

function updateCodeTab() {
  var tab = state.activeCodeTab;
  codeDrawer.querySelectorAll('.drawer-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  var content = '';
  if (tab === 'html') {
    content = state.currentHtml || '<!-- Noch kein HTML generiert -->';
  } else if (tab === 'config') {
    content = JSON.stringify({
      name: state.scaffold || 'nano-zyrkel-project',
      scaffold: state.scaffold || 'interactive-app',
      theme: state.theme,
      dataSources: state.dataSources,
      schedule: '0 */3 * * *',
      notifications: { telegram: true, email: false }
    }, null, 2);
  } else if (tab === 'css') {
    content = '/* Theme: ' + state.theme + ' */\n' + (THEME_CSS[state.theme] || '');
  } else if (tab === 'workflow') {
    content = 'name: nano-zyrkel run\non:\n  schedule:\n    - cron: "0 */3 * * *"\n  workflow_dispatch:\njobs:\n  run:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Run nano-zyrkel\n        run: |\n          curl -sL https://github.com/schlein-lab/nano-zyrkel/releases/latest/download/nano-zyrkel-linux -o nz\n          chmod +x nz\n          ./nz run --config config.json';
  }

  drawerCode.textContent = content;
}

// ─── STATUS BAR ────────────────────────────────────────────────

function updateStatusBar() {
  $('status-scaffold').textContent = state.scaffold || 'Kein Projekt';
  $('status-theme').textContent = state.theme;
  $('status-sources').textContent = state.dataSources.length + ' Datenquelle' + (state.dataSources.length !== 1 ? 'n' : '');

  // Count elements in iframe
  try {
    if (canvas.contentDocument) {
      var count = canvas.contentDocument.querySelectorAll('[data-nz-id]').length;
      $('status-elements').textContent = count + ' Element' + (count !== 1 ? 'e' : '');
    }
  } catch (e) {
    $('status-elements').textContent = '0 Elemente';
  }
}

// ─── IFRAME MESSAGES ───────────────────────────────────────────

window.addEventListener('message', function(e) {
  var msg = e.data;
  if (!msg || !msg.type) return;

  if (msg.type === 'nz-select') {
    showProperties(msg);
  }

  if (msg.type === 'nz-deselect') {
    hideProperties();
  }

  if (msg.type === 'nz-ready') {
    updateStatusBar();
  }

  if (msg.type === 'nz-html-export') {
    state.currentHtml = msg.html;
    if (state.codeVisible) updateCodeTab();
  }

  if (msg.type === 'nz-edit') {
    // Text was edited in iframe — could send to chat as context
  }
});

// ─── CHAT INPUT HANDLING ──────────────────────────────────────

function initChatInput() {
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });

  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });

  $('chat-send').addEventListener('click', function() {
    sendMessage(chatInput.value);
  });
}

// ─── HEADER BUTTONS ────────────────────────────────────────────

function initHeaderButtons() {
  $('btn-code').addEventListener('click', toggleCodeDrawer);

  $('btn-deploy').addEventListener('click', function() {
    if (!state.currentHtml) {
      addSystemMessage('Noch nichts zu deployen — beschreibe erst dein Projekt.');
      return;
    }
    if (state.zyrkelPort) {
      addSystemMessage('Deployment wird gestartet...');
      fetch('http://localhost:' + state.zyrkelPort + '/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: state.currentHtml,
          config: {
            scaffold: state.scaffold,
            theme: state.theme,
            dataSources: state.dataSources
          }
        })
      }).then(function(r) { return r.json(); })
        .then(function(d) {
          addSystemMessage('Deployed: ' + (d.url || d.message || 'Erfolgreich'));
        })
        .catch(function() {
          addSystemMessage('Deployment fehlgeschlagen. Zyrkel-Verbindung pruefen.');
        });
    } else {
      addSystemMessage('Deployment erfordert eine Zyrkel-Verbindung. Code kann ueber den Code-Button exportiert werden.');
    }
  });

  $('btn-close-drawer').addEventListener('click', function() {
    state.codeVisible = false;
    codeDrawer.classList.add('hidden');
  });

  $('btn-copy').addEventListener('click', function() {
    var text = drawerCode.textContent;
    navigator.clipboard.writeText(text).then(function() {
      var btn = $('btn-copy');
      btn.textContent = 'Kopiert!';
      setTimeout(function() { btn.textContent = 'Kopieren'; }, 1500);
    });
  });

  // Drawer tabs
  codeDrawer.querySelectorAll('.drawer-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      state.activeCodeTab = tab.dataset.tab;
      updateCodeTab();
    });
  });
}

// ─── CLOSE DROPDOWNS ON CLICK OUTSIDE ──────────────────────────

document.addEventListener('click', function() {
  themeMenu.classList.remove('open');
});

// ─── INIT ──────────────────────────────────────────────────────

function init() {
  initThemeMenu();
  initChatInput();
  initHeaderButtons();
  renderWelcome();
  updateStatusBar();

  loadEditorAssets().then(function() {
    // Assets loaded
  });

  detectZyrkel().then(function(port) {
    updateZyrkelStatus(port);
    if (port) {
      addSystemMessage('Zyrkel verbunden auf Port ' + port);
    }
  });

  // Re-check Zyrkel every 30s
  setInterval(function() {
    detectZyrkel().then(updateZyrkelStatus);
  }, 30000);
}

init();

})();
