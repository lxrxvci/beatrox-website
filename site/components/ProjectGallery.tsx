'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { EditableImage } from '@/components/admin'
import type { TagOption } from '@/components/admin/EditableImage'

interface GalleryImageTag {
  id: string
  slug: string
  title: string
}

interface GalleryImage {
  url: string
  alt: string
  note?: string
  width?: number
  height?: number
  /** Index into the project doc's raw `images` array (inline-edit field path). */
  sourceIndex?: number
  /** Backend-only per-image tags — editable in the panel, never rendered. */
  serviceTags?: GalleryImageTag[]
  techTags?: GalleryImageTag[]
}

interface ProjectGalleryProps {
  images: GalleryImage[]
  /** Inline-edit target — the project doc that owns these images. */
  collection?: string
  documentId?: string
  /** Tag pickers for the per-image edit panel (work pages only). */
  serviceOptions?: TagOption[]
  techOptions?: TagOption[]
}

interface SizedImage extends GalleryImage {
  aspect: number
}

interface RowImage extends SizedImage {
  width: number
  height: number
  fillWidth?: boolean
}

function getAspect(img: GalleryImage): number {
  if (img.width && img.height && img.height > 0) {
    return img.width / img.height
  }
  // Default tiles based on URL hints or 4:3
  return 4 / 3
}

function rowHeightFor(
  row: SizedImage[],
  containerWidth: number,
  targetHeight: number,
  gap: number
): number {
  const totalWidth = row.reduce((sum, img) => sum + targetHeight * img.aspect, 0)
  const totalGap = gap * (row.length - 1)
  return totalWidth > 0 ? (targetHeight * (containerWidth - totalGap)) / totalWidth : targetHeight
}

function buildRows(
  images: SizedImage[],
  containerWidth: number,
  targetHeight: number,
  gap: number
): RowImage[][] {
  if (!containerWidth || images.length === 0) return []

  const minHeight = targetHeight * 0.82
  const maxHeight = targetHeight * 1.18
  const rows: SizedImage[][] = []
  let row: SizedImage[] = []

  images.forEach((img) => {
    const candidate = [...row, img]
    const height = rowHeightFor(candidate, containerWidth, targetHeight, gap)

    if (row.length > 0) {
      if (height < minHeight) {
        rows.push(row)
        row = [img]
        return
      }
      if (height > maxHeight && row.length >= 2) {
        rows.push(row)
        row = [img]
        return
      }
    }
    row = candidate
  })
  if (row.length) rows.push(row)

  // Scale each row to fill the container width, but cap row height so a
  // single very wide image doesn't create a giant row.
  const absoluteMaxHeight = targetHeight * 1.35
  return rows.map((r) => {
    let height = rowHeightFor(r, containerWidth, targetHeight, gap)
    const fillWidth = height <= absoluteMaxHeight
    if (!fillWidth) height = absoluteMaxHeight

    return r.map((img) => ({
      ...img,
      width: height * img.aspect,
      height,
      fillWidth,
    }))
  })
}

