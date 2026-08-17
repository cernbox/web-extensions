import type { LanguageSupport, StreamParser } from '@codemirror/language'
import { cpp } from '@codemirror/lang-cpp'
import { css } from '@codemirror/lang-css'
import { go } from '@codemirror/lang-go'
import { html } from '@codemirror/lang-html'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { php } from '@codemirror/lang-php'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { sql } from '@codemirror/lang-sql'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'
import { cmake } from '@codemirror/legacy-modes/mode/cmake'
import { perl } from '@codemirror/legacy-modes/mode/perl'
import { properties } from '@codemirror/legacy-modes/mode/properties'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { toml } from '@codemirror/legacy-modes/mode/toml'

/**
 * Which file extensions this app registers, and how each one is edited.
 *
 * `label` is only needed for extensions that can appear in the "New file" menu; the rest are
 * opened but never created. Keeping the whole registry in one place means `index.ts` and the
 * two editor components cannot disagree about which extensions exist.
 */
export interface FileTypeDefinition {
  /** Editor to open the file with. */
  engine: 'markdown' | 'code'
  /** Human-readable name, shown in the "New file" menu when the extension is primary. */
  label?: string
  /**
   * CodeMirror grammar key, resolved by `loadLanguage`. Absent means no highlighting: the file
   * still opens, as plain text with line numbers.
   */
  grammar?: GrammarKey
  /**
   * Read-only rendered view this file type can switch to, alongside the raw editor. Markdown is
   * not listed here: its rendered view is the editable TipTap surface, not a preview.
   */
  preview?: PreviewKind
}

export type PreviewKind = 'json' | 'csv'

export type GrammarKey =
  | 'cmake'
  | 'cpp'
  | 'css'
  | 'go'
  | 'html'
  | 'java'
  | 'javascript'
  | 'json'
  | 'jsx'
  | 'markdown'
  | 'perl'
  | 'php'
  | 'properties'
  | 'python'
  | 'rust'
  | 'shell'
  | 'sql'
  | 'toml'
  | 'typescript'
  | 'tsx'
  | 'xml'
  | 'yaml'

/**
 * Extraction marker. `index.ts` translates these labels at runtime with the real `$gettext`, but
 * it does so with a variable, which gettext extraction cannot see. Wrapping the literals in a
 * function named `$gettext` puts them in the .pot without changing the value.
 */
const $gettext = (msgid: string) => msgid

/**
 * The extensions the built-in text-editor registered, so that swapping this app in for it does
 * not silently drop file types, plus the source formats that were previously opened as
 * unhighlighted plain text.
 */
export const fileTypes: Record<string, FileTypeDefinition> = {
  // grammar is what the Source view highlights with; engine is what opens the file normally.
  md: { engine: 'markdown', label: $gettext('Markdown file'), grammar: 'markdown' },
  markdown: { engine: 'markdown', label: $gettext('Markdown file'), grammar: 'markdown' },

  txt: { engine: 'code', label: $gettext('Plain text file') },
  log: { engine: 'code', label: $gettext('Log file') },
  conf: { engine: 'code', label: $gettext('Configuration file'), grammar: 'properties' },
  cfg: { engine: 'code', grammar: 'properties' },
  ini: { engine: 'code', grammar: 'properties' },
  inf: { engine: 'code', grammar: 'properties' },
  toml: { engine: 'code', grammar: 'toml' },
  env: { engine: 'code', grammar: 'shell' },

  js: { engine: 'code', label: $gettext('JavaScript file'), grammar: 'javascript' },
  mjs: { engine: 'code', grammar: 'javascript' },
  cjs: { engine: 'code', grammar: 'javascript' },
  ts: { engine: 'code', label: $gettext('TypeScript file'), grammar: 'typescript' },
  jsx: { engine: 'code', grammar: 'jsx' },
  tsx: { engine: 'code', grammar: 'tsx' },
  vue: { engine: 'code', grammar: 'html' },

  json: { engine: 'code', label: $gettext('JSON file'), grammar: 'json', preview: 'json' },
  jsonl: { engine: 'code', grammar: 'json' },
  csv: { engine: 'code', label: $gettext('CSV file'), preview: 'csv' },
  tsv: { engine: 'code', preview: 'csv' },
  // Autotools templates. The generated file can be anything, so no grammar applies.
  in: { engine: 'code' },
  xml: { engine: 'code', label: $gettext('XML file'), grammar: 'xml' },
  svg: { engine: 'code', grammar: 'xml' },
  html: { engine: 'code', grammar: 'html' },
  htm: { engine: 'code', grammar: 'html' },
  css: { engine: 'code', grammar: 'css' },
  scss: { engine: 'code', grammar: 'css' },
  yaml: { engine: 'code', label: $gettext('YAML file'), grammar: 'yaml' },
  yml: { engine: 'code', grammar: 'yaml' },

  py: { engine: 'code', label: $gettext('Python file'), grammar: 'python' },
  php: { engine: 'code', label: $gettext('PHP file'), grammar: 'php' },
  sh: { engine: 'code', label: $gettext('Shell script'), grammar: 'shell' },
  bash: { engine: 'code', grammar: 'shell' },
  zsh: { engine: 'code', grammar: 'shell' },
  tcsh: { engine: 'code', grammar: 'shell' },
  pl: { engine: 'code', grammar: 'perl' },
  pm: { engine: 'code', grammar: 'perl' },
  cmake: { engine: 'code', grammar: 'cmake' },
  // No CodeMirror grammar exists for Makefiles or QML. Shell gets the comments,
  // strings and recipe bodies of a Makefile right, and JavaScript covers QML's
  // imports and expressions; both are approximations, not exact.
  make: { engine: 'code', grammar: 'shell' },
  mk: { engine: 'code', grammar: 'shell' },
  qml: { engine: 'code', grammar: 'javascript' },
  sql: { engine: 'code', grammar: 'sql' },
  go: { engine: 'code', grammar: 'go' },
  rs: { engine: 'code', grammar: 'rust' },
  java: { engine: 'code', grammar: 'java' },
  c: { engine: 'code', grammar: 'cpp' },
  h: { engine: 'code', grammar: 'cpp' },
  cpp: { engine: 'code', grammar: 'cpp' },
  hpp: { engine: 'code', grammar: 'cpp' },
  cc: { engine: 'code', grammar: 'cpp' },
  cxx: { engine: 'code', grammar: 'cpp' }
}

