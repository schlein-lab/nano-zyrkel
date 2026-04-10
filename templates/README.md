# Templates

Skeletons, themes, examples and reusable workflows for building new
nano-zyrkel agents. Everything in this directory is **NOT linked
code** — it is meant to be copied or forked. The update-core reusable
workflow never touches files inside a user repo that came from here.

## Layout

```
templates/
├── scaffolds/        Complete starter repos (use the GitHub
│                     "Use this template" button)
│   ├── scaffold-data-pipeline/    Cron-driven binary, no browser
│   ├── scaffold-interactive-app/  Binary + WASM dashboard
│   └── scaffold-showcase/         Pure browser app
│
├── themes/           Drop-in design themes (HTML + CSS)
│   ├── theme-clinical/    White, Inter, scientific
│   ├── theme-dashboard/   Dark, neon, monospace, dense grid
│   ├── theme-magazine/    Editorial, serif, two columns
│   ├── theme-minimal/     Black on white, no chrome
│   └── theme-cinematic/   Dark, gradient, single hero
│
├── examples/         Standalone chart cookbook entries
│   ├── example-time-series/
│   ├── example-overview-cards/
│   ├── example-data-table/
│   ├── example-geographic/
│   ├── example-genome-track/
│   └── example-network-graph/
│
└── workflows/        Reusable GitHub Actions referenced from user repos
    ├── update-core.yml
    ├── deploy.yml
    ├── data-update.yml
    └── (legacy templates: basic.yml, codex-*.yml)
```

The reusable workflows also live under `.github/workflows/` so user
repos can `uses: schlein-lab/nano-zyrkel/.github/workflows/<name>.yml@main`.

## Versioning

Templates are not versioned alongside the binary or WASM cores. They
evolve at their own pace and breaking changes to a template only
affect new repos created from it. Existing user repos keep whatever
they forked.
