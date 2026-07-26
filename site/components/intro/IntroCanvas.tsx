'use client'

import { useEffect, useRef } from 'react'
import type { IntroParticlesHandle } from './intro-particles'

interface IntroCanvasProps {
  onReady: (handle: IntroParticlesHandle) => void
  /** WebGL context creation/init failed — intro continues DOM-only. */
  onFail: () => void
}

/**
 * Lazy three.js particle backdrop for the intro. Follows the FluidImage
 * precedent: `await import('./intro-particles')` (which itself imports
 * `three`) inside an effect with a cancelled guard, and full disposal on
 * unmount. Renders nothing but the canvas element.
 */
export default function IntroCanvas({ onReady, onFail }: IntroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Stable callback refs so the effect never re-runs on parent re-renders
  // (the counter setState would otherwise tear down and rebuild the scene).
  const onReadyRef = useRef(onReady)
  const onFailRef = useRef(onFail)
  onReadyRef.current = onReady
  onFailRef.current = onFail

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let handle: IntroParticlesHandle | null = null
    const lowTier = (navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 768

    import('./intro-particles')
      .then((m) => m.initIntroParticles(canvas, { lowTier }))
      .then((h) => {
        if (cancelled) {
          h.dispose()
          return
        }
        handle = h
        onReadyRef.current(h)
      })
      .catch(() => {
        if (!cancelled) onFailRef.current()
      })

    return () => {
      cancelled = true
      handle?.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 h-full w-full"
    />
  )
}
