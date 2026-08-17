/**
 * One button in an editor toolbar. Shared by the Markdown and code toolbars so both render
 * through `EditorToolbar.vue` and stay visually identical.
 */
export interface ToolbarItem {
  id: string
  label: string
  icon: string
  /**
   * How `OcIcon` resolves the asset: `none` loads `<name>.svg`, anything else loads
   * `<name>-<fillType>.svg`.
   *
   * Most editor and formatting glyphs in the icon set exist only under the bare name, which is
   * why this defaults to `none` — passing `line` for those silently renders nothing, because the
   * file does not exist. `dev/verify-icons.mjs` checks every value here against the real asset
   * list; run it after adding an item.
   */
  fillType?: 'none' | 'line' | 'fill'
  run: () => void
  /** Rendered as a pressed toggle when this returns true. */
  isActive?: () => boolean
  /** Greyed out and non-interactive when this returns true. */
  isDisabled?: () => boolean
}

export type ToolbarGroup = ToolbarItem[]

/**
 * A set of related actions collapsed behind a single button, so the bar does not become a wall of
 * similar glyphs. Headings are the obvious case.
 */
export interface ToolbarMenu {
  id: string
  label: string
  icon: string
  fillType?: 'none' | 'line' | 'fill'
  items: ToolbarItem[]
  isActive?: () => boolean
}

export const isMenu = (entry: ToolbarItem | ToolbarMenu): entry is ToolbarMenu =>
  Object.prototype.hasOwnProperty.call(entry, 'items')
