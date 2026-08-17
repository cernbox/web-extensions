import { Extension, type Editor } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { computePosition, flip, shift, offset, type VirtualElement } from '@floating-ui/dom'
import { h, ref, render, type AppContext } from 'vue'
import InsertMenu from '../components/InsertMenu.vue'
import { buildInsertCommands, filterInsertCommands, type InsertCommand } from './insertCommands'

export interface SlashCommandOptions {
  $gettext: (msgid: string) => string
  /**
   * The editor component's app context. The popup renders outside the component tree, so without
   * this it would not resolve the globally registered `oc-*` components or the tooltip directive
   * that the host application installs.
   */
  appContext?: AppContext | null
}

/**
 * Typing "/" at the start of an empty block opens the same insert menu the toolbar's "+" button
 * shows.
 *
 * The popup is rendered into a detached element rather than declared in the editor's template:
 * `@tiptap/suggestion` hands back plain DOM lifecycle callbacks, and the menu has to be positioned
 * against a caret rectangle that only exists inside those callbacks.
 */
export const createSlashCommand = (options: SlashCommandOptions) =>
  Extension.create<SlashCommandOptions>({
    name: 'slashCommand',

    addOptions() {
      return options
    },

    addProseMirrorPlugins() {
      const { $gettext, appContext } = this.options
      const allCommands = buildInsertCommands($gettext)

      const suggestion: Omit<SuggestionOptions<InsertCommand>, 'editor'> = {
        char: '/',
        // Only at the start of a block, so a slash inside a sentence or a URL is left alone.
        startOfLine: true,
        allowSpaces: false,

        items: ({ query }) => filterInsertCommands(allCommands, query),

        command: ({ editor, range, props }) => {
          props.run(editor as Editor, range)
        },

        render: () => {
          let element: HTMLElement | null = null
          const items = ref<InsertCommand[]>([])
          const selectedIndex = ref(0)
          let onPick: (command: InsertCommand) => void = () => undefined

          // Re-render in place. `render` with an appContext keeps the host's global components
          // and directives resolvable outside the editor's own component tree.
          const paint = () => {
            if (!element) {
              return
            }
            const vnode = h(InsertMenu, {
              commands: items.value,
              selectedIndex: selectedIndex.value,
              onSelect: (command: InsertCommand) => onPick(command)
            })
            if (appContext) {
              vnode.appContext = appContext
            }
            render(vnode, element)
          }

          const position = (clientRect: (() => DOMRect | null) | null | undefined) => {
            if (!element || !clientRect) {
              return
            }
            const virtual: VirtualElement = {
              getBoundingClientRect: () => clientRect() ?? new DOMRect()
            }
            computePosition(virtual, element, {
              placement: 'bottom-start',
              middleware: [offset(6), flip(), shift({ padding: 8 })]
            }).then(({ x, y }) => {
              if (!element) {
                return
              }
              Object.assign(element.style, { left: `${x}px`, top: `${y}px` })
            })
          }

          return {
            onStart: (props) => {
              items.value = props.items
              selectedIndex.value = 0
              onPick = (command) => props.command(command)

              element = document.createElement('div')
              element.className = 'cern-insert-menu-popup oc-box-shadow-medium oc-rounded'
              document.body.appendChild(element)

              paint()
              position(props.clientRect)
            },

            onUpdate: (props) => {
              items.value = props.items
              selectedIndex.value = 0
              onPick = (command) => props.command(command)
              paint()
              position(props.clientRect)
            },

            onKeyDown: ({ event }) => {
              const count = items.value.length
              if (event.key === 'Escape') {
                return true
              }
              if (!count) {
                return false
              }
              if (event.key === 'ArrowDown') {
                selectedIndex.value = (selectedIndex.value + 1) % count
                paint()
                return true
              }
              if (event.key === 'ArrowUp') {
                selectedIndex.value = (selectedIndex.value - 1 + count) % count
                paint()
                return true
              }
              if (event.key === 'Enter' || event.key === 'Tab') {
                onPick(items.value[selectedIndex.value])
                return true
              }
              return false
            },

            onExit: () => {
              if (element) {
                // Unmount the vnode before dropping the host element, so InsertMenu's own
                // teardown runs instead of the DOM simply disappearing under it.
                render(null, element)
                element.remove()
              }
              element = null
            }
          }
        }
      }

      return [Suggestion({ editor: this.editor, ...suggestion })]
    }
  })
