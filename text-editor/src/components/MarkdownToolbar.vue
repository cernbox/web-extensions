<template>
  <editor-toolbar :groups="isReadOnly ? [] : groups">
    <template #right>
      <oc-button
        v-oc-tooltip="$gettext('Decrease font size')"
        :aria-label="$gettext('Decrease font size')"
        :disabled="!canZoomOut"
        class="cern-editor-toolbar-button"
        appearance="raw"
        @click="emit('zoomOut')"
      >
        <oc-icon name="zoom-out" fill-type="line" size="small" />
      </oc-button>
      <oc-button
        v-oc-tooltip="$gettext('Reset font size')"
        :aria-label="$gettext('Reset font size')"
        :disabled="!canResetZoom"
        class="cern-editor-toolbar-button"
        appearance="raw"
        @click="emit('resetZoom')"
      >
        <oc-icon name="font-size" fill-type="none" size="small" />
      </oc-button>
      <oc-button
        v-oc-tooltip="$gettext('Increase font size')"
        :aria-label="$gettext('Increase font size')"
        :disabled="!canZoomIn"
        class="cern-editor-toolbar-button"
        appearance="raw"
        @click="emit('zoomIn')"
      >
        <oc-icon name="zoom-in" fill-type="line" size="small" />
      </oc-button>
      <oc-button
        v-oc-tooltip="outlineVisible ? $gettext('Hide the outline') : $gettext('Show the outline')"
        :aria-label="outlineVisible ? $gettext('Hide the outline') : $gettext('Show the outline')"
        :aria-pressed="outlineVisible"
        :class="['cern-editor-toolbar-button', { 'cern-editor-toolbar-active': outlineVisible }]"
        appearance="raw"
        @click="emit('toggleOutline')"
      >
        <oc-icon name="list-unordered" fill-type="none" size="small" />
        <span class="oc-ml-xs">{{ $gettext('Outline') }}</span>
      </oc-button>
      <oc-button
        v-oc-tooltip="sourceLabel"
        :aria-label="sourceLabel"
        class="cern-editor-toolbar-button"
        appearance="raw"
        @click="emit('toggleSource')"
      >
        <oc-icon name="code-s-slash" fill-type="line" size="small" />
        <span class="oc-ml-xs">{{ $gettext('Source') }}</span>
      </oc-button>
    </template>
  </editor-toolbar>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import type { Editor } from '@tiptap/vue-3'
import EditorToolbar from './EditorToolbar.vue'
import { diagramTemplates } from '../helpers/mermaid'
import { useLinkDialog } from '../composables/useLinkDialog'
import type { ToolbarItem, ToolbarMenu } from '../helpers/toolbar'

interface Props {
  editor: Editor
  isReadOnly?: boolean
  outlineVisible?: boolean
  canZoomIn?: boolean
  canZoomOut?: boolean
  canResetZoom?: boolean
}
interface Emits {
  (e: 'toggleSource'): void
  (e: 'toggleOutline'): void
  (e: 'zoomIn'): void
  (e: 'zoomOut'): void
  (e: 'resetZoom'): void
}
const {
  editor,
  isReadOnly = false,
  outlineVisible = false,
  canZoomIn = true,
  canZoomOut = true
} = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $gettext } = useGettext()

const sourceLabel = computed(() =>
  isReadOnly ? $gettext('View the raw Markdown source') : $gettext('Edit the raw Markdown source')
)
const { openLinkDialog } = useLinkDialog(() => editor)

const headingLevels = [1, 2, 3, 4] as const

