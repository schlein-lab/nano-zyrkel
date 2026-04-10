# Builder guide

The nano-zyrkel SDK ships everything needed for a **browser-based
nano-zyrkel builder** — a small web app that lets a user pick a
template, fill in a form, and spawn a new GitHub repository with the
materialized files. This page describes the contract the SDK
exposes so a builder can consume it without baking in any catalog.

The reference builder will eventually live as its own nano-zyrkel
(meta-circular: a nano-zyrkel that builds nano-zyrkels). Until then
this page is the spec.

## Three sources of truth

A builder needs three artifacts to render its UI:

| Artifact                                       | Where it comes from                               |
| ---------------------------------------------- | ------------------------------------------------- |
| **SDK schema** — list of nano types, fetchers, conditions, actions, notifiers and their fields | The `nano-zyrkel introspect` CLI or the `schema.json` asset on every `bin-v*` GitHub Release |
| **WASM SDK schema** — list of browser-side primitives + which feature profile they belong to  | The `wasmSdkSchema()` JS function exported by `nano-zyrkel-wasm-core`, or the same data as a JSON snapshot at build time |
| **Template manifest** — every scaffold, theme and example with its slot definitions          | [`templates/manifest.json`](../templates/manifest.json) at the repo root, plus a `template.json` per template |

All three are versioned and follow the SDK's semver promise.

## Loading the catalog

```js
// 1. Pull the SDK schema (binary side)
const sdk = await fetch('https://github.com/schlein-lab/nano-zyrkel/releases/latest/download/schema.json').then(r => r.json());

// 2. Pull the WASM SDK schema (browser side)
import init, { wasmSdkSchema } from '/wasm/nano_zyrkel_wasm_core.js';
await init();
const wasm = wasmSdkSchema();

// 3. Pull the template manifest
const manifest = await fetch('https://raw.githubusercontent.com/schlein-lab/nano-zyrkel/main/templates/manifest.json').then(r => r.json());
const templates = await Promise.all(
  [...manifest.scaffolds, ...manifest.themes, ...manifest.examples]
    .map(t => fetch(`https://raw.githubusercontent.com/schlein-lab/nano-zyrkel/main/templates/${t.manifest}`).then(r => r.json()))
);
```

The same pattern works inside a static page hosted on GitHub Pages
once the builder itself is shipped as a nano-zyrkel.

## Rendering a form per template

Every `template.json` exposes a `slots` array. The slot's `kind`
maps directly to a standard form control — see
[`templates/TEMPLATE-SCHEMA.md`](../templates/TEMPLATE-SCHEMA.md)
for the full list. A minimal renderer:

```js
function renderTemplate(template) {
  const form = document.createElement('form');
  for (const slot of template.slots) {
    const field = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = slot.label;
    field.appendChild(label);

    let input;
    switch (slot.kind) {
      case 'string':
      case 'slug':
        input = document.createElement('input');
        input.type = 'text';
        break;
      case 'number':
        input = document.createElement('input');
        input.type = 'number';
        break;
      case 'boolean':
        input = document.createElement('input');
        input.type = 'checkbox';
        break;
      case 'enum':
        input = document.createElement('select');
        for (const opt of slot.options ?? []) {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          input.appendChild(o);
        }
        break;
      case 'url':
        input = document.createElement('input');
        input.type = 'url';
        break;
      case 'color':
        input = document.createElement('input');
        input.type = 'color';
        break;
      default:
        input = document.createElement('input');
        input.type = 'text';
    }
    input.name = slot.name;
    if (slot.default != null) input.value = slot.default;
    if (slot.required) input.required = true;
    field.appendChild(input);
    form.appendChild(field);
  }
  return form;
}
```

## Materializing the chosen template

When the user submits, the builder needs to:

1. Read every file in `template.files` from the SDK repo (raw GitHub
   contents).
2. Substitute every `{{SLOT_NAME}}` placeholder with the user's value.
3. Create a new repo via the GitHub REST API.
4. Upload the substituted files via the *Create or update file
   contents* endpoint.

```js
async function spawn(template, values, octokit, owner, repo) {
  // 1. Create the repo
  await octokit.repos.createForAuthenticatedUser({ name: repo });

  // 2. Read each file from the SDK repo
  for (const path of template.files) {
    const raw = await fetch(
      `https://raw.githubusercontent.com/schlein-lab/nano-zyrkel/main/templates/${template.kind}s/${template.id}/${path}`
    ).then(r => r.text());

    // 3. Substitute slots
    let body = raw;
    for (const [name, value] of Object.entries(values)) {
      body = body.replaceAll(`{{${name}}}`, value);
    }

    // 4. Upload to the new repo
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Initial scaffold from ${template.id}`,
      content: btoa(body),
    });
  }
}
```

## Validating user choices

The builder should run two checks before letting a user submit:

1. **Required slots** — every slot with `required: true` must have a
   non-empty value.
2. **Compatibility** — `template.requires` lists the minimum binary
   and WASM versions plus the WASM features the template depends
   on. Compare against the SDK schema's `version` field and warn the
   user if their pinned core is too old.

## Versioning

The schemas all follow `vN/vN+1` semver. Every breaking change to
the SDK schema, the WASM schema or the template schema bumps a
major version and is listed in the corresponding compatibility
matrix at the repo root.

A builder targeting `nano-zyrkel-template/v1` MUST gracefully refuse
to render `v2` templates (and the other way around).

## What still needs to land

This page describes the contract; the reference builder is on the
roadmap. The next milestone is shipping
`nano-zyrkel-builder` as its own scaffold inside `templates/`,
written entirely in vanilla HTML + the wasm-core viz-ui layer, so
the builder is itself a nano-zyrkel that anyone can fork and
customize.
