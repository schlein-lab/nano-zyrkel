# theme-multipage

Sidebar layout for nano-zyrkels with many sections. Designed to pair
with the [`Router`](../../../crates/wasm-core/src/data/router.rs) from
`nano-zyrkel-wasm-core` so hash-based navigation just works.

## Use it

```bash
cp -r theme-multipage/docs/* my-nano/docs/
```

## Wire the router from `app.js`

```js
import init, { Router } from './core/wasm/profile/nano_zyrkel_wasm_core.js';
await init();

const router = new Router();
router.on('/',           () => render_home());
router.on('/genes',      () => render_genes());
router.on('/gene/:id',   p  => render_gene_detail(p.id));
router.start();
```

## Variables

| Variable      | Default     | Purpose                            |
| ------------- | ----------- | ---------------------------------- |
| `--brand`     | `#8B5CF6`   | Sidebar accent + active nav state  |
| `--sidebar-w` | `240px`     | Sidebar width                      |
| `--bg`        | `#FFFFFF`   | Page background                    |
| `--text`      | `#111827`   | Body text                          |
| `--muted`     | `#6B7280`   | Secondary text                     |
