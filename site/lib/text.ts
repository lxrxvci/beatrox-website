/**
 * Truncate at the last word boundary within `max` chars so card excerpts
 * never cut mid-word. CSS `line-clamp` alone can slice words at narrow
 * widths, so excerpts are pre-truncated here instead.
 */
export function truncateAtWord(text: string, max = 110): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}
