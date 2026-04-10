# Deploying

The default delivery target for a nano-zyrkel that has a `docs/`
folder is **GitHub Pages**, because it is the only static host that
ships with the same git repository the agent already lives in. The
[`deploy.yml`][deploy] reusable workflow takes care of the upload.

[deploy]: ../.github/workflows/deploy.yml

This page lists the alternatives — Cloudflare Pages, Netlify and a
self-hosted Forge / VPS — together with the workflow snippets that
get you there.

## GitHub Pages (default)

```yaml
jobs:
  publish:
    uses: schlein-lab/nano-zyrkel/.github/workflows/deploy.yml@main
    with:
      docs-path: docs
```

Settings:
1. Repo → Settings → Pages → Source: **GitHub Actions**.
2. The first push that triggers `deploy.yml` provisions the URL.
3. Custom domain support: add a `CNAME` file under `docs/` and
   configure DNS as usual.

Pros: free, integrated, no extra accounts.
Cons: 100 GB / month bandwidth quota, occasional minute-long
propagation delay.

## Cloudflare Pages

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          command: pages deploy docs --project-name=my-nano
```

Secrets:
- `CF_API_TOKEN` — created at <https://dash.cloudflare.com/profile/api-tokens>
- `CF_ACCOUNT_ID` — visible on the Cloudflare dashboard sidebar

Pros: edge cache in 300+ POPs, generous free tier, custom domain
with automatic TLS.
Cons: separate dashboard, slightly more setup than GitHub Pages.

## Netlify

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --dir=docs --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID:    ${{ secrets.NETLIFY_SITE_ID }}
```

## Self-hosted (Forge / VPS / S3)

For nano-zyrkels that need to live on a custom domain or behind a
firewall, ship the `docs/` folder via SCP, rsync or `aws s3 sync`.
Example for a [Laravel Forge](https://forge.laravel.com/) site:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Forge deploy script
        env:
          FORGE_TOKEN: ${{ secrets.FORGE_API_TOKEN }}
        run: |
          curl -sX POST \
            -H "Authorization: Bearer $FORGE_TOKEN" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            "https://forge.laravel.com/api/v1/servers/${SERVER_ID}/sites/${SITE_ID}/commands" \
            -d '{"command":"cd /tmp && rm -rf nz && git clone --depth 1 https://github.com/'"$GITHUB_REPOSITORY"'.git nz && rsync -av --delete nz/docs/ /home/forge/example.com/ && rm -rf nz"}'
```

…or skip the GitHub workflow entirely and let the Forge site pull
from the repo via its built-in *deploy on push* hook.

## Recommended profile per scaffold

| Scaffold                     | Best fit                                |
| ---------------------------- | --------------------------------------- |
| `scaffold-data-pipeline`     | No docs/ — nothing to deploy            |
| `scaffold-interactive-app`   | GitHub Pages (the default)              |
| `scaffold-monitor`           | GitHub Pages or Cloudflare Pages        |
| `scaffold-newsletter`        | GitHub Pages, plus SMTP for the digest  |
| `scaffold-showcase`          | GitHub Pages, optionally Cloudflare for edge cache |
