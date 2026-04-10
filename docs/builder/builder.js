/* ═══════════════════════════════════════════════════════════════
   nano-zyrkel Project Studio — builder.js
   BioRender-style visual catalog + live preview canvas
   ═══════════════════════════════════════════════════════════════ */

// ─── MINI VISUAL GENERATORS ─────────────────────────────────

function miniLineChart(color, points) {
  const pts = points || '0,35 15,28 30,32 45,18 60,22 75,8 100,12';
  return `<svg viewBox="0 0 100 40" class="mini-chart">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${pts}" fill="url(#grad-${color.replace('#','')})" stroke="none" opacity="0.15"/>
    <defs><linearGradient id="grad-${color.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="transparent"/>
    </linearGradient></defs>
  </svg>`;
}

function miniBarChart(color) {
  const bars = [28, 18, 35, 12, 24, 30, 20];
  return `<svg viewBox="0 0 100 40" class="mini-chart">
    ${bars.map((h, i) => `<rect x="${i*14+2}" y="${40-h}" width="10" height="${h}" rx="2" fill="${color}" opacity="${0.5 + (i % 3) * 0.15}"/>`).join('')}
  </svg>`;
}

function miniThresholdChart(color) {
  return `<svg viewBox="0 0 100 50" class="mini-chart">
    <line x1="0" y1="20" x2="100" y2="20" stroke="${color}" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>
    <text x="2" y="18" fill="${color}" font-size="5" opacity="0.7">Schwelle</text>
    <polyline points="0,35 12,30 24,28 36,22 48,15 60,18 72,10 84,25 100,20" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/>
    <circle cx="72" cy="10" r="3" fill="#ef4444" opacity="0.8"/>
  </svg>`;
}

function miniBrowser(urlText, bodyContent) {
  return `<div class="mini-browser">
    <div class="mini-browser-bar">
      <span class="mini-browser-dot" style="background:#ef4444"></span>
      <span class="mini-browser-dot" style="background:#f59e0b"></span>
      <span class="mini-browser-dot" style="background:#22c55e"></span>
      <span class="mini-browser-url">${urlText}</span>
    </div>
    <div class="mini-browser-body">${bodyContent}</div>
  </div>`;
}

function miniJson(jsonLines) {
  return `<div class="mini-json">${jsonLines}</div>`;
}

function miniTelegram() {
  return `<div class="mini-tg">
    <div class="mini-tg-bubble">&#128276; <b>Aenderung erkannt!</b><br>Seite wurde aktualisiert...</div>
    <span class="mini-tg-time">14:32</span>
  </div>`;
}

function miniDiscord() {
  return `<div class="mini-discord">
    <div class="mini-discord-header">
      <div class="mini-discord-avatar"></div>
      <span class="mini-discord-name">nano-zyrkel</span>
    </div>
    <div class="mini-discord-embed">
      <div class="mini-discord-embed-line" style="width:80%"></div>
      <div class="mini-discord-embed-line" style="width:60%"></div>
      <div class="mini-discord-embed-line" style="width:45%"></div>
    </div>
  </div>`;
}

function miniSlack() {
  return `<div class="mini-slack">
    <div class="mini-slack-avatar"></div>
    <div class="mini-slack-body">
      <span class="mini-slack-name">nano-zyrkel</span>
      <div class="mini-slack-line" style="width:85%"></div>
      <div class="mini-slack-line" style="width:60%"></div>
    </div>
  </div>`;
}

function miniEmailCard() {
  return `<div class="mini-email-card">
    <div class="mini-email-header">
      <div class="mini-email-header-line" style="width:30%; flex-shrink:0"></div>
      <div class="mini-email-header-line" style="width:55%"></div>
    </div>
    <div class="mini-email-body">
      <div class="mini-email-body-line" style="width:90%"></div>
      <div class="mini-email-body-line" style="width:70%"></div>
      <div class="mini-email-body-line" style="width:55%"></div>
    </div>
  </div>`;
}

function miniSilence() {
  return `<div class="mini-silence">
    <span class="mini-silence-icon">&#9989;</span>
    <span class="mini-silence-text">Alles ruhig</span>
  </div>`;
}

function miniClockFace(hourAngle, minuteAngle) {
  return `<div class="mini-clock">
    <div class="mini-clock-hand hour" style="transform:rotate(${hourAngle}deg)"></div>
    <div class="mini-clock-hand minute" style="transform:rotate(${minuteAngle}deg)"></div>
    <div class="mini-clock-center"></div>
  </div>`;
}

function miniTimelineDots(count, activeIdx) {
  let dots = '';
  for (let i = 0; i < count; i++) {
    dots += `<span class="mini-timeline-dot${i === activeIdx ? ' active' : ''}"></span>`;
  }
  return `<div class="mini-timeline">${dots}</div>`;
}

function miniWeekStrip(activeDay) {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const heights = [24, 18, 20, 22, 16, 10, 8];
  return `<div class="mini-week">
    ${days.map((d, i) => `<div class="mini-week-day">
      <div class="mini-week-bar${i === activeDay ? ' active' : ''}" style="height:${heights[i]}px"></div>
      <span class="mini-week-label">${d}</span>
    </div>`).join('')}
  </div>`;
}

function miniPageHighlight() {
  return `<div class="mini-page">
    <div class="mini-page-line" style="width:90%"></div>
    <div class="mini-page-line" style="width:75%"></div>
    <div class="mini-page-highlight" style="width:45%"></div>
    <div class="mini-page-line" style="width:85%"></div>
    <div class="mini-page-line" style="width:60%"></div>
  </div>`;
}

function miniDiff() {
  return `<div class="mini-diff">
    <div class="mini-diff-line context">&nbsp; &lt;div class="status"&gt;</div>
    <div class="mini-diff-line removed">- &nbsp; geschlossen</div>
    <div class="mini-diff-line added">+ &nbsp; geoeffnet</div>
    <div class="mini-diff-line context">&nbsp; &lt;/div&gt;</div>
  </div>`;
}

