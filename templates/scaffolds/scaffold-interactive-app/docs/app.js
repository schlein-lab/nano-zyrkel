// scaffold-interactive-app — JavaScript glue
//
// All compute happens in the WASM core. This file just wires DOM
// elements to chart primitives and feeds them data loaded by the
// DataLoader. Replace the data path and chart configuration with
// whatever your nano-zyrkel needs — the imports below are stable
// across wasm-v1.x.x.

import init, {
  install_panic_hook,
  DataLoader, ConfigReader,
  ChartCanvas, Padding, Scale,
  draw_y_grid, draw_x_axis,
  LineChart, BarChart, Format,
} from '../core/wasm/profile/nano_zyrkel_wasm_core.js';

await init();
install_panic_hook();

// 1. Read the same hats/config.json the binary uses
const cfg = await ConfigReader.load('hats/config.json');
document.getElementById('title').textContent = cfg.id();
document.getElementById('subtitle').textContent = cfg.description();
const brand = cfg.brandingColor() ?? '#8B5CF6';

// 2. Load the snapshot the binary wrote during the last cron run
const loader = new DataLoader();
const data = await loader.fetch(`staging/${cfg.id()}/latest.json`).catch(() => null);

if (!data) {
  console.warn('No staging/latest.json yet — skip the first run');
}

// 3. Draw the trend chart from `data.trend = [{x, y}, ...]`
if (data?.trend?.length) {
  const canvas = new ChartCanvas(
    document.getElementById('chart-trend'),
    220,
    new Padding(40, 12, 12, 28),
  );
  const xs = data.trend.map(p => p.x);
  const ys = data.trend.map(p => p.y);
  const xScale = Scale.linear(Math.min(...xs), Math.max(...xs), canvas.plotLeft(), canvas.plotLeft() + canvas.plotWidth());
  const yScale = Scale.linear(0, Math.max(...ys) * 1.1, canvas.plotTop() + canvas.plotHeight(), canvas.plotTop());

  draw_y_grid(canvas, yScale, 5, v => Format.fixed(v, 0));
  draw_x_axis(canvas, xScale, 6, v => Format.fixed(v, 0));

  new LineChart(canvas)
    .x(xScale)
    .y(yScale)
    .data(data.trend)
    .stroke(brand, 2)
    .draw();
}

// 4. Distribution bars from `data.distribution = [{label, value}, ...]`
if (data?.distribution?.length) {
  const canvas = new ChartCanvas(
    document.getElementById('chart-dist'),
    220,
    new Padding(40, 12, 12, 28),
  );
  const max = Math.max(...data.distribution.map(b => b.value));
  const yScale = Scale.linear(0, max * 1.1, canvas.plotTop() + canvas.plotHeight(), canvas.plotTop());

  draw_y_grid(canvas, yScale, 5, v => Format.fixed(v, 0));

  BarChart.single(canvas, data.distribution)
    .y(yScale)
    .color(brand)
    .draw();
}
