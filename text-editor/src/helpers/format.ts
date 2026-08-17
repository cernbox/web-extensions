import { grammarForLanguage } from './fileTypes'

/**
 * Re-indent a document.
 *
 * Only JSON is supported, and deliberately so: it needs no dependency, because the parser is in
 * the platform. Covering js/css/markdown/yaml as well means Prettier and its plugins, which
 * measured at +308 kB gzipped on this bundle — a third again on top of what mermaid already costs.
 * If that trade is ever worth making, this is the single place to widen.
 *
 * Nothing here formats Python, Go, C++ or shell; those have no cheap JavaScript formatter.
 */
export const isFormattable = (language?: string): boolean => grammarForLanguage(language) === 'json'

export interface FormatResult {
  text?: string
  error?: string
}

const INDENT = 2

export const formatCode = (text: string, language?: string): FormatResult => {
  if (!isFormattable(language)) {
    return {}
  }
  if (!text.trim()) {
    return { text }
  }
  try {
    return { text: JSON.stringify(JSON.parse(text), null, INDENT) }
  } catch (error) {
    // Reported rather than swallowed: pressing Format on a file that does not parse should say so,
    // not appear to do nothing.
    return { error: (error as Error).message }
  }
}
