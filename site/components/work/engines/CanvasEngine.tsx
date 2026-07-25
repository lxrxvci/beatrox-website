'use client'

import { useEffect, useRef } from 'react'

/** Per-frame draw callback. `t` is seconds since the loop started. */
export type EngineDrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void

interface CanvasEngineProps {
  draw: EngineDrawFn
  className?: string
}

/**
 * Shared canvas runtime for hero atmosphere engines:
 * - sizes to its parent via ResizeObserver, DPR capped at 2
 * - rAF loop that only runs while on screen (IntersectionObserver)
 * - prefers-reduced-motion: renders one static frame, never loops
 * - full cleanup on unmount; canvas is aria-hidden + pointer-events-none
 */
export default function CanvasEngine({ draw, className = '' }: CanvasEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    let running = false
    let start = 0
    let disposed = false

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const frame = (now: number) => {
      if (!running) return
      drawRef.current(ctx, w, h, (now - start) / 1000)
      raf = requestAnimationFrame(frame)
    }

    const play = () => {
      if (running || disposed || reduced || w === 0) return
      running = true
      start = performance.now()
      raf = requestAnimationFrame(frame)
    }

    const pause = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    resize()

    if (reduced) {
      // Static frame at a pleasant mid-loop timestamp; no animation.
      drawRef.current(ctx, w, h, 2.4)
      return () => {}
    }

    const ro = new ResizeObserver(() => {
      resize()
      if (!running) drawRef.current(ctx, w, h, 0)
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) play()
        else pause()
      },
      { threshold: 0.05 },
    )
    io.observe(canvas)

    return () => {
      disposed = true
      pause()
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
