# Chart cookbook

Copy-pasteable recipes for the visualization primitives in
`nano-zyrkel-wasm-core`. Every example lives under
[`templates/examples/`](../templates/examples) as a complete, runnable
HTML file.

## Foundation (always available)

| Type           | Example                                          |
| -------------- | ------------------------------------------------ |
| Time series    | [`example-time-series`](../templates/examples/example-time-series/index.html) |
| Overview cards | [`example-overview-cards`](../templates/examples/example-overview-cards/index.html) |
| Data table     | [`example-data-table`](../templates/examples/example-data-table/index.html) |

These need only the `viz-basic` feature of `wasm-core`.

## Spatial primitives

| Type           | Example                                          |
| -------------- | ------------------------------------------------ |
| Geographic map | [`example-geographic`](../templates/examples/example-geographic/index.html) |
| 1D coordinate  | [`example-genome-track`](../templates/examples/example-genome-track/index.html) |
| Network graph  | [`example-network-graph`](../templates/examples/example-network-graph/index.html) |

These need the `viz-spatial` feature of `wasm-core`.

## Pattern: bring data, point at a host element, draw

Every chart in this library follows the same shape:

```js
import init, {
  install_panic_hook, ChartCanvas, Padding, Scale,
  draw_y_grid, LineChart, Format,
} from './core/wasm/profile/nano_zyrkel_wasm_core.js';

await init();
install_panic_hook();

const canvas = new ChartCanvas(
  document.getElementById('chart'),
  220,
  new Padding(40, 12, 12, 28),
);

const yScale = Scale.linear(0, max, canvas.plotTop() + canvas.plotHeight(), canvas.plotTop());
draw_y_grid(canvas, yScale, 5, v => Format.fixed(v, 0));

new LineChart(canvas)
  .x(xScale).y(yScale)
  .data(points)
  .stroke('#8B5CF6', 2)
  .draw();
```

If you find yourself writing the same boilerplate twice in a single
nano-zyrkel, factor it into a small helper inside `docs/app.js` — it
does not need to live in the core.

## What's NOT in here

Domain-specific charts belong in your own repo, not in `wasm-core`:

- Particle systems and Star Wars-style intros — see the showcase repo.
- ACMG variant classification charts — see the vusTracker repo.
- Hardy-Weinberg, Punnett squares, pedigrees — see the helix repo.

The cookbook is intentionally generic so the patterns transfer.
