# text-editor

Replacement for ownCloud Web's built-in `text-editor` app, built on
[TipTap 3](https://tiptap.dev) and [CodeMirror 6](https://codemirror.net).

It claims the same application id (`text-editor`) and registers the same file extensions, so it
drops in wherever the built-in app was loaded.

## Why

The built-in app routes every file through md-editor-v3. That is reasonable for Markdown and
poor for everything else: opening a `.py`, `.ts` or `.log` file gives a plain `textarea` with no
highlighting, no line numbers and Markdown semantics applied to content that is not Markdown.
`highlight.js` is wired in, but only for fenced code blocks in the Markdown *preview* pane.

This app picks an editor per file instead:

| file | editor | what you get |
| --- | --- | --- |
| `.md`, `.markdown` | TipTap 3 | WYSIWYG editing, toolbar, tables, task lists, and fenced code blocks highlighted **while editing** via lowlight |
| everything else | CodeMirror 6 | real per-language grammar, line numbers, bracket matching, search, code folding |

Markdown files also have a **Source** button that swaps the rich-text view for CodeMirror with
the Markdown grammar, for editing the raw text. **Rich text** switches back. Both editors share
one toolbar component, so they look the same; the code toolbar carries undo/redo and font-size
controls, the Markdown one the formatting actions.

## Markdown editor features

All MIT, all chosen because they survive a Markdown round-trip:

| extension | what it adds |
| --- | --- |
| `Placeholder` | prompt on an empty document |
| `CharacterCount` | word and character count in the footer |
| `Typography` | smart quotes, dashes, ellipses — input rules that emit plain characters, so nothing extra has to serialise |
| `BubbleMenu` | formatting bar on a selection |
| `FloatingMenu` | block menu on an empty line (headings, lists, code block, table) |
| `DragHandle` | grab a block and reorder it |
| `TableOfContents` | drives the collapsible **Outline** panel on the right |
| `Suggestion` | the `/` command — type a slash at the start of a line to insert a block; the toolbar's **+** opens the same list |

The prose column is capped at `48rem` and centred, rather than running the full window width.
Font size is adjustable from the toolbar (0.8×–1.6×) and scales headings with the body, since it
is applied as a multiplier rather than a fixed size.

Fenced code blocks are edited by an embedded CodeMirror instance, not highlighted statically, so
they get the same grammars, line numbers and bracket matching as a source file — and each block
has its own language picker. This is also why `lowlight` is not a dependency: one grammar set
serves both fenced blocks and whole files.

`BubbleMenu` and `FloatingMenu` come from `@tiptap/vue-3/menus`, which bundles their plugins —
the standalone `@tiptap/extension-bubble-menu` / `-floating-menu` packages are not needed.

### What was deliberately left out

The constraint is that this app saves Markdown, so a node TipTap cannot serialise is either
dropped or written into the file as raw HTML. Measured against our actual config:

| extension | serialises to | why not |
| --- | --- | --- |
| `TextAlign` | *nothing* | it is an attribute on an existing paragraph, so the HTML fallback never fires and the alignment is **silently lost on save**. Same for `FontFamily` |
| `Color` / `TextStyle` | `<span style="color: #f00;">` | HTML in a file people also edit by hand |
| `Mention` | `<span data-type="mention" data-id="…">` | as above |
| `Youtube` | `<div data-youtube-video><iframe …>` with 12 attributes | as above |
| `Highlight` | `<mark>` | reachable — see below |
| `Image` | `![alt](src)` — clean | held back deliberately; to be wired through Web embed mode |

Any of these becomes viable by giving the node a serialiser: `tiptap-markdown` reads a
`markdown: { serialize, parse }` spec per node or mark, which is roughly ten lines. That is the
route to `Highlight` as `==text==`, or to `@tiptap/extension-mathematics` as `$…$`.

Still paid, and not on public npm: Comments, AI, Snapshot Compare, docx import/export.

## Mermaid diagrams

A **Diagram** submenu in the toolbar inserts a ```` ```mermaid ```` block from a template —
flowchart, sequence, class, state, ER, Gantt, pie, user journey, mind map, timeline. Blocks with
`language: mermaid` render as a diagram and toggle between the drawing and its source from the
block header. Rendering is debounced at 300 ms, and a syntax error is shown in place rather than
clearing the last good drawing, since invalid syntax is the normal state while typing.

It is an ordinary code block with a `language` attribute, so it round-trips through Markdown like
any other fence — verified, not assumed.

**Mermaid is why the bundle is ~5 MB.** It lazy-loads each diagram renderer with `import()`, which
would split the build into chunks the extension loader cannot fetch, so `vite.config.ts` sets
`inlineDynamicImports: true` to force one file. Removing mermaid — the import in
`src/helpers/mermaid.ts`, the Diagram submenu, and that rollup option — takes the bundle back to
roughly 640 kB gzipped.

## Theme

Both editors follow the host theme, which itself falls back to the system `prefers-color-scheme`
when the user has not pinned one — so light/dark is inherited from the OS without this app
reading any media query.

The Markdown editor is styled entirely with `--oc-*` custom properties, including the
highlight.js classes for fenced code, so it re-themes with no JavaScript. CodeMirror switches
between its default light theme and `@codemirror/theme-one-dark` through a compartment, which
reconfigures the running editor without discarding undo history or the cursor.

## Translations

English source strings with French supplied, in `l10n/translations.json` (33 locale keys, matching
the other extensions here; the rest are empty until Transifex fills them).

File-type labels live in `src/helpers/fileTypes.ts` and are translated in `index.ts` with a
variable, which gettext extraction cannot see. `fileTypes.ts` therefore defines a local no-op
`$gettext` marker so the literals still land in the `.pot`. Keep using it when adding a label.

## View modes

Every file opens in an editable view and some offer a second, read-only rendered view. The
toggle is in the toolbar, on the right.

| file | editable view | rendered view |
| --- | --- | --- |
| `.md`, `.markdown` | TipTap rich text | — (**Source** switches to raw Markdown in CodeMirror) |
| `.json` | CodeMirror | **Preview** → collapsible tree, invalid JSON reports the parser error |
| `.csv`, `.tsv` | CodeMirror | **Preview** → table with a sticky header, capped at 500 rows |
| everything else | CodeMirror | — |

The rendered views are read-only on purpose: editing stays in one place, so there is no second
path that can write to the file. The row cap applies only to the table — the raw editor always
shows the whole file.

## Configuration

Loaded as an external app:

```json
{
  "external_apps": [
    { "id": "text-editor", "path": "https://<host>/text-editor/main.js" }
  ]
}
```

**Remove `text-editor` from the `apps` list when you do this.** Both register the same
extensions, so leaving the built-in loaded makes the app picker offer every text file twice.

Options, all under the app's `config` key:

| option | default | meaning |
| --- | --- | --- |
| `extraExtensions` | `[]` | extra extensions to open. They get CodeMirror with no grammar — still line numbers, still no Markdown mangling |
| `primaryExtensions` | `["txt", "md"]` | which extensions appear in the "New file" menu |
| `fileSizeLimit` | `50000000` | bytes. The built-in app capped this at 2 MB, which is small for logs |
| `markdownForAll` | `false` | force the Markdown editor for every file. The escape hatch for deployments that relied on the built-in app's `showPreviewOnlyMd: false` |

Font size in the code editor is a per-session UI control, not configuration; it resets to 14 px
on reopen.

## Why `tiptap-markdown`

TipTap 3.30 does ship markdown support in core, but it is **node-level**: `markdown: { render,
parseMarkdown }` specs let a custom node declare how it serialises. There is no document-level
round-trip — `Editor` exposes `getJSON()`, `getHTML()` and `getText()`, but no `getMarkdown()`.

So `tiptap-markdown` provides the piece that is actually needed here. It is a 0.x package, which
is worth knowing: it peer-depends on `@tiptap/core ^3.0.1`, and if it stops tracking TipTap the
fallback is a `prosemirror-markdown` serializer, which is what it wraps.

## Adding a language

Grammars are imported statically in `src/helpers/fileTypes.ts`, not through
`@codemirror/language-data`. That package resolves each grammar with a dynamic `import()`, which
makes rollup split the build — and every extension in this repo ships as a single `main.js`
loaded as one AMD module, with no runtime chunk resolution.

So: add the `@codemirror/lang-*` package, import it at the top of `fileTypes.ts`, add a
`GrammarKey`, add a `loadLanguage` case, and map the extensions in `fileTypes`.

## Icons: the trap

`OcIcon` resolves `fill-type="none"` to `<name>.svg` and anything else to
`<name>-<fillType>.svg`, defaulting to **`fill`**. Most formatting glyphs in the design system —
`bold`, `italic`, `h-1`, `table-2`, `list-unordered`, `separator`, `draggable` — exist **only**
under the bare name. Asking for those with `fill-type="line"` renders **nothing**: no console
error, no build failure, just an empty button.

That is why toolbar items carry an explicit `fillType`, defaulting to `'none'`, and why there is
a check:

```bash
pnpm check:icons     # every icon reference resolves against the real asset list
```

Run it after adding a toolbar item or an `<oc-icon>`. It knows that toolbar objects default to
`none` while `index.ts` app icons go to the runtime, which defaults to `fill`.

## Development

```bash
pnpm install
pnpm build           # single dist/main.js
pnpm build:w         # watch
pnpm lint
pnpm check:types
pnpm check:icons
../dev.sh text-editor    # serve on https://localhost:9226
```
