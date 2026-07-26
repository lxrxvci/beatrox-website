'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

interface BreakoutImage {
  url: string
  alt: string
  note?: string
  width?: number
  height?: number
}

interface BreakoutFigureProps {
  img: BreakoutImage
  /** Position among the breakouts (caption numbering). */
  index: number
}

/**
 * Full-bleed breakout figure staged between gallery chunks: edge-to-edge
 * ~21:9 image with a mono caption (note || alt) and a subtle scroll parallax
 * driven by motion/react. The inner frame is oversized by 8% top/bottom so
 * the ±6% drift never exposes the edges. Reduced-motion users get a static
 * image (no transform applied). Deliberately not inline-editable: the image
 * stays editable through the gallery mosaic's EditableImage wrappers and the
 * fieldPath audit admits no new image paths.
 */
export default function BreakoutFigure({ img, index }: BreakoutFigureProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  const caption = img.note || img.alt

  return (
    <figure
      ref={ref}
      className="relative w-full overflow-hidden aspect-[21/9] max-h-[82vh] my-12 lg:my-20 bg-neutral-950"
    >
      <motion.div
        className="absolute inset-x-0 -inset-y-[8%]"
        style={reduceMotion ? undefined : { y }}
      >
        <Image
          src={img.url}
          alt={img.alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
      {caption && (
        <figcaption className="absolute bottom-0 left-0 z-10 p-5 lg:p-8 max-w-2xl">
          <span className="mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)] block mb-2">
            Plate {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-sm text-white leading-snug">{caption}</span>
        </figcaption>
      )}
    </figure>
  )
}

