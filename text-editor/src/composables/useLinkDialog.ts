import { useGettext } from 'vue3-gettext'
import { useMessages, useModals } from '@ownclouders/web-pkg'
import type { Editor } from '@tiptap/vue-3'
import LinkModal, { type LinkModalResult } from '../components/LinkModal.vue'

/**
 * The add/edit-link dialog, shared by the toolbar button and the selection bubble menu so the two
 * cannot drift apart.
 */
export const useLinkDialog = (getEditor: () => Editor | undefined) => {
  const { $gettext } = useGettext()
  const { dispatchModal } = useModals()
  const { showMessage } = useMessages()

  /**
   * Normalise what people actually type. `example.com` has no scheme, and TipTap's Link extension
   * validates the URI before accepting it, so the mark would silently not apply.
   */
  const normaliseHref = (value: string) => {
    if (
      !value ||
      /^[a-z][a-z0-9+.-]*:/i.test(value) ||
      value.startsWith('/') ||
      value.startsWith('#')
    ) {
      return value
    }
    return `https://${value}`
  }

  const applyLink = (editor: Editor, result: LinkModalResult) => {
    const href = normaliseHref(result.href)
    const { text } = result
    const chain = editor.chain().focus()

    if (!href) {
      chain.extendMarkRange('link').unsetLink().run()
      return
    }

    const { from, to } = editor.state.selection
    const hasSelection = from !== to

    if (hasSelection) {
      const selected = editor.state.doc.textBetween(from, to, ' ')
      if (text && text !== selected) {
        // Replacing the selection and marking the inserted run keeps the caret behaviour the same
        // as a plain edit would.
        chain
          .extendMarkRange('link')
          .insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href } }] })
          .run()
        return
      }
      chain.extendMarkRange('link').setLink({ href }).run()
      return
    }

    // No selection: without inserting something there is nothing for the mark to attach to, which
    // is why applying a link on an empty selection previously appeared to do nothing at all.
    chain
      .insertContent({
        type: 'text',
        text: text || href,
        marks: [{ type: 'link', attrs: { href } }]
      })
      .run()
  }

  /**
   * ModalWrapper only removes the modal when its confirm task resolves — a throw leaves the dialog
   * open with its loading state set, which is indistinguishable from the app hanging. Editing the
   * document can throw for reasons outside this dialog's control (a rejected URI, a stale
   * selection), so failures are reported and swallowed rather than allowed to escape.
   */
  const applyLinkSafely = (editor: Editor, result: LinkModalResult) => {
    try {
      applyLink(editor, result)
    } catch (error) {
      showMessage({
        title: $gettext('The link could not be applied.'),
        status: 'danger',
        desc: (error as Error).message
      })
    }
  }

  const openLinkDialog = () => {
    const editor = getEditor()
    if (!editor) {
      return
    }

    const { from, to } = editor.state.selection
    const hasSelection = from !== to
    const selectedText = hasSelection ? editor.state.doc.textBetween(from, to, ' ') : ''
    const existingHref = (editor.getAttributes('link').href as string | undefined) ?? ''

    // The dialog reports edits into this, and `onConfirm` below applies whatever it last held.
    let pending: LinkModalResult = { href: existingHref, text: selectedText }

    dispatchModal({
      title: existingHref ? $gettext('Edit link') : $gettext('Add link'),
      confirmText: $gettext('Apply'),
      customComponent: LinkModal,
      customComponentAttrs: () => ({
        initialHref: existingHref,
        initialText: selectedText,
        // With a selection, that text is the link text and editing it here would be confusing.
        textEditable: !hasSelection,
        onChange: (result: LinkModalResult) => {
          pending = result
        }
      }),
      // ModalWrapper checks this branch first and removes the modal once it resolves.
      onConfirm: () => applyLinkSafely(editor, pending)
    })
  }

  return { openLinkDialog }
}
