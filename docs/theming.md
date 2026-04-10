# Theming

A theme in this repo is just a pair of files (`docs/index.html` plus
`docs/style.css`) that you copy into your nano-zyrkel and edit. Themes
are **not linked code** — once you copy a theme into your repo, the
update-core reusable workflow will never touch it.

## Bundled themes

| Theme              | Best for                                     |
| ------------------ | -------------------------------------------- |
| `theme-clinical`   | Medical / scientific dashboards              |
| `theme-dashboard`  | Monitoring, status pages, watcher boards     |
| `theme-magazine`   | Newsletters and curation outputs             |
| `theme-minimal`    | Status pages and short briefs                |
| `theme-cinematic`  | Showcase portals and demo pages              |

Each theme lives under [`templates/themes/`](../templates/themes) with
its own README.

## Use one

```bash
cp -r templates/themes/theme-clinical/docs/* my-nano/docs/
```

Then edit `docs/style.css` and `docs/index.html` freely. The CSS
variables at the top of every theme stylesheet are the easiest way to
re-skin without touching layout — change `--brand`, `--bg` and you are
done.

## Build your own

The bundled themes follow a few conventions so they stay swap-compatible
with the scaffold's `docs/app.js`:

1. Define a `:root` block with at minimum `--bg`, `--text`, `--muted`,
   `--brand`.
2. Provide one outer `<main>` container so the JS glue can append to it.
3. Use the IDs the scaffold expects (`title`, `subtitle`, chart hosts).
4. Keep typography choices in CSS — the JS glue should never set fonts.

Drop your theme into `templates/themes/theme-yourname/` and submit a PR
if you want to share it.