function miniDomTree() {
  return `<div class="mini-dom">
    &lt;html&gt;<br>
    &nbsp;&nbsp;&lt;body&gt;<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&lt;div class="content"&gt;<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="mini-dom-highlight">&lt;span class="open"&gt;</span><br>
    &nbsp;&nbsp;&nbsp;&nbsp;&lt;/div&gt;
  </div>`;
}

function miniJsonPath() {
  return miniJson(`<span class="key">"data"</span>: {<br>&nbsp;&nbsp;<span class="key">"status"</span>: <span class="str">"open"</span>,<br>&nbsp;&nbsp;<span class="key">"count"</span>: <span class="num">42</span><br>}`);
}

function miniRssNew() {
  return `<div class="mini-feed">
    <div class="mini-feed-item" style="background:rgba(6,182,212,0.08); border-left:2px solid var(--accent2);">
      <div class="mini-feed-dot" style="background:var(--accent2)"></div>
      <span style="font-size:6px; color:var(--accent2); font-weight:600;">NEU</span>
      <div class="mini-feed-line" style="width:50%"></div>
    </div>
    <div class="mini-feed-item" style="background:rgba(6,182,212,0.08); border-left:2px solid var(--accent2);">
      <div class="mini-feed-dot" style="background:var(--accent2)"></div>
      <span style="font-size:6px; color:var(--accent2); font-weight:600;">NEU</span>
      <div class="mini-feed-line" style="width:40%"></div>
    </div>
    <div class="mini-feed-item">
      <div class="mini-feed-dot" style="background:var(--text-muted)"></div>
      <div class="mini-feed-line" style="width:55%"></div>
    </div>
  </div>`;
}

function miniAiChat() {
  return `<div class="mini-ai-chat">
    <div class="mini-ai-q">Ist Anmeldung offen?</div>
    <div class="mini-ai-a">Ja, 3 Plaetze frei.</div>
  </div>`;
}

function miniRegex() {
  return `<div class="mini-regex">
    Preis: <span class="mini-regex-match">29,99 EUR</span><br>
    Rabatt: <span class="mini-regex-match">14,50 EUR</span>
  </div>`;
}

function miniWebhook() {
  return `<div class="mini-webhook">
    <div class="mini-webhook-box">POST</div>
    <span class="mini-webhook-arrow">&#8594;</span>
    <div class="mini-webhook-box" style="background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.3); color:var(--success);">URL</div>
  </div>`;
}

function miniGhIssue() {
  return `<div class="mini-gh-issue">
    <div class="mini-gh-issue-title">Alert: Aenderung erkannt</div>
    <div class="mini-gh-labels">
      <span class="mini-gh-label" style="background:rgba(239,68,68,0.2); color:#ef4444;">bug</span>
      <span class="mini-gh-label" style="background:rgba(139,92,246,0.2); color:#8b5cf6;">auto</span>
    </div>
  </div>`;
}

function miniTerminal(cmd) {
  return `<div class="mini-terminal">
    <div class="mini-terminal-bar">
      <span class="mini-terminal-dot" style="background:#ef4444"></span>
      <span class="mini-terminal-dot" style="background:#f59e0b"></span>
      <span class="mini-terminal-dot" style="background:#22c55e"></span>
    </div>
    <div class="mini-terminal-body"><span class="mini-terminal-prompt">$ </span>${cmd}</div>
  </div>`;
}

function miniCloudUpload() {
  return `<div class="mini-cloud">
    <span class="mini-cloud-icon">&#9729;</span>
    <span class="mini-cloud-arrow">&#8593;</span>
    <span style="font-size:6px; color:var(--text-muted);">S3 Bucket</span>
  </div>`;
}

function miniChainTrigger() {
  return `<div class="mini-chain">
    <div class="mini-hex">&#x2B21;</div>
    <div class="mini-chain-link"></div>
    <div class="mini-hex">&#x2B21;</div>
  </div>`;
}

function miniDashboard(bg, accent, card) {
  return `<div class="mini-dashboard" style="background:${bg}; border:1px solid ${accent}33;">
    <div class="mini-dash-bar" style="background:${card};">
      <span class="mini-dash-bar-dot" style="background:#ef4444;"></span>
      <span class="mini-dash-bar-dot" style="background:#f59e0b;"></span>
      <span class="mini-dash-bar-dot" style="background:#22c55e;"></span>
    </div>
    <div class="mini-dash-body">
      <div class="mini-dash-card" style="background:${card};"></div>
      <div class="mini-dash-card" style="background:${accent}33;"></div>
      <div class="mini-dash-card" style="background:${card};"></div>
      <div class="mini-dash-card" style="background:${accent}22;"></div>
    </div>
  </div>`;
}

function miniHeatmap() {
  const colors = ['#1a1a2e','#16213e','#0f3460','#533483','#e94560','#f59e0b','#22c55e','#06b6d4'];
  let cells = '';
  for (let i = 0; i < 24; i++) {
    const c = colors[Math.floor(Math.random() * colors.length)];
    cells += `<div class="mini-heatmap-cell" style="background:${c}; opacity:${0.4 + Math.random()*0.6}"></div>`;
  }
  return `<div class="mini-heatmap">${cells}</div>`;
}

