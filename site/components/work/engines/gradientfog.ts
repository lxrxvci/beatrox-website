import type { EngineDrawFn } from './CanvasEngine'
import { mulberry32, num, str, withAlpha } from './util'

/**
 * gradientfog — slow-drifting radial gradient blobs, additive blend.
 * Params: colors (string[]), count, speed, alpha (peak per-blob), scale.
 * Stateless: blob centers follow Lissajous paths from their seeds.
 */
export function createGradientFog(params: Record<string, unknown>): EngineDrawFn {
  const colors = Array.isArray(params.colors) && params.colors.length > 0
    ? (params.colors as string[])
    : [str(params.color, '#c8ff00')]
  const count = Math.round(num(params.count, 4))
  const speed = num(params.speed, 1)
  const peak = num(params.alpha, 0.16)
  const scale = num(params.scale, 0.45)
  const rand = mulberry32(num(params.seed, 5))
  const blobs = Array.from({ length: Math.max(1, count) }, (_, i) => ({
    color: colors[i % colors.length],
    ax: 0.2 + rand() * 0.6,
    ay: 0.15 + rand() * 0.5,
    fx: 0.08 + rand() * 0.16,
    fy: 0.06 + rand() * 0.12,
    px: rand() * Math.PI * 2,
    py: rand() * Math.PI * 2,
    r: 0.6 + rand() * 0.6,
  }))

  return (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    const base = Math.max(w, h) * scale
    for (const b of blobs) {
      const x = w * (0.5 + b.ax * 0.5 * Math.sin(t * b.fx * speed * Math.PI * 2 + b.px))
      const y = h * (0.5 + b.ay * 0.5 * Math.cos(t * b.fy * speed * Math.PI * 2 + b.py))
      const r = base * b.r
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, withAlpha(b.color, peak))
      g.addColorStop(1, withAlpha(b.color, 0))
      ctx.fillStyle = g
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
    ctx.globalCompositeOperation = 'source-over'
  }
}