export default function ProjectGallery({ images, collection, documentId, serviceOptions, techOptions }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Start unmeasured (0 = render no rows) so the SSR/first paint can't
  // overflow the viewport; the effect below measures on mount.
  const [containerWidth, setContainerWidth] = useState(0)

  // Drop entries with no usable URL so they can't render as empty
  // bordered black frames.
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(new Set())
  const galleryImages = useMemo(
    () =>
      images.filter(
        (img) => img.url && img.url.trim() !== '' && !failedUrls.has(img.url)
      ),
    [images, failedUrls]
  )

  // Runtime 404s/optimizer failures would otherwise leave empty black frames
  // in the mosaic — drop the failed URL and let the rows reflow.
  const markFailed = useCallback((url: string) => {
    setFailedUrls((prev) => {
      if (prev.has(url)) return prev
      const next = new Set(prev)
      next.add(url)
      return next
    })
  }, [])

  const sizedImages = useMemo<SizedImage[]>(
    () => galleryImages.map((img) => ({ ...img, aspect: getAspect(img) })),
    [galleryImages]
  )

  // Measure container and respond to resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      // Rows are laid out inside the container's horizontal padding, so
      // measure the content box — otherwise every row overflows by the
      // combined px-6/lg:px-10 padding and the page scrolls sideways.
      const styles = window.getComputedStyle(el)
      const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
      setContainerWidth(Math.max(320, Math.floor(rect.width - paddingX)))
    }
    update()

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const rows = useMemo(() => {
    const isMobile = containerWidth < 640
    const targetHeight = isMobile ? 150 : containerWidth < 1024 ? 195 : 240
    const gap = isMobile ? 8 : 14
    return buildRows(sizedImages, containerWidth, targetHeight, gap)
  }, [sizedImages, containerWidth])

  const close = useCallback(() => setActiveIndex(null), [])
  const goPrev = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null
      return current === 0 ? galleryImages.length - 1 : current - 1
    })
  }, [galleryImages.length])
  const goNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null
      return current === galleryImages.length - 1 ? 0 : current + 1
    })
  }, [galleryImages.length])

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

  const activeImage = activeIndex !== null ? galleryImages[activeIndex] : null

  // Every entry failed to load (or none were provided) — render nothing
  // rather than an empty header over a blank section.
  if (galleryImages.length === 0) return null

  return (
    <>
      <div ref={containerRef} className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="heading-sm text-white">Gallery</p>
            <p className="mono text-xs text-white mt-1 uppercase tracking-[0.2em]">
              {galleryImages.length} {galleryImages.length === 1 ? 'image' : 'images'}
            </p>
          </div>
          <p className="hidden sm:block mono text-xs text-white uppercase tracking-[0.2em]">
            Click to expand
          </p>
        </div>

        <div className="space-y-3 sm:space-y-5">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`flex ${row.some((img) => !img.fillWidth) ? 'justify-center' : ''}`}
              style={{ gap: containerWidth < 640 ? 8 : 14 }}
            >
              {row.map((img, i) => {
                const index = rows.slice(0, rowIndex).reduce((sum, r) => sum + r.length, 0) + i
                const caption = img.note || img.alt
                return (
                  <motion.button
                    key={`${img.url}-${index}`}
                    layoutId={`gallery-${index}`}
                    className="relative overflow-hidden bg-neutral-950 group text-left border border-white/5 max-w-full focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                    style={{ width: img.width, height: img.height, flexShrink: 0 }}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Open image ${index + 1} of ${galleryImages.length}`}
                  >
                    <EditableImage
                      collection={collection}
                      documentId={documentId}
                      fieldPath={`images.${img.sourceIndex ?? index + 1}`}
                      value={img.url}
                      alt={img.alt}
                      serviceOptions={serviceOptions}
                      techOptions={techOptions}
                      selectedServiceIds={(img.serviceTags || []).map((tag) => tag.id)}
                      selectedTechIds={(img.techTags || []).map((tag) => tag.id)}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt}
                        fill
                        sizes={`${Math.round(img.width)}px`}
                        className="object-cover transition-all duration-500 group-hover:scale-[1.02] group-hover:brightness-110"
                        onError={() => markFailed(img.url)}
                      />
                    </EditableImage>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4">
                      <span className="mono text-[10px] text-white uppercase tracking-[0.2em] mb-1">
                        {String(index + 1).padStart(2, '0')} / {String(galleryImages.length).padStart(2, '0')}
                      </span>
                      {caption && (
                        <span className="text-xs text-white line-clamp-2 leading-snug">
                          {caption}
                        </span>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeIndex !== null && activeImage && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/92 backdrop-blur-[20px] p-4 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`Image ${activeIndex + 1} of ${galleryImages.length}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 md:p-6">
              <button
                className="text-white hover:text-white mono text-xs uppercase tracking-[0.15em] transition-colors"
                onClick={close}
                autoFocus
              >
                ✕ Close
              </button>
              <p className="mono text-xs text-white tabular-nums tracking-[0.15em]">
                {String(activeIndex + 1).padStart(2, '0')} / {String(galleryImages.length).padStart(2, '0')}
              </p>
            </div>

            {/* Prev */}
            <button
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 text-white hover:text-[var(--accent)] transition-colors text-3xl md:text-4xl p-2"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              aria-label="Previous image"
            >
              ←
            </button>

            {/* Image */}
            <motion.div
              layoutId={`gallery-${activeIndex}`}
              className="relative w-full max-w-6xl max-h-[75vh] flex items-center justify-center"
              transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox goes through the optimizer (multi-MB originals are
                  not served raw); max-w/max-h + intrinsic dims preserve the
                  same contain-fit layout as the previous raw <img>. */}
              <Image
                src={activeImage.url}
                alt={activeImage.alt}
                width={activeImage.width ?? 1920}
                height={activeImage.height ?? 1080}
                sizes="100vw"
                className="max-w-full max-h-[75vh] object-contain"
              />
            </motion.div>

            {/* Next */}
            <button
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 text-white hover:text-[var(--accent)] transition-colors text-3xl md:text-4xl p-2"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              aria-label="Next image"
            >
              →
            </button>

            {/* Caption + progress */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <div className="max-w-3xl mx-auto text-center">
                {(activeImage.note || activeImage.alt) && (
                  <p className="text-sm md:text-base text-white mb-4">
                    {activeImage.note || activeImage.alt}
                  </p>
                )}
                <div className="flex justify-center gap-1.5">
                  {galleryImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveIndex(i)
                      }}
                      className={`h-1 rounded-full transition-all ${
                        i === activeIndex ? 'w-6 bg-[var(--accent)]' : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
