/* ═══════════════════════════════════════════════════════════════
   nano-zyrkel Project Studio — builder.js
   Three-Layer Architecture: Intent → Questions → Live Preview
   ═══════════════════════════════════════════════════════════════ */

// ─── MINI VISUAL GENERATORS ─────────────────────────────────

function miniLineChart(color, points) {
  const pts = points || '0,35 15,28 30,32 45,18 60,22 75,8 100,12';
  const id = 'grad-' + color.replace('#','') + Math.random().toString(36).slice(2,6);
  return `<svg viewBox="0 0 100 40" class="mini-chart">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <polyline points="${pts} 100,40 0,40" fill="url(#${id})" stroke="none"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function miniBarChart(color) {
  const bars = [28, 18, 35, 12, 24, 30, 20];
  return `<svg viewBox="0 0 100 40" class="mini-chart">
    ${bars.map((h, i) => `<rect x="${i*14+2}" y="${40-h}" width="10" height="${h}" rx="2" fill="${color}" opacity="${0.5 + (i % 3) * 0.15}"/>`).join('')}
  </svg>`;
}

function miniDonutChart(color) {
  return `<svg viewBox="0 0 40 40" class="mini-chart" style="width:50px;height:50px">
    <circle cx="20" cy="20" r="14" fill="none" stroke="${color}33" stroke-width="6"/>
    <circle cx="20" cy="20" r="14" fill="none" stroke="${color}" stroke-width="6"
      stroke-dasharray="60 88" stroke-linecap="round" transform="rotate(-90 20 20)"/>
  </svg>`;
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

function miniThresholdChart(color) {
  return `<svg viewBox="0 0 100 50" class="mini-chart">
    <line x1="0" y1="20" x2="100" y2="20" stroke="${color}" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>
    <polyline points="0,35 12,30 24,28 36,22 48,15 60,18 72,10 84,25 100,20" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/>
    <circle cx="72" cy="10" r="3" fill="#ef4444" opacity="0.8"/>
  </svg>`;
}

function miniScatter() {
  return `<svg viewBox="0 0 100 50" class="mini-chart">
    ${Array.from({length: 12}, () => {
      const cx = 5 + Math.random() * 90;
      const cy = 5 + Math.random() * 40;
      const r = 1.5 + Math.random() * 2;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#06b6d4" opacity="${0.4 + Math.random() * 0.5}"/>`;
    }).join('')}
  </svg>`;
}

function miniSurvival() {
  return `<svg viewBox="0 0 100 50" class="mini-chart">
    <polyline points="0,8 15,8 15,15 30,15 30,22 45,22 45,30 60,30 60,38 75,38 75,42 100,42"
      fill="none" stroke="#8B5CF6" stroke-width="2"/>
    <polyline points="0,12 15,12 15,18 30,18 30,28 45,28 45,35 60,35 60,40 75,40 75,45 100,45"
      fill="none" stroke="#06b6d4" stroke-width="2" stroke-dasharray="3,2"/>
  </svg>`;
}

function miniNetwork() {
  return `<svg viewBox="0 0 100 50" class="mini-chart">
    <line x1="25" y1="25" x2="50" y2="15" stroke="#8B5CF6" stroke-width="1" opacity="0.5"/>
    <line x1="25" y1="25" x2="50" y2="35" stroke="#8B5CF6" stroke-width="1" opacity="0.5"/>
    <line x1="50" y1="15" x2="75" y2="20" stroke="#8B5CF6" stroke-width="1" opacity="0.5"/>
    <line x1="50" y1="35" x2="75" y2="30" stroke="#8B5CF6" stroke-width="1" opacity="0.5"/>
    <line x1="75" y1="20" x2="75" y2="30" stroke="#8B5CF6" stroke-width="1" opacity="0.5"/>
    <circle cx="25" cy="25" r="4" fill="#8B5CF6"/>
    <circle cx="50" cy="15" r="3" fill="#06b6d4"/>
    <circle cx="50" cy="35" r="3" fill="#06b6d4"/>
    <circle cx="75" cy="20" r="3" fill="#22c55e"/>
    <circle cx="75" cy="30" r="3" fill="#22c55e"/>
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
    </div>
  </div>`;
}

function miniSlack() {
  return `<div class="mini-slack">
    <div class="mini-slack-avatar"></div>
    <div class="mini-slack-body">
      <span class="mini-slack-name">nano-zyrkel</span>
      <div class="mini-slack-line" style="width:85%"></div>
    </div>
  </div>`;
}

function miniEmailCard() {
  return `<div class="mini-email-card">
    <div class="mini-email-header">
      <div class="mini-email-header-line" style="width:30%"></div>
      <div class="mini-email-header-line" style="width:55%"></div>
    </div>
    <div class="mini-email-body">
      <div class="mini-email-body-line" style="width:90%"></div>
      <div class="mini-email-body-line" style="width:70%"></div>
    </div>
  </div>`;
}

function miniMatrix() {
  return `<div style="padding:8px; font-size:10px; color:#00bc8c; font-family:monospace;">
    <div>#zyrkel-alerts:matrix.org</div>
    <div style="margin-top:4px; color:#888;">&#8627; Neue Nachricht</div>
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
    <div class="mini-clock-hand hour" style="transform:translate(-50%,-100%) rotate(${hourAngle}deg)"></div>
    <div class="mini-clock-hand minute" style="transform:translate(-50%,-100%) rotate(${minuteAngle}deg)"></div>
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

function miniCalendar(highlightDay) {
  let cells = '';
  for (let i = 1; i <= 28; i++) {
    const isActive = i === highlightDay;
    cells += `<div class="mini-cal-day${isActive ? ' active' : ''}">${i}</div>`;
  }
  return `<div class="mini-cal">${cells}</div>`;
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
  </div>`;
}

function miniDiff() {
  return `<div class="mini-diff">
    <div class="mini-diff-line context">&nbsp; &lt;div class="status"&gt;</div>
    <div class="mini-diff-line removed">- &nbsp; geschlossen</div>
    <div class="mini-diff-line added">+ &nbsp; geoeffnet</div>
  </div>`;
}

function miniDomTree() {
  return `<div class="mini-dom">
    &lt;html&gt;<br>
    &nbsp;&nbsp;&lt;body&gt;<br>
    &nbsp;&nbsp;&nbsp;&nbsp;<span class="mini-dom-highlight">&lt;span class="open"&gt;</span><br>
    &nbsp;&nbsp;&lt;/body&gt;
  </div>`;
}

function miniJsonPath() {
  return miniJson(`<span class="key">"data"</span>: {<br>&nbsp;&nbsp;<span class="key">"status"</span>: <span class="str">"open"</span>,<br>&nbsp;&nbsp;<span class="key">"count"</span>: <span class="num">42</span><br>}`);
}

function miniRssNew() {
  return `<div class="mini-feed">
    <div class="mini-feed-item" style="background:rgba(6,182,212,0.08); border-left:2px solid var(--accent2);">
      <div class="mini-feed-dot" style="background:var(--accent2)"></div>
      <div class="mini-feed-line" style="width:50%"></div>
    </div>
    <div class="mini-feed-item" style="background:rgba(6,182,212,0.08); border-left:2px solid var(--accent2);">
      <div class="mini-feed-dot" style="background:var(--accent2)"></div>
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

function miniStale() {
  return `<div style="font-size:9px; color:var(--warning); text-align:center;">
    <div style="font-size:22px;">&#9203;</div>
    <div style="margin-top:4px;">&gt; 24h alt</div>
  </div>`;
}

function miniSchema() {
  return miniJson(`<span class="key">"type"</span>: <span class="str">"object"</span><br><span class="key">"required"</span>: [<span class="str">"id"</span>]`);
}

function miniStructDiff() {
  return `<div style="font-size:9px; color:var(--text); text-align:center;">
    <div style="color:var(--success); font-size:10px;">+ 12 neu</div>
    <div style="color:var(--danger); font-size:10px;">&minus; 3 entfernt</div>
    <div style="color:var(--warning); font-size:10px;">&asymp; 5 geaendert</div>
  </div>`;
}

function miniDeadline() {
  return `<div style="font-size:9px; color:var(--accent2); text-align:center;">
    <div style="font-size:22px;">&#128197;</div>
    <div style="margin-top:4px;">Noch 7 Tage</div>
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

function miniGhPr() {
  return `<div class="mini-gh-issue">
    <div class="mini-gh-issue-title" style="color:#8b5cf6;">&#x2387; Update config.json</div>
    <div class="mini-gh-labels">
      <span class="mini-gh-label" style="background:rgba(34,197,94,0.2); color:#22c55e;">ready</span>
    </div>
  </div>`;
}

function miniGhComment() {
  return `<div style="font-size:9px; padding:6px; border-left:2px solid #8b5cf6; background:rgba(139,92,246,0.05);">
    <div style="font-weight:600; color:var(--text);">@bot commented</div>
    <div style="color:var(--text-muted); margin-top:2px;">Alert gefunden um 14:32</div>
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
    <span style="font-size:8px; color:var(--text-muted);">S3</span>
  </div>`;
}

function miniChainTrigger() {
  return `<div class="mini-chain">
    <div class="mini-hex">&#x2B21;</div>
    <div class="mini-chain-link"></div>
    <div class="mini-hex">&#x2B21;</div>
  </div>`;
}

function miniCfWorker() {
  return `<div style="text-align:center; font-size:9px; color:#f38020;">
    <div style="font-size:24px;">&#x25BA;</div>
    <div style="margin-top:2px;">Worker</div>
  </div>`;
}

function miniPublishApi() {
  return miniJson(`<span class="key">"api"</span>: <span class="str">"/data.json"</span><br><span class="key">"public"</span>: <span class="bool">true</span>`);
}

function miniDashboardTheme(bg, accent, card) {
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

function miniGenomTracks() {
  return `<div class="mini-tracks">
    <div class="mini-track-row">
      <div class="mini-track-bar" style="width:20%; background:#8B5CF6; margin-left:10%"></div>
      <div class="mini-track-bar" style="width:35%; background:#8B5CF6; margin-left:5%"></div>
    </div>
    <div class="mini-track-row">
      <div class="mini-track-bar" style="width:50%; background:#ef4444; margin-left:15%"></div>
    </div>
    <div class="mini-track-row">
      <div class="mini-track-bar" style="width:25%; background:#06b6d4; margin-left:10%"></div>
      <div class="mini-track-bar" style="width:15%; background:#06b6d4; margin-left:5%"></div>
    </div>
  </div>`;
}

function miniRustCode() {
  return `<div class="mini-rust">
<span class="kw">pub fn</span> <span class="fn">process</span>(d: &amp;[u8]) {<br>
&nbsp;&nbsp;<span class="fn">emit</span>(<span class="str">"done"</span>);<br>
}</div>`;
}

function miniPubmed() {
  return `<div class="mini-pubmed">
    <div class="mini-pubmed-header"><span class="mini-pubmed-logo">PubMed</span></div>
    <div class="mini-pubmed-item"><div class="mini-pubmed-title" style="width:85%"></div></div>
    <div class="mini-pubmed-item"><div class="mini-pubmed-title" style="width:70%"></div></div>
    <div class="mini-pubmed-item"><div class="mini-pubmed-title" style="width:75%"></div></div>
  </div>`;
}

function miniClinvar() {
  return `<div class="mini-clinvar">
    <div class="mini-clinvar-header"><span class="mini-clinvar-logo">ClinVar</span></div>
    <div class="mini-clinvar-row"><span class="mini-clinvar-variant">BRCA1</span><span class="mini-clinvar-badge pathogenic">P</span></div>
    <div class="mini-clinvar-row"><span class="mini-clinvar-variant">TP53</span><span class="mini-clinvar-badge vus">VUS</span></div>
    <div class="mini-clinvar-row"><span class="mini-clinvar-variant">MLH1</span><span class="mini-clinvar-badge benign">B</span></div>
  </div>`;
}

function miniGithubCard() {
  return `<div class="mini-github">
    <div class="mini-github-name">user/repo</div>
    <div class="mini-github-desc-line" style="width:80%"></div>
    <div class="mini-github-stats">
      <span class="mini-github-stat">&#9733; 42</span>
    </div>
  </div>`;
}

function miniAwsCloud() {
  return `<div class="mini-aws">
    <span class="mini-aws-logo">CloudWatch</span>
    ${miniLineChart('#ff9900', '0,30 15,25 30,28 45,15 60,20 75,12 100,18')}
  </div>`;
}

function miniS3() {
  return `<div style="text-align:center; font-size:10px; color:#f38020;">
    <div style="font-size:26px;">&#x1F4E6;</div>
    <div>S3 Bucket</div>
  </div>`;
}

function miniDatabase() {
  return `<div style="text-align:center; font-size:10px; color:var(--accent2);">
    <div style="font-size:26px;">&#x1F5C4;</div>
    <div>PostgreSQL</div>
  </div>`;
}

function miniGraphql() {
  return `<div style="text-align:center; color:#e535ab;">
    <div style="font-size:22px;">&#x25A0;</div>
    <div style="font-size:9px; margin-top:2px;">GraphQL</div>
  </div>`;
}

function miniWebhookIn() {
  return `<div style="text-align:center; font-size:10px; color:var(--accent);">
    <div style="font-size:22px;">&#x1F9F2;</div>
    <div>Webhook In</div>
  </div>`;
}

function miniInbox() {
  return `<div class="mini-inbox">
    <div class="mini-inbox-row unread"><div class="mini-inbox-from"></div><div class="mini-inbox-subj" style="width:70%"></div></div>
    <div class="mini-inbox-row unread"><div class="mini-inbox-from"></div><div class="mini-inbox-subj" style="width:55%"></div></div>
    <div class="mini-inbox-row"><div class="mini-inbox-from"></div><div class="mini-inbox-subj" style="width:65%"></div></div>
  </div>`;
}

function miniFeed() {
  return `<div class="mini-feed">
    <div class="mini-feed-item"><div class="mini-feed-dot"></div><div class="mini-feed-line" style="width:65%"></div></div>
    <div class="mini-feed-item"><div class="mini-feed-dot"></div><div class="mini-feed-line" style="width:50%"></div></div>
    <div class="mini-feed-item"><div class="mini-feed-dot"></div><div class="mini-feed-line" style="width:55%"></div></div>
  </div>`;
}

// ─── INTENT DEFINITIONS ─────────────────────────────────────

const INTENTS = [
  {
    id: 'observe',
    icon: '\uD83E\uDDE0',
    question: 'Lies eine Seite und verstehe ob etwas passiert ist',
    examples: 'KI liest + entscheidet, nicht nur Textsuche — z.B. "Hat sich die Rechtslage geaendert?"',
    title: 'Mein Versteher'
  },
  {
    id: 'measure',
    icon: '\uD83D\uDCCA',
    question: 'Analysiere Daten, finde Trends und Anomalien',
    examples: 'Survival-Kurven, Korrelationen, Ausreisser — wissenschaftliches Compute ohne Server',
    title: 'Mein Analyst'
  },
  {
    id: 'collect',
    icon: '\uD83E\uDDF9',
    question: 'Filtere aus vielen Quellen das Relevante heraus',
    examples: 'Nicht nur sammeln — kuratieren, bewerten, priorisieren mit LLM',
    title: 'Mein Kurator'
  },
  {
    id: 'react',
    icon: '\uD83E\uDD16',
    question: 'Handle autonom — mit Verstand und Genehmigung',
    examples: 'Email analysieren + Antwort vorschlagen + per Telegram freigeben lassen',
    title: 'Mein Agent'
  },
  {
    id: 'present',
    icon: '\uD83D\uDDA5',
    question: 'Baue ein interaktives Dashboard oder eine App',
    examples: 'Genom-Tracks, Netzwerk-Graphen, Heatmaps — WASM-Power im Browser, kein Backend',
    title: 'Mein Dashboard'
  },
  {
    id: 'remind',
    icon: '\uD83D\uDD0D',
    question: 'Ueberwache aktiv bis etwas eintritt',
    examples: 'Nicht Timer sondern Agent: prueft regelmaessig ob eine Bedingung wahr wird',
    title: 'Mein Waechter'
  },
  {
    id: 'blank',
    icon: '\u2699\uFE0F',
    question: 'Eigenes System — Rust-Plugin, Custom-Logik, Pipeline',
    examples: 'Fuer Entwickler: komplett leer starten, alles selbst zusammenbauen',
    title: 'Mein System'
  }
];

// ─── QUESTION DEFINITIONS PER INTENT ─────────────────────────

const QUESTIONS = {
  observe: [
    {
      id: 'what',
      label: 'Was soll dein Agent lesen und verstehen?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: 'website', icon: '\uD83C\uDF10', label: 'Eine Webseite', visual: () => miniBrowser('https://...', '<div class="mini-browser-line" style="width:80%"></div><div class="mini-browser-line" style="width:60%"></div>') },
        { id: 'api', icon: '\uD83D\uDD0C', label: 'Eine API / Datenquelle', visual: () => miniJson(`{<br>&nbsp;&nbsp;<span class="key">"status"</span>: <span class="str">"ok"</span><br>}`) },
        { id: 'feed', icon: '\uD83D\uDCF0', label: 'Einen RSS/Atom Feed', visual: miniFeed },
        { id: 'inbox', icon: '\uD83D\uDCE7', label: 'Ein Email-Postfach', visual: miniInbox },
        { id: 'multi', icon: '\uD83D\uDD17', label: 'Mehrere Quellen kombinieren', visual: () => miniJson(`<span class="key">"sources"</span>: [<span class="num">3</span>]`) }
      ]
    },
    {
      id: 'change',
      label: 'Was soll der Agent erkennen?',
      type: 'cards',
      gridClass: 'wide',
      options: [
        { id: 'llm', icon: '\uD83E\uDDE0', label: 'Stelle eine Frage an die Seite (KI liest + versteht)', visual: miniAiChat, field: { name: 'question', placeholder: 'z.B. "Hat sich die Rechtslage zu Thema X geaendert?" oder "Gibt es neue Ausschreibungen?"', type: 'textarea' } },
        { id: 'contains', icon: '\uD83D\uDCDD', label: 'Ein bestimmter Text taucht auf', visual: miniPageHighlight, field: { name: 'searchText', placeholder: 'z.B. "freie Plaetze"', type: 'text' } },
        { id: 'changed', icon: '\uD83D\uDD04', label: 'Strukturelle Aenderung erkennen', visual: miniDiff },
        { id: 'threshold', icon: '\uD83D\uDCCA', label: 'Ein Wert ueberschreitet eine Grenze', visual: () => miniThresholdChart('#ef4444'), field: { name: 'threshold', type: 'threshold' } },
        { id: 'css', icon: '\uD83C\uDFF7', label: 'Ein bestimmtes Element erscheint/verschwindet', visual: miniDomTree, field: { name: 'selector', placeholder: '.registration-open', type: 'text' } },
        { id: 'schema', icon: '\uD83D\uDCC4', label: 'API-Vertrag verletzt (Schema-Validierung)', visual: () => miniJson(`<span class="key">"type"</span>: <span class="str">"object"</span>`), field: { name: 'schema', placeholder: 'JSON Schema...', type: 'textarea' } }
      ]
    },
    {
      id: 'schedule',
      label: 'Wie dringend?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: '5min', icon: '\u26A1', label: 'Sofort (alle 5 Min)', visual: () => miniTimelineDots(20, 3), cron: '*/5 * * * *' },
        { id: 'hourly', icon: '\u23F0', label: 'Stuendlich', visual: () => miniClockFace(0, 0), cron: '0 * * * *' },
        { id: 'daily', icon: '\uD83D\uDCC5', label: 'Taeglich', visual: () => miniClockFace(240, 0), cron: '0 8 * * *' },
        { id: 'weekly', icon: '\uD83D\uDCC6', label: 'Woechentlich', visual: () => miniWeekStrip(0), cron: '0 8 * * 1' }
      ]
    },
    {
      id: 'notify',
      label: 'Wohin benachrichtigen?',
      type: 'cards-multi',
      gridClass: '',
      options: [
        { id: 'telegram', icon: '\uD83D\uDCAC', label: 'Telegram', visual: miniTelegram },
        { id: 'email', icon: '\uD83D\uDCE7', label: 'Email', visual: miniEmailCard },
        { id: 'slack', icon: '\uD83D\uDCBC', label: 'Slack', visual: miniSlack },
        { id: 'discord', icon: '\uD83C\uDFAE', label: 'Discord', visual: miniDiscord },
        { id: 'silence', icon: '\u2705', label: 'Stille-Bestaetigung', visual: miniSilence }
      ]
    }
  ],
  measure: [
    {
      id: 'what',
      label: 'Was misst du?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: 'api', icon: '\uD83D\uDD0C', label: 'API-Endpunkt', visual: () => miniJson(`{<br>&nbsp;&nbsp;<span class="key">"value"</span>: <span class="num">42</span><br>}`) },
        { id: 'website', icon: '\uD83C\uDF10', label: 'Webseite-Wert', visual: () => miniBrowser('https://...', '<div class="mini-browser-line" style="width:70%"></div>') },
        { id: 'cloud', icon: '\u2601\uFE0F', label: 'Cloud-Metrik', visual: miniAwsCloud },
        { id: 'database', icon: '\uD83D\uDDC4', label: 'Datenbank', visual: miniDatabase }
      ]
    },
    {
      id: 'value_path',
      label: 'Welcher Wert?',
      type: 'field',
      fieldConfig: { name: 'valuePath', placeholder: 'JSON-Path, CSS-Selector oder Beschreibung', type: 'text' }
    },
    {
      id: 'alert',
      label: 'Schwellwert-Alert?',
      type: 'cards',
      gridClass: 'wide',
      options: [
        { id: 'yes', icon: '\uD83D\uDEA8', label: 'Ja: Wenn Wert Grenze ueberschreitet', visual: () => miniThresholdChart('#ef4444'), field: { name: 'threshold', type: 'threshold' } },
        { id: 'no', icon: '\uD83D\uDCDD', label: 'Nein, nur aufzeichnen', visual: () => miniLineChart('#22c55e') }
      ]
    },
    {
      id: 'viz',
      label: 'Visualisierung?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: 'line', icon: '\uD83D\uDCC8', label: 'Line Chart', visual: () => miniLineChart('#8B5CF6') },
        { id: 'bar', icon: '\uD83D\uDCCA', label: 'Bar Chart', visual: () => miniBarChart('#06b6d4') },
        { id: 'donut', icon: '\uD83C\uDF69', label: 'Donut', visual: () => miniDonutChart('#8B5CF6') },
        { id: 'heatmap', icon: '\uD83D\uDDFA', label: 'Heatmap', visual: miniHeatmap }
      ]
    },
    {
      id: 'schedule',
      label: 'Zeitplan',
      type: 'cards',
      gridClass: '',
      options: [
        { id: '5min', icon: '\u26A1', label: 'Alle 5 Minuten', visual: () => miniTimelineDots(20, 3), cron: '*/5 * * * *' },
        { id: 'hourly', icon: '\u23F0', label: 'Stuendlich', visual: () => miniClockFace(0, 0), cron: '0 * * * *' },
        { id: 'daily', icon: '\uD83D\uDCC5', label: 'Taeglich', visual: () => miniClockFace(240, 0), cron: '0 8 * * *' },
        { id: 'weekly', icon: '\uD83D\uDCC6', label: 'Woechentlich', visual: () => miniWeekStrip(0), cron: '0 8 * * 1' }
      ]
    },
    {
      id: 'notify',
      label: 'Benachrichtigen',
      type: 'cards-multi',
      gridClass: '',
      options: [
        { id: 'telegram', icon: '\uD83D\uDCAC', label: 'Telegram', visual: miniTelegram },
        { id: 'email', icon: '\uD83D\uDCE7', label: 'Email', visual: miniEmailCard },
        { id: 'slack', icon: '\uD83D\uDCBC', label: 'Slack', visual: miniSlack },
        { id: 'discord', icon: '\uD83C\uDFAE', label: 'Discord', visual: miniDiscord },
        { id: 'silence', icon: '\u2705', label: 'Stille-Bestaetigung', visual: miniSilence }
      ]
    }
  ],
  collect: [
    {
      id: 'what',
      label: 'Was sammeln?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: 'rss', icon: '\uD83D\uDCF0', label: 'RSS/Atom Feeds', visual: miniFeed },
        { id: 'email', icon: '\uD83D\uDCE7', label: 'Emails', visual: miniInbox },
        { id: 'api', icon: '\uD83D\uDD0C', label: 'API-Daten', visual: () => miniJson(`{<br>&nbsp;&nbsp;<span class="key">"items"</span>: [<span class="num">...</span>]<br>}`) },
        { id: 'urls', icon: '\uD83D\uDD17', label: 'Mehrere URLs', visual: () => miniBrowser('https://...', '<div class="mini-browser-line" style="width:80%"></div>') }
      ]
    },
    {
      id: 'format',
      label: 'Wie zusammenfassen?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: 'list', icon: '\uD83D\uDCCB', label: 'Als Liste', visual: miniFeed },
        { id: 'email_digest', icon: '\uD83D\uDCE7', label: 'Als Email-Digest', visual: miniEmailCard },
        { id: 'webpage', icon: '\uD83C\uDF10', label: 'Als Webseite', visual: () => miniBrowser('digest.html', '<div class="mini-browser-line" style="width:90%"></div><div class="mini-browser-line" style="width:70%"></div>') },
        { id: 'github_issue', icon: '\uD83D\uDCDD', label: 'Als GitHub Issue', visual: miniGhIssue }
      ]
    },
    {
      id: 'schedule',
      label: 'Frequenz',
      type: 'cards',
      gridClass: '',
      options: [
        { id: 'daily', icon: '\uD83D\uDCC5', label: 'Taeglich', visual: () => miniClockFace(240, 0), cron: '0 8 * * *' },
        { id: 'weekly', icon: '\uD83D\uDCC6', label: 'Woechentlich', visual: () => miniWeekStrip(0), cron: '0 8 * * 1' },
        { id: 'monthly', icon: '\uD83D\uDCC6', label: 'Monatlich', visual: () => miniCalendar(1), cron: '0 8 1 * *' }
      ]
    }
  ],
  react: [
    {
      id: 'trigger',
      label: 'Worauf reagieren?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: 'email', icon: '\uD83D\uDCE7', label: 'Eingehende Email', visual: miniInbox },
        { id: 'webhook', icon: '\uD83D\uDD17', label: 'Webhook empfangen', visual: miniWebhookIn },
        { id: 'feed', icon: '\uD83D\uDCF0', label: 'Neuer Feed-Eintrag', visual: miniRssNew },
        { id: 'change', icon: '\uD83D\uDD04', label: 'Aenderung erkannt', visual: miniDiff }
      ]
    },
    {
      id: 'action',
      label: 'Was tun?',
      type: 'cards',
      gridClass: 'wide',
      options: [
        { id: 'reply_email', icon: '\uD83D\uDCE7', label: 'Email antworten', visual: miniEmailCard },
        { id: 'webhook_out', icon: '\uD83D\uDD17', label: 'Webhook aufrufen', visual: miniWebhook },
        { id: 'github_issue', icon: '\uD83D\uDCDD', label: 'GitHub Issue', visual: miniGhIssue },
        { id: 'shell', icon: '\u26A1', label: 'Shell-Befehl', visual: () => miniTerminal('deploy.sh') },
        { id: 'trigger_agent', icon: '\uD83D\uDD04', label: 'Anderen Agent triggern', visual: miniChainTrigger }
      ]
    },
    {
      id: 'approval',
      label: 'Genehmigung noetig?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: 'auto', icon: '\u2705', label: 'Automatisch', visual: miniSilence },
        { id: 'ask', icon: '\uD83D\uDCAC', label: 'Erst per Telegram fragen', visual: miniTelegram },
        { id: 'log', icon: '\uD83D\uDCCB', label: 'Nur loggen', visual: () => miniJson(`<span class="key">"logged"</span>: <span class="str">"true"</span>`) }
      ]
    }
  ],
  present: [
    {
      id: 'what',
      label: 'Was zeigen?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: 'dashboard', icon: '\uD83D\uDCCA', label: 'Daten-Dashboard', visual: () => miniDashboardTheme('#0f172a', '#22d3ee', '#1e293b') },
        { id: 'portal', icon: '\uD83C\uDFA8', label: 'Projekt-Portal', visual: () => miniDashboardTheme('#0a0a0a', '#ec4899', '#1a1a1a') },
        { id: 'learning', icon: '\uD83D\uDCDA', label: 'Interaktive Lernumgebung', visual: () => miniDashboardTheme('#ffffff', '#2563eb', '#f0f4ff') }
      ]
    },
    {
      id: 'design',
      label: 'Design waehlen',
      type: 'themes',
      options: [
        { id: 'theme-clinical', name: 'Clinical', colors: { bg: '#ffffff', accent: '#2563eb', card: '#f8fafc', text: '#0f172a', textDim: '#475569' } },
        { id: 'theme-dashboard', name: 'Dashboard', colors: { bg: '#0f172a', accent: '#22d3ee', card: '#1e293b', text: '#e2e8f0', textDim: '#94a3b8' } },
        { id: 'theme-magazine', name: 'Magazine', colors: { bg: '#fefce8', accent: '#b45309', card: '#fffbeb', text: '#1c1917', textDim: '#78716c' } },
        { id: 'theme-minimal', name: 'Minimal', colors: { bg: '#ffffff', accent: '#000000', card: '#f5f5f5', text: '#000', textDim: '#666' } },
        { id: 'theme-cinematic', name: 'Cinematic', colors: { bg: '#0a0a0a', accent: '#ec4899', card: '#171717', text: '#fafafa', textDim: '#a1a1aa' } },
        { id: 'theme-report', name: 'Report', colors: { bg: '#ffffff', accent: '#475569', card: '#f1f5f9', text: '#0f172a', textDim: '#64748b' } }
      ]
    },
    {
      id: 'components',
      label: 'Welche Komponenten?',
      type: 'cards-multi',
      gridClass: '',
      options: [
        { id: 'charts', icon: '\uD83D\uDCC8', label: 'Charts', visual: () => miniLineChart('#8B5CF6') },
        { id: 'tables', icon: '\uD83D\uDCCA', label: 'Tabellen', visual: () => miniJson(`<span class="key">"rows"</span>: <span class="num">42</span>`) },
        { id: 'maps', icon: '\uD83D\uDDFA', label: 'Karten', visual: miniHeatmap },
        { id: 'genome', icon: '\uD83E\uDDEC', label: 'Genom-Tracks', visual: miniGenomTracks },
        { id: 'network', icon: '\uD83D\uDD78', label: 'Netzwerk-Graphen', visual: miniNetwork }
      ]
    }
  ],
  remind: [
    {
      id: 'what',
      label: 'Worauf wartest du?',
      type: 'field',
      fieldConfig: { name: 'reminderText', placeholder: 'z.B. "Kursanmeldung wird freigeschaltet" oder "Neues Paper zu meinem Thema"', type: 'textarea' }
    },
    {
      id: 'where',
      label: 'Wo kann man das pruefen?',
      type: 'cards',
      gridClass: 'wide',
      options: [
        { id: 'url', icon: '\uD83C\uDF10', label: 'Webseite regelmaessig pruefen', visual: () => miniBrowser('https://...', '<div class="mini-browser-line" style="width:60%"></div>'), field: { name: 'reminderUrl', placeholder: 'https://...', type: 'text' } },
        { id: 'api', icon: '\uD83D\uDD0C', label: 'API-Endpunkt abfragen', visual: () => miniJson(`<span class="key">"open"</span>: <span class="bool">false</span>`), field: { name: 'reminderUrl', placeholder: 'https://api...', type: 'text' } },
        { id: 'feed', icon: '\uD83D\uDCF0', label: 'Feed beobachten', visual: miniFeed, field: { name: 'reminderUrl', placeholder: 'https://.../feed.xml', type: 'text' } }
      ]
    },
    {
      id: 'how',
      label: 'Wie erkennt der Agent dass es passiert ist?',
      type: 'cards',
      gridClass: 'wide',
      options: [
        { id: 'llm', icon: '\uD83E\uDDE0', label: 'KI liest die Seite und entscheidet', visual: miniAiChat },
        { id: 'contains', icon: '\uD83D\uDCDD', label: 'Bestimmter Text taucht auf', visual: miniPageHighlight, field: { name: 'searchText', placeholder: 'z.B. "Anmeldung offen"', type: 'text' } },
        { id: 'changed', icon: '\uD83D\uDD04', label: 'Irgendeine Aenderung auf der Seite', visual: miniDiff }
      ]
    },
    {
      id: 'silence',
      label: 'Was tun solange nichts passiert?',
      type: 'cards',
      gridClass: 'wide',
      options: [
        { id: 'confirm_daily', icon: '\u2705', label: 'Taeglich bestaetigen: "Tracker laeuft, noch keine Aenderung"', visual: miniSilence },
        { id: 'confirm_weekly', icon: '\uD83D\uDCC6', label: 'Woechentlich bestaetigen', visual: miniSilence },
        { id: 'quiet', icon: '\uD83D\uDD07', label: 'Nur melden wenn es passiert', visual: () => miniStarter('\uD83D\uDD15', 'Stille', '#94a3b8') }
      ]
    },
    {
      id: 'schedule',
      label: 'Wie oft pruefen?',
      type: 'cards',
      gridClass: '',
      options: [
        { id: '5min', icon: '\u26A1', label: 'Alle 5 Min', visual: () => miniTimelineDots(20, 3), cron: '*/5 * * * *' },
        { id: 'hourly', icon: '\u23F0', label: 'Stuendlich', visual: () => miniClockFace(0, 0), cron: '0 * * * *' },
        { id: 'daily', icon: '\uD83D\uDCC5', label: 'Taeglich', visual: () => miniClockFace(240, 0), cron: '0 8 * * *' }
      ]
    },
    {
      id: 'notify',
      label: 'Wohin benachrichtigen wenn es eintritt?',
      type: 'cards-multi',
      gridClass: '',
      options: [
        { id: 'telegram', icon: '\uD83D\uDCAC', label: 'Telegram', visual: miniTelegram },
        { id: 'email', icon: '\uD83D\uDCE7', label: 'Email', visual: miniEmailCard },
        { id: 'slack', icon: '\uD83D\uDCBC', label: 'Slack', visual: miniSlack },
        { id: 'discord', icon: '\uD83C\uDFAE', label: 'Discord', visual: miniDiscord }
      ]
    }
  ]
};

// ─── EXTRA BLOCKS FOR EXPANDED OPTIONS ──────────────────────

const EXTRA_BLOCK_CATEGORIES = [
  {
    id: 'sources', name: 'Quellen', icon: '\uD83D\uDCE1',
    blocks: [
      { id: 'src-url', name: 'URL / Webseite', desc: 'HTML-Seite abrufen', visual: () => miniBrowser('https://...', '<div class="mini-browser-line" style="width:80%"></div>') },
      { id: 'src-api', name: 'REST API', desc: 'JSON API abfragen', visual: () => miniJson(`{<br>&nbsp;&nbsp;<span class="key">"status"</span>: <span class="str">"ok"</span><br>}`) },
      { id: 'src-graphql', name: 'GraphQL API', desc: 'GraphQL-Abfrage', visual: miniGraphql },
      { id: 'src-rss', name: 'RSS / Atom Feed', desc: 'Feed-Eintraege', visual: miniFeed },
      { id: 'src-imap', name: 'Email-Postfach', desc: 'IMAP Inbox lesen', visual: miniInbox },
      { id: 'src-pubmed', name: 'PubMed', desc: 'Biomedizinische Literatur', visual: miniPubmed },
      { id: 'src-clinvar', name: 'ClinVar', desc: 'Varianten-Datenbank', visual: miniClinvar },
      { id: 'src-github', name: 'GitHub API', desc: 'Repos, Issues, PRs', visual: miniGithubCard },
      { id: 'src-aws', name: 'AWS CloudWatch', desc: 'Metriken + Logs', visual: miniAwsCloud },
      { id: 'src-db', name: 'PostgreSQL / SQLite', desc: 'SQL-Datenbank', visual: miniDatabase },
      { id: 'src-webhook-in', name: 'Webhook (eingehend)', desc: 'POST empfangen', visual: miniWebhookIn }
    ]
  },
  {
    id: 'conditions', name: 'Bedingungen', icon: '\uD83D\uDD0D',
    blocks: [
      { id: 'cond-contains', name: 'Text-Suche', desc: 'Text taucht auf', visual: miniPageHighlight },
      { id: 'cond-regex', name: 'Regex', desc: 'Regulaerer Ausdruck', visual: miniRegex },
      { id: 'cond-css', name: 'HTML-Element', desc: 'CSS-Selector', visual: miniDomTree },
      { id: 'cond-json', name: 'JSON-Wert', desc: 'API-Feld pruefen', visual: miniJsonPath },
      { id: 'cond-threshold', name: 'Schwellwert', desc: 'Wert ueber/unter X', visual: () => miniThresholdChart('#ef4444') },
      { id: 'cond-llm', name: 'KI-Frage', desc: 'Natuerliche Sprache', visual: miniAiChat },
      { id: 'cond-changed', name: 'Aenderung erkannt', desc: 'Irgendwas aendert sich', visual: miniDiff },
      { id: 'cond-deadline', name: 'Frist / Deadline', desc: 'Datum erreicht', visual: miniDeadline }
    ]
  },
  {
    id: 'actions', name: 'Aktionen', icon: '\u26A1',
    blocks: [
      { id: 'act-webhook', name: 'Webhook aufrufen', desc: 'HTTP POST', visual: miniWebhook },
      { id: 'act-github-issue', name: 'GitHub Issue', desc: 'Issue erstellen', visual: miniGhIssue },
      { id: 'act-github-pr', name: 'GitHub PR', desc: 'Pull Request', visual: miniGhPr },
      { id: 'act-shell', name: 'Shell-Befehl', desc: 'Command ausfuehren', visual: () => miniTerminal('echo "done"') },
      { id: 'act-s3', name: 'Nach S3 pushen', desc: 'Daten in S3', visual: miniCloudUpload },
      { id: 'act-publish', name: 'API veroeffentlichen', desc: 'JSON auf Pages', visual: miniPublishApi },
      { id: 'act-trigger', name: 'Nano-Zyrkel triggern', desc: 'Anderes Projekt', visual: miniChainTrigger },
      { id: 'act-cf-worker', name: 'Cloudflare Worker', desc: 'Worker aufrufen', visual: miniCfWorker }
    ]
  },
  {
    id: 'compute', name: 'Berechnung', icon: '\u2699\uFE0F',
    blocks: [
      { id: 'feat-data', name: 'DataLoader + Filter', desc: 'Laden, Filtern, Aggregieren', visual: () => miniJson(`<span class="key">"filter"</span>: <span class="str">"gene=TP53"</span>`) },
      { id: 'feat-viz-basic', name: 'Charts (Line/Bar/Donut)', desc: 'Basis-Visualisierungen', visual: () => miniLineChart('#8B5CF6') },
      { id: 'feat-viz-advanced', name: 'Charts (Heatmap/Scatter)', desc: 'Erweiterte Visualisierungen', visual: miniHeatmap },
      { id: 'feat-viz-spatial', name: 'Genom-Tracks + Karten', desc: 'LinearTrack, WorldMap', visual: miniGenomTracks },
      { id: 'feat-network', name: 'Netzwerk-Graph', desc: 'Force-directed Graphen', visual: miniNetwork },
      { id: 'feat-survival', name: 'Survival-Kurven', desc: 'Kaplan-Meier', visual: miniSurvival },
      { id: 'feat-plugin', name: 'Custom Rust Plugin', desc: 'Eigene Logik, WASM', visual: miniRustCode }
    ]
  }
];

// ─── STATE ──────────────────────────────────────────────────

const state = {
  intent: null,
  answers: {},
  fieldValues: {},
  design: null,
  extraBlocks: [],
  extraConfig: {},
  title: 'Mein Agent',
  codeVisible: false,
  activeTab: 'config',
  zyrkelPort: null,
  chatOpen: false,
  expandedOptions: false,
  reminderChips: {}
};

// ─── DOM REFS ───────────────────────────────────────────────

const $intentPanel = document.getElementById('intent-panel');
const $intentCards = document.getElementById('intent-cards');
const $buildPanel = document.getElementById('build-panel');
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

function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getIntentDef(intentId) {
  return INTENTS.find(i => i.id === intentId);
}

function getThemeColors() {
  if (state.design) {
    // Find in present question themes
    const q = (QUESTIONS.present || []).find(q => q.type === 'themes');
    if (q) {
      const t = q.options.find(o => o.id === state.design);
      if (t && t.colors) return t.colors;
    }
  }
  return { bg: '#0f172a', accent: '#22d3ee', card: '#1e293b', text: '#e2e8f0', textDim: '#94a3b8' };
}

function getActiveCron() {
  const schedAnswer = state.answers.schedule;
  if (!schedAnswer) return '0 * * * *';
  const questions = QUESTIONS[state.intent] || [];
  for (const q of questions) {
    if (q.id === 'schedule') {
      const opt = q.options.find(o => o.id === schedAnswer);
      if (opt && opt.cron) return opt.cron;
    }
  }
  return '0 * * * *';
}

function getScheduleLabel() {
  const schedAnswer = state.answers.schedule;
  if (!schedAnswer) return null;
  const questions = QUESTIONS[state.intent] || [];
  for (const q of questions) {
    if (q.id === 'schedule') {
      const opt = q.options.find(o => o.id === schedAnswer);
      if (opt) return opt.label;
    }
  }
  return null;
}

// ─── RENDER: INTENT PANEL (Layer 1) ─────────────────────────

function renderIntentPanel() {
  $intentCards.innerHTML = '';
  INTENTS.forEach(intent => {
    const card = document.createElement('div');
    card.className = 'intent-card' + (state.intent === intent.id ? ' selected' : '');
    card.innerHTML = `
      <span class="intent-card-icon">${intent.icon}</span>
      <div class="intent-card-body">
        <div class="intent-card-question">${intent.question}</div>
        <div class="intent-card-examples">${intent.examples}</div>
      </div>
    `;
    card.addEventListener('click', () => selectIntent(intent.id));
    $intentCards.appendChild(card);
  });
}

// ─── SELECT INTENT ──────────────────────────────────────────

function selectIntent(intentId) {
  if (state.intent === intentId) return;
  state.intent = intentId;
  state.answers = {};
  state.fieldValues = {};
  state.design = null;
  state.extraBlocks = [];
  state.extraConfig = {};
  state.expandedOptions = false;
  state.reminderChips = {};

  const def = getIntentDef(intentId);
  state.title = def ? def.title : 'Mein Agent';

  renderIntentPanel();
  renderBuildPanel();
  if (state.codeVisible) renderCodeDrawer();
}

// ─── RENDER: BUILD PANEL ────────────────────────────────────

function renderBuildPanel() {
  if (!state.intent) {
    renderEmptyState();
    return;
  }
  if (state.intent === 'blank') {
    renderBlankCanvas();
    return;
  }

  let html = '';

  // Layer 3: Live preview (builds as answers accumulate)
  html += renderPreview();

  // Layer 2: Questions
  html += renderQuestions(state.intent);

  // Expanded options
  html += renderExpandedOptions();

  $buildPanel.innerHTML = html;
  wireUpBuildPanel();
}

// ─── RENDER: EMPTY STATE ────────────────────────────────────

function renderEmptyState() {
  $buildPanel.innerHTML = `
    <div class="bp-empty">
      <div class="bp-empty-icon">&#x2B21;</div>
      <h2>Was willst du erreichen?</h2>
      <p>Waehle links einen Typ aus — oder klicke auf "Ich weiss was ich tue" fuer einen leeren Baukasten.</p>
    </div>
  `;
}

// ─── RENDER: BLANK CANVAS ───────────────────────────────────

function renderBlankCanvas() {
  let html = renderPreview();
  html += renderExpandedOptions();
  $buildPanel.innerHTML = html;
  wireUpBuildPanel();
  // Auto-open expanded options for blank canvas
  const expOpt = $buildPanel.querySelector('.expanded-options');
  if (expOpt) {
    expOpt.classList.add('open');
    state.expandedOptions = true;
  }
}

// ─── RENDER: QUESTIONS (Layer 2) ────────────────────────────

function renderQuestions(intentId) {
  const questions = QUESTIONS[intentId];
  if (!questions) return '';

  let html = '<div class="questions-section">';

  questions.forEach(q => {
    html += '<div class="question-group">';
    html += `<div class="question-label">${q.label}</div>`;

    if (q.type === 'cards' || q.type === 'cards-multi') {
      html += renderAnswerCards(q);
    } else if (q.type === 'field') {
      html += renderFieldQuestion(q);
    } else if (q.type === 'themes') {
      html += renderThemeCards(q);
    } else if (q.type === 'toggle-chips') {
      html += renderToggleChips(q);
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
}

function renderAnswerCards(q) {
  const isMulti = q.type === 'cards-multi';
  const selected = state.answers[q.id];
  const selectedMulti = isMulti ? (Array.isArray(selected) ? selected : []) : [];

  let html = `<div class="answer-grid ${q.gridClass || ''}">`;

  q.options.forEach(opt => {
    const isSel = isMulti ? selectedMulti.includes(opt.id) : selected === opt.id;
    const visualHtml = opt.visual ? (typeof opt.visual === 'function' ? opt.visual() : opt.visual) : '';

    html += `<div class="answer-card${isSel ? ' selected' : ''}" data-question="${q.id}" data-answer="${opt.id}" data-multi="${isMulti}">`;
    if (visualHtml) {
      html += `<div class="answer-card-visual">${visualHtml}</div>`;
    } else {
      html += `<span class="answer-card-icon">${opt.icon}</span>`;
    }
    html += `<div class="answer-card-label">${opt.label}</div>`;

    // Inline field if selected and has field config
    if (isSel && opt.field) {
      html += renderInlineField(opt.field, q.id);
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
}

function renderInlineField(fieldCfg, questionId) {
  const val = state.fieldValues[fieldCfg.name] || '';

  if (fieldCfg.type === 'threshold') {
    const op = state.fieldValues.thresholdOp || '>';
    const thVal = state.fieldValues.thresholdVal || '';
    return `<div class="answer-inline-field" onclick="event.stopPropagation()">
      <div class="threshold-row">
        <span class="threshold-label">Wenn Wert</span>
        <select data-field-name="thresholdOp" class="inline-field-input">
          ${['>', '<', '>=', '<=', '=='].map(o => `<option value="${o}" ${op === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
        <input type="number" data-field-name="thresholdVal" class="inline-field-input" value="${escHtml(thVal)}" placeholder="Grenzwert">
      </div>
    </div>`;
  }
  if (fieldCfg.type === 'textarea') {
    return `<div class="answer-inline-field" onclick="event.stopPropagation()">
      <textarea class="answer-inline-input inline-field-input" data-field-name="${fieldCfg.name}" placeholder="${escHtml(fieldCfg.placeholder || '')}">${escHtml(val)}</textarea>
    </div>`;
  }
  if (fieldCfg.type === 'date') {
    return `<div class="answer-inline-field" onclick="event.stopPropagation()">
      <div class="date-picker-row">
        <input type="date" class="inline-field-input" data-field-name="${fieldCfg.name}" value="${escHtml(val)}">
      </div>
    </div>`;
  }
  return `<div class="answer-inline-field" onclick="event.stopPropagation()">
    <input class="answer-inline-input inline-field-input" type="text" data-field-name="${fieldCfg.name}" value="${escHtml(val)}" placeholder="${escHtml(fieldCfg.placeholder || '')}">
  </div>`;
}

function renderFieldQuestion(q) {
  const val = state.fieldValues[q.fieldConfig.name] || '';
  if (q.fieldConfig.type === 'textarea') {
    return `<textarea class="answer-inline-input inline-field-input" data-field-name="${q.fieldConfig.name}" placeholder="${escHtml(q.fieldConfig.placeholder || '')}">${escHtml(val)}</textarea>`;
  }
  return `<input class="answer-inline-input inline-field-input" type="text" data-field-name="${q.fieldConfig.name}" value="${escHtml(val)}" placeholder="${escHtml(q.fieldConfig.placeholder || '')}">`;
}

function renderThemeCards(q) {
  let html = '<div class="answer-grid">';
  q.options.forEach(opt => {
    const isSel = state.design === opt.id;
    const c = opt.colors;
    html += `<div class="theme-card${isSel ? ' selected' : ''}" data-theme-id="${opt.id}">
      <div class="theme-card-preview">${miniDashboardTheme(c.bg, c.accent, c.card)}</div>
      <div class="theme-card-name">${opt.name}</div>
    </div>`;
  });
  html += '</div>';
  return html;
}

function renderToggleChips(q) {
  let html = '<div class="toggle-chips">';
  q.options.forEach(opt => {
    const isActive = !!state.reminderChips[opt.id];
    html += `<button class="toggle-chip${isActive ? ' active' : ''}" data-chip-id="${opt.id}" data-question="${q.id}">${opt.label}</button>`;
  });
  html += '</div>';
  return html;
}

// ─── RENDER: LIVE PREVIEW (Layer 3) ─────────────────────────

function renderPreview() {
  const hasAnswers = Object.keys(state.answers).length > 0 || state.intent === 'blank';
  if (!hasAnswers && state.intent !== 'blank') return '';

  const colors = getThemeColors();
  const schedLabel = getScheduleLabel();
  const srcUrl = state.fieldValues.url || state.fieldValues.valuePath || state.fieldValues.reminderUrl || 'https://example.com';
  const condText = state.fieldValues.searchText || state.fieldValues.question || state.fieldValues.selector || state.fieldValues.reminderText || 'Aenderung erkannt';

  let html = '<div class="preview-section">';
  html += `<div class="pv-dashboard" style="--pv-bg:${colors.bg}; --pv-accent:${colors.accent}; --pv-card:${colors.card}; --pv-text:${colors.text}; --pv-text-dim:${colors.textDim};">`;

  // Header
  html += `
    <div class="pv-dash-header">
      <div class="pv-dash-header-left">
        <span class="pv-dash-header-hex">&#x2B21;</span>
        <input class="pv-dash-title-input" type="text" value="${escHtml(state.title)}"
          placeholder="Mein Agent" id="preview-title-input">
      </div>
      ${schedLabel ? `<div class="pv-dash-schedule">&#9200; ${escHtml(schedLabel)}</div>` : '<div class="pv-dash-schedule" style="opacity:0.4;">Kein Zeitplan</div>'}
    </div>
  `;

  html += '<div class="pv-dash-body">';

  // Build flow steps based on answered questions
  if (state.intent && state.intent !== 'blank') {
    html += buildPreviewSteps(srcUrl, condText);
  }

  // Notifications preview
  const notifyAnswers = state.answers.notify;
  if (notifyAnswers && Array.isArray(notifyAnswers) && notifyAnswers.length > 0) {
    html += renderNotifyPreviewSection(notifyAnswers, srcUrl, condText);
  }

  // Extra blocks preview
  if (state.extraBlocks.length > 0) {
    html += renderExtraBlocksPreview();
  }

  html += '</div></div></div>'; // body, dashboard, preview-section

  return html;
}

function buildPreviewSteps(srcUrl, condText) {
  let html = '';
  const intent = state.intent;

  // Source step
  const whatAnswer = state.answers.what;
  if (whatAnswer) {
    const whatLabels = {
      website: '\uD83C\uDF10 Webseite', api: '\uD83D\uDD0C API', feed: '\uD83D\uDCF0 Feed', inbox: '\uD83D\uDCE7 Postfach',
      cloud: '\u2601\uFE0F Cloud', database: '\uD83D\uDDC4 Datenbank',
      rss: '\uD83D\uDCF0 RSS/Atom', email: '\uD83D\uDCE7 Emails', urls: '\uD83D\uDD17 URLs',
      dashboard: '\uD83D\uDCCA Dashboard', portal: '\uD83C\uDFA8 Portal', learning: '\uD83D\uDCDA Lernumgebung'
    };
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDCE1</div>
        <div class="pv-flow-step-content">
          <div class="label">Quelle</div>
          <div class="value">${whatLabels[whatAnswer] || whatAnswer}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // URL field if present
  if (state.fieldValues.url || state.fieldValues.valuePath || state.fieldValues.reminderUrl) {
    const url = state.fieldValues.url || state.fieldValues.valuePath || state.fieldValues.reminderUrl;
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDD17</div>
        <div class="pv-flow-step-content">
          <div class="label">Adresse</div>
          <div class="value">${escHtml(url)}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Condition step (observe)
  const changeAnswer = state.answers.change;
  if (changeAnswer) {
    const changeLabels = {
      contains: `\uD83D\uDD0D Wenn: "${escHtml(state.fieldValues.searchText || '...')}" erscheint`,
      changed: '\uD83D\uDD04 Wenn: Irgendwas aendert sich',
      threshold: `\uD83D\uDCCA Wenn: Wert ${state.fieldValues.thresholdOp || '>'} ${state.fieldValues.thresholdVal || '...'}`,
      llm: `\uD83E\uDD16 Wenn: "${escHtml(state.fieldValues.question || '...')}"`,
      css: `\uD83C\uDFF7 Wenn: "${escHtml(state.fieldValues.selector || '...')}" erscheint`
    };
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDD0D</div>
        <div class="pv-flow-step-content">
          <div class="label">Bedingung</div>
          <div class="value">${changeLabels[changeAnswer] || changeAnswer}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Trigger step (react)
  const triggerAnswer = state.answers.trigger;
  if (triggerAnswer) {
    const triggerLabels = {
      email: '\uD83D\uDCE7 Eingehende Email',
      webhook: '\uD83D\uDD17 Webhook empfangen',
      feed: '\uD83D\uDCF0 Neuer Feed-Eintrag',
      change: '\uD83D\uDD04 Aenderung erkannt'
    };
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDD14</div>
        <div class="pv-flow-step-content">
          <div class="label">Trigger</div>
          <div class="value">${triggerLabels[triggerAnswer] || triggerAnswer}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Action step (react)
  const actionAnswer = state.answers.action;
  if (actionAnswer) {
    const actionLabels = {
      reply_email: '\uD83D\uDCE7 Email antworten',
      webhook_out: '\uD83D\uDD17 Webhook aufrufen',
      github_issue: '\uD83D\uDCDD GitHub Issue erstellen',
      shell: '\u26A1 Shell-Befehl ausfuehren',
      trigger_agent: '\uD83D\uDD04 Anderen Agent triggern'
    };
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\u26A1</div>
        <div class="pv-flow-step-content">
          <div class="label">Aktion</div>
          <div class="value">${actionLabels[actionAnswer] || actionAnswer}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Approval step (react)
  const approvalAnswer = state.answers.approval;
  if (approvalAnswer) {
    const approvalLabels = {
      auto: '\u2705 Automatisch ausfuehren',
      ask: '\uD83D\uDCAC Erst per Telegram fragen',
      log: '\uD83D\uDCCB Nur loggen'
    };
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDD12</div>
        <div class="pv-flow-step-content">
          <div class="label">Genehmigung</div>
          <div class="value">${approvalLabels[approvalAnswer] || approvalAnswer}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Collect format
  const formatAnswer = state.answers.format;
  if (formatAnswer) {
    const formatLabels = {
      list: '\uD83D\uDCCB Als Liste',
      email_digest: '\uD83D\uDCE7 Als Email-Digest',
      webpage: '\uD83C\uDF10 Als Webseite',
      github_issue: '\uD83D\uDCDD Als GitHub Issue'
    };
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDCE4</div>
        <div class="pv-flow-step-content">
          <div class="label">Ausgabe</div>
          <div class="value">${formatLabels[formatAnswer] || formatAnswer}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Visualization (measure)
  const vizAnswer = state.answers.viz;
  if (vizAnswer) {
    const vizLabels = {
      line: '\uD83D\uDCC8 Line Chart',
      bar: '\uD83D\uDCCA Bar Chart',
      donut: '\uD83C\uDF69 Donut',
      heatmap: '\uD83D\uDDFA Heatmap'
    };
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDCCA</div>
        <div class="pv-flow-step-content">
          <div class="label">Visualisierung</div>
          <div class="value">${vizLabels[vizAnswer] || vizAnswer}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Alert (measure)
  const alertAnswer = state.answers.alert;
  if (alertAnswer === 'yes') {
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDEA8</div>
        <div class="pv-flow-step-content">
          <div class="label">Alert</div>
          <div class="value">Wenn Wert ${state.fieldValues.thresholdOp || '>'} ${state.fieldValues.thresholdVal || '...'}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Reminder specific
  if (state.fieldValues.reminderText) {
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\u23F0</div>
        <div class="pv-flow-step-content">
          <div class="label">Erinnerung</div>
          <div class="value">${escHtml(state.fieldValues.reminderText)}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  const whenAnswer = state.answers.when;
  if (whenAnswer === 'fixed' && state.fieldValues.reminderDate) {
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDCC5</div>
        <div class="pv-flow-step-content">
          <div class="label">Datum</div>
          <div class="value">${escHtml(state.fieldValues.reminderDate)}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Reminder escalation chips
  const activeChips = Object.keys(state.reminderChips).filter(k => state.reminderChips[k]);
  if (activeChips.length > 0) {
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83D\uDCE2</div>
        <div class="pv-flow-step-content">
          <div class="label">Erinnerungsstaffel</div>
          <div class="value">${activeChips.map(c => c + ' Tage vorher').join(', ')}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Present components
  const compAnswers = state.answers.components;
  if (compAnswers && Array.isArray(compAnswers) && compAnswers.length > 0) {
    const compLabels = {
      charts: '\uD83D\uDCC8 Charts', tables: '\uD83D\uDCCA Tabellen', maps: '\uD83D\uDDFA Karten',
      genome: '\uD83E\uDDEC Genom-Tracks', network: '\uD83D\uDD78 Netzwerk-Graphen'
    };
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\uD83E\uDDE9</div>
        <div class="pv-flow-step-content">
          <div class="label">Komponenten</div>
          <div class="value">${compAnswers.map(c => compLabels[c] || c).join(', ')}</div>
        </div>
      </div>
      <div class="pv-flow-connector"></div>
    `;
  }

  // Schedule step
  const schedLabel = getScheduleLabel();
  if (schedLabel) {
    html += `
      <div class="pv-flow-step">
        <div class="pv-flow-step-icon">\u23F0</div>
        <div class="pv-flow-step-content">
          <div class="label">Zeitplan</div>
          <div class="value">${escHtml(schedLabel)}</div>
        </div>
      </div>
    `;
  }

  return html;
}

function renderNotifyPreviewSection(channels, srcUrl, condText) {
  const now = new Date();
  const timeStr = now.toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

  let html = `
    <div class="pv-notify-section">
      <div class="pv-notify-title">&#128276; Benachrichtigungen</div>
      <div class="pv-notify-grid">
  `;

  channels.forEach(ch => {
    html += renderNotifyPreview(ch, srcUrl, condText, timeStr);
  });

  html += '</div></div>';
  return html;
}

function renderNotifyPreview(channel, srcUrl, condText, timeStr) {
  let inner = '';
  let cls = '';

  if (channel === 'telegram') {
    cls = 'pv-notify-telegram';
    inner = `<div class="pv-ntf-tg-bubble">
      &#128276; <b>Aenderung erkannt!</b><br>
      Die Seite ${escHtml(srcUrl)} enthaelt jetzt "${escHtml(condText)}".
      <div class="pv-ntf-tg-time">${timeStr}</div>
    </div>`;
  } else if (channel === 'email') {
    cls = 'pv-notify-email';
    inner = `<div class="pv-ntf-email-subject">Aenderung erkannt auf ${escHtml(srcUrl)}</div>
    <div class="pv-ntf-email-body">Hallo,

dein Agent hat eine Aenderung erkannt:

  Seite: ${escHtml(srcUrl)}
  Bedingung: "${escHtml(condText)}"
  Zeit: ${timeStr}

Viele Gruesse,
dein nano-zyrkel</div>`;
  } else if (channel === 'slack') {
    cls = 'pv-notify-slack';
    inner = `<div class="pv-ntf-slack-avatar"></div>
    <div class="pv-ntf-slack-body">
      <div class="pv-ntf-slack-name">nano-zyrkel</div>
      &#128276; *Aenderung erkannt!*<br>
      &gt; ${escHtml(srcUrl)}<br>
      &gt; "${escHtml(condText)}"
    </div>`;
  } else if (channel === 'discord') {
    cls = 'pv-notify-discord';
    inner = `<div class="pv-ntf-discord-header">
      <div class="pv-ntf-discord-avatar"></div>
      <div class="pv-ntf-discord-name">nano-zyrkel BOT</div>
    </div>
    <div class="pv-ntf-discord-embed">
      <b>Aenderung erkannt!</b><br>
      Seite: ${escHtml(srcUrl)}<br>
      Bedingung: "${escHtml(condText)}"<br>
      <span style="color:#72767d; font-size:11px;">${timeStr}</span>
    </div>`;
  } else if (channel === 'silence') {
    cls = 'pv-notify-silence';
    inner = `<div style="font-size:22px; margin-bottom:6px;">&#9989;</div>
    <div style="font-weight:600; margin-bottom:4px;">Alles ruhig</div>
    <div style="font-size:12px; color:var(--text-muted);">
      Letzte Pruefung: ${timeStr}<br>
      Dein Agent laeuft.
    </div>`;
  }

  return `<div class="pv-notify-card ${cls}"><div class="pv-ntf-inner">${inner}</div></div>`;
}

function renderExtraBlocksPreview() {
  if (state.extraBlocks.length === 0) return '';
  let html = '<div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:16px;">';
  html += '<div class="pv-notify-title">&#9881;&#65039; Erweiterte Bausteine</div>';

  state.extraBlocks.forEach(blockId => {
    let block = null;
    for (const cat of EXTRA_BLOCK_CATEGORIES) {
      block = cat.blocks.find(b => b.id === blockId);
      if (block) break;
    }
    if (!block) return;

    html += `<div class="pv-flow-step" style="margin-bottom:8px;">
      <div class="pv-flow-step-icon" style="font-size:14px;">\u2699\uFE0F</div>
      <div class="pv-flow-step-content">
        <div class="label">${escHtml(block.name)}</div>
        <div class="value" style="font-size:12px; color:var(--pv-text-dim);">${escHtml(block.desc)}</div>
      </div>
    </div>`;
  });

  html += '</div>';
  return html;
}

// ─── RENDER: EXPANDED OPTIONS ───────────────────────────────

function renderExpandedOptions() {
  let html = `<div class="expanded-options${state.expandedOptions ? ' open' : ''}" id="expanded-options">`;
  html += `<button class="expanded-options-toggle" id="expanded-options-toggle">
    <span class="expanded-options-arrow">&#9662;</span>
    Erweiterte Optionen
  </button>`;
  html += '<div class="expanded-options-body">';

  EXTRA_BLOCK_CATEGORIES.forEach(cat => {
    html += `<div class="block-catalog-section">
      <div class="block-catalog-title">${cat.icon} ${cat.name}</div>
      <div class="block-catalog-grid">`;

    cat.blocks.forEach(block => {
      const inUse = state.extraBlocks.includes(block.id);
      const visualHtml = block.visual ? (typeof block.visual === 'function' ? block.visual() : block.visual) : '';
      html += `<div class="block-catalog-card${inUse ? ' in-use' : ''}" data-extra-block="${block.id}">
        <div class="block-catalog-visual">${visualHtml}</div>
        <div class="block-catalog-label">
          <div class="block-catalog-name">${block.name}</div>
          <div class="block-catalog-desc">${block.desc}</div>
        </div>
      </div>`;
    });

    html += '</div></div>';
  });

  html += '</div></div>';
  return html;
}

// ─── WIRE UP EVENT LISTENERS ────────────────────────────────

function wireUpBuildPanel() {
  // Answer cards
  $buildPanel.querySelectorAll('.answer-card').forEach(card => {
    card.addEventListener('click', () => {
      const qId = card.dataset.question;
      const aId = card.dataset.answer;
      const isMulti = card.dataset.multi === 'true';
      selectAnswer(qId, aId, isMulti);
    });
  });

  // Theme cards
  $buildPanel.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      state.design = card.dataset.themeId;
      renderBuildPanel();
      if (state.codeVisible) renderCodeDrawer();
    });
  });

  // Toggle chips
  $buildPanel.querySelectorAll('.toggle-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const chipId = chip.dataset.chipId;
      state.reminderChips[chipId] = !state.reminderChips[chipId];
      renderBuildPanel();
      if (state.codeVisible) renderCodeDrawer();
    });
  });

  // Inline field inputs
  $buildPanel.querySelectorAll('.inline-field-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      state.fieldValues[e.target.dataset.fieldName] = e.target.value;
      // Debounced preview re-render
      clearTimeout(state._fieldTimer);
      state._fieldTimer = setTimeout(() => {
        renderBuildPanel();
        if (state.codeVisible) renderCodeDrawer();
      }, 400);
    });
    // Prevent card click when interacting with fields
    inp.addEventListener('click', (e) => e.stopPropagation());
  });

  // Title input
  const titleInput = document.getElementById('preview-title-input');
  if (titleInput) {
    titleInput.addEventListener('input', (e) => {
      state.title = e.target.value || 'Mein Agent';
      if (state.codeVisible) renderCodeDrawer();
    });
  }

  // Expanded options toggle
  const expToggle = document.getElementById('expanded-options-toggle');
  if (expToggle) {
    expToggle.addEventListener('click', () => {
      state.expandedOptions = !state.expandedOptions;
      const expOpt = document.getElementById('expanded-options');
      if (expOpt) expOpt.classList.toggle('open', state.expandedOptions);
    });
  }

  // Extra block catalog cards
  $buildPanel.querySelectorAll('.block-catalog-card').forEach(card => {
    card.addEventListener('click', () => {
      const blockId = card.dataset.extraBlock;
      if (state.extraBlocks.includes(blockId)) return;
      state.extraBlocks.push(blockId);
      renderBuildPanel();
      if (state.codeVisible) renderCodeDrawer();
    });
  });
}

