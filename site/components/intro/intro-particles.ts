/**
 * Particle scene module (three.js, vanilla) — dynamically imported by the
 * intro so `three` never enters the initial bundle (mirrors FluidImage).
 *
 * Phase 3 implements the real scene; this stub keeps the Phase 2 timeline
 * types honest.
 */

export interface IntroParticlesHandle {
  /** Converge the field into sampled text pixels (default "BEATROX"). */
  morphTo(text?: string): void
  /** Blow the formation back out into a loose drift. */
  scatter(): void
  /** Part the field like a curtain for the hero match-frame. */
  part(): void
  /** Stop all tweens immediately (user skipped to the dissolve). */
  skip(): void
  /** Kill the render loop and dispose geometry/material/renderer. */
  dispose(): void
}
