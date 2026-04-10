// scaffold-showcase — JavaScript glue
//
// Reads hats/config.json via the WASM ConfigReader and renders one
// card per entry in the `widgets` array. No binary, no cron — pure
// browser app powered by the WASM core.

import init, {
  install_panic_hook,
  ConfigReader,
} from '../core/wasm/profile/nano_zyrkel_wasm_core.js';

await init();
install_panic_hook();

const cfg = await ConfigReader.load('hats/config.json');
document.getElementById('title').textContent = cfg.id();
document.getElementById('subtitle').textContent = cfg.description();

const widgets = cfg.get('widgets') ?? [];
const cards = document.getElementById('cards');

for (const widget of widgets) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h3>${widget.title ?? widget.id ?? 'Untitled'}</h3>
    <p>${widget.subtitle ?? widget.description ?? ''}</p>
    <a href="${widget.url ?? '#'}" target="_blank" rel="noopener">Open →</a>
  `;
  if (widget.color) {
    card.style.borderColor = widget.color + '55';
  }
  cards.appendChild(card);
}
