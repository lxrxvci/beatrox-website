'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface GalleryImage {
  url: string
  alt: string
}

interface ProjectGalleryProps {
  images: GalleryImage[]
}

/**
 * Asymmetric gallery grid with a FLIP-zoom lightbox (shared layoutId),
 * keyboard navigation (←/→ browse, Esc close), mono counter, and a
 * blurred backdrop.
 */
export default function ProjectGallery({ images }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const close = useCallback(() => setActiveIndex(null), [])
  const goPrev = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null
      return current === 0 ? images.length - 1 : current - 1
    })
  }, [images.length])
  const goNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null
      return current === images.length - 1 ? 0 : current + 1
    })
  }, [images.length])

  useEffect(() => {
    if (activeIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [activeIndex, close, goPrev, goNext])

  // Varied card sizes for the asymmetric grid
  const spanFor = (i: number) => {
    const pattern = i % 6
    if (pattern === 0) return 'sm:col-span-2 lg:col-span-2 aspect-[16/10]'
    if (pattern === 3) return 'lg:col-span-2 aspect-[16/10]'
    return 'aspect-square'
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 lg:px-10 pb-10 max-w-[1400px] mx-auto">
        {images.map((img, i) => (
          <motion.button
            key={`${img.url}-${i}`}
            layoutId={`gallery-${i}`}
            className={`relative overflow-hidden bg-neutral-950 group text-left ${spanFor(i)}`}
            onClick={() => setActiveIndex(i)}
            aria-label={`Open image ${i + 1} of ${images.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-end p-4">
              <span className="mono text-white/90 uppercase">Expand</span>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-[20px]"
            role="dialog"
            aria-modal="true"
            aria-label={`Image ${activeIndex + 1} of ${images.length}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <p className="mono absolute top-5 right-5 text-white/70 tabular-nums">
              {activeIndex + 1} / {images.length}
            </p>

            <button
              className="absolute top-5 left-5 text-white/80 hover:text-white mono uppercase"
              onClick={close}
              autoFocus
            >
              ✕ Close
            </button>

            <button
              className="absolute left-4 md:left-8 text-white/80 hover:text-[var(--accent)] transition-colors text-3xl"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              aria-label="Previous image"
            >
              ←
            </button>

            <motion.div
              layoutId={`gallery-${activeIndex}`}
              className="relative w-full max-w-6xl max-h-[85vh] aspect-[16/10]"
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeIndex].url}
                alt={images[activeIndex].alt}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </motion.div>

            <button
              className="absolute right-4 md:right-8 text-white/80 hover:text-[var(--accent)] transition-colors text-3xl"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              aria-label="Next image"
            >
              →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
