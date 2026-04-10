// scaffold-newsletter — JavaScript glue
//
// Loads the most recent digest snapshot, renders it via Markdown,
// and lists the archive of past issues.

import init, {
  install_panic_hook,
  ConfigReader, DataLoader, Markdown, DateTime,
} from './core/wasm/profile/nano_zyrkel_wasm_core.js';

await init();
install_panic_hook();

const cfg = await ConfigReader.load('hats/config.json').catch(() => null);
const id = cfg?.id() ?? 'newsletter';

const loader = new DataLoader();

// Latest issue.
const latest = await loader.fetch(`staging/${id}/latest.json`).catch(() => null);
if (latest) {
  document.getElementById('issue-body').innerHTML = Markdown.toHtml(
    latest.body ?? '_(empty issue)_'
  );
} else {
  document.getElementById('issue-body').textContent = 'No issue published yet.';
}

// Archive.
const archive = await loader.fetch(`staging/${id}/archive.json`).catch(() => null);
if (Array.isArray(archive)) {
  const ul = document.getElementById('archive');
  ul.innerHTML = archive
    .slice()
    .reverse()
    .map(entry => `
      <li>
        <a href="${entry.url}">${entry.title}</a>
        — ${DateTime.toDate(Date.parse(entry.published))}
      </li>
    `)
    .join('');
}
