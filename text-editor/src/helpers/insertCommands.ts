import type { Editor } from '@tiptap/core'

/**
 * One entry in the insert menu, reachable both from the toolbar's "+" button and by typing "/".
 * Kept separate from the toolbar item type because these carry a description and search keywords
 * rather than an active state.
 */
export interface InsertCommand {
  id: string
  label: string
  description: string
  icon: string
  fillType?: 'none' | 'line' | 'fill'
  /** Extra words matched when filtering, so "bullet" finds the unordered list. */
  keywords: string[]
  run: (editor: Editor, range?: { from: number; to: number }) => void
}

/**
 * `range` is the "/query" text that triggered the menu; it has to be deleted before the block is
 * inserted, or the slash and what was typed after it stay in the document.
 */
const chain = (editor: Editor, range?: { from: number; to: number }) =>
  range ? editor.chain().focus().deleteRange(range) : editor.chain().focus()

export const buildInsertCommands = ($gettext: (msgid: string) => string): InsertCommand[] => [
  {
    id: 'insert-h1',
    label: $gettext('Heading 1'),
    description: $gettext('Top level section title'),
    icon: 'h-1',
    keywords: ['h1', 'title', 'heading'],
    run: (editor, range) => chain(editor, range).setNode('heading', { level: 1 }).run()
  },
  {
    id: 'insert-h2',
    label: $gettext('Heading 2'),
    description: $gettext('Section title'),
    icon: 'h-2',
    keywords: ['h2', 'heading'],
    run: (editor, range) => chain(editor, range).setNode('heading', { level: 2 }).run()
  },
  {
    id: 'insert-h3',
    label: $gettext('Heading 3'),
    description: $gettext('Subsection title'),
    icon: 'h-3',
    keywords: ['h3', 'heading'],
    run: (editor, range) => chain(editor, range).setNode('heading', { level: 3 }).run()
  },
  {
    id: 'insert-bullet-list',
    label: $gettext('Bullet list'),
    description: $gettext('An unordered list'),
    icon: 'list-unordered',
    keywords: ['bullet', 'unordered', 'ul', 'list'],
    run: (editor, range) => chain(editor, range).toggleBulletList().run()
  },
  {
    id: 'insert-ordered-list',
    label: $gettext('Numbered list'),
    description: $gettext('An ordered list'),
    icon: 'list-ordered',
    keywords: ['numbered', 'ordered', 'ol', 'list'],
    run: (editor, range) => chain(editor, range).toggleOrderedList().run()
  },
  {
    id: 'insert-task-list',
    label: $gettext('Task list'),
    description: $gettext('A checklist'),
    icon: 'list-check-2',
    keywords: ['task', 'todo', 'check', 'list'],
    run: (editor, range) => chain(editor, range).toggleTaskList().run()
  },
  {
    id: 'insert-quote',
    label: $gettext('Quote'),
    description: $gettext('A quoted passage'),
    icon: 'double-quotes-l',
    keywords: ['quote', 'blockquote', 'citation'],
    run: (editor, range) => chain(editor, range).toggleBlockquote().run()
  },
  {
    id: 'insert-code-block',
    label: $gettext('Code block'),
    description: $gettext('Code with syntax highlighting'),
    icon: 'code-box',
    fillType: 'line',
    keywords: ['code', 'fence', 'snippet'],
    run: (editor, range) => chain(editor, range).setNode('codeBlock').run()
  },
  {
    id: 'insert-table',
    label: $gettext('Table'),
    description: $gettext('A three by three table'),
    icon: 'table-2',
    keywords: ['table', 'grid'],
    run: (editor, range) =>
      chain(editor, range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  },
  {
    id: 'insert-horizontal-rule',
    label: $gettext('Horizontal rule'),
    description: $gettext('A dividing line'),
    icon: 'separator',
    keywords: ['rule', 'divider', 'separator', 'hr'],
    run: (editor, range) => chain(editor, range).setHorizontalRule().run()
  }
]

export const filterInsertCommands = (commands: InsertCommand[], query: string): InsertCommand[] => {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return commands
  }
  return commands.filter(
    (command) =>
      command.label.toLowerCase().includes(needle) ||
      command.keywords.some((keyword) => keyword.includes(needle))
  )
}
