// scaffold-monitor — JavaScript glue
//
// Reads the staging snapshot the binary writes after every cron tick
// and renders three KPI cards plus a recent-events table.

import init, {
  install_panic_hook,
  ConfigReader, DataLoader, DateTime, Format,
} from './core/wasm/profile/nano_zyrkel_wasm_core.js';

await init();
install_panic_hook();

const cfg = await ConfigReader.load('hats/config.json').catch(() => null);
if (cfg) document.documentElement.lang = cfg.lang() || 'en';

const id = cfg?.id() ?? 'monitor';
const loader = new DataLoader();
const snapshot = await loader.fetch(`staging/${id}/latest.json`).catch(() => null);

if (snapshot) {
  const ok = !snapshot.matched;
  setCard('status-current', ok ? 'OK' : 'STALE', ok ? 'good' : 'bad');
  if (snapshot.checked_at) {
    setCard('status-checked', DateTime.toIso(Date.parse(snapshot.checked_at)));
  }
  if (snapshot.uptime_24h !== undefined) {
    setCard('status-uptime', Format.percent(snapshot.uptime_24h, 1));
  }

  const events = snapshot.events ?? [];
  const tbody = document.getElementById('events');
  tbody.innerHTML = events.map(e => `
    <tr>
      <td>${DateTime.toIso(Date.parse(e.when))}</td>
      <td>${e.state}</td>
      <td>${e.detail ?? ''}</td>
    </tr>
  `).join('');
}

function setCard(id, value, kind) {
  const el = document.querySelector(`#${id} .status-value`);
  if (!el) return;
  el.textContent = value;
  el.classList.remove('good', 'warn', 'bad');
  if (kind) el.classList.add(kind);
}
