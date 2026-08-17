/**
 * Parse delimited text into rows of cells, following RFC 4180: fields may be quoted, a quoted
 * field may contain the delimiter and newlines, and `""` inside a quoted field is a literal quote.
 *
 * Hand-written rather than pulled from a library because the preview needs nothing else, and the
 * extension already ships a large bundle.
 */
export const parseDelimited = (input: string, delimiter = ','): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (inQuotes) {
      if (char !== '"') {
        cell += char
        continue
      }
      if (input[i + 1] === '"') {
        cell += '"'
        i++
        continue
      }
      inQuotes = false
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === delimiter) {
      row.push(cell)
      cell = ''
      continue
    }

    if (char === '\r') {
      // Swallow CR so CRLF ends the row exactly once.
      continue
    }

    if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  // A file not ending in a newline still has a final row to flush; one that does must not
  // contribute a spurious empty row.
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}