function miniGenomTracks() {
  return `<div class="mini-tracks">
    <div class="mini-track-row">
      <span class="mini-track-label">Gene</span>
      <div class="mini-track-bar" style="width:20%; background:#8B5CF6; margin-left:10%"></div>
      <div class="mini-track-bar" style="width:35%; background:#8B5CF6; margin-left:5%"></div>
    </div>
    <div class="mini-track-row">
      <span class="mini-track-label">SV</span>
      <div class="mini-track-bar" style="width:50%; background:#ef4444; margin-left:15%"></div>
    </div>
    <div class="mini-track-row">
      <span class="mini-track-label">CNV</span>
      <div class="mini-track-bar" style="width:15%; background:#06b6d4; margin-left:5%"></div>
      <div class="mini-track-bar" style="width:25%; background:#06b6d4; margin-left:10%"></div>
      <div class="mini-track-bar" style="width:10%; background:#06b6d4; margin-left:3%"></div>
    </div>
    <div class="mini-track-row">
      <span class="mini-track-label">Cov</span>
      <svg viewBox="0 0 100 6" style="flex:1; height:6px;">
        <polyline points="0,5 8,3 16,4 24,2 32,3 40,1 48,2 56,4 64,3 72,2 80,4 88,3 96,5 100,4" fill="none" stroke="#22c55e" stroke-width="1"/>
      </svg>
    </div>
  </div>`;
}

function miniRustCode() {
  return `<div class="mini-rust">
<span class="kw">pub fn</span> <span class="fn">process</span>(data: &amp;[u8]) {<br>
&nbsp;&nbsp;<span class="kw">let</span> result = <span class="fn">transform</span>(data);<br>
&nbsp;&nbsp;<span class="fn">emit</span>(<span class="str">"done"</span>, result);<br>
}
  </div>`;
}

function miniPubmed() {
  return `<div class="mini-pubmed">
    <div class="mini-pubmed-header"><span class="mini-pubmed-logo">PubMed</span></div>
    <div class="mini-pubmed-item"><div class="mini-pubmed-title" style="width:85%"></div><div class="mini-pubmed-meta"></div></div>
    <div class="mini-pubmed-item"><div class="mini-pubmed-title" style="width:70%"></div><div class="mini-pubmed-meta"></div></div>
    <div class="mini-pubmed-item"><div class="mini-pubmed-title" style="width:75%"></div><div class="mini-pubmed-meta"></div></div>
  </div>`;
}

function miniClinvar() {
  return `<div class="mini-clinvar">
    <div class="mini-clinvar-header"><span class="mini-clinvar-logo">ClinVar</span></div>
    <div class="mini-clinvar-row"><span class="mini-clinvar-variant">BRCA1 c.68_69del</span><span class="mini-clinvar-badge pathogenic">P</span></div>
    <div class="mini-clinvar-row"><span class="mini-clinvar-variant">TP53 c.743G&gt;A</span><span class="mini-clinvar-badge vus">VUS</span></div>
    <div class="mini-clinvar-row"><span class="mini-clinvar-variant">MLH1 c.306+5G</span><span class="mini-clinvar-badge benign">B</span></div>
  </div>`;
}

function miniGithubCard() {
  return `<div class="mini-github">
    <div class="mini-github-name">user/my-project</div>
    <div class="mini-github-desc-line" style="width:80%"></div>
    <div class="mini-github-stats">
      <span class="mini-github-stat"><span class="mini-github-stat-dot" style="background:#f59e0b"></span> JS</span>
      <span class="mini-github-stat">&#9733; 42</span>
      <span class="mini-github-stat">&#9741; 8</span>
    </div>
  </div>`;
}

function miniAwsCloud() {
  return `<div class="mini-aws">
    <span class="mini-aws-logo">CloudWatch</span>
    ${miniLineChart('#ff9900', '0,30 15,25 30,28 45,15 60,20 75,12 100,18')}
  </div>`;
}

function miniInbox() {
  return `<div class="mini-inbox">
    <div class="mini-inbox-row unread"><div class="mini-inbox-from"></div><div class="mini-inbox-subj" style="width:70%"></div></div>
    <div class="mini-inbox-row unread"><div class="mini-inbox-from"></div><div class="mini-inbox-subj" style="width:55%"></div></div>
    <div class="mini-inbox-row"><div class="mini-inbox-from"></div><div class="mini-inbox-subj" style="width:65%"></div></div>
    <div class="mini-inbox-row"><div class="mini-inbox-from"></div><div class="mini-inbox-subj" style="width:50%"></div></div>
  </div>`;
}

function miniFeed() {
  return `<div class="mini-feed">
    <div class="mini-feed-item"><div class="mini-feed-dot"></div><div class="mini-feed-line" style="width:65%"></div></div>
    <div class="mini-feed-item"><div class="mini-feed-dot"></div><div class="mini-feed-line" style="width:50%"></div></div>
    <div class="mini-feed-item"><div class="mini-feed-dot"></div><div class="mini-feed-line" style="width:55%"></div></div>
  </div>`;
}

// Starter template composites
function miniStarterWatcher() {
  return `<div class="mini-starter">
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:#0d1117;">${miniBrowser('vhs.de', '<div class="mini-browser-line" style="width:70%"></div>')}</div>
    </div>
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:rgba(245,158,11,0.06);font-size:10px; color:var(--warning);">&#128269;</div>
      <div class="mini-starter-block" style="background:rgba(0,136,204,0.1);">${miniTelegram()}</div>
    </div>
  </div>`;
}

function miniStarterTracker() {
  return `<div class="mini-starter">
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:#0d1117;">${miniLineChart('#06b6d4')}</div>
      <div class="mini-starter-block" style="background:rgba(239,68,68,0.06); font-size:14px;">&#128200;</div>
    </div>
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:rgba(0,136,204,0.1);">${miniTelegram()}</div>
    </div>
  </div>`;
}

