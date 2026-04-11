/* ═══════════════════════════════════════════════════════════════
   nano-zyrkel Project Studio — builder.js
   Dropdown catalog + Live product preview with composable slots
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
    ${Array.from({length: 12}, (_, i) => {
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

// Starter template composites
function miniStarter(icon, title, accent) {
  return `<div style="width:100%; height:100%; display:flex; flex-direction:column; padding:6px; gap:4px;">
    <div style="font-size:22px; text-align:center; color:${accent};">${icon}</div>
    <div style="font-size:9px; text-align:center; color:var(--text-dim); font-weight:600;">${title}</div>
  </div>`;
}

function miniStarterWatcher() { return miniStarter('&#x1F441;&#xFE0F;', 'URL + Alert', '#06b6d4'); }
function miniStarterTracker() { return miniStarter('&#x1F4C8;', 'Daten + Chart', '#8b5cf6'); }
function miniStarterLearn()   { return miniStarter('&#x1F393;', '10 Module', '#2563eb'); }
function miniStarterMail()    { return miniStarter('&#x1F916;', 'Email + LLM', '#8b5cf6'); }
function miniStarterPortal()  { return miniStarter('&#x2728;', 'Card Grid', '#ec4899'); }
function miniStarterAlert()   { return miniStarter('&#x1F4E7;', 'PubMed Digest', '#22c55e'); }
function miniStarterApiMon()  { return miniStarter('&#x1F50C;', 'API Health', '#f59e0b'); }
function miniStarterNewsletter() { return miniStarter('&#x1F4F0;', 'Weekly Digest', '#b45309'); }

// ─── CATEGORIES & BLOCKS ─────────────────────────────────────

const CATEGORIES = [
  {
    id: 'showcase', name: 'Start', icon: '\u2728',
    blocks: [
      { id: 'start-watcher', name: 'Webseiten-Watcher', desc: 'URL ueberwachen + benachrichtigen',
        starter: true, design: 'theme-minimal',
        autoBlocks: ['src-url', 'cond-contains', 'sched-hourly', 'notify-telegram', 'notify-silence'],
        visual: miniStarterWatcher },
      { id: 'start-tracker', name: 'Daten-Tracker', desc: '4.4M Varianten tracken',
        starter: true, design: 'theme-dashboard',
        autoBlocks: ['src-clinvar', 'cond-changed', 'sched-3h', 'notify-telegram', 'feat-data', 'feat-viz-basic'],
        visual: miniStarterTracker },
      { id: 'start-helix', name: 'Lernplattform', desc: '10-Modul Genetik-Suite',
        starter: true, design: 'theme-clinical',
        autoBlocks: ['src-api', 'sched-daily', 'feat-viz-basic', 'feat-plugin'],
        visual: miniStarterLearn },
      { id: 'start-mailbot', name: 'Email-Agent', desc: 'LLM-Email mit Approval',
        starter: true, design: 'theme-minimal',
        autoBlocks: ['src-imap', 'cond-llm', 'sched-15min', 'notify-telegram'],
        visual: miniStarterMail },
      { id: 'start-portal', name: 'Portal / Showcase', desc: 'Animiertes Projekt-Hub',
        starter: true, design: 'theme-cinematic',
        autoBlocks: ['src-github', 'sched-daily', 'act-publish'],
        visual: miniStarterPortal },
      { id: 'start-alert', name: 'Literatur-Alert', desc: 'PubMed-Recherche-Bot',
        starter: true, design: 'theme-magazine',
        autoBlocks: ['src-pubmed', 'cond-rss', 'sched-daily', 'notify-email'],
        visual: miniStarterAlert },
      { id: 'start-apimon', name: 'API-Monitor', desc: 'Endpunkt-Gesundheit pruefen',
        starter: true, design: 'theme-dashboard',
        autoBlocks: ['src-api', 'cond-threshold', 'sched-5min', 'notify-slack', 'feat-viz-basic'],
        visual: miniStarterApiMon },
      { id: 'start-newsletter', name: 'Newsletter-Digest', desc: 'Woechentliche Zusammenfassung',
        starter: true, design: 'theme-magazine',
        autoBlocks: ['src-rss', 'sched-weekly', 'notify-email', 'act-publish'],
        visual: miniStarterNewsletter },
    ]
  },
  {
    id: 'sources', name: 'Quellen', icon: '\uD83D\uDCE1',
    blocks: [
      { id: 'src-url', name: 'URL / Webseite', desc: 'HTML-Seite abrufen', configKey: 'source',
        fields: [{ name: 'url', label: 'URL', type: 'url', placeholder: 'https://vhs-hamburg.de/kurse' }],
        visual: () => miniBrowser('https://...', '<div class="mini-browser-line" style="width:80%"></div><div class="mini-browser-line" style="width:60%"></div><div class="mini-browser-line" style="width:70%"></div>') },
      { id: 'src-api', name: 'REST API', desc: 'JSON API abfragen',
        fields: [{ name: 'url', label: 'API URL', type: 'url', placeholder: 'https://api.example.com/data' }, { name: 'method', label: 'Methode', type: 'select', options: ['GET', 'POST'] }],
        visual: () => miniJson(`{<br>&nbsp;&nbsp;<span class="key">"status"</span>: <span class="str">"ok"</span>,<br>&nbsp;&nbsp;<span class="key">"data"</span>: [<span class="num">...</span>]<br>}`) },
      { id: 'src-graphql', name: 'GraphQL API', desc: 'GraphQL-Abfrage',
        fields: [{ name: 'url', label: 'Endpoint', type: 'url', placeholder: 'https://api.example.com/graphql' }, { name: 'query', label: 'Query', type: 'textarea', placeholder: '{ user { name } }' }],
        visual: miniGraphql },
      { id: 'src-rss', name: 'RSS / Atom Feed', desc: 'Feed-Eintraege ueberwachen',
        fields: [{ name: 'url', label: 'Feed URL', type: 'url', placeholder: 'https://example.com/feed.xml' }],
        visual: miniFeed },
      { id: 'src-imap', name: 'Email-Postfach', desc: 'IMAP Inbox lesen',
        fields: [{ name: 'host', label: 'IMAP Host', placeholder: 'imap.gmail.com' }, { name: 'user', label: 'Benutzer', placeholder: 'user@example.com' }],
        visual: miniInbox },
      { id: 'src-pubmed', name: 'PubMed', desc: 'Biomedizinische Literatur',
        fields: [{ name: 'query', label: 'Suchbegriff', placeholder: 'structural variants' }],
        visual: miniPubmed },
      { id: 'src-clinvar', name: 'ClinVar', desc: 'Varianten-Datenbank',
        fields: [{ name: 'gene', label: 'Gen', placeholder: 'BRCA1' }],
        visual: miniClinvar },
      { id: 'src-github', name: 'GitHub API', desc: 'Repos, Issues, PRs',
        fields: [{ name: 'repo', label: 'Repository', placeholder: 'user/repo' }],
        visual: miniGithubCard },
      { id: 'src-aws', name: 'AWS CloudWatch', desc: 'Metriken + Logs',
        fields: [{ name: 'metric', label: 'Metrik', placeholder: 'CPUUtilization' }, { name: 'region', label: 'Region', placeholder: 'eu-central-1' }],
        visual: miniAwsCloud },
      { id: 'src-s3', name: 'S3 Bucket', desc: 'Dateien aus S3 lesen',
        fields: [{ name: 'bucket', label: 'Bucket' }, { name: 'key', label: 'Key/Prefix' }],
        visual: miniS3 },
      { id: 'src-db', name: 'PostgreSQL / SQLite', desc: 'SQL-Datenbank abfragen',
        fields: [{ name: 'connection', label: 'Connection String', placeholder: 'postgres://...' }, { name: 'query', label: 'SQL', type: 'textarea' }],
        visual: miniDatabase },
      { id: 'src-webhook-in', name: 'Webhook (eingehend)', desc: 'POST-Requests empfangen',
        fields: [{ name: 'secret', label: 'Shared Secret' }],
        visual: miniWebhookIn },
    ]
  },
  {
    id: 'conditions', name: 'Wenn', icon: '\uD83D\uDD0D',
    blocks: [
      { id: 'cond-contains', name: 'Text-Suche', desc: '"freie Plaetze" taucht auf',
        fields: [{ name: 'value', label: 'Suchtext', placeholder: 'freie Plaetze' }],
        visual: miniPageHighlight },
      { id: 'cond-regex', name: 'Regex', desc: 'Regulaerer Ausdruck',
        fields: [{ name: 'regex', label: 'Pattern', placeholder: 'Preis:\\s*\\d+' }],
        visual: miniRegex },
      { id: 'cond-css', name: 'HTML-Element', desc: 'CSS-Selector erscheint',
        fields: [{ name: 'selector', label: 'CSS Selector', placeholder: '.registration-open' }],
        visual: miniDomTree },
      { id: 'cond-json', name: 'JSON-Wert', desc: 'API-Feld pruefen',
        fields: [{ name: 'path', label: 'JSON Path', placeholder: '$.data.status' }, { name: 'value', label: 'Erwarteter Wert', placeholder: 'open' }],
        visual: miniJsonPath },
      { id: 'cond-threshold', name: 'Schwellwert', desc: 'Wert ueber/unter X',
        fields: [{ name: 'path', label: 'Pfad' }, { name: 'operator', label: 'Operator', type: 'select', options: ['>', '<', '>=', '<=', '=='] }, { name: 'value', label: 'Grenzwert', type: 'number' }],
        visual: () => miniThresholdChart('#ef4444') },
      { id: 'cond-rss', name: 'Neue Feed-Eintraege', desc: 'Neue Items im RSS',
        visual: miniRssNew },
      { id: 'cond-llm', name: 'KI-Frage', desc: 'Natuerliche Sprache (~$0.001)',
        fields: [{ name: 'question', label: 'Frage', type: 'textarea', placeholder: 'Ist die Anmeldung geoeffnet?' }],
        visual: miniAiChat },
      { id: 'cond-changed', name: 'Aenderung erkannt', desc: 'Irgendwas aendert sich',
        visual: miniDiff },
      { id: 'cond-stale', name: 'Alter pruefen', desc: 'Daten aelter als X Stunden',
        fields: [{ name: 'max_age_hours', label: 'Max. Alter (h)', type: 'number', placeholder: '24' }],
        visual: miniStale },
      { id: 'cond-schema', name: 'JSON-Schema Check', desc: 'Struktur-Validierung',
        fields: [{ name: 'schema', label: 'Schema', type: 'textarea' }],
        visual: miniSchema },
      { id: 'cond-structdiff', name: 'Strukturelle Aenderung', desc: 'min_changes Items anders',
        fields: [{ name: 'min_changes', label: 'Mindest-Aenderungen', type: 'number', placeholder: '5' }],
        visual: miniStructDiff },
      { id: 'cond-deadline', name: 'Frist / Deadline', desc: 'Datum erreicht',
        fields: [{ name: 'date', label: 'Datum', type: 'text', placeholder: '2026-12-31' }, { name: 'remind_days', label: 'Erinnern (Tage vorher)', placeholder: '30,14,7,1' }],
        visual: miniDeadline },
    ]
  },
  {
    id: 'schedule', name: 'Zeitplan', icon: '\u23F0',
    blocks: [
      { id: 'sched-5min', name: 'Alle 5 Minuten', desc: 'Sehr haeufig', cron: '*/5 * * * *',
        visual: () => miniTimelineDots(20, 3) },
      { id: 'sched-15min', name: 'Alle 15 Minuten', desc: 'Haeufig', cron: '*/15 * * * *',
        visual: () => miniTimelineDots(16, 2) },
      { id: 'sched-hourly', name: 'Stuendlich', desc: 'Jede volle Stunde', cron: '0 * * * *',
        visual: () => miniClockFace(0, 0) },
      { id: 'sched-3h', name: 'Alle 3 Stunden', desc: '8x pro Tag', cron: '0 */3 * * *',
        visual: () => miniClockFace(90, 0) },
      { id: 'sched-daily-morning', name: 'Taeglich 8 Uhr', desc: 'Morgens', cron: '0 8 * * *',
        visual: () => miniClockFace(240, 0) },
      { id: 'sched-daily-evening', name: 'Taeglich 20 Uhr', desc: 'Abends', cron: '0 20 * * *',
        visual: () => miniClockFace(600, 0) },
      { id: 'sched-weekly', name: 'Woechentlich (Mo)', desc: 'Montag 8 Uhr', cron: '0 8 * * 1',
        visual: () => miniWeekStrip(0) },
      { id: 'sched-monthly', name: 'Monatlich (1.)', desc: '1. des Monats', cron: '0 8 1 * *',
        visual: () => miniCalendar(1) },
    ]
  },
  {
    id: 'notify', name: 'Melden', icon: '\uD83D\uDD14',
    blocks: [
      { id: 'notify-telegram', name: 'Telegram', desc: 'Bot-Nachricht',
        fields: [{ name: 'bot_token', label: 'Bot Token', placeholder: '123456:ABC-DEF...' }, { name: 'chat_id', label: 'Chat ID', placeholder: '-100123456789' }],
        visual: miniTelegram },
      { id: 'notify-discord', name: 'Discord', desc: 'Webhook',
        fields: [{ name: 'webhook_url', label: 'Webhook URL', type: 'url' }],
        visual: miniDiscord },
      { id: 'notify-slack', name: 'Slack', desc: 'Webhook',
        fields: [{ name: 'webhook_url', label: 'Webhook URL', type: 'url' }],
        visual: miniSlack },
      { id: 'notify-email', name: 'Email (SMTP)', desc: 'Email senden',
        fields: [{ name: 'to', label: 'Empfaenger', placeholder: 'user@example.com' }, { name: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' }],
        visual: miniEmailCard },
      { id: 'notify-webhook', name: 'Webhook', desc: 'HTTP POST',
        fields: [{ name: 'url', label: 'URL', type: 'url' }],
        visual: miniWebhook },
      { id: 'notify-matrix', name: 'Matrix', desc: 'Matrix-Raum',
        fields: [{ name: 'room', label: 'Room', placeholder: '#alerts:matrix.org' }],
        visual: miniMatrix },
      { id: 'notify-silence', name: 'Stille-Bestaetigung', desc: '"Alles ruhig"',
        visual: miniSilence },
    ]
  },
  {
    id: 'actions', name: 'Dann', icon: '\u26A1',
    blocks: [
      { id: 'act-webhook', name: 'Webhook aufrufen', desc: 'HTTP POST',
        fields: [{ name: 'url', label: 'URL', type: 'url' }, { name: 'body', label: 'Body', type: 'textarea' }],
        visual: miniWebhook },
      { id: 'act-github-issue', name: 'GitHub Issue', desc: 'Issue erstellen',
        fields: [{ name: 'repo', label: 'Repo', placeholder: 'user/repo' }, { name: 'title', label: 'Titel' }],
        visual: miniGhIssue },
      { id: 'act-github-pr', name: 'GitHub PR', desc: 'Pull Request erstellen',
        fields: [{ name: 'repo', label: 'Repo' }, { name: 'branch', label: 'Branch' }],
        visual: miniGhPr },
      { id: 'act-github-comment', name: 'GitHub Comment', desc: 'Kommentar hinzufuegen',
        fields: [{ name: 'repo', label: 'Repo' }, { name: 'issue', label: 'Issue/PR Nr.' }],
        visual: miniGhComment },
      { id: 'act-shell', name: 'Shell-Befehl', desc: 'Command ausfuehren',
        fields: [{ name: 'command', label: 'Befehl', placeholder: 'echo "done"' }],
        visual: () => miniTerminal('echo "done"') },
      { id: 'act-s3', name: 'Nach S3 pushen', desc: 'Daten in S3-Bucket',
        fields: [{ name: 'bucket', label: 'Bucket' }, { name: 'key', label: 'Key' }],
        visual: miniCloudUpload },
      { id: 'act-publish', name: 'API veroeffentlichen', desc: 'JSON auf Pages',
        fields: [{ name: 'path', label: 'Pfad', placeholder: '/data.json' }],
        visual: miniPublishApi },
      { id: 'act-trigger', name: 'Nano-Zyrkel triggern', desc: 'Anderes Projekt',
        fields: [{ name: 'repo', label: 'Repo' }],
        visual: miniChainTrigger },
      { id: 'act-cf-worker', name: 'Cloudflare Worker', desc: 'Worker aufrufen',
        fields: [{ name: 'worker_url', label: 'Worker URL', type: 'url' }],
        visual: miniCfWorker },
    ]
  },
  {
    id: 'gui', name: 'Design', icon: '\uD83C\uDFA8',
    blocks: [
      { id: 'theme-clinical', name: 'Clinical', desc: 'Medizinisch, blau/weiss',
        colors: { bg: '#ffffff', accent: '#2563eb', card: '#f8fafc', text: '#0f172a', textDim: '#475569' },
        visual: () => miniDashboardTheme('#ffffff', '#2563eb', '#f0f4ff') },
      { id: 'theme-dashboard', name: 'Dashboard', desc: 'Dunkel, Neon',
        colors: { bg: '#0f172a', accent: '#22d3ee', card: '#1e293b', text: '#e2e8f0', textDim: '#94a3b8' },
        visual: () => miniDashboardTheme('#0f172a', '#22d3ee', '#1e293b') },
      { id: 'theme-magazine', name: 'Magazine', desc: 'Editorial, warm',
        colors: { bg: '#fefce8', accent: '#b45309', card: '#fffbeb', text: '#1c1917', textDim: '#78716c' },
        visual: () => miniDashboardTheme('#fefce8', '#b45309', '#fff7d6') },
      { id: 'theme-minimal', name: 'Minimal', desc: 'Schwarz/Weiss',
        colors: { bg: '#ffffff', accent: '#000000', card: '#f5f5f5', text: '#000', textDim: '#666' },
        visual: () => miniDashboardTheme('#ffffff', '#000000', '#f0f0f0') },
      { id: 'theme-cinematic', name: 'Cinematic', desc: 'Dunkel, Gradient',
        colors: { bg: '#0a0a0a', accent: '#ec4899', card: '#171717', text: '#fafafa', textDim: '#a1a1aa' },
        visual: () => miniDashboardTheme('#0a0a0a', '#ec4899', '#1a1a1a') },
      { id: 'theme-multipage', name: 'Multipage', desc: 'Mit Navigation',
        colors: { bg: '#f8fafc', accent: '#8b5cf6', card: '#ffffff', text: '#0f172a', textDim: '#64748b' },
        visual: () => miniDashboardTheme('#f8fafc', '#8b5cf6', '#ffffff') },
      { id: 'theme-report', name: 'Report', desc: 'Formal, strukturiert',
        colors: { bg: '#ffffff', accent: '#475569', card: '#f1f5f9', text: '#0f172a', textDim: '#64748b' },
        visual: () => miniDashboardTheme('#ffffff', '#475569', '#f1f5f9') },
      { id: 'theme-cardgrid', name: 'Card Grid', desc: 'Karten-Layout',
        colors: { bg: '#0b0d12', accent: '#8b5cf6', card: '#161a24', text: '#e2e8f0', textDim: '#94a3b8' },
        visual: () => miniDashboardTheme('#0b0d12', '#8b5cf6', '#161a24') },
    ]
  },
  {
    id: 'compute', name: 'Berechnung', icon: '\u2699\uFE0F',
    blocks: [
      { id: 'feat-data', name: 'DataLoader + Filter', desc: 'Laden, Filtern, Aggregieren', wasmFeature: 'data',
        visual: () => miniJson(`<span class="key">"filter"</span>: <span class="str">"gene=TP53"</span><br><span class="key">"rows"</span>: <span class="num">4,412,108</span>`) },
      { id: 'feat-viz-basic', name: 'Charts (Line / Bar / Donut)', desc: 'Basis-Visualisierungen', wasmFeature: 'viz-basic',
        visual: () => miniLineChart('#8B5CF6') },
      { id: 'feat-viz-advanced', name: 'Charts (Heatmap / Scatter)', desc: 'Erweiterte Visualisierungen', wasmFeature: 'viz-advanced',
        visual: miniHeatmap },
      { id: 'feat-viz-spatial', name: 'Genom-Tracks + Karten', desc: 'LinearTrack, WorldMap', wasmFeature: 'viz-spatial',
        visual: miniGenomTracks },
      { id: 'feat-network', name: 'Netzwerk-Graph', desc: 'Force-directed Graphen', wasmFeature: 'viz-spatial',
        visual: miniNetwork },
      { id: 'feat-survival', name: 'Survival-Kurven', desc: 'Kaplan-Meier', wasmFeature: 'viz-advanced',
        visual: miniSurvival },
      { id: 'feat-plugin', name: 'Custom Rust Plugin', desc: 'Eigene Logik, WASM',
        visual: miniRustCode },
    ]
  }
];

// Flat lookup
const BLOCK_MAP = {};
CATEGORIES.forEach(cat => cat.blocks.forEach(b => { b.category = cat.id; BLOCK_MAP[b.id] = b; }));

// ─── STATE ───────────────────────────────────────────────────

const state = {
  activeCategory: 'showcase',
  blocks: [],
  blockConfig: {},
  design: null,
  title: 'Mein nano-zyrkel',
  codeVisible: false,
  activeTab: 'config',
  zyrkelPort: null,
  chatOpen: false,
};

// ─── DOM REFS ────────────────────────────────────────────────

const $dropBtn = document.getElementById('bk-dropdown-btn');
const $dropWrap = document.getElementById('bk-dropdown-wrap');
const $dropList = document.getElementById('bk-dropdown-list');
const $dropIcon = document.getElementById('bk-dropdown-icon');
const $dropText = document.getElementById('bk-dropdown-text');
const $dropCount = document.getElementById('bk-dropdown-count');
const $grid = document.getElementById('baukasten-grid');
const $searchInput = document.getElementById('search-input');
const $canvas = document.getElementById('preview-canvas');
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

// ─── HELPERS ─────────────────────────────────────────────────

function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function blocksOfType(prefix) {
  return state.blocks.filter(id => id.startsWith(prefix));
}

function getDesignBlock() {
  if (!state.design) return null;
  return BLOCK_MAP[state.design];
}

function getThemeColors() {
  const d = getDesignBlock();
  if (d && d.colors) return d.colors;
  return { bg: '#0b0d12', accent: '#8B5CF6', card: '#161a24', text: '#e2e8f0', textDim: '#94a3b8' };
}

// ─── DROPDOWN ────────────────────────────────────────────────

function updateDropdownButton() {
  const cat = CATEGORIES.find(c => c.id === state.activeCategory);
  if (!cat) return;
  $dropIcon.textContent = cat.icon;
  $dropText.textContent = cat.name;
  const inUseCount = cat.blocks.filter(b => state.blocks.includes(b.id)).length;
  $dropCount.textContent = inUseCount > 0 ? String(inUseCount) : '';
}

function renderDropdownList() {
  $dropList.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const inUseCount = cat.blocks.filter(b => state.blocks.includes(b.id)).length;
    const item = document.createElement('div');
    item.className = 'bk-dropdown-item' + (cat.id === state.activeCategory ? ' active' : '');
    item.innerHTML = `
      <span class="bk-dropdown-item-icon">${cat.icon}</span>
      <span class="bk-dropdown-item-name">${cat.name}</span>
      <span class="bk-dropdown-item-count${inUseCount > 0 ? ' has-items' : ''}">${inUseCount > 0 ? inUseCount : cat.blocks.length}</span>
    `;
    item.addEventListener('click', () => {
      state.activeCategory = cat.id;
      closeDropdown();
      updateDropdownButton();
      renderGrid();
    });
    $dropList.appendChild(item);
  });
}

