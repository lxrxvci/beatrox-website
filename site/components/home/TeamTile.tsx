'use client'

import { useState } from 'react'
import Image from 'next/image'

interface TeamTileProps {
  name: string
  title: string
  photoUrl?: string
  photoAlt?: string
}

/**
 * Team member tile. Photos render grayscale; desktop hover recolors via
 * group-hover, and tap/click (or Enter/Space) toggles recolor per tile so
 * touch users get the same reveal. Any number of tiles can be on at once.
 */
export default function TeamTile({ name, title, photoUrl, photoAlt }: TeamTileProps) {
  const [recolored, setRecolored] = useState(false)
  const toggle = () => setRecolored((v) => !v)

  return (
    <div
      className="group cursor-pointer"
      role="button"
      tabIndex={0}
      aria-pressed={recolored}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
    >
      {photoUrl && (
        <div className="relative mb-4 aspect-square overflow-hidden border border-white/10 bg-neutral-950">
          <Image
            src={photoUrl}
            alt={photoAlt || name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover transition duration-700 group-hover:grayscale-0 ${
              recolored ? 'grayscale-0' : 'grayscale'
            }`}
          />
        </div>
      )}
      <p className="text-sm font-semibold uppercase tracking-[0.11em] text-white">{name}</p>
      <p className="mt-1 text-sm text-white">{title}</p>
    </div>
  )
}
