# theme-card-grid

Responsive grid layout with image, title, tags and body per card.
Use it for showcases that need more than two or three items —
literature digests, gene catalogs, dataset previews, project lists.

## Use it

```bash
cp -r theme-card-grid/docs/* my-nano/docs/
```

## Wire data from `app.js`

```js
import init, { DataLoader } from './core/wasm/profile/nano_zyrkel_wasm_core.js';
await init();

const data = await new DataLoader().fetch('staging/cards.json');
const grid = document.getElementById('grid');
grid.innerHTML = data.map(card => `
  <article class="nz-card">
    ${card.image ? `<div class="image" style="background-image:url('${card.image}');"></div>` : ''}
    <div class="body">
      <h3>${card.title}</h3>
      <p>${card.description}</p>
      <div class="tags">${(card.tags ?? []).map(t => `<span>${t}</span>`).join('')}</div>
    </div>
  </article>
`).join('');
```
