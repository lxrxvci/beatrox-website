import type { EngineDrawFn } from './CanvasEngine'
import { mulberry32, num, str, withAlpha } from './util'

/**
 * equalizer, audio-style bars rising from the hero baseline.
 * Params: color, bars, speed, height (max fraction of hero), alpha.
 * Stateless: each bar's level is a sum of sines of t.
 */
export function createEqualizer(params: Record<string, unknown>): EngineDrawFn {
  const color = str(params.color, '#c8ff00')
  const bars = Math.round(num(params.bars, 48))
  const speed = num(params.speed, 1)
  const maxH = num(params.height, 0.5)
  const alpha = num(params.alpha, 0.55)
  const rand = mulberry32(num(params.seed, 3))
  const voices = Array.from({ length: Math.max(4, bars) }, () => ({
    f1: 0.8 + rand() * 2.2,
    f2: 0.4 + rand() * 1.4,
    p1: rand() * Math.PI * 2,
    p2: rand() * Math.PI * 2,
    bias: 0.25 + rand() * 0.35,
  }))

  return (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h)
    const bw = w / voices.length
    for (let i = 0; i < voices.length; i++) {
      const v = voices[i]
      const level =
        v.bias +
        0.3 * (0.5 + 0.5 * Math.sin(t * v.f1 * speed + v.p1)) +
        0.25 * (0.5 + 0.5 * Math.sin(t * v.f2 * speed * 1.7 + v.p2))
      const bh = level * maxH * h
      const x = i * bw + bw * 0.18
      const g = ctx.createLinearGradient(0, h, 0, h - bh)
      g.addColorStop(0, withAlpha(color, alpha))
      g.addColorStop(1, withAlpha(color, 0.06))
      ctx.fillStyle = g
      ctx.fillRect(x, h - bh, bw * 0.64, bh)
    }
  }
}