// ─── SELECT ANSWER ──────────────────────────────────────────

function selectAnswer(questionId, answerId, isMulti) {
  if (isMulti) {
    let arr = state.answers[questionId];
    if (!Array.isArray(arr)) arr = [];
    const idx = arr.indexOf(answerId);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(answerId);
    state.answers[questionId] = arr;
  } else {
    state.answers[questionId] = answerId;
  }

  renderBuildPanel();
  if (state.codeVisible) renderCodeDrawer();
}

// ─── CONFIG GENERATION ──────────────────────────────────────

function generateConfig() {
  const config = {
    name: state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mein-agent',
    description: state.title,
    version: '1.0.0',
    hats: {}
  };

  if (!state.intent) return JSON.stringify(config, null, 2);

  const intent = state.intent;
  const answers = state.answers;
  const fv = state.fieldValues;

  // Translate intent + answers into technical config
  if (intent === 'observe') {
    config.hats.type = 'watcher';

    // Source
    const whatMap = { website: 'url', api: 'api', feed: 'rss', inbox: 'imap' };
    config.hats.sources = [{ type: whatMap[answers.what] || 'url', url: fv.url || '' }];

    // Condition
    if (answers.change === 'contains') {
      config.hats.conditions = [{ type: 'contains', value: fv.searchText || '' }];
    } else if (answers.change === 'changed') {
      config.hats.conditions = [{ type: 'changed' }];
    } else if (answers.change === 'threshold') {
      config.hats.conditions = [{ type: 'threshold', operator: fv.thresholdOp || '>', value: Number(fv.thresholdVal) || 0 }];
    } else if (answers.change === 'llm') {
      config.hats.conditions = [{ type: 'llm', question: fv.question || '' }];
    } else if (answers.change === 'css') {
      config.hats.conditions = [{ type: 'css', selector: fv.selector || '' }];
    }
  } else if (intent === 'measure') {
    config.hats.type = 'tracker';
    const whatMap = { api: 'api', website: 'url', cloud: 'aws', database: 'db' };
    config.hats.sources = [{ type: whatMap[answers.what] || 'api', url: fv.valuePath || '' }];
    if (answers.alert === 'yes') {
      config.hats.conditions = [{ type: 'threshold', operator: fv.thresholdOp || '>', value: Number(fv.thresholdVal) || 0 }];
    }
    const vizMap = { line: 'viz-basic', bar: 'viz-basic', donut: 'viz-basic', heatmap: 'viz-advanced' };
    if (answers.viz) {
      config.hats.wasm_features = [vizMap[answers.viz] || 'viz-basic'];
      config.hats.visualization = { type: answers.viz };
    }
  } else if (intent === 'collect') {
    config.hats.type = 'collector';
    const whatMap = { rss: 'rss', email: 'imap', api: 'api', urls: 'url' };
    config.hats.sources = [{ type: whatMap[answers.what] || 'rss' }];
    if (answers.format) config.hats.output = { format: answers.format };
  } else if (intent === 'react') {
    config.hats.type = 'reactor';
    const triggerMap = { email: 'imap', webhook: 'webhook-in', feed: 'rss', change: 'watcher' };
    config.hats.trigger = { type: triggerMap[answers.trigger] || 'webhook-in' };
    const actionMap = { reply_email: 'email-reply', webhook_out: 'webhook', github_issue: 'github-issue', shell: 'shell', trigger_agent: 'chain-trigger' };
    config.hats.actions = [{ type: actionMap[answers.action] || 'webhook' }];
    if (answers.approval) config.hats.approval = { mode: answers.approval };
  } else if (intent === 'present') {
    config.hats.type = 'presenter';
    if (state.design) {
      const q = (QUESTIONS.present || []).find(q => q.type === 'themes');
      const t = q ? q.options.find(o => o.id === state.design) : null;
      if (t) config.hats.theme = { id: state.design.replace('theme-', ''), colors: t.colors };
    }
    if (answers.components && Array.isArray(answers.components)) {
      const wasmMap = { charts: 'viz-basic', tables: 'data', maps: 'viz-spatial', genome: 'viz-spatial', network: 'viz-spatial' };
      config.hats.wasm_features = [...new Set(answers.components.map(c => wasmMap[c] || 'data'))];
      config.hats.components = answers.components;
    }
  } else if (intent === 'remind') {
    config.hats.type = 'reminder';
    config.hats.reminder = {
      text: fv.reminderText || '',
      mode: answers.when || 'fixed'
    };
    if (answers.when === 'fixed' && fv.reminderDate) config.hats.reminder.date = fv.reminderDate;
    if (answers.when === 'dynamic' && fv.reminderUrl) config.hats.reminder.url = fv.reminderUrl;
    const activeChips = Object.keys(state.reminderChips).filter(k => state.reminderChips[k]);
    if (activeChips.length > 0) config.hats.reminder.remind_days = activeChips.map(Number).sort((a, b) => b - a);
  }

  // Schedule
  config.hats.schedule = { cron: getActiveCron() };

  // Notifications
  const notifyAnswers = answers.notify;
  if (notifyAnswers && Array.isArray(notifyAnswers) && notifyAnswers.length > 0) {
    config.hats.notifications = notifyAnswers.map(ch => ({ type: ch }));
  }

  // Extra blocks
  if (state.extraBlocks.length > 0) {
    const extras = {};
    state.extraBlocks.forEach(id => {
      const prefix = id.split('-')[0];
      const type = id.replace(/^[^-]+-/, '');
      if (!extras[prefix]) extras[prefix] = [];
      extras[prefix].push({ type });
    });
    if (extras.src) config.hats.extra_sources = extras.src;
    if (extras.cond) config.hats.extra_conditions = extras.cond;
    if (extras.act) config.hats.extra_actions = extras.act;
    if (extras.feat) config.hats.extra_features = extras.feat;
  }

  return JSON.stringify(config, null, 2);
}

