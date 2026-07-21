import Link from 'next/link'
import { getAboutResolved } from '@/lib/content'
import ScrollPanel from './ScrollPanel'

export default async function AboutTeaser() {
  const data = await getAboutResolved()
  // sectionImages[0] duplicates the hero image (IMG_3942) — two adjacent
  // full-bleed panels with the same photo reads as an asset shortage. The
  // projection-mapped cityscape ([2]) is the "we build worlds" frame.
  const sectionImages = data.media?.sectionImages ?? []
  const bgImage = sectionImages[2] ?? sectionImages[0]

  return (
    <ScrollPanel
      id="about"
      variant="media"
      bgSrc={bgImage}
      bgAlt="BEATROX production in progress"
      className="border-t border-white/10"
    >
      <div className="max-w-3xl">
        <p className="overline mb-4">About</p>
        <h2 className="heading-lg mb-6">
          We don&apos;t just produce events. We engineer awe.
        </h2>
        <p className="mb-10 max-w-md text-base leading-relaxed text-white/80">
          Engineers, artists, and architects of the unforgettable — building the
          things people can&apos;t stop talking about.
        </p>
        <Link href="/about" className="btn-ghost">
          Our Story →
        </Link>
      </div>
    </ScrollPanel>
  )
}
