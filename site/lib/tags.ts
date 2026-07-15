/**
 * Humanize a kebab-case project tag for display.
 * "ai-computer-vision" → "AI & Computer Vision"
 */
export function humanizeTag(tag: string): string {
  return tag
    .split('-')
    .map((word) => {
      if (word === 'ai') return 'AI'
      if (word === 'and') return '&'
      if (!word) return ''
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .trim()
}