function openDropdown() {
  renderDropdownList();
  $dropList.classList.remove('hidden');
  $dropWrap.classList.add('open');
}

function closeDropdown() {
  $dropList.classList.add('hidden');
  $dropWrap.classList.remove('open');
}

$dropBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if ($dropList.classList.contains('hidden')) openDropdown();
  else closeDropdown();
});

document.addEventListener('click', (e) => {
  if (!$dropWrap.contains(e.target)) closeDropdown();
});

// ─── CATALOG GRID ────────────────────────────────────────────

function renderGrid() {
  $grid.innerHTML = '';
  const cat = CATEGORIES.find(c => c.id === state.activeCategory);
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
    card.addEventListener('click', () => { if (!inUse) addBlock(block.id); });
    $grid.appendChild(card);
  });
}

$searchInput.addEventListener('input', () => {
  const q = $searchInput.value.toLowerCase().trim();
  if (q.length === 0) { renderGrid(); return; }
  $grid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    cat.blocks.forEach(block => {
      const text = (block.name + ' ' + block.desc + ' ' + cat.name).toLowerCase();
      if (!text.includes(q)) return;
      const inUse = state.blocks.includes(block.id);
      const card = document.createElement('div');
      card.className = 'vcard' + (inUse ? ' in-use' : '');
      card.innerHTML = `
        <div class="vcard-visual">${block.visual ? block.visual() : ''}</div>
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

  // Starter templates: set design + auto-add sub-blocks
  if (block.starter) {
    if (block.design) state.design = block.design;
    if (!state.blocks.includes(blockId)) {
      state.blocks.push(blockId);
      state.blockConfig[blockId] = {};
    }
    (block.autoBlocks || []).forEach(subId => {
      if (!state.blocks.includes(subId)) {
        state.blocks.push(subId);
        state.blockConfig[subId] = {};
      }
    });
    state.title = block.name;
  }
  // Theme blocks: set design
  else if (blockId.startsWith('theme-')) {
    // Remove previous theme
    state.blocks = state.blocks.filter(id => !id.startsWith('theme-'));
    state.blocks.push(blockId);
    state.blockConfig[blockId] = {};
    state.design = blockId;
  }
  // Schedule blocks: only one allowed
  else if (blockId.startsWith('sched-')) {
    state.blocks = state.blocks.filter(id => !id.startsWith('sched-'));
    state.blocks.push(blockId);
    state.blockConfig[blockId] = {};
  }
  // Everything else
  else {
    state.blocks.push(blockId);
    state.blockConfig[blockId] = {};
  }

  renderAll();
}

function removeBlock(blockId) {
  state.blocks = state.blocks.filter(id => id !== blockId);
  delete state.blockConfig[blockId];
  if (state.design === blockId) state.design = null;
  if (blockId.startsWith('start-')) state.title = 'Mein nano-zyrkel';
  renderAll();
}
window.removeBlock = removeBlock;

function updateFieldValue(blockId, fieldName, value) {
  if (!state.blockConfig[blockId]) state.blockConfig[blockId] = {};
  state.blockConfig[blockId][fieldName] = value;
  renderPreview();
  if (state.codeVisible) renderCodeDrawer();
}
window.updateFieldValue = updateFieldValue;

function updateTitle(newTitle) {
  state.title = newTitle || 'Mein nano-zyrkel';
  if (state.codeVisible) renderCodeDrawer();
}
window.updateTitle = updateTitle;

// ─── RENDER ALL ──────────────────────────────────────────────

function renderAll() {
  updateDropdownButton();
  renderGrid();
  renderPreview();
  if (state.codeVisible) renderCodeDrawer();
}

// ─── LIVE PREVIEW: The Product Canvas ────────────────────────

function renderPreview() {
  if (state.blocks.length === 0) {
    renderEmptyState();
    return;
  }
  const colors = getThemeColors();
  // Apply theme as CSS variables on canvas
  $canvas.style.setProperty('--pv-bg', colors.bg);
  $canvas.style.setProperty('--pv-accent', colors.accent);
  $canvas.style.setProperty('--pv-card', colors.card);
  $canvas.style.setProperty('--pv-text', colors.text);
  $canvas.style.setProperty('--pv-text-dim', colors.textDim);

  renderDashboardPreview();
}

function renderEmptyState() {
  $canvas.innerHTML = `
    <div class="pv-empty">
      <div class="pv-empty-icon">&#x2B21;</div>
      <h2>Starte mit einer Vorlage</h2>
      <p>Waehle links im Dropdown <b>Start</b> und klicke eine Vorlage an — oder baue deinen nano-zyrkel Baustein fuer Baustein aus den anderen Kategorien zusammen.</p>
    </div>
  `;
}

function renderDashboardPreview() {
  const sources = blocksOfType('src-');
  const conditions = blocksOfType('cond-');
  const schedules = blocksOfType('sched-');
  const notifies = blocksOfType('notify-');
  const actions = blocksOfType('act-');
  const computes = blocksOfType('feat-');

  const schedLabel = schedules.length > 0 ? BLOCK_MAP[schedules[0]].name : null;

  let html = `<div class="pv-dashboard">`;

  // Header
  html += `
    <div class="pv-dash-header">
      <div class="pv-dash-header-left">
        <span class="pv-dash-header-hex">&#x2B21;</span>
        <input class="pv-dash-title-input" type="text" value="${escHtml(state.title)}"
          oninput="updateTitle(this.value); document.querySelectorAll('.pv-dash-title-input').forEach(i=>{ if(i!==this) i.value=this.value })"
          placeholder="Mein nano-zyrkel">
      </div>
      ${schedLabel ? `<div class="pv-dash-schedule">&#9200; ${escHtml(schedLabel)}</div>` : '<div class="pv-dash-schedule" style="opacity:0.4;">Kein Zeitplan</div>'}
    </div>
  `;

  html += `<div class="pv-dash-body">`;

  // Row 1: Source(s) and Compute/Charts
  html += `<div class="pv-slot-grid">`;
  html += renderSourceSlot(sources);
  html += renderChartsSlot(computes);
  html += `</div>`;

  // Row 2: Condition and Action
  if (conditions.length > 0 || actions.length > 0) {
    html += `<div class="pv-slot-grid">`;
    html += renderConditionSlot(conditions);
    html += renderActionSlot(actions);
    html += `</div>`;
  } else {
    html += `<div class="pv-slot-grid">`;
    html += renderConditionSlot([]);
    html += renderActionSlot([]);
    html += `</div>`;
  }

  // Notifications
  html += renderNotifySection(notifies, sources, conditions, schedules);

  html += `</div></div>`; // close body, dashboard

  $canvas.innerHTML = html;

  // Wire up field inputs
  $canvas.querySelectorAll('.pv-field-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      updateFieldValue(e.target.dataset.blockId, e.target.dataset.field, e.target.value);
    });
  });
}

function renderSlotEmpty(label, hint) {
  return `
    <div class="pv-slot">
      <span class="pv-slot-label">${label}</span>
      <div class="pv-slot-hint">${hint}</div>
    </div>
  `;
}

function renderFilledHeader(typeLabel, blockId, blockName) {
  return `
    <div class="pv-filled-header">
      <div>
        <span class="pv-filled-type">${typeLabel}</span>
        <span class="pv-filled-name">${escHtml(blockName)}</span>
      </div>
      <button class="pv-filled-remove" onclick="removeBlock('${blockId}')" title="Entfernen">&times;</button>
    </div>
  `;
}

function renderFields(blockId, block) {
  if (!block.fields || block.fields.length === 0) return '';
  const config = state.blockConfig[blockId] || {};
  return `<div class="pv-fields">
    ${block.fields.map(f => {
      const val = config[f.name] || '';
      if (f.type === 'select') {
        return `<label class="pv-field">
          <span class="pv-field-label">${f.label}</span>
          <select class="pv-field-input" data-block-id="${blockId}" data-field="${f.name}">
            ${(f.options || []).map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </label>`;
      }
      if (f.type === 'textarea') {
        return `<label class="pv-field">
          <span class="pv-field-label">${f.label}</span>
          <textarea class="pv-field-input" data-block-id="${blockId}" data-field="${f.name}" placeholder="${escHtml(f.placeholder || '')}">${escHtml(val)}</textarea>
        </label>`;
      }
      return `<label class="pv-field">
        <span class="pv-field-label">${f.label}</span>
        <input class="pv-field-input" type="${f.type || 'text'}" data-block-id="${blockId}" data-field="${f.name}" value="${escHtml(val)}" placeholder="${escHtml(f.placeholder || '')}">
      </label>`;
    }).join('')}
  </div>`;
}

function renderSourceSlot(sourceIds) {
  if (sourceIds.length === 0) {
    return renderSlotEmpty('Datenquelle', 'Waehle &#128225; <b>Quellen</b> im Dropdown');
  }
  return sourceIds.map(id => {
    const block = BLOCK_MAP[id];
    const visualHtml = block.visual ? block.visual() : '';
    return `
      <div class="pv-slot filled">
        ${renderFilledHeader('Datenquelle', id, block.name)}
        <div class="pv-filled-body">
          <div class="pv-filled-visual">${visualHtml}</div>
          ${renderFields(id, block)}
        </div>
      </div>
    `;
  }).join('');
}

function renderConditionSlot(condIds) {
  if (condIds.length === 0) {
    return renderSlotEmpty('Wenn (Bedingung)', 'Waehle &#128269; <b>Wenn</b> im Dropdown');
  }
  return condIds.map(id => {
    const block = BLOCK_MAP[id];
    const visualHtml = block.visual ? block.visual() : '';
    return `
      <div class="pv-slot filled">
        ${renderFilledHeader('Bedingung', id, block.name)}
        <div class="pv-filled-body">
          <div class="pv-filled-visual">${visualHtml}</div>
          ${renderFields(id, block)}
        </div>
      </div>
    `;
  }).join('');
}

function renderActionSlot(actionIds) {
  if (actionIds.length === 0) {
    return renderSlotEmpty('Dann (Aktion)', 'Waehle &#9889; <b>Dann</b> im Dropdown (optional)');
  }
  return actionIds.map(id => {
    const block = BLOCK_MAP[id];
    const visualHtml = block.visual ? block.visual() : '';
    return `
      <div class="pv-slot filled">
        ${renderFilledHeader('Aktion', id, block.name)}
        <div class="pv-filled-body">
          <div class="pv-filled-visual">${visualHtml}</div>
          ${renderFields(id, block)}
        </div>
      </div>
    `;
  }).join('');
}

function renderChartsSlot(computeIds) {
  if (computeIds.length === 0) {
    return renderSlotEmpty('Visualisierung / Berechnung', 'Waehle &#9881;&#65039; <b>Berechnung</b> im Dropdown');
  }
  return computeIds.map(id => {
    const block = BLOCK_MAP[id];
    const visualHtml = block.visual ? block.visual() : '';
    return `
      <div class="pv-slot filled">
        ${renderFilledHeader('Berechnung', id, block.name)}
        <div class="pv-filled-body">
          <div class="pv-chart-large">${visualHtml}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderNotifySection(notifyIds, sources, conditions, schedules) {
  if (notifyIds.length === 0) {
    return `
      <div class="pv-notify-section">
        <div class="pv-notify-title">&#128276; Benachrichtigungen</div>
        <div class="pv-slot">
          <span class="pv-slot-label">Benachrichtigungen</span>
          <div class="pv-slot-hint">Waehle &#128276; <b>Melden</b> im Dropdown</div>
        </div>
      </div>
    `;
  }

  const srcUrl = getFirstSourceUrl();
  const condText = getFirstConditionText();
  const schedLabel = schedules.length > 0 ? BLOCK_MAP[schedules[0]].name : 'stuendlich';

  return `
    <div class="pv-notify-section">
      <div class="pv-notify-title">&#128276; Benachrichtigungen</div>
      <div class="pv-notify-grid">
        ${notifyIds.map(id => renderNotifyCard(id, srcUrl, condText, schedLabel)).join('')}
      </div>
    </div>
  `;
}

function renderNotifyCard(notifyId, srcUrl, condText, schedLabel) {
  const block = BLOCK_MAP[notifyId];
  const now = new Date();
  const timeStr = now.toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

  let inner = '';
  if (notifyId === 'notify-telegram') {
    inner = `
      <div class="pv-ntf-tg-bubble">
        &#128276; <b>Aenderung erkannt!</b><br>
        Die Seite ${escHtml(srcUrl || 'https://...')} enthaelt jetzt "${escHtml(condText)}".
        <div class="pv-ntf-tg-time">${timeStr}</div>
      </div>
    `;
  } else if (notifyId === 'notify-discord') {
    inner = `
      <div class="pv-ntf-discord-header">
        <div class="pv-ntf-discord-avatar"></div>
        <div class="pv-ntf-discord-name">nano-zyrkel BOT</div>
      </div>
      <div class="pv-ntf-discord-embed">
        <b>Aenderung erkannt!</b><br>
        Seite: ${escHtml(srcUrl || '...')}<br>
        Bedingung: "${escHtml(condText)}"<br>
        <span style="color:#72767d; font-size:11px;">${timeStr}</span>
      </div>
    `;
  } else if (notifyId === 'notify-slack') {
    inner = `
      <div class="pv-ntf-slack-avatar"></div>
      <div class="pv-ntf-slack-body">
        <div class="pv-ntf-slack-name">nano-zyrkel</div>
        &#128276; *Aenderung erkannt!*<br>
        &gt; ${escHtml(srcUrl || '...')}<br>
        &gt; "${escHtml(condText)}"
      </div>
    `;
  } else if (notifyId === 'notify-email') {
    inner = `
      <div class="pv-ntf-email-subject">Aenderung erkannt auf ${escHtml(srcUrl || '...')}</div>
      <div class="pv-ntf-email-body">Hallo,

dein Tracker hat eine Aenderung erkannt:

  Seite: ${escHtml(srcUrl || '...')}
  Bedingung: "${escHtml(condText)}"
  Zeit: ${timeStr}

Viele Gruesse,
dein nano-zyrkel</div>
    `;
  } else if (notifyId === 'notify-webhook') {
    inner = `POST ${escHtml((state.blockConfig[notifyId] || {}).url || 'https://...')}
{
  "event": "change_detected",
  "source": "${escHtml(srcUrl || '...')}",
  "condition": "${escHtml(condText)}",
  "time": "${timeStr}"
}`;
  } else if (notifyId === 'notify-matrix') {
    inner = `
      <b>#${escHtml((state.blockConfig[notifyId] || {}).room || 'alerts:matrix.org')}</b><br>
      &#128276; Aenderung erkannt auf ${escHtml(srcUrl || '...')}<br>
      Bedingung: ${escHtml(condText)}
    `;
  } else if (notifyId === 'notify-silence') {
    inner = `
      <div style="font-size:22px; margin-bottom:6px;">&#9989;</div>
      <div style="font-weight:600; margin-bottom:4px;">Alles ruhig</div>
      <div style="font-size:12px; color:var(--text-muted);">
        Letzte Pruefung: ${timeStr}<br>
        Dein Tracker laeuft.
      </div>
    `;
  }

  const clsMap = {
    'notify-telegram': 'pv-notify-telegram',
    'notify-discord': 'pv-notify-discord',
    'notify-slack': 'pv-notify-slack',
    'notify-email': 'pv-notify-email',
    'notify-webhook': 'pv-notify-webhook',
    'notify-matrix': 'pv-notify-matrix',
    'notify-silence': 'pv-notify-silence',
  };

  return `
    <div class="pv-notify-card ${clsMap[notifyId] || ''}">
      <button class="pv-filled-remove" onclick="removeBlock('${notifyId}')">&times;</button>
      <div class="pv-ntf-inner">${inner}</div>
    </div>
  `;
}

function getFirstSourceUrl() {
  for (const id of state.blocks) {
    if (id.startsWith('src-')) {
      const cfg = state.blockConfig[id] || {};
      return cfg.url || cfg.query || cfg.gene || cfg.repo || cfg.metric || cfg.bucket || cfg.host || 'https://example.com';
    }
  }
  return 'https://example.com';
}

function getFirstConditionText() {
  for (const id of state.blocks) {
    if (id.startsWith('cond-')) {
      const cfg = state.blockConfig[id] || {};
      if (id === 'cond-contains') return cfg.value || 'freie Plaetze';
      if (id === 'cond-llm') return cfg.question || 'KI-Bedingung erfuellt';
      if (id === 'cond-css') return cfg.selector || '.selector';
      if (id === 'cond-json') return (cfg.path || '$.status') + ' == ' + (cfg.value || 'open');
      if (id === 'cond-regex') return cfg.regex || 'Preis: \\d+';
      if (id === 'cond-threshold') return (cfg.path || 'Wert') + ' ' + (cfg.operator || '>') + ' ' + (cfg.value || '0');
      const block = BLOCK_MAP[id];
      return block ? block.name : 'Bedingung erfuellt';
    }
  }
  return 'Aenderung erkannt';
}

// ─── CRON / SCHEDULE ─────────────────────────────────────────

function getActiveCron() {
  for (const id of state.blocks) {
    if (id.startsWith('sched-')) {
      return BLOCK_MAP[id].cron;
    }
  }
  return '0 * * * *';
}

// ─── CODE GENERATION ─────────────────────────────────────────

function generateConfig() {
  const config = {
    name: state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mein-nano-zyrkel',
    description: state.title,
    version: '1.0.0',
    hats: {}
  };
  const sources = [];
  const conditions = [];
  const notifications = [];
  const actions = [];
  const wasmFeatures = [];

  state.blocks.forEach(id => {
    const block = BLOCK_MAP[id];
    const cfg = state.blockConfig[id] || {};
    if (!block) return;

    if (id.startsWith('src-')) sources.push({ type: id.replace('src-', ''), ...cfg });
    else if (id.startsWith('cond-')) conditions.push({ type: id.replace('cond-', ''), ...cfg });
    else if (id.startsWith('notify-')) notifications.push({ type: id.replace('notify-', ''), ...cfg });
    else if (id.startsWith('act-')) actions.push({ type: id.replace('act-', ''), ...cfg });
    else if (id.startsWith('feat-') && block.wasmFeature) wasmFeatures.push(block.wasmFeature);
  });

  const cron = getActiveCron();
  if (sources.length) config.hats.sources = sources;
  if (conditions.length) config.hats.conditions = conditions;
  if (cron) config.hats.schedule = { cron };
  if (notifications.length) config.hats.notifications = notifications;
  if (actions.length) config.hats.actions = actions;
  if (state.design) {
    const theme = BLOCK_MAP[state.design];
    if (theme) config.hats.theme = { id: state.design.replace('theme-', ''), colors: theme.colors };
  }
  if (wasmFeatures.length) config.hats.wasm_features = [...new Set(wasmFeatures)];

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
  return `# ${state.title}

Ein autonomer nano-zyrkel Agent, erstellt mit dem nano-zyrkel Project Studio.

## Was er tut

${getReadmeDescription()}

## Deploy

1. Repository auf GitHub erstellen
2. Diese Dateien hineinladen: \`hats/config.json\`, \`.github/workflows/run.yml\`
3. Unter Settings > Secrets die benoetigten Tokens eintragen
4. GitHub Actions aktivieren — der Agent laeuft automatisch nach dem Zeitplan
`;
}

function getReadmeDescription() {
  const parts = [];
  blocksOfType('src-').forEach(id => parts.push('- Quelle: ' + BLOCK_MAP[id].name));
  blocksOfType('cond-').forEach(id => parts.push('- Bedingung: ' + BLOCK_MAP[id].name));
  blocksOfType('sched-').forEach(id => parts.push('- Zeitplan: ' + BLOCK_MAP[id].name));
  blocksOfType('notify-').forEach(id => parts.push('- Benachrichtigung: ' + BLOCK_MAP[id].name));
  blocksOfType('act-').forEach(id => parts.push('- Aktion: ' + BLOCK_MAP[id].name));
  return parts.join('\n') || 'Keine Konfiguration';
}

// ─── CODE DRAWER ─────────────────────────────────────────────

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

// ─── ZYRKEL DETECTION ────────────────────────────────────────

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

// ─── LLM CHAT ────────────────────────────────────────────────

$chatFab.addEventListener('click', () => {
  state.chatOpen = !state.chatOpen;
  $chatOverlay.classList.toggle('hidden', !state.chatOpen);
  if (state.chatOpen && $chatMessages.children.length === 0) {
    appendChatMsg('assistant', 'Hi! Beschreibe was du bauen willst — z.B. "Ueberwache den Schwimmkurs" oder "Tracke ClinVar-Varianten". Ich fuege die passenden Bausteine hinzu.');
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
          system: 'Du bist der nano-zyrkel Builder-Assistent. Wenn du ein Konfigurationsfeld bestimmst, bette es so ein: <!-- ADD:blockId --> fuer jeden Baustein. Verfuegbare Blocks: ' + Object.keys(BLOCK_MAP).join(', ')
        })
      });
      const data = await res.json();
      const response = data.response || data.message || '';
      parseAndApplyFields(response);
      appendChatMsg('assistant', response.replace(/<!-- ADD:[^>]+-->/g, '').trim() || 'Ok!');
    } catch (e) {
      appendChatMsg('assistant', 'Zyrkel nicht erreichbar. Nutze den Katalog links.');
    }
  } else {
    // Offline fallback: keyword matching
    const reply = offlineChatReply(msg);
    appendChatMsg('assistant', reply);
  }
}

