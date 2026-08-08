/**
 * Per-project theme registry, "17 projects, 17 identities".
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
  /** Colors, density, speed, direction, consumed by the engine factory */
  engineParams?: Record<string, unknown>
  heroIntro: HeroIntro
}

/** Fallback for any project without a registry entry, the current site look. */
export const DEFAULT_THEME: ProjectTheme = {
  accent: '#c8ff00',
  engine: 'particles',
  engineParams: { preset: 'motes', count: 40, speed: 0.4 },
  heroIntro: 'rise',
}

/** Keyed by canonical project slug. */
export const PROJECT_THEMES: Record<string, ProjectTheme> = {
  // Metaverse city, violet fog drifting over the skyline.
  'aku-world': {
    accent: '#a78bfa',
    engine: 'gradientfog',
    engineParams: { colors: ['#a78bfa', '#7c5ce0', '#c4b5fd'], count: 5, alpha: 0.15, speed: 0.8 },
    heroIntro: 'iris',
  },
  // NewFronts stage orbs, teal LED pulse.
  buzzfeed: {
    accent: '#4fd1c5',
    engine: 'pixelgrid',
    engineParams: { color: '#4fd1c5', cell: 24, mode: 'pulse', intensity: 0.4, speed: 1 },
    heroIntro: 'rise',
  },
  // Election-night projection, signal red scan with static.
  'cnn-road-to-270': {
    accent: '#ff3b3b',
    engine: 'scansweep',
    engineParams: { color: '#ff3b3b', axis: 'x', speed: 0.35, noise: 40, trail: 0.22 },
    heroIntro: 'glitch',
  },
  // Cyc-wall projection stage, warm amber wash.
  'create-our-future': {
    accent: '#e8c15a',
    engine: 'gradientfog',
    engineParams: { colors: ['#e8c15a', '#c98a3a', '#f2dfa0'], count: 4, alpha: 0.13, speed: 0.7 },
    heroIntro: 'wipe',
  },
  // Journey's minimal silver, sparse monochrome chrome motes.
  destination: {
    accent: '#e5e5e5',
    engine: 'particles',
    engineParams: { color: '#e5e5e5', preset: 'stars', count: 26, speed: 0.6 },
    heroIntro: 'rise',
  },
  // Medieval poison shop, torch embers rising.
  disenchantment: {
    accent: '#e07b39',
    engine: 'particles',
    engineParams: { color: '#e07b39', preset: 'embers', count: 50, speed: 1 },
    heroIntro: 'iris',
  },
  // Spherical theatre, desert gold orbital beams.
  'dubai-360-spherical-projection-theatre': {
    accent: '#d4a94e',
    engine: 'beams',
    engineParams: { color: '#d4a94e', mode: 'radial', count: 7, speed: 0.6 },
    heroIntro: 'iris',
  },
  // Desert noir, heat-dust amber drift.
  'el-camino': {
    accent: '#d9a441',
    engine: 'particles',
    engineParams: { color: '#d9a441', preset: 'dust', count: 45, speed: 0.9 },
    heroIntro: 'wipe',
  },
  // Thermal history wall, infrared horizontal sweep.
  flir: {
    accent: '#ff9d00',
    engine: 'scansweep',
    engineParams: { color: '#ff9d00', axis: 'y', speed: 0.3, noise: 14, trail: 0.35 },
    heroIntro: 'wipe',
  },
  // C-HR teal light tunnel, radial beams from the vanishing point.
  'g-man-experiential-campaign': {
    accent: '#2dd4bf',
    engine: 'beams',
    engineParams: { color: '#2dd4bf', mode: 'radial', count: 9, speed: 0.85 },
    heroIntro: 'rise',
  },
  // Amazon Music, violet equalizer along the hero base.
  'infinite-playlist': {
    accent: '#9f7aea',
    engine: 'equalizer',
    engineParams: { color: '#9f7aea', bars: 56, height: 0.45, alpha: 0.5, speed: 1 },
    heroIntro: 'rise',
  },
  // Foggy LED bodega, amber rain and tube glow.
  myshelter: {
    accent: '#e0b45c',
    engine: 'particles',
    engineParams: { color: '#e0b45c', preset: 'rain', count: 90, speed: 1 },
    heroIntro: 'wipe',
  },
  // Racing Extinction, oceanic projection sweep.
  'projecting-change-racing-extinction': {
    accent: '#5ec8e5',
    engine: 'scansweep',
    engineParams: { color: '#5ec8e5', axis: 'y', speed: 0.22, noise: 10, trail: 0.4 },
    heroIntro: 'iris',
  },
  // Adriatique X, crimson laser show.
  'projekt-x': {
    accent: '#ff2d55',
    engine: 'beams',
    engineParams: { colors: ['#ff2d55', '#ff7a95'], mode: 'sweep', count: 6, speed: 1.2, angle: -28 },
    heroIntro: 'laser-draw',
  },
  // Ocean LED tunnel, rolling wave grid.
  'run-for-the-oceans': {
    accent: '#38bdf8',
    engine: 'pixelgrid',
    engineParams: { color: '#38bdf8', cell: 28, mode: 'wave', intensity: 0.45, speed: 1.1 },
    heroIntro: 'rise',
  },
  // Marble projection, limestone haze.
  'super-bowl-2020': {
    accent: '#c9c4a3',
    engine: 'gradientfog',
    engineParams: { colors: ['#c9c4a3', '#8f8a72', '#e6e1c8'], count: 4, alpha: 0.11, speed: 0.6 },
    heroIntro: 'wipe',
  },
  // Escape vaults, slow steel-and-gold scan.
  'the-great-escape': {
    accent: '#d4af37',
    engine: 'scansweep',
    engineParams: { color: '#d4af37', axis: 'x', speed: 0.14, noise: 8, trail: 0.42 },
    heroIntro: 'iris',
  },
}

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
