import type { EngineDrawFn } from './CanvasEngine'
import { mulberry32, num, str, withAlpha } from './util'

/**
 * beams — sweeping light beams, additive glow.
 * Params: colors (string[]), count, speed, angle (deg, linear mode),
 *         mode: 'sweep' | 'radial', origin ('left'|'right'|'center').
 * Stateless: every beam's pose is a pure function of t.
 */
export function createBeams(params: Record<string, unknown>): EngineDrawFn {
  const colors = Array.isArray(params.colors) ? (params.colors as string[]) : null
  const accent = str(params.color, '#c8ff00')
  const count = num(params.count, 5)
  const speed = num(params.speed, 0.5)
  const angle = (num(params.angle, -24) * Math.PI) / 180
  const radial = str(params.mode, 'sweep') === 'radial'
  const rand = mulberry32(num(params.seed, 7))
  const beams = Array.from({ length: Math.max(1, Math.round(count)) }, (_, i) => ({
    offset: rand(),
    width: 1 + rand() * 2.5,
    len: 0.55 + rand() * 0.5,
    drift: 0.5 + rand(),
    color: colors?.[i % colors.length] ?? accent,
    phase: rand() * Math.PI * 2,
  }))

  return (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    const diag = Math.hypot(w, h)
    for (const b of beams) {
      const pulse = 0.55 + 0.45 * Math.sin(t * b.drift * 2 + b.phase)
      ctx.strokeStyle = withAlpha(b.color, 0.5 * pulse)
      ctx.lineWidth = b.width
      ctx.shadowColor = b.color
      ctx.shadowBlur = 12 * pulse
      ctx.beginPath()
      if (radial) {
        // Orbital beams rotating around a center point (tunnel / orbit-ring).
        const cx = w / 2
        const cy = h * 0.42
        const a = b.phase + t * speed * b.drift * 0.6
        const inner = diag * 0.05
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)
        ctx.lineTo(cx + Math.cos(a) * diag * b.len, cy + Math.sin(a) * diag * b.len)
      } else {
        // Parallel beams sweeping across the hero at `angle`.
        const travel = w + diag * 0.4
        const x0 = ((b.offset + t * speed * b.drift * 0.08) % 1) * travel - diag * 0.2
        const dx = Math.cos(angle) * diag * b.len * 0.5
        const dy = Math.sin(angle) * diag * b.len * 0.5
        ctx.moveTo(x0, h * 0.9)
        ctx.lineTo(x0 + dx, h * 0.9 + dy)
      }
      ctx.stroke()
    }
    ctx.shadowBlur = 0
    ctx.globalCompositeOperation = 'source-over'
  }
}
