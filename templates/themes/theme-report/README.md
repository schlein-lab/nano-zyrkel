# theme-report

Print-friendly A4 / Letter layout for nano-zyrkels that produce
static reports. Pair with `pulldown-cmark`-rendered Markdown from
the wasm-core viz-ui layer for editorial bodies, or fill the table
slot from a JSON snapshot via the DataLoader.

## Use it

```bash
cp -r theme-report/docs/* my-nano/docs/
```

## Notes

- The screen view keeps a paper-like centered column with shadow.
- The `@media print` section hides shadows and link colors so the
  page prints cleanly.
- `@page { size: A4; margin: 18mm 20mm; }` sets the print page size
  and margins. Switch to `letter` if your audience is US-based.