const groups = computed<(ToolbarItem | ToolbarMenu)[][]>(() => [
  [
    {
      id: 'bold',
      label: $gettext('Bold'),
      icon: 'bold',
      run: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold')
    },
    {
      id: 'italic',
      label: $gettext('Italic'),
      icon: 'italic',
      run: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic')
    },
    {
      id: 'strike',
      label: $gettext('Strikethrough'),
      icon: 'strikethrough',
      run: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike')
    },
    {
      id: 'code',
      label: $gettext('Inline code'),
      icon: 'code-s-slash',
      fillType: 'line',
      run: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code')
    }
  ],
  [
    {
      id: 'headings',
      label: $gettext('Heading'),
      icon: 'heading',
      items: headingLevels.map((level) => ({
        id: `h${level}`,
        label: $gettext('Heading %{level}').replace('%{level}', String(level)),
        icon: `h-${level}`,
        run: () => editor.chain().focus().toggleHeading({ level }).run(),
        isActive: () => editor.isActive('heading', { level })
      })),
      isActive: () => editor.isActive('heading')
    },
    {
      id: 'lists',
      label: $gettext('List'),
      icon: 'list-unordered',
      items: [
        {
          id: 'bullet-list',
          label: $gettext('Bullet list'),
          icon: 'list-unordered',
          run: () => editor.chain().focus().toggleBulletList().run(),
          isActive: () => editor.isActive('bulletList')
        },
        {
          id: 'ordered-list',
          label: $gettext('Numbered list'),
          icon: 'list-ordered',
          run: () => editor.chain().focus().toggleOrderedList().run(),
          isActive: () => editor.isActive('orderedList')
        },
        {
          id: 'task-list',
          label: $gettext('Task list'),
          icon: 'list-check-2',
          run: () => editor.chain().focus().toggleTaskList().run(),
          isActive: () => editor.isActive('taskList')
        }
      ],
      isActive: () =>
        editor.isActive('bulletList') ||
        editor.isActive('orderedList') ||
        editor.isActive('taskList')
    }
  ],
  [
    {
      id: 'blockquote',
      label: $gettext('Quote'),
      icon: 'double-quotes-l',
      run: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote')
    },
    {
      id: 'code-block',
      label: $gettext('Code block'),
      icon: 'code-box',
      fillType: 'line',
      run: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive('codeBlock')
    },
    {
      id: 'table',
      label: $gettext('Table'),
      icon: 'table-2',
      items: [
        {
          id: 'table-insert',
          label: $gettext('Insert table'),
          icon: 'table-2',
          run: () =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        },
        {
          id: 'table-add-row-before',
          label: $gettext('Insert row above'),
          icon: 'insert-row-top',
          run: () => editor.chain().focus().addRowBefore().run(),
          isDisabled: () => !editor.can().addRowBefore()
        },
        {
          id: 'table-add-row-after',
          label: $gettext('Insert row below'),
          icon: 'insert-row-bottom',
          run: () => editor.chain().focus().addRowAfter().run(),
          isDisabled: () => !editor.can().addRowAfter()
        },
        {
          id: 'table-delete-row',
          label: $gettext('Delete row'),
          icon: 'delete-row',
          run: () => editor.chain().focus().deleteRow().run(),
          isDisabled: () => !editor.can().deleteRow()
        },
        {
          id: 'table-add-column-before',
          label: $gettext('Insert column left'),
          icon: 'insert-column-left',
          run: () => editor.chain().focus().addColumnBefore().run(),
          isDisabled: () => !editor.can().addColumnBefore()
        },
        {
          id: 'table-add-column-after',
          label: $gettext('Insert column right'),
          icon: 'insert-column-right',
          run: () => editor.chain().focus().addColumnAfter().run(),
          isDisabled: () => !editor.can().addColumnAfter()
        },
        {
          id: 'table-delete-column',
          label: $gettext('Delete column'),
          icon: 'delete-column',
          run: () => editor.chain().focus().deleteColumn().run(),
          isDisabled: () => !editor.can().deleteColumn()
        },
        {
          id: 'table-toggle-header-row',
          label: $gettext('Toggle header row'),
          icon: 'table-line',
          fillType: 'none',
          run: () => editor.chain().focus().toggleHeaderRow().run(),
          isDisabled: () => !editor.can().toggleHeaderRow()
        },
        {
          id: 'table-delete',
          label: $gettext('Delete table'),
          icon: 'delete-bin',
          fillType: 'line',
          run: () => editor.chain().focus().deleteTable().run(),
          isDisabled: () => !editor.can().deleteTable()
        }
      ],
      isActive: () => editor.isActive('table')
    },
    {
      id: 'horizontal-rule',
      label: $gettext('Horizontal rule'),
      icon: 'separator',
      run: () => editor.chain().focus().setHorizontalRule().run()
    },
    {
      id: 'diagram',
      label: $gettext('Diagram'),
      icon: 'flow-chart',
      items: diagramTemplates($gettext).map((template) => ({
        id: `diagram-${template.id}`,
        label: template.label,
        icon: 'flow-chart',
        run: () => insertDiagram(template.code)
      })),
      isActive: () => editor.isActive('codeBlock', { language: 'mermaid' })
    },
    {
      id: 'link',
      label: $gettext('Add or edit link'),
      icon: 'link',
      run: () => openLinkDialog(),
      isActive: () => editor.isActive('link')
    }
  ],
  [
    {
      id: 'undo',
      label: $gettext('Undo'),
      icon: 'arrow-go-back',
      fillType: 'line',
      run: () => editor.chain().focus().undo().run(),
      isDisabled: () => !editor.can().undo()
    },
    {
      id: 'redo',
      label: $gettext('Redo'),
      icon: 'arrow-go-forward',
      fillType: 'line',
      run: () => editor.chain().focus().redo().run(),
      isDisabled: () => !editor.can().redo()
    }
  ]
])

/**
 * Insert a ```mermaid fenced block holding the chosen template. It is an ordinary code block with
 * `language: 'mermaid'`, so it serialises to Markdown like any other fence and renders as a
 * diagram in the editor.
 */
const insertDiagram = (code: string) => {
  editor
    .chain()
    .focus()
    .insertContent({
      type: 'codeBlock',
      attrs: { language: 'mermaid' },
      content: [{ type: 'text', text: code }]
    })
    .run()
}
</script>
