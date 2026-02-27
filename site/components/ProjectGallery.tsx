'use client'

import { useState } from 'react'
import Image from 'next/image'

interface GalleryImage {
  url: string
  alt: string
}

interface ProjectGalleryProps {
  images: GalleryImage[]
}

export default function ProjectGallery({ images }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const close = () => setActiveIndex(null)
  const goPrev = () =>
    setActiveIndex((current) => {
      if (current === null) return null
      return current === 0 ? images.length - 1 : current - 1
    })
  const goNext = () =>
    setActiveIndex((current) => {
      if (current === null) return null
      return current === images.length - 1 ? 0 : current + 1
    })

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
        {images.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            className="relative aspect-square overflow-hidden bg-neutral-950 group text-left"
            onClick={() => setActiveIndex(i)}
            aria-label={`Open image ${i + 1}`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-end p-3">
              <span className="text-[0.65rem] uppercase tracking-[0.14em] text-white/80">Expand</span>
            </div>
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white text-xs tracking-[0.2em] uppercase"
            onClick={close}
          >
            Close
          </button>

          <button
            className="absolute left-4 md:left-8 text-white/70 hover:text-white text-xs tracking-[0.2em] uppercase"
            onClick={goPrev}
          >
            Prev
          </button>

          <div className="relative w-full max-w-6xl aspect-[16/10]">
            <Image
              src={images[activeIndex].url}
              alt={images[activeIndex].alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <button
            className="absolute right-4 md:right-8 text-white/70 hover:text-white text-xs tracking-[0.2em] uppercase"
            onClick={goNext}
          >
            Next
          </button>
        </div>
      )}
    </>
  )
}
