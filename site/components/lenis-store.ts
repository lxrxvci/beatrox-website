import type Lenis from 'lenis'

/**
 * Module-level handle to the global Lenis instance (owned by SmoothScroll)
 * so velocity-reactive components (ticker, marquee) can subscribe to it.
 */
let instance: Lenis | null = null

export function setLenis(lenis: Lenis | null) {
  instance = lenis
}

export function getLenis(): Lenis | null {
  return instance
}