/**
 * Extensions offered in the "New file" menu unless `primaryExtensions` overrides it. Matches the
 * built-in app's default so the menu does not change when this app replaces it.
 */
export const defaultPrimaryExtensions = ['txt', 'md']

export const isMarkdownExtension = (extension?: string): boolean =>
  fileTypes[extension?.toLowerCase()]?.engine === 'markdown'

export const grammarFor = (extension?: string): GrammarKey | undefined =>
  fileTypes[extension?.toLowerCase()]?.grammar

export const previewFor = (extension?: string): PreviewKind | undefined =>
  fileTypes[extension?.toLowerCase()]?.preview

/**
 * Markdown fences name a language (```python), not a file extension (.py). Map the names people
 * actually write onto the same grammar set the code editor uses, so one registry serves both and
 * adding a language benefits fenced blocks and whole files alike.
 */
const fenceAliases: Record<string, GrammarKey> = {
  bash: 'shell',
  sh: 'shell',
  shell: 'shell',
  zsh: 'shell',
  console: 'shell',
  js: 'javascript',
  javascript: 'javascript',
  node: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  py: 'python',
  python: 'python',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'properties',
  html: 'html',
  xml: 'xml',
  css: 'css',
  scss: 'css',
  sql: 'sql',
  php: 'php',
  perl: 'perl',
  pl: 'perl',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  rs: 'rust',
  java: 'java',
  c: 'cpp',
  cpp: 'cpp',
  'c++': 'cpp',
  cmake: 'cmake',
  make: 'shell',
  makefile: 'shell',
  markdown: 'markdown',
  md: 'markdown'
}

export const grammarForLanguage = (language?: string): GrammarKey | undefined => {
  if (!language) {
    return undefined
  }
  const key = language.toLowerCase().trim()
  return fenceAliases[key] ?? grammarFor(key)
}

/** Languages offered in a fenced block's picker, in the order they are shown. */
export const fenceLanguages = [
  'bash',
  'c',
  'cmake',
  'cpp',
  'css',
  'go',
  'html',
  'java',
  'javascript',
  'json',
  'markdown',
  'mermaid',
  'perl',
  'php',
  'python',
  'rust',
  'sql',
  'toml',
  'typescript',
  'xml',
  'yaml'
]

/**
 * Grammars are imported statically, not through `@codemirror/language-data` and not behind
 * `import()`. Dynamic imports make rollup split the build, and every extension in this repo ships
 * as one `main.js` that the runtime loads as a single AMD module — chunk files alongside it would
 * have to resolve at runtime relative to the extension URL, which nothing here does today.
 *
 * The cost is that all grammars are in the bundle whether or not they are used. That is roughly
 * 500 kB gzipped, in line with the other bundles here.
 */
export const loadLanguage = (
  grammar?: GrammarKey
): LanguageSupport | StreamParser<unknown> | null => {
  switch (grammar) {
    case 'javascript':
      return javascript()
    case 'typescript':
      return javascript({ typescript: true })
    case 'jsx':
      return javascript({ jsx: true })
    case 'tsx':
      return javascript({ jsx: true, typescript: true })
    case 'python':
      return python()
    case 'json':
      return json()
    case 'xml':
      return xml()
    case 'html':
      return html()
    case 'css':
      return css()
    case 'yaml':
      return yaml()
    case 'markdown':
      return markdown()
    case 'php':
      return php()
    case 'sql':
      return sql()
    case 'cpp':
      return cpp()
    case 'java':
      return java()
    case 'rust':
      return rust()
    case 'go':
      return go()
    case 'perl':
      return perl
    case 'cmake':
      return cmake
    case 'properties':
      return properties
    case 'shell':
      return shell
    case 'toml':
      return toml
    default:
      return null
  }
}