function generateWorkflow() {
  const cron = getActiveCron();
  return `name: nano-zyrkel run
on:
  schedule:
    - cron: '${cron}'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install nano-zyrkel
        run: |
          curl -sL https://github.com/schlein-lab/nano-zyrkel/releases/latest/download/nano-zyrkel-linux -o nano-zyrkel
          chmod +x nano-zyrkel

      - name: Run
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: \${{ secrets.TELEGRAM_CHAT_ID }}
        run: ./nano-zyrkel run --config hats/config.json

      - name: Commit state
        run: |
          git config user.name "nano-zyrkel"
          git config user.email "bot@nano-zyrkel"
          git add -A
          git diff --staged --quiet || git commit -m "state update"
          git push
`;
}

function generateReadme() {
  const def = getIntentDef(state.intent);
  const intentName = def ? def.question : 'Autonomer Agent';
  return `# ${state.title}

Ein autonomer nano-zyrkel Agent, erstellt mit dem nano-zyrkel Project Studio.

## Typ
${intentName}

## Deploy

1. Repository auf GitHub erstellen
2. Diese Dateien hineinladen: \`hats/config.json\`, \`.github/workflows/run.yml\`
3. Unter Settings > Secrets die benoetigten Tokens eintragen
4. GitHub Actions aktivieren — der Agent laeuft automatisch nach dem Zeitplan
`;
}

