'use client'

import { useCallback } from 'react'

interface IntroImageStreaksProps {
  images: string[]
  /** Registers each streak element so the GSAP timeline can drive it. */
  register: (index: number, el: HTMLDivElement | null) => void
}

/**
 * Montage image flashes (beat 2) — plain DOM/CSS, no WebGL. Full-bleed
 * gallery images streak across for ~140ms via GSAP-driven clip-path wipes
 * (see intro-timeline.ts). Fully transparent until the timeline sets them.
 */
export default function IntroImageStreaks({ images, register }: IntroImageStreaksProps) {
  const setRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => register(index, el),
    [register]
  )

  return (
    <>
      {images.map((src, i) => (
        <div
          key={src + i}
          ref={setRef(i)}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 opacity-0"
          style={{ clipPath: 'inset(0% 100% 0% 0%)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral
              flash frame; preloaded during beat 0, gone within seconds */}
          <img src={src} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/25" />
        </div>
      ))}
    </>
  )
}