function miniStarterLearn() {
  return `<div class="mini-starter">
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:rgba(37,99,235,0.1); font-size:7px; color:#60a5fa;">Mod 1</div>
      <div class="mini-starter-block" style="background:rgba(37,99,235,0.1); font-size:7px; color:#60a5fa;">Mod 2</div>
    </div>
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:rgba(37,99,235,0.1); font-size:7px; color:#60a5fa;">Mod 3</div>
      <div class="mini-starter-block" style="background:rgba(37,99,235,0.1); font-size:7px; color:#60a5fa;">Mod 4</div>
    </div>
  </div>`;
}

function miniStarterMail() {
  return `<div class="mini-starter">
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:#0d1117;">${miniInbox()}</div>
    </div>
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:rgba(139,92,246,0.06); font-size:10px; color:var(--accent);">&#129302;</div>
      <div class="mini-starter-block" style="background:rgba(0,136,204,0.1);">${miniTelegram()}</div>
    </div>
  </div>`;
}

function miniStarterPortal() {
  return `<div class="mini-starter">
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:rgba(139,92,246,0.08); font-size:7px; color:var(--accent);">Proj A</div>
      <div class="mini-starter-block" style="background:rgba(139,92,246,0.08); font-size:7px; color:var(--accent);">Proj B</div>
    </div>
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:rgba(139,92,246,0.08); font-size:7px; color:var(--accent);">Proj C</div>
      <div class="mini-starter-block" style="background:rgba(139,92,246,0.12); font-size:8px; color:var(--accent);">+</div>
    </div>
  </div>`;
}

function miniStarterAlert() {
  return `<div class="mini-starter">
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:#0d1117;">${miniPubmed()}</div>
    </div>
    <div class="mini-starter-row">
      <div class="mini-starter-block" style="background:rgba(139,92,246,0.06);">${miniEmailCard()}</div>
    </div>
  </div>`;
}

// ─── CATEGORIES & BLOCKS ─────────────────────────────────────

