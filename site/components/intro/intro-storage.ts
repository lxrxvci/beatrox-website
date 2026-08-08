/**
 * Gating + persistence for the first-visit intro overlay.
 *
 * The intro shows only when ALL of these hold (see plan §3.3):
 * - `beatrox-intro-seen` is unset in sessionStorage (first visit this session)
 * - `prefers-reduced-motion: no-preference` (reduced-motion never mounts it)
 * - `?intro=0` is not present (kill switch)
 * `?intro=1` forces a replay for QA (still blocked by reduced-motion).
 *
 * All functions are client-only, callers must invoke them from effects.
 */

export const INTRO_STORAGE_KEY = 'beatrox-intro-seen'
export const INTRO_COMPLETE_EVENT = 'intro:complete'

type IntroMode = 'force' | 'kill' | 'auto'

function getIntroMode(): IntroMode {
  const value = new URLSearchParams(window.location.search).get('intro')
  if (value === '1') return 'force'
  if (value === '0') return 'kill'
  return 'auto'
}

export function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) === '1'
  } catch {
    // sessionStorage unavailable (private mode), fail closed, no intro loops.
    return true
  }
}

export function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, '1')
  } catch {
    /* private mode, intro simply may replay next load */
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Pure read, safe to call from multiple components; never mutates state. */
export function shouldRunIntro(): boolean {
  if (prefersReducedMotion()) return false
  const mode = getIntroMode()
  if (mode === 'force') return true
  if (mode === 'kill') return false
  return !hasSeenIntro()
}
