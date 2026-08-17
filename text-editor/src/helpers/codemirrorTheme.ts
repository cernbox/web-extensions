import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark'

/**
 * CodeMirror styling for both the standalone code editor and the code blocks embedded in the
 * Markdown editor.
 *
 * Only the *syntax colours* are taken from one-dark. The full `oneDark` theme also paints its own
 * background (`#282c34`), which does not match the surface the design system puts behind it — in
 * dark mode that showed as a visibly different panel next to the surrounding editor. Here the
 * background stays transparent so whatever the host renders behind shows through, and the two
 * editors look like one document.
 */
/**
 * The design system defines no monospace token, and setting the family on `.cm-scroller` alone let
 * the application's own font rules win for the gutter — so the line numbers were rendered in a
 * proportional face and their digits did not line up.
 *
 * Applied to the content and the gutter explicitly, with tabular figures so every digit occupies
 * the same advance width even in faces whose default numerals are proportional.
 */
const MONO_STACK =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

export const codemirrorTheme = (isDark: boolean): Extension => [
  EditorView.theme(
    {
      '&': {
        backgroundColor: 'transparent',
        color: 'var(--oc-color-text-default)'
      },
      '.cm-content, .cm-gutters, .cm-tooltip-autocomplete': {
        fontFamily: MONO_STACK,
        fontFeatureSettings: '"tnum"',
        fontVariantNumeric: 'tabular-nums'
      },
      '.cm-content': {
        caretColor: 'var(--oc-color-text-default)'
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--oc-color-text-default)'
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--oc-color-text-muted)',
        // Digits are the same width now, so the column can align on the right and stay steady as
        // the count crosses into more digits.
        userSelect: 'none'
      },
      '.cm-lineNumbers .cm-gutterElement': {
        minWidth: '2.5ch',
        padding: '0 var(--oc-space-xsmall) 0 var(--oc-space-small)',
        textAlign: 'right'
      },
      // The selection is painted in a layer *behind* the content, so an opaque active-line
      // background hid it completely whenever the selection stayed on the cursor's own line.
      '.cm-activeLine': {
        backgroundColor: 'color-mix(in srgb, var(--oc-color-background-hover) 45%, transparent)'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: 'var(--oc-color-text-default)'
      },
      '.cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'var(--oc-color-input-border)'
      },
      // CodeMirror's own base theme targets the focused selection through the full layer chain,
      // which outweighs a shorter selector here — so the focused case has to match it selector
      // for selector or the default purple wins.
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
        backgroundColor: 'var(--oc-color-input-border)'
      },
      // The search and go-to-line panels ship unstyled defaults that look nothing like the rest
      // of the app, so they are rebuilt from the design system's tokens.
      '.cm-panels': {
        backgroundColor: 'var(--oc-color-background-default)',
        color: 'var(--oc-color-text-default)'
      },
      '.cm-panels.cm-panels-top': {
        borderBottom: '1px solid var(--oc-color-border)'
      },
      '.cm-panels.cm-panels-bottom': {
        borderTop: '1px solid var(--oc-color-border)'
      },
      '.cm-panel': {
        fontFamily: 'inherit',
        fontSize: 'var(--oc-font-size-small, 0.875rem)',
        padding: 'var(--oc-space-xsmall) var(--oc-space-small)'
      },
      // Deliberately NOT a flex container. CodeMirror's markup relies on a plain <br> to put the
      // replace controls on a second row, and inside a flex container a <br> becomes a flex item
      // rather than a line break — which collapsed the whole panel onto one line.
      '.cm-panel.cm-search label': {
        fontSize: 'var(--oc-font-size-xsmall, 0.75rem)'
      },
      '.cm-textfield': {
        backgroundColor: 'var(--oc-color-background-default)',
        border: '1px solid var(--oc-color-input-border, var(--oc-color-border))',
        borderRadius: '4px',
        color: 'var(--oc-color-text-default)',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        padding: '4px 8px'
      },
      '.cm-textfield:focus': {
        borderColor: 'var(--oc-color-swatch-primary-default)',
        outline: 'none'
      },
      '.cm-button': {
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        border: '1px solid var(--oc-color-border)',
        borderRadius: '4px',
        color: 'var(--oc-color-text-default)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        padding: '4px 10px'
      },
      '.cm-button:hover': {
        backgroundColor: 'var(--oc-color-background-hover)'
      },
      '.cm-button:active': {
        backgroundImage: 'none'
      },
      // The base theme already positions this absolutely in the corner; only the colour changes.
      '.cm-panel.cm-search [name=close]': {
        color: 'var(--oc-color-text-muted)',
        cursor: 'pointer'
      },
      '.cm-panel.cm-search [name=close]:hover': {
        color: 'var(--oc-color-text-default)'
      },
      '.cm-searchMatch': {
        backgroundColor: 'var(--oc-color-swatch-warning-muted, rgba(255, 200, 0, 0.3))'
      },
      '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
        backgroundColor: 'var(--oc-color-background-hover)',
        outline: '1px solid var(--oc-color-border)'
      },
      '.cm-tooltip': {
        backgroundColor: 'var(--oc-color-background-default)',
        border: '1px solid var(--oc-color-border)',
        color: 'var(--oc-color-text-default)'
      }
    },
    { dark: isDark }
  ),
  syntaxHighlighting(isDark ? oneDarkHighlightStyle : defaultHighlightStyle, { fallback: true })
]
