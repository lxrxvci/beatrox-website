'use client'

import { useMemo } from 'react'
import type { EngineKind } from '../project-themes'
import CanvasEngine, { type EngineDrawFn } from './CanvasEngine'
import { createBeams } from './beams'
import { createParticles } from './particles'
import { createPixelGrid } from './pixelgrid'
import { createScanSweep } from './scansweep'
import { createGradientFog } from './gradientfog'
import { createEqualizer } from './equalizer'

interface ProjectAtmosphereProps {
  engine: EngineKind
  params?: Record<string, unknown>
}

const FACTORIES: Record<EngineKind, (p: Record<string, unknown>) => EngineDrawFn> = {
  beams: createBeams,
  particles: createParticles,
  pixelgrid: createPixelGrid,
  scansweep: createScanSweep,
  gradientfog: createGradientFog,
  equalizer: createEqualizer,
}

/**
 * Hero atmosphere layer: fills its (positioned) parent with a themed canvas.
 * Sits above the hero image, below the hero content; purely decorative.
 */
export default function ProjectAtmosphere({ engine, params = {} }: ProjectAtmosphereProps) {
  const draw = useMemo(() => FACTORIES[engine](params), [engine, params])
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <CanvasEngine draw={draw} />
    </div>
  )
}
