'use client'

import { useState } from 'react'

interface VideoPosterCardProps {
  /** YouTube embed URL (https://www.youtube.com/embed/<id>). */
  embedUrl: string
  /** YouTube video ID — used for the hqdefault poster thumbnail. */
  videoId: string
  label: string
}

/**
 * Click-to-load YouTube poster card: renders the hqdefault thumbnail with an
 * accent play button instead of an iframe (which otherwise sits as a black
 * box until interacted with). Clicking swaps in the autoplay embed.
 * Uses a plain <img> because i.ytimg.com is intentionally not in the
 * next/image remotePatterns allowlist.
 */
export default function VideoPosterCard({ embedUrl, videoId, label }: VideoPosterCardProps) {
  const [active, setActive] = useState(false)

  if (active) {
    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
          title={label}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play ${label}`}
      className="group/poster relative block aspect-video w-full overflow-hidden bg-black text-left"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={label}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-75 transition-opacity duration-300 group-hover/poster:opacity-100"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/25 bg-black/55 backdrop-blur-sm transition-colors duration-300 group-hover/poster:border-[var(--accent)]">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 translate-x-0.5 fill-[var(--accent)]">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  )
}
