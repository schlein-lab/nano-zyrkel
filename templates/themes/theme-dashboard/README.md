# theme-dashboard

Dark, neon accent, monospace headings, dense 12-column grid. Built for
monitoring and status-page style nano-zyrkels (watcher, tracker, uptime
boards).

## Use it

```bash
cp -r theme-dashboard/docs/* my-nano-zyrkel/docs/
```

Recommended `wasm-core` profile: `viz-advanced` (gives you scatter,
histogram and heatmap on top of the basics).

## Variables

| Variable    | Default   | Purpose                |
| ----------- | --------- | ---------------------- |
| `--brand`   | `#06B6D4` | Primary accent (cyan)  |
| `--brand-2` | `#8B5CF6` | Hover / secondary      |
| `--bg`      | `#0B0F19` | Page background        |
| `--panel`   | `#111827` | Panel background       |
| `--text`    | `#F3F4F6` | Body text              |
| `--muted`   | `#9CA3AF` | Secondary text         |