// ─── CODE DRAWER ────────────────────────────────────────────

function renderCodeDrawer() {
  let content = '';
  if (state.activeTab === 'config') content = generateConfig();
  else if (state.activeTab === 'workflow') content = generateWorkflow();
  else if (state.activeTab === 'readme') content = generateReadme();
  $drawerCode.textContent = content;

  $nextSteps.innerHTML = `
    <li>Erstelle ein neues GitHub Repository (z.B. <code>${state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</code>)</li>
    <li>Lege die Datei <code>hats/config.json</code> mit dem obigen Inhalt an</li>
    <li>Lege <code>.github/workflows/run.yml</code> mit dem Workflow an</li>
    <li>Trage benoetigte Secrets unter Settings &gt; Secrets ein (Telegram Token, SMTP, etc.)</li>
    <li>Committe und pushe — der nano-zyrkel startet automatisch</li>
  `;
}

document.querySelectorAll('.drawer-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeTab = tab.dataset.tab;
    renderCodeDrawer();
  });
});

$btnCode.addEventListener('click', () => {
  state.codeVisible = !state.codeVisible;
  $codeDrawer.classList.toggle('visible', state.codeVisible);
  if (state.codeVisible) renderCodeDrawer();
});

$btnCloseDrawer.addEventListener('click', () => {
  state.codeVisible = false;
  $codeDrawer.classList.remove('visible');
});

$btnCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($drawerCode.textContent);
    $btnCopy.textContent = 'Kopiert!';
    setTimeout(() => { $btnCopy.textContent = 'Kopieren'; }, 1500);
  } catch (e) {
    $btnCopy.textContent = 'Fehler';
  }
});

// ─── ZYRKEL DETECTION ───────────────────────────────────────

async function detectZyrkel() {
  const ports = [37848, 37849, 37850, 37851, 37852, 37853];
  for (const port of ports) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(`http://localhost:${port}/api/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        state.zyrkelPort = port;
        $statusDot.classList.add('online');
        $statusDot.classList.remove('offline');
        $statusLabel.textContent = 'Zyrkel verbunden (Port ' + port + ')';
        $btnDeploy.classList.remove('hidden');
        return;
      }
    } catch (e) { /* try next port */ }
  }
  $statusLabel.textContent = 'Offline';
}

$btnDeploy.addEventListener('click', async () => {
  if (!state.zyrkelPort) return;
  $btnDeploy.textContent = 'Deploye...';
  try {
    const res = await fetch(`http://localhost:${state.zyrkelPort}/api/nanos/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: JSON.parse(generateConfig()), workflow: generateWorkflow() })
    });
    if (res.ok) {
      $btnDeploy.textContent = 'Deployed!';
    } else {
      $btnDeploy.textContent = 'Fehler';
    }
  } catch (e) {
    $btnDeploy.textContent = 'Fehler';
  }
  setTimeout(() => { $btnDeploy.textContent = 'Jetzt deployen'; }, 2500);
});

