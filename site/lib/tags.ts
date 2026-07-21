/**
 * Humanize a kebab-case project tag for display.
 * "ai-computer-vision" → "AI & Computer Vision"
 */
const ACRONYMS = new Set(['ai', 'vr', 'ar', 'xr', 'led'])

export function humanizeTag(tag: string): string {
  return tag
    .split('-')
    .map((word) => {
      if (ACRONYMS.has(word)) return word.toUpperCase()
      if (word === 'and') return '&'
      if (!word) return ''
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .trim()
}
