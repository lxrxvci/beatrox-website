import type { EngineDrawFn } from './CanvasEngine'
import { mulberry32, num, str, withAlpha } from './util'

/**
 * scansweep — a scan line with a soft trailing gradient sweeping the hero,
 * plus faint static ticks (signal-noise texture) behind it.
 * Params: color, speed, axis ('x' vertical line | 'y' horizontal line),
 *         trail (0..1 length of the gradient tail), noise (tick count).
 */
export function createScanSweep(params: Record<string, unknown>): EngineDrawFn {
  const color = str(params.color, '#c8ff00')
  const speed = num(params.speed, 0.25)
  const horizontal = str(params.axis, 'x') === 'y'
  const trail = num(params.trail, 0.28)
  const noiseCount = Math.round(num(params.noise, 26))
  const rand = mulberry32(num(params.seed, 11))
  const ticks = Array.from({ length: noiseCount }, () => ({
    p: rand(),
    q: rand(),
    len: 2 + rand() * 8,
    phase: rand() * Math.PI * 2,
    rate: 1 + rand() * 3,
  }))

  return (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h)
    const span = horizontal ? h : w

    // Static / signal ticks flickering in place.
    for (const k of ticks) {
      const a = 0.12 + 0.1 * Math.sin(t * k.rate + k.phase)
      if (a <= 0.03) continue
      ctx.fillStyle = withAlpha(color, a)
      if (horizontal) ctx.fillRect(k.p * w, k.q * h, k.len, 1)
      else ctx.fillRect(k.p * w, k.q * h, 1, k.len)
    }

    // Ping-pong sweep position in [0,1].
    const cycle = (t * speed) % 2
    const pos = (cycle < 1 ? cycle : 2 - cycle) * span
    const dir = cycle < 1 ? 1 : -1

    // Trailing gradient behind the line.
    const trailLen = span * trail * dir
    const grad = horizontal
      ? ctx.createLinearGradient(0, pos, 0, pos - trailLen)
      : ctx.createLinearGradient(pos, 0, pos - trailLen, 0)
    grad.addColorStop(0, withAlpha(color, 0.22))
    grad.addColorStop(1, withAlpha(color, 0))
    ctx.fillStyle = grad
    if (horizontal) ctx.fillRect(0, Math.min(pos, pos - trailLen), w, Math.abs(trailLen))
    else ctx.fillRect(Math.min(pos, pos - trailLen), 0, Math.abs(trailLen), h)

    // The scan line itself.
    ctx.strokeStyle = withAlpha(color, 0.85)
    ctx.lineWidth = 1.5
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.beginPath()
    if (horizontal) {
      ctx.moveTo(0, pos)
      ctx.lineTo(w, pos)
    } else {
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, h)
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  }
}
