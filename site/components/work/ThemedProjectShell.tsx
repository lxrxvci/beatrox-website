import type { CSSProperties, ReactNode } from 'react'
import { getProjectTheme, themeToCssVars } from './project-themes'

interface ThemedProjectShellProps {
  slug: string
  children: ReactNode
}

/**
 * Server-safe wrapper that scopes a project's theme (accent palette) to its
 * page by overriding the site's CSS variables on a plain wrapper div. All
 * existing markup — including every Editable* wrapper and fieldPath — lives
 * untouched inside; the shell only re-skins via inherited custom properties.
 */
export default function ThemedProjectShell({ slug, children }: ThemedProjectShellProps) {
  const theme = getProjectTheme(slug)
  return (
    <div
      className="project-theme"
      style={{ ...themeToCssVars(theme), backgroundColor: 'var(--bg-primary)' } as CSSProperties}
    >
      {children}
    </div>
  )
}
