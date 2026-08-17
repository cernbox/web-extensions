# AGENTS.md — CERNBox web-extensions

Standalone apps and extensions loaded into [CERNBox Web](https://github.com/cernbox/web) at
runtime. Nothing here is compiled into `web`: each package builds to a single JavaScript file
that the web runtime fetches and registers, so an extension can be added, updated or removed by
editing configuration and redeploying one file.

Two other repositories matter: [`cernbox/web`](https://github.com/cernbox/web) is the host
application, and `cernbox/web-release` is deployment tooling. The scripts here assume both are
checked out next to this one, so that `web` resolves as `../web` — see `CERTS_DIR` and the echoed
paths in `dev.sh` if your layout differs.

## Layout

One directory per extension, each an independent pnpm workspace package. `pnpm-workspace.yaml`
lists the active ones — a directory not listed there is not built (`backups` and `image-editor`
are currently commented out).

| extension | purpose |
| --- | --- |
| `cernbox-integration`, `theme-cernbox` | CERN branding, theming and glue |
| `codimd`, `draw-io`, `image-editor`, `rootjs`, `ndmspc-reader`, `ifc-js`, `text-editor` | file editors and viewers |
| `jupyter`, `open-in-swan` | hand a file or folder to SWAN |
| `data-repositories`, `otg`, `search-in-folder`, `old-web-redirector`, `office-app-feedback` | assorted UI additions |
| `lightweight-accounts`, `ms-tracing` | account handling and telemetry |
| `sync-clients` | desktop client enrolment (Login Flow V2) and connected device management |
| `tours`, `tours-cernbox` | product tours |

## Anatomy of an extension

`draw-io` is the smallest complete example; `text-editor` is the one with real dependencies.

```
<name>/
  package.json          name === directory name === app id, usually; version starts at 0.0.0
  vite.config.ts        defineConfig from @ownclouders/extension-sdk; sets the dev-server port
  tsconfig.json         extends @ownclouders/tsconfig
  eslint.config.js      spreads @ownclouders/eslint-config
  .prettierrc.json      "@ownclouders/prettier-config"
  .bumpversion.cfg      tag_name = <name>/v{new_version}
  Makefile              release target, produces release/<name>.tar.gz
  l10n/translations.json   generated; never hand-edit
  src/index.ts          defineWebApplication({ setup() { ... } })
  src/App.vue
```

To add one: copy that skeleton, then register the name in **three** places —
`pnpm-workspace.yaml`, the `ALL_EXTENSIONS` array and port map in `dev.sh`, and the `extension`
choice list in `.github/workflows/release.yml`. Missing any one of them fails quietly: the
extension builds locally but is never served or released.

## The build contract

`@ownclouders/extension-sdk` wraps vite. What matters:

- **Output is AMD**, loaded by the web runtime as a single module.
- **Externals** are `vue`, `luxon`, `pinia`, `vue3-gettext` and all `@ownclouders/*` packages.
  These come from the host at runtime. Everything else is bundled into your output file.
- Extensions here therefore ship as **one `main.js`** — `ifc-js` is 4 MB, `jupyter` 1.2 MB. Set
  `output.entryFileNames: 'main.js'` in `vite.config.ts`, as every extension does.
- **Avoid dynamic `import()`.** It makes rollup emit `js/chunks/*.mjs` alongside the entry, which
  the runtime would have to resolve relative to the extension URL. Nothing here does that today,
  and no extension currently emits chunks. Prefer static imports even at the cost of bundle size.

### Version skew worth knowing

The catalog in `pnpm-workspace.yaml` pins `vue3-gettext: 4.0.0-beta.1`, but the host `web`
runs **2.4.0**. Since the package is externalised, an extension is type-checked against v4 and
executes against v2. The `useGettext` / `$gettext` surface is the same in both, so this has not
bitten anyone, but pin `vue3-gettext` to `2.4.0` in a new package if you want the types to match
what actually runs.

Similarly, `@ownclouders/*` are pinned at `^12.1.2` from npm while `web` is a fork at 12.5.0.
That works because the fork keeps the public API compatible — not because the trees match.

## Registering an app

`src/index.ts` returns `appInfo`, `routes`, `translations` and optional `extensions` from
`defineWebApplication({ setup() {} })`.

For a file editor, wrap the component in `AppWrapperRoute(App, { applicationId })`. The wrapper
owns loading, saving, the dirty flag, conflict handling and the "Save as" and "Export as PDF"
actions. Your component receives `resource`, `currentContent`, `isReadOnly` and
`applicationConfig` as props, and emits `update:currentContent`. It should not fetch or save
anything itself.

Because the wrapper owns the content, a component that also holds it internally must guard the
incoming prop:

```ts
watch(() => currentContent, (value) => {
  if (value === whatWeLastEmitted()) return   // else every keystroke resets the cursor
  applyExternalChange(value)
})
```

## Commands

```bash
pnpm install                  # at the repo root, installs every workspace package
pnpm build                    # every extension
pnpm lint

cd <name> && pnpm build       # one extension
cd <name> && pnpm build:w     # watch mode

./dev.sh                      # serve all extensions over HTTPS
./dev.sh draw-io text-editor  # serve specific ones
./buildall.sh                 # make release in every directory that has a Makefile
```

`dev.sh` needs the traefik certs from the `web` checkout, generated by `docker compose up traefik`
there.
Accept each `https://localhost:92XX` certificate once per browser session.

Point the host at a locally served extension with:

```json
{ "external_apps": [{ "id": "<name>", "path": "https://localhost:92XX/main.js" }] }
```

## Conventions

- `<script setup lang="ts">`, Composition API, typed props and emits, no `any`.
- `unref()` to read, `.value` to write. Prefer `computed` over watchers.
- Every user-facing string goes through `$gettext`. `l10n/translations.json` is generated from
  Transifex — never hand-edit it, except to seed a brand-new extension before its Transifex
  resource exists.
- **English and French are usually enough.** CERN's working languages are English and French, so
  that is the expected baseline — not coverage of the ~33 languages the host offers. Languages you
  do not translate stay as empty objects in `translations.json` and fall back to the English msgid,
  the way `draw-io` does.
- Import from `@ownclouders/web-pkg` and `@ownclouders/web-client` by package name.
- Style with the design system's `oc-*` utilities and `--oc-*` custom properties, so extensions
  follow the active theme. Do not hardcode colours.
- Prettier and ESLint decide formatting. Do not hand-format.
- Comments explain *why*, not *what*.

Note that `@ownclouders/tsconfig` sets `types: ["vitest/globals"]`, so `vue-tsc` fails on a
missing type library before reaching any source unless vitest is resolvable. A new package that
wants `check:types` must either depend on vitest or override `types` in its own `tsconfig.json`.
`sync-clients` does the former (and gets unit tests out of it), `text-editor` the latter.

## Releasing

A new package starts at `"version": "0.0.0"`, so its first bump produces the first real
version instead of skipping one.

Version bumps and tags are driven by `.bumpversion.cfg`; a tag matching `<name>/v*` triggers
`.github/workflows/ci.yml`, which runs `make release` in that directory and attaches
`release/<name>.tar.gz` to a GitHub release.

Use the **Release** workflow (`workflow_dispatch`) rather than tagging by hand: it takes the
extension name and a patch/minor/major bump. A new extension must be added to that workflow's
`extension` choice list or it cannot be released.