function parseAndApplyFields(text) {
  const regex = /<!--\s*ADD:([^\s>]+)\s*-->/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const blockId = match[1].trim();
    if (BLOCK_MAP[blockId]) addBlock(blockId);
  }
}

function offlineChatReply(msg) {
  const m = msg.toLowerCase();
  const added = [];
  const tryAdd = (id) => { if (BLOCK_MAP[id] && !state.blocks.includes(id)) { addBlock(id); added.push(BLOCK_MAP[id].name); } };

  if (m.includes('schwimm') || m.includes('kurs') || m.includes('webseite') || m.includes('ueberwache') || m.includes('url')) {
    tryAdd('start-watcher');
    return 'Habe den Webseiten-Watcher gestartet: ' + added.join(', ');
  }
  if (m.includes('clinvar') || m.includes('variante') || m.includes('tracker') || m.includes('daten')) {
    tryAdd('start-tracker');
    return 'Habe den Daten-Tracker gestartet: ' + added.join(', ');
  }
  if (m.includes('email') || m.includes('mail')) {
    tryAdd('start-mailbot');
    return 'Habe den Email-Agent gestartet: ' + added.join(', ');
  }
  if (m.includes('pubmed') || m.includes('literatur') || m.includes('forschung')) {
    tryAdd('start-alert');
    return 'Habe den Literatur-Alert gestartet: ' + added.join(', ');
  }
  if (m.includes('dashboard') || m.includes('chart') || m.includes('visuali')) {
    tryAdd('theme-dashboard');
    tryAdd('feat-viz-basic');
    return 'Habe Dashboard-Theme und Charts hinzugefuegt: ' + added.join(', ');
  }
  return 'Ich kann verschiedene Vorlagen starten: Webseiten-Watcher, Daten-Tracker, Email-Agent, Literatur-Alert. Probier einen Begriff davon.';
}

$chatSend.addEventListener('click', sendChatMessage);
$chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });

// ─── INIT ────────────────────────────────────────────────────

function init() {
  updateDropdownButton();
  renderGrid();
  renderEmptyState();
  detectZyrkel();
}

init();
