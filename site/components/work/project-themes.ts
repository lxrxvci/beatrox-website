/**
 * Per-project theme registry — "17 projects, 17 identities".
 *
 * Each `/work/[slug]` page is wrapped in `ThemedProjectShell`, which scopes
 * the site's CSS variables (`--accent`, `--accent-glow`, `--accent-rgb`,
 * optionally `--bg-primary`) to the page. Hud-chips, overlines, buttons,
 * NodeBullets and card glows re-skin automatically with zero markup changes.
 *
 * The `engine` + `engineParams` drive the hero atmosphere canvas
 * (`components/work/engines/`), `heroIntro` selects the KineticHeading
 * reveal variant. Projects without an entry fall back to `DEFAULT_THEME`
 * (the current acid-lime look), so new CMS content never breaks.
 */

export type EngineKind =
  | 'beams'
  | 'particles'
  | 'pixelgrid'
  | 'scansweep'
  | 'gradientfog'
  | 'equalizer'

export type HeroIntro = 'laser-draw' | 'glitch' | 'iris' | 'wipe' | 'rise'

export interface ProjectTheme {
  /** Page-scoped --accent */
  accent: string
  /** Page-scoped --accent-glow (derived from accent at 0.35 alpha when omitted) */
  accentGlow?: string
  /** Page-scoped --bg-primary (default: keep site black) */
  bg?: string
  engine: EngineKind
  /** Colors, density, speed, direction — consumed by the engine factory */
  engineParams?: Record<string, unknown>
  heroIntro: HeroIntro
}

/** Fallback for any project without a registry entry — the current site look. */
export const DEFAULT_THEME: ProjectTheme = {
  accent: '#c8ff00',
  engine: 'particles',
  engineParams: { preset: 'motes', count: 40, speed: 0.4 },
  heroIntro: 'rise',
}

/** Keyed by canonical project slug. Filled in with the 17 identities. */
export const PROJECT_THEMES: Record<string, ProjectTheme> = {}

export function getProjectTheme(slug: string): ProjectTheme {
  return PROJECT_THEMES[slug] ?? DEFAULT_THEME
}

/** '#rrggbb' → 'r, g, b' for use inside rgba(var(--accent-rgb), α). */
export function hexToRgbTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return '200, 255, 0'
  const n = parseInt(m[1], 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

/** CSS variable overrides applied by ThemedProjectShell's wrapper div. */
export function themeToCssVars(theme: ProjectTheme): Record<string, string> {
  const vars: Record<string, string> = {
    '--accent': theme.accent,
    '--accent-rgb': hexToRgbTriplet(theme.accent),
    '--accent-glow': theme.accentGlow ?? `rgba(${hexToRgbTriplet(theme.accent)}, 0.35)`,
  }
  if (theme.bg) vars['--bg-primary'] = theme.bg
  return vars
}
