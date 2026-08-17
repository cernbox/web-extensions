/**
 * Mermaid diagram support for fenced ```mermaid blocks.
 *
 * Mermaid is loaded statically. It lazy-loads its own diagram renderers with `import()`, which
 * would normally split the build into chunks this extension cannot serve — see
 * `inlineDynamicImports` in vite.config.ts.
 */
import mermaid from 'mermaid'

export interface DiagramTemplate {
  id: string
  label: string
  /** Body of the fenced block, without the ```mermaid fence itself. */
  code: string
}

let initialisedTheme: string | null = null

const configure = (isDark: boolean) => {
  const theme = isDark ? 'dark' : 'default'
  if (initialisedTheme === theme) {
    return
  }
  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: 'strict',
    fontFamily: 'inherit'
  })
  initialisedTheme = theme
}

let renderSeq = 0

/**
 * Render a diagram to SVG markup.
 *
 * Rejects with mermaid's own message when the source does not parse, which is normal while the
 * diagram is being typed — callers should show it rather than treat it as a failure.
 */
export const renderMermaid = async (code: string, isDark: boolean): Promise<string> => {
  configure(isDark)
  // The id must be unique per render: mermaid injects a temporary element keyed on it, and reusing
  // an id makes a second render of the same block silently return the previous diagram.
  const id = `cern-mermaid-${(renderSeq += 1)}`
  const { svg } = await mermaid.render(id, code)
  return svg
}

/** Force the next render to re-read the theme, after the host switches light/dark. */
export const resetMermaidTheme = () => {
  initialisedTheme = null
}

/**
 * The diagram types the previous editor offered, so nothing that could be inserted there is
 * missing here. Each template is a minimal but valid diagram, ready to edit.
 */
export const diagramTemplates = ($gettext: (msgid: string) => string): DiagramTemplate[] => [
  {
    id: 'flowchart',
    label: $gettext('Flowchart'),
    code: [
      'flowchart TD',
      '    A[Start] --> B{Decision}',
      '    B -->|Yes| C[OK]',
      '    B -->|No| D[Stop]'
    ].join('\n')
  },
  {
    id: 'sequence',
    label: $gettext('Sequence diagram'),
    code: [
      'sequenceDiagram',
      '    participant Alice',
      '    participant Bob',
      '    Alice->>Bob: Hello Bob',
      '    Bob-->>Alice: Hi Alice'
    ].join('\n')
  },
  {
    id: 'class',
    label: $gettext('Class diagram'),
    code: [
      'classDiagram',
      '    class Animal {',
      '      +String name',
      '      +move()',
      '    }',
      '    Animal <|-- Dog'
    ].join('\n')
  },
  {
    id: 'state',
    label: $gettext('State diagram'),
    code: [
      'stateDiagram-v2',
      '    [*] --> Idle',
      '    Idle --> Running: start',
      '    Running --> [*]: stop'
    ].join('\n')
  },
  {
    id: 'er',
    label: $gettext('Entity relationship diagram'),
    code: [
      'erDiagram',
      '    CUSTOMER ||--o{ ORDER : places',
      '    ORDER ||--|{ LINE-ITEM : contains'
    ].join('\n')
  },
  {
    id: 'gantt',
    label: $gettext('Gantt chart'),
    code: [
      'gantt',
      '    title Project plan',
      '    dateFormat YYYY-MM-DD',
      '    section Phase one',
      '    Design :a1, 2026-01-01, 30d',
      '    Build  :after a1, 45d'
    ].join('\n')
  },
  {
    id: 'pie',
    label: $gettext('Pie chart'),
    code: ['pie title Distribution', '    "A" : 45', '    "B" : 30', '    "C" : 25'].join('\n')
  },
  {
    id: 'journey',
    label: $gettext('User journey'),
    code: [
      'journey',
      '    title Daily routine',
      '    section Morning',
      '      Wake up: 3: Me',
      '      Coffee: 5: Me'
    ].join('\n')
  },
  {
    id: 'mindmap',
    label: $gettext('Mind map'),
    code: ['mindmap', '  root((Topic))', '    Idea one', '    Idea two'].join('\n')
  },
  {
    id: 'timeline',
    label: $gettext('Timeline'),
    code: ['timeline', '    title History', '    2024 : First', '    2025 : Second'].join('\n')
  }
]