// ─── LLM CHAT ───────────────────────────────────────────────

$chatFab.addEventListener('click', () => {
  state.chatOpen = !state.chatOpen;
  $chatOverlay.classList.toggle('hidden', !state.chatOpen);
  if (state.chatOpen && $chatMessages.children.length === 0) {
    appendChatMsg('assistant', 'Hi! Beschreibe was du bauen willst — z.B. "Ueberwache den Schwimmkurs" oder "Tracke ClinVar-Varianten". Ich helfe dir die richtigen Einstellungen zu waehlen.');
  }
});

$chatClose.addEventListener('click', () => {
  state.chatOpen = false;
  $chatOverlay.classList.add('hidden');
});

function appendChatMsg(role, text) {
  const div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.textContent = text;
  $chatMessages.appendChild(div);
  $chatMessages.scrollTop = $chatMessages.scrollHeight;
}

async function sendChatMessage() {
  const msg = $chatInput.value.trim();
  if (!msg) return;
  appendChatMsg('user', msg);
  $chatInput.value = '';

  if (state.zyrkelPort) {
    try {
      const res = await fetch(`http://localhost:${state.zyrkelPort}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          system: 'Du bist der nano-zyrkel Builder-Assistent. Hilf dem Benutzer den richtigen Intent und die richtigen Antworten zu waehlen. Verfuegbare Intents: ' + INTENTS.map(i => i.id).join(', ')
        })
      });
      const data = await res.json();
      const response = data.response || data.message || '';
      appendChatMsg('assistant', response.trim() || 'Ok!');
    } catch (e) {
      appendChatMsg('assistant', 'Zyrkel nicht erreichbar. Nutze die Karten links.');
    }
  } else {
    const reply = offlineChatReply(msg);
    appendChatMsg('assistant', reply);
  }
}

function offlineChatReply(msg) {
  const m = msg.toLowerCase();

  if (m.includes('schwimm') || m.includes('kurs') || m.includes('webseite') || m.includes('ueberwache') || m.includes('beobachte')) {
    selectIntent('observe');
    return 'Habe "Beobachten" ausgewaehlt. Beantworte jetzt die Fragen rechts — was beobachtest du, welche Aenderung, wie dringend?';
  }
  if (m.includes('clinvar') || m.includes('variante') || m.includes('track') || m.includes('metrik') || m.includes('messe')) {
    selectIntent('measure');
    return 'Habe "Messen" ausgewaehlt. Waehle jetzt rechts die Details aus.';
  }
  if (m.includes('email') || m.includes('mail') || m.includes('reagier')) {
    selectIntent('react');
    return 'Habe "Reagieren" ausgewaehlt. Konfiguriere den Trigger und die Aktion rechts.';
  }
  if (m.includes('news') || m.includes('digest') || m.includes('samml') || m.includes('zusammenfass')) {
    selectIntent('collect');
    return 'Habe "Sammeln" ausgewaehlt. Waehle rechts die Quellen und das Format.';
  }
  if (m.includes('dashboard') || m.includes('portal') || m.includes('zeig') || m.includes('praesentier')) {
    selectIntent('present');
    return 'Habe "Praesentieren" ausgewaehlt. Waehle Design und Komponenten rechts.';
  }
  if (m.includes('erinne') || m.includes('frist') || m.includes('deadline') || m.includes('vergiss')) {
    selectIntent('remind');
    return 'Habe "Erinnern" ausgewaehlt. Trage rechts ein woran und wann.';
  }
  return 'Ich kann verschiedene Agenten-Typen starten: Beobachten, Messen, Sammeln, Reagieren, Praesentieren, Erinnern. Probier einen Begriff davon.';
}

$chatSend.addEventListener('click', sendChatMessage);
$chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });

// ─── INIT ───────────────────────────────────────────────────

function init() {
  renderIntentPanel();
  renderEmptyState();
  detectZyrkel();
}

init();
