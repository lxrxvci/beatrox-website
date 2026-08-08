import type { EngineDrawFn } from './CanvasEngine'
import { mulberry32, num, str, withAlpha } from './util'

/**
 * particles, drifting motes, rain, embers, dust, stars.
 * Params: color, count, speed, preset ('motes'|'rain'|'embers'|'dust'|'stars'),
 *         direction ('down'|'up'). Stateless: positions are pure functions of t.
 */
export function createParticles(params: Record<string, unknown>): EngineDrawFn {
  const color = str(params.color, '#c8ff00')
  const preset = str(params.preset, 'motes')
  const baseCount = num(params.count, 60)
  const speed = num(params.speed, 1)
  const rand = mulberry32(num(params.seed, 42))

  const cfg = {
    motes: { fall: 0.012, sway: 22, size: [1, 2.6], alpha: [0.15, 0.5], streak: 0 },
    rain: { fall: 0.55, sway: 3, size: [0.6, 1.2], alpha: [0.2, 0.5], streak: 14 },
    embers: { fall: -0.05, sway: 16, size: [1, 2.4], alpha: [0.25, 0.8], streak: 0 },
    dust: { fall: 0.03, sway: 34, size: [1, 2.2], alpha: [0.1, 0.35], streak: 0 },
    stars: { fall: 0.004, sway: 4, size: [0.6, 1.6], alpha: [0.25, 0.7], streak: 0 },
  }[preset] ?? { fall: 0.012, sway: 22, size: [1, 2.6], alpha: [0.15, 0.5], streak: 0 }

  const dots = Array.from({ length: Math.max(1, Math.round(baseCount)) }, () => ({
    x: rand(),
    y: rand(),
    size: cfg.size[0] + rand() * (cfg.size[1] - cfg.size[0]),
    alpha: cfg.alpha[0] + rand() * (cfg.alpha[1] - cfg.alpha[0]),
    rate: 0.5 + rand(),
    phase: rand() * Math.PI * 2,
  }))

  return (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h)
    for (const d of dots) {
      // Vertical travel wraps; horizontal sway oscillates around the seed x.
      const y = (((d.y + t * cfg.fall * d.rate * speed) % 1) + 1) % 1
      const x = (((d.x + Math.sin(t * 0.5 * d.rate + d.phase) * (cfg.sway / Math.max(w, 1))) % 1) + 1) % 1
      const tw = 0.7 + 0.3 * Math.sin(t * 2.2 * d.rate + d.phase)
      const px = x * w
      const py = y * h
      ctx.strokeStyle = ctx.fillStyle = withAlpha(color, d.alpha * tw)
      if (cfg.streak > 0) {
        ctx.lineWidth = d.size
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px - cfg.streak * 0.25, py - cfg.streak)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.arc(px, py, d.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}