const CATEGORIES = [
  {
    id: 'showcase', name: 'Start', icon: '\u2728',
    blocks: [
      { id: 'start-watcher', name: 'Webseiten-Watcher', desc: 'URL ueberwachen + benachrichtigen', appliesAll: true,
        autoBlocks: ['src-url', 'cond-contains', 'sched-hourly', 'notify-telegram'],
        visual: miniStarterWatcher },
      { id: 'start-tracker', name: 'Daten-Tracker', desc: '4.4M Varianten tracken', appliesAll: true,
        autoBlocks: ['src-clinvar', 'cond-changed', 'sched-3h', 'notify-telegram', 'theme-dashboard', 'feat-data'],
        visual: miniStarterTracker },
      { id: 'start-helix', name: 'Lernplattform', desc: '10-Modul Genetik-Suite', appliesAll: true,
        autoBlocks: ['src-api', 'cond-changed', 'sched-daily', 'notify-email', 'theme-clinical', 'feat-viz-basic'],
        visual: miniStarterLearn },
      { id: 'start-mailbot', name: 'Email-Agent', desc: 'LLM-Email mit Approval', appliesAll: true,
        autoBlocks: ['src-imap', 'cond-llm', 'sched-5min', 'notify-telegram'],
        visual: miniStarterMail },
      { id: 'start-portal', name: 'Portal / Showcase', desc: 'Animiertes Projekt-Hub', appliesAll: true,
        autoBlocks: ['src-github', 'sched-daily', 'theme-cinematic', 'act-publish'],
        visual: miniStarterPortal },
      { id: 'start-alert', name: 'Alert-Bot', desc: 'PubMed-Recherche-Bot', appliesAll: true,
        autoBlocks: ['src-pubmed', 'cond-rss', 'sched-daily', 'notify-email'],
        visual: miniStarterAlert },
    ]
  },
  {
    id: 'sources', name: 'Quellen', icon: '\uD83D\uDCE1',
    blocks: [
      { id: 'src-url', name: 'URL / Webseite', desc: 'HTML-Seite abrufen', configKey: 'source',
        fields: [{ name: 'url', label: 'URL', type: 'url', placeholder: 'https://vhs-hamburg.de/kurse' }],
        visual: () => miniBrowser('https://...', '<div class="mini-browser-line" style="width:80%"></div><div class="mini-browser-line" style="width:60%"></div><div class="mini-browser-line" style="width:70%"></div>') },
      { id: 'src-api', name: 'REST API', desc: 'JSON API abfragen', configKey: 'source',
        fields: [{ name: 'url', label: 'API URL', type: 'url', placeholder: 'https://api.example.com/data' }, { name: 'method', label: 'Methode', type: 'select', options: ['GET', 'POST'] }],
        visual: () => miniJson(`{<br>&nbsp;&nbsp;<span class="key">"status"</span>: <span class="str">"ok"</span>,<br>&nbsp;&nbsp;<span class="key">"data"</span>: [<span class="num">...</span>]<br>}`) },
      { id: 'src-rss', name: 'RSS / Atom Feed', desc: 'Feed-Eintraege ueberwachen', configKey: 'source',
        fields: [{ name: 'url', label: 'Feed URL', type: 'url', placeholder: 'https://example.com/feed.xml' }],
        visual: miniFeed },
      { id: 'src-imap', name: 'Email-Postfach', desc: 'IMAP Inbox lesen', configKey: 'maildesk',
        fields: [{ name: 'host', label: 'IMAP Host', placeholder: 'imap.gmail.com' }, { name: 'user', label: 'Benutzer', placeholder: 'user@example.com' }],
        visual: miniInbox },
      { id: 'src-pubmed', name: 'PubMed', desc: 'Biomedizinische Literatur', configKey: 'literature', preset: true,
        fields: [{ name: 'query', label: 'Suchbegriff', placeholder: 'structural variants AND segmental duplications' }],
        visual: miniPubmed },
      { id: 'src-clinvar', name: 'ClinVar', desc: 'Varianten-Datenbank', configKey: 'clinvar', preset: true,
        fields: [{ name: 'gene', label: 'Gen', placeholder: 'BRCA1' }],
        visual: miniClinvar },
      { id: 'src-github', name: 'GitHub API', desc: 'Repos, Issues, PRs', configKey: 'source', preset: true,
        fields: [{ name: 'repo', label: 'Repository', placeholder: 'user/repo' }],
        visual: miniGithubCard },
      { id: 'src-aws', name: 'AWS CloudWatch', desc: 'AWS Metriken + Logs', configKey: 'source', preset: true,
        fields: [{ name: 'metric', label: 'Metrik', placeholder: 'CPUUtilization' }],
        visual: miniAwsCloud },
    ]
  },
  {
    id: 'conditions', name: 'Wenn', icon: '\uD83D\uDD0D',
    blocks: [
      { id: 'cond-contains', name: 'Text-Suche', desc: '"freie Plaetze" taucht auf', configKey: 'condition',
        fields: [{ name: 'value', label: 'Suchtext', placeholder: 'freie Plaetze' }],
        visual: miniPageHighlight },
      { id: 'cond-changed', name: 'Aenderung erkannt', desc: 'Irgendwas aendert sich', configKey: 'condition',
        visual: miniDiff },
      { id: 'cond-css', name: 'HTML-Element', desc: 'CSS-Selector erscheint', configKey: 'condition',
        fields: [{ name: 'selector', label: 'CSS Selector', placeholder: '.registration-open' }],
        visual: miniDomTree },
      { id: 'cond-json', name: 'JSON-Wert', desc: 'API-Feld pruefen', configKey: 'condition',
        fields: [{ name: 'path', label: 'JSON Path', placeholder: '$.data.status' }, { name: 'value', label: 'Erwarteter Wert', placeholder: 'open' }],
        visual: miniJsonPath },
      { id: 'cond-threshold', name: 'Schwellwert', desc: 'Wert ueber/unter X', configKey: 'condition',
        fields: [{ name: 'path', label: 'Pfad zum Wert' }, { name: 'operator', label: 'Operator', type: 'select', options: ['>', '<', '>=', '<=', '=='] }, { name: 'value', label: 'Grenzwert', type: 'number' }],
        visual: () => miniThresholdChart('#ef4444') },
      { id: 'cond-rss', name: 'Neue Feed-Eintraege', desc: 'Neue Items im RSS', configKey: 'condition',
        visual: miniRssNew },
      { id: 'cond-llm', name: 'KI-Frage', desc: 'Natuerliche Sprache (~$0.001)', configKey: 'condition',
        fields: [{ name: 'question', label: 'Frage', type: 'textarea', placeholder: 'Ist die Anmeldung geoeffnet?' }],
        visual: miniAiChat },
      { id: 'cond-regex', name: 'Regex', desc: 'Regulaerer Ausdruck', configKey: 'condition',
        fields: [{ name: 'regex', label: 'Pattern', placeholder: 'Preis:\\s*\\d+,\\d+\\s*EUR' }],
        visual: miniRegex },
    ]
  },
  {
    id: 'schedule', name: 'Zeitplan', icon: '\u23F0',
    blocks: [
      { id: 'sched-5min', name: 'Alle 5 Minuten', desc: '*/5 * * * *', cron: '*/5 * * * *',
        visual: () => miniTimelineDots(20, 3) },
      { id: 'sched-hourly', name: 'Stuendlich', desc: '0 * * * *', cron: '0 * * * *',
        visual: () => miniClockFace(0, 0) },
      { id: 'sched-3h', name: 'Alle 3 Stunden', desc: '0 */3 * * *', cron: '0 */3 * * *',
        visual: () => miniClockFace(90, 0) },
      { id: 'sched-daily', name: 'Taeglich 8 Uhr', desc: '0 8 * * *', cron: '0 8 * * *',
        visual: () => miniClockFace(240, 0) },
      { id: 'sched-weekly', name: 'Woechentlich (Mo)', desc: '0 8 * * 1', cron: '0 8 * * 1',
        visual: () => miniWeekStrip(0) },
    ]
  },
  {
    id: 'notify', name: 'Melden', icon: '\uD83D\uDD14',
    blocks: [
      { id: 'notify-telegram', name: 'Telegram', desc: 'Bot-Nachricht',
        fields: [{ name: 'bot_token', label: 'Bot Token', placeholder: '123456:ABC-DEF...' }, { name: 'chat_id', label: 'Chat ID', placeholder: '-100123456789' }],
        visual: miniTelegram },
      { id: 'notify-discord', name: 'Discord', desc: 'Webhook',
        fields: [{ name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://discord.com/api/webhooks/...' }],
        visual: miniDiscord },
      { id: 'notify-slack', name: 'Slack', desc: 'Webhook',
        fields: [{ name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/services/...' }],
        visual: miniSlack },
      { id: 'notify-email', name: 'Email', desc: 'SMTP',
        fields: [{ name: 'to', label: 'Empfaenger', placeholder: 'user@example.com' }, { name: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' }],
        visual: miniEmailCard },
      { id: 'notify-silence', name: 'Stille-Bestaetigung', desc: '"Alles ruhig" Meldung',
        visual: miniSilence },
    ]
  },
  {
    id: 'actions', name: 'Dann', icon: '\u26A1',
    blocks: [
      { id: 'act-webhook', name: 'Webhook aufrufen', desc: 'HTTP POST an URL',
        fields: [{ name: 'url', label: 'Webhook URL', type: 'url' }],
        visual: miniWebhook },
      { id: 'act-github-issue', name: 'GitHub Issue', desc: 'Issue erstellen',
        fields: [{ name: 'repo', label: 'Repo', placeholder: 'user/repo' }],
        visual: miniGhIssue },
      { id: 'act-shell', name: 'Shell-Befehl', desc: 'Command ausfuehren',
        fields: [{ name: 'command', label: 'Befehl', placeholder: 'echo "done"' }],
        visual: () => miniTerminal('echo "done"') },
      { id: 'act-s3', name: 'Nach S3 pushen', desc: 'Daten in S3-Bucket',
        fields: [{ name: 'bucket', label: 'Bucket' }, { name: 'path', label: 'Pfad' }],
        visual: miniCloudUpload },
      { id: 'act-trigger', name: 'Nano-Zyrkel triggern', desc: 'Anderes Projekt starten',
        fields: [{ name: 'repo', label: 'Repo' }],
        visual: miniChainTrigger },
      { id: 'act-publish', name: 'API veroeffentlichen', desc: 'JSON auf GitHub Pages',
        visual: () => miniJson(`<span class="key">"api"</span>: <span class="str">"/data.json"</span><br><span class="key">"pages"</span>: <span class="str">true</span>`) },
    ]
  },
  {
    id: 'gui', name: 'Design', icon: '\uD83C\uDFA8',
    blocks: [
      { id: 'theme-clinical', name: 'Clinical', desc: 'Medizinisch, blau/weiss',
        colors: { bg: '#ffffff', accent: '#2563eb', card: '#f8fafc' },
        visual: () => miniDashboard('#ffffff', '#2563eb', '#f0f4ff') },
      { id: 'theme-dashboard', name: 'Dashboard', desc: 'Dunkel, Neon-Akzente',
        colors: { bg: '#0f172a', accent: '#22d3ee', card: '#1e293b' },
        visual: () => miniDashboard('#0f172a', '#22d3ee', '#1e293b') },
      { id: 'theme-magazine', name: 'Magazine', desc: 'Editorial, warm',
        colors: { bg: '#fefce8', accent: '#b45309', card: '#fffbeb' },
        visual: () => miniDashboard('#fefce8', '#b45309', '#fff7d6') },
      { id: 'theme-minimal', name: 'Minimal', desc: 'Schwarz/Weiss',
        colors: { bg: '#ffffff', accent: '#000000', card: '#f5f5f5' },
        visual: () => miniDashboard('#ffffff', '#000000', '#f0f0f0') },
      { id: 'theme-cinematic', name: 'Cinematic', desc: 'Dunkel, Gradient',
        colors: { bg: '#0a0a0a', accent: '#8b5cf6', card: '#171717' },
        visual: () => miniDashboard('#0a0a0a', '#8b5cf6', '#1a1a1a') },
    ]
  },
  {
    id: 'compute', name: 'Berechnung', icon: '\u2699\uFE0F',
    blocks: [
      { id: 'feat-data', name: 'DataLoader + Filter', desc: 'Laden, Filtern, Aggregieren', wasmFeature: 'data',
        visual: () => miniJson(`<span class="key">"filter"</span>: <span class="str">"gene=TP53"</span><br><span class="key">"rows"</span>: <span class="num">4,412,108</span>`) },
      { id: 'feat-viz-basic', name: 'Charts (Line, Bar)', desc: 'Basis-Visualisierungen', wasmFeature: 'viz-basic',
        visual: () => miniLineChart('#8B5CF6') },
      { id: 'feat-viz-advanced', name: 'Charts (Heatmap)', desc: 'Heatmap, Scatter, Violin', wasmFeature: 'viz-advanced',
        visual: miniHeatmap },
      { id: 'feat-viz-spatial', name: 'Genom-Tracks', desc: 'LinearTrack, Network', wasmFeature: 'viz-spatial',
        visual: miniGenomTracks },
      { id: 'feat-plugin', name: 'Custom Plugin', desc: 'Eigene Rust-Logik',
        visual: miniRustCode },
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
  codeVisible: false,
  activeTab: 'config',
  zyrkelPort: null,
  chatOpen: false,
};

// ─── ACTIVE CATEGORY ────────────────────────────────────────

let activeCategory = 'showcase';

// ─── DOM REFS ────────────────────────────────────────────────

const $tabs = document.getElementById('baukasten-tabs');
const $grid = document.getElementById('baukasten-grid');
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

// ─── HELPERS ────────────────────────────────────────────────

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
    showcase: 'Vorlage', source: 'Datenquelle', condition: 'Bedingung',
    schedule: 'Zeitplan', notify: 'Benachrichtigung', action: 'Aktion',
    theme: 'Oberflaeche', compute: 'Berechnung'
  };
  return map[badgeClass(blockId)] || '';
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── RENDER CATALOG (LEFT) ──────────────────────────────────

function renderTabs() {
  $tabs.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const inUseCount = cat.blocks.filter(b => state.blocks.includes(b.id)).length;
    const btn = document.createElement('button');
    btn.className = 'bk-tab' + (cat.id === activeCategory ? ' active' : '');
    btn.innerHTML = `
      <span class="bk-tab-icon">${cat.icon}</span>
      <span class="bk-tab-label">${cat.name}</span>
      ${inUseCount > 0 ? `<span class="bk-tab-count">${inUseCount}</span>` : ''}
    `;
    btn.addEventListener('click', () => {
      activeCategory = cat.id;
      renderTabs();
      renderGrid();
    });
    $tabs.appendChild(btn);
  });
}

function renderGrid() {
  $grid.innerHTML = '';
  const cat = CATEGORIES.find(c => c.id === activeCategory);
  if (!cat) return;

  cat.blocks.forEach(block => {
    const inUse = state.blocks.includes(block.id);
    const card = document.createElement('div');
    card.className = 'vcard' + (inUse ? ' in-use' : '');
    card.dataset.blockId = block.id;

    const visualHtml = block.visual ? block.visual() : '';
    card.innerHTML = `
      <div class="vcard-visual">${visualHtml}</div>
      <div class="vcard-label">
        <div class="vcard-name">${block.name}</div>
        <div class="vcard-desc">${block.desc}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (!inUse) addBlock(block.id);
    });

    $grid.appendChild(card);
  });
}

function renderCatalog() {
  renderTabs();
  renderGrid();
}

// ─── SEARCH / FILTER ─────────────────────────────────────────

$searchInput.addEventListener('input', () => {
  const q = $searchInput.value.toLowerCase().trim();
  if (q.length === 0) {
    renderGrid();
    return;
  }
  // Search across ALL categories, show matching cards
  $grid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    cat.blocks.forEach(block => {
      const text = (block.name + ' ' + block.desc + ' ' + cat.name).toLowerCase();
      if (!text.includes(q)) return;
      const inUse = state.blocks.includes(block.id);
      const card = document.createElement('div');
      card.className = 'vcard' + (inUse ? ' in-use' : '');
      card.dataset.blockId = block.id;
      const visualHtml = block.visual ? block.visual() : '';
      card.innerHTML = `
        <div class="vcard-visual">${visualHtml}</div>
        <div class="vcard-label">
          <div class="vcard-name">${block.name}</div>
          <div class="vcard-desc">${block.desc}</div>
        </div>
      `;
      card.addEventListener('click', () => { if (!inUse) addBlock(block.id); });
      $grid.appendChild(card);
    });
  });
});

// ─── ADD / REMOVE BLOCK ──────────────────────────────────────

function addBlock(blockId) {
  if (state.blocks.includes(blockId)) return;
  const block = BLOCK_MAP[blockId];
  if (!block) return;

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
window.removeBlock = removeBlock;

function updateFieldValue(blockId, fieldName, value) {
  if (!state.blockConfig[blockId]) state.blockConfig[blockId] = {};
  state.blockConfig[blockId][fieldName] = value;
  updateNotificationPreviews();
  if (state.codeVisible) renderCodeDrawer();
}

// ─── RENDER PREVIEW (RIGHT) ─────────────────────────────────

function renderPreview() {
  const hasBlocks = state.blocks.length > 0;
  $vorschauEmpty.style.display = hasBlocks ? 'none' : 'flex';
  $vorschauContent.style.display = hasBlocks ? 'block' : 'none';

  if (!hasBlocks) {
    $vorschauContent.innerHTML = '';
    return;
  }

  $vorschauContent.innerHTML = '';

  // Group by type and render in order
  const order = ['start-', 'src-', 'cond-', 'sched-', 'notify-', 'theme-', 'feat-', 'act-'];
  const sorted = [...state.blocks].sort((a, b) => {
    const ai = order.findIndex(p => a.startsWith(p));
    const bi = order.findIndex(p => b.startsWith(p));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  sorted.forEach(blockId => {
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
  if (blockId.startsWith('start-')) bodyHtml = renderShowcaseBody(blockId, block);
  else if (blockId.startsWith('src-')) bodyHtml = renderSourceBody(blockId, block);
  else if (blockId.startsWith('cond-')) bodyHtml = renderConditionBody(blockId, block);
  else if (blockId.startsWith('sched-')) bodyHtml = renderScheduleBody(blockId, block);
  else if (blockId.startsWith('notify-')) bodyHtml = renderNotifyBody(blockId, block);
  else if (blockId.startsWith('act-')) bodyHtml = renderActionBody(blockId, block);
  else if (blockId.startsWith('theme-')) bodyHtml = renderThemeBody(blockId, block);
  else if (blockId.startsWith('feat-')) bodyHtml = renderComputeBody(blockId, block);

  div.innerHTML = `
    <button class="remove-btn" onclick="removeBlock('${blockId}')" title="Entfernen">&times;</button>
    <div class="preview-block-header">
      <span class="preview-block-badge ${badge}">${label}</span>
      <span class="preview-block-title">${block.name}</span>
    </div>
    <div class="preview-block-body">${bodyHtml}</div>
  `;

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
    <div style="color:var(--text-muted); font-size:12px; margin-bottom:8px;">${block.desc}</div>
    <div class="showcase-includes">
      ${autoNames.map(n => `<span class="showcase-chip">${n}</span>`).join('')}
    </div>
    <div style="margin-top:8px; font-size:11px; color:var(--text-muted); opacity:0.7;">
      Alle enthaltenen Bausteine wurden automatisch hinzugefuegt und koennen einzeln angepasst werden.
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
      &#9989; Gefunden: "${escHtml(val)}" auf ${escHtml(srcUrl) || '[URL]'}
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
      if (id === 'cond-contains') return cfg.value || 'freie Plaetze';
      if (id === 'cond-llm') return cfg.question || 'KI-Bedingung erfuellt';
      if (id === 'cond-css') return 'Element ' + (cfg.selector || '.selector') + ' gefunden';
      if (id === 'cond-json') return (cfg.path || '$.status') + ' == ' + (cfg.value || 'true');
      if (id === 'cond-regex') return 'Regex: ' + (cfg.regex || '.*');
      if (id === 'cond-threshold') return (cfg.path || 'Wert') + ' ' + (cfg.operator || '>') + ' ' + (cfg.value || '0');
      const block = BLOCK_MAP[id];
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
        <div class="notify-preview-msg">&#9989; Alles ruhig. Letzte Pruefung: ${timeStr}.\nDein Tracker laeuft seit 3 Tagen. Naechste Pruefung: ${schedLabel}.</div>
      </div>`;
  }
  return '';
}

function updateNotificationPreviews() {
  document.querySelectorAll('.notify-preview-container').forEach(container => {
    const notifyId = container.dataset.notifyId;
    if (notifyId) container.innerHTML = renderNotificationPreview(notifyId);
  });
}

// ─── SCHEDULE HELPERS ────────────────────────────────────────

function getNextCronTimes(cron, count) {
  const parts = cron.split(' ');
  const now = new Date();
  const results = [];

  for (let i = 0; i < count; i++) {
    const next = new Date(now.getTime() + (i + 1) * estimateCronIntervalMs(parts));
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
      sources.push({ type: id.replace('src-', ''), ...cfg });
    } else if (id.startsWith('cond-')) {
      conditions.push({ type: id.replace('cond-', ''), ...cfg });
    } else if (id.startsWith('sched-')) {
      schedCron.push(block.cron);
    } else if (id.startsWith('notify-')) {
      notifications.push({ type: id.replace('notify-', ''), ...cfg });
    } else if (id.startsWith('act-')) {
      actions.push({ type: id.replace('act-', ''), ...cfg });
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
  return { config: generateConfig(), workflow: generateWorkflow(), readme: generateReadme() };
}

// ─── CODE DRAWER ─────────────────────────────────────────────

function toggleCodeDrawer() {
  state.codeVisible = !state.codeVisible;
  $codeDrawer.classList.toggle('visible', state.codeVisible);
  if (state.codeVisible) renderCodeDrawer();
}

function renderCodeDrawer() {
  const files = generateAllFiles();
  const tabContent = { config: files.config, workflow: files.workflow, readme: files.readme };
  $drawerCode.textContent = tabContent[state.activeTab] || '';

  const steps = [];
  steps.push('Erstelle ein neues GitHub Repository');
  steps.push('Kopiere config.json nach <code>hats/config.json</code>');
  steps.push('Kopiere run.yml nach <code>.github/workflows/run.yml</code>');
  if (state.blocks.some(id => id.startsWith('notify-'))) {
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

document.querySelectorAll('.drawer-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeTab = tab.dataset.tab;
    renderCodeDrawer();
  });
});

$btnCopy.addEventListener('click', () => {
  const text = $drawerCode.textContent;
  navigator.clipboard.writeText(text).then(() => {
    $btnCopy.textContent = 'Kopiert!';
    setTimeout(() => { $btnCopy.textContent = 'Kopieren'; }, 1500);
  }).catch(() => {
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
  renderCatalog();
  renderPreview();
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
    } catch (_) { /* next */ }
  }
  state.zyrkelPort = null;
  $statusDot.classList.remove('online');
  $statusLabel.textContent = 'Offline';
  $btnDeploy.classList.add('hidden');
}

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
    } else {
      $btnDeploy.textContent = 'Fehler';
    }
  } catch (e) {
    $btnDeploy.textContent = 'Fehler';
  }
  setTimeout(() => { $btnDeploy.textContent = 'Jetzt deployen'; }, 2000);
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
        const display = reply.replace(/<!--.*?-->/g, '').trim();
        addChatMessage('assistant', display || 'Bausteine aktualisiert.');
        parseLLMBlockCommands(reply);
        return;
      }
    } catch (_) { /* fallback */ }
  }

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
    display = 'Webseiten-Watcher eingerichtet: URL-Quelle, Text-Suche, stuendlicher Check, Telegram-Benachrichtigung.';
  } else if (t.includes('email') || t.includes('mail')) {
    commands.push('<!-- ADD:src-imap -->', '<!-- ADD:cond-llm -->', '<!-- ADD:sched-5min -->', '<!-- ADD:notify-telegram -->');
    display = 'Email-Agent eingerichtet: IMAP-Postfach, KI-Analyse, alle 5 Minuten, Telegram.';
  } else if (t.includes('pubmed') || t.includes('literatur') || t.includes('paper')) {
    commands.push('<!-- ADD:src-pubmed -->', '<!-- ADD:cond-rss -->', '<!-- ADD:sched-daily -->', '<!-- ADD:notify-email -->');
    display = 'Literatur-Alert eingerichtet: PubMed-Suche, neue Eintraege, taeglich, Email.';
  } else if (t.includes('github') || t.includes('repo')) {
    commands.push('<!-- ADD:src-github -->', '<!-- ADD:cond-changed -->', '<!-- ADD:sched-3h -->', '<!-- ADD:notify-discord -->');
    display = 'GitHub-Tracker eingerichtet: Repo ueberwachen, Aenderungen erkennen, alle 3h, Discord.';
  } else if (t.includes('dashboard') || t.includes('chart') || t.includes('visualis')) {
    commands.push('<!-- ADD:src-api -->', '<!-- ADD:feat-data -->', '<!-- ADD:feat-viz-basic -->', '<!-- ADD:theme-dashboard -->');
    display = 'Dashboard eingerichtet: API-Quelle, DataLoader, Charts, Dashboard-Theme.';
  } else if (t.includes('tracker') || t.includes('clinvar') || t.includes('variant')) {
    commands.push('<!-- ADD:start-tracker -->');
    display = 'Daten-Tracker mit allen Bausteinen eingerichtet.';
  } else if (t.includes('telegram')) {
    commands.push('<!-- ADD:notify-telegram -->');
    display = 'Telegram-Benachrichtigung hinzugefuegt.';
  } else if (t.includes('discord')) {
    commands.push('<!-- ADD:notify-discord -->');
    display = 'Discord-Benachrichtigung hinzugefuegt.';
  } else if (t.includes('entfern') || t.includes('loesch') || t.includes('reset')) {
    const removeAll = state.blocks.map(id => `<!-- REMOVE:${id} -->`);
    return { display: 'Alle Bausteine entfernt.', commands: removeAll.join('\n') };
  } else {
    display = 'Beschreibe genauer, was du bauen willst. Z.B.: "Webseite ueberwachen", "Email-Bot", "PubMed-Alert", "Dashboard mit Charts".';
  }

  return { display, commands: commands.join('\n') };
}

$chatSend.addEventListener('click', sendChatMessage);
$chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});

// ─── INIT ────────────────────────────────────────────────────

renderAll();
detectZyrkel();
setInterval(detectZyrkel, 15000);
