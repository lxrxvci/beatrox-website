import type { EngineDrawFn } from './CanvasEngine'
import { num, str, withAlpha } from './util'

/**
 * pixelgrid — LED-wall grid pulsing with travelling waves.
 * Params: color, cell (px), speed, mode ('pulse' radial rings | 'wave' horizontal),
 *         intensity (0..1). Stateless: brightness of each cell is f(t).
 */
export function createPixelGrid(params: Record<string, unknown>): EngineDrawFn {
  const color = str(params.color, '#c8ff00')
  const cell = num(params.cell, 26)
  const speed = num(params.speed, 1)
  const wave = str(params.mode, 'pulse') === 'wave'
  const intensity = num(params.intensity, 0.5)

  return (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h)
    const cols = Math.ceil(w / cell)
    const rows = Math.ceil(h / cell)
    const gap = Math.max(2, cell * 0.22)
    const cx = cols / 2
    const cy = rows / 2
    for (let ix = 0; ix < cols; ix++) {
      for (let iy = 0; iy < rows; iy++) {
        const d = wave
          ? iy / Math.max(rows, 1)
          : Math.hypot(ix - cx, iy - cy) / Math.max(Math.hypot(cx, cy), 1)
        // Two travelling waves so the grid never sits uniformly lit.
        const b1 = 0.5 + 0.5 * Math.sin(d * 9 - t * 1.6 * speed)
        const b2 = 0.5 + 0.5 * Math.sin(d * 23 + t * 0.9 * speed + ix * 0.35)
        const brightness = b1 * 0.75 + b2 * 0.25
        const alpha = brightness * brightness * intensity
        if (alpha < 0.02) continue
        ctx.fillStyle = withAlpha(color, alpha)
        ctx.fillRect(ix * cell + gap / 2, iy * cell + gap / 2, cell - gap, cell - gap)
      }
    }
  }
}
