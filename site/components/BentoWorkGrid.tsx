'use client'

import Link from 'next/link'
import FluidImage from '@/components/FluidImage'
import { humanizeTag } from '@/lib/tags'

export interface BentoProject {
  slug: string
  title: string
  client?: string
  tags?: string[]
  image: string
  alt?: string
}

interface BentoWorkGridProps {
  projects: BentoProject[]
  className?: string
  /** Home teaser variant: full-brightness image block with the copy stacked
   *  neatly below it (related-cards pattern). Unset = the signature bento
   *  overlay used on /work. */
  textBelow?: boolean
}



/**
 * Asymmetric bento grid: first project is the featured card (8 cols × 2
 * rows), second is a vertical medium card, the rest alternate wide cards.
 * Collapses to a 2-column equal grid on mobile.
 */
export default function BentoWorkGrid({ projects, className = '', textBelow = false }: BentoWorkGridProps) {
  // After the featured card the rest pair up as 2-col squares on mobile;
  // when that remaining count is odd the final card spans both columns so
  // it never sits orphaned at half width. Desktop bento spans unchanged.
  const lastIsFullWidth = (projects.length - 1) % 2 === 1
  const spanFor = (i: number) => {
    if (textBelow) {
      if (i === 0) return 'work-card-featured'
      if (i === projects.length - 1 && lastIsFullWidth)
        return 'work-card-wide work-card-odd-last'
      if (i === 1) return 'work-card-medium'
      return 'work-card-wide'
    }
    // Overlay (/work): featured spans the FULL width of both columns on
    // desktop, then every remaining card pairs up evenly (17 projects →
    // featured + 8 clean rows of 2, no asymmetric side card).
    if (i === 0) return 'work-card-featured work-card-full'
    return 'work-card-wide'
  }
  const aspectFor = (i: number) => {
    // textBelow: the image div is a plain block and always needs a ratio.
    if (textBelow) {
      if (i === 0) return 'aspect-[16/9]'
      if (i === projects.length - 1 && lastIsFullWidth) return 'aspect-[3/2]'
      if (i === 1) return 'aspect-square sm:aspect-[4/5]'
      return 'aspect-square sm:aspect-[3/2]'
    }
    // Overlay (/work): featured is full-width 16/9 on every breakpoint;
    // all remaining cards are even 3/2 pairs on desktop, squares on mobile.
    if (i === 0) return 'aspect-[16/9]'
    return 'aspect-square sm:aspect-[3/2]'
  }

  const tagsFor = (project: BentoProject) =>
    project.tags && project.tags.length > 0 ? (
      // Mobile: single non-wrapping line, tags truncate instead of
      // wrapping a 2nd line into the card edges. sm+ wraps as before.
      <div className="flex flex-nowrap sm:flex-wrap gap-x-2 gap-y-1 mt-1 overflow-hidden">
        {/* Mobile cards are too small for 3 tags, cap at 2 below sm. */}
        {project.tags.slice(0, 3).map((tag, tagIndex) => (
          <span
            key={tag}
            className={`mono text-[10px] sm:text-[11px] text-white uppercase truncate min-w-0 shrink${
              tagIndex > 1 ? ' hidden sm:inline' : ''
            }`}
          >
            {humanizeTag(tag)}
          </span>
        ))}
      </div>
    ) : null

  return (
    <div className={`work-grid ${className}`}>
      {projects.map((project, i) =>
        textBelow ? (
          <Link
            key={project.slug}
            href={`/work/${project.slug}`}
            className={`group block border border-white/10 bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-[rgba(var(--accent-rgb),0.65)] hover:shadow-[0_0_18px_rgba(var(--accent-rgb),0.3)] ${spanFor(i)}`}
          >
            <div className={`relative bg-black overflow-hidden ${aspectFor(i)}`}>
              <span className="hud-corners" aria-hidden="true" />
              <FluidImage
                src={project.image}
                alt={project.alt || project.title}
                sizes="(max-width: 768px) 50vw, 66vw"
                priority={i === 0}
              />
            </div>
            <div className="p-4 sm:p-5">
              {project.client && (
                <p className="glow-text mono text-[var(--accent)] mb-1">{project.client}</p>
              )}
              <p className={`${i === 0 ? 'heading-md' : 'heading-sm'} text-white leading-[1.2] break-words`}>
                {project.title}
              </p>
              {tagsFor(project)}
            </div>
          </Link>
        ) : (
          <Link
            key={project.slug}
            href={`/work/${project.slug}`}
            className={`project-card group relative overflow-hidden bg-neutral-950 block ${spanFor(i)} ${aspectFor(i)}`}
          >
            <span className="hud-corners" aria-hidden="true" />
            <FluidImage
              src={project.image}
              alt={project.alt || project.title}
              sizes="(max-width: 768px) 50vw, 66vw"
              priority={i === 0}
            />
            <div className="project-card-overlay">
              {/* No translate on mobile: the shift pushed copy past the card's
                  bottom edge on small cards, and hover doesn't exist on touch.
                  w-full + min-w-0: the overlay is a row flex container, so
                  without an explicit width this div sizes to the longest word
                  (e.g. "DISENCHANTMENT") and clips instead of wrapping. */}
              <div className="w-full min-w-0 sm:translate-y-2 sm:group-hover:translate-y-0 transition-transform duration-500 ease-[var(--ease-expo-out)]">
                {project.client && (
                  <p className="glow-text mono text-[var(--accent)] mb-1 sm:mb-2">{project.client}</p>
                )}
                <p className="heading-md text-white leading-[1.2] mb-2 sm:mb-3 break-words">{project.title}</p>
                {tagsFor(project)}
              </div>
            </div>
          </Link>
        ),
      )}
    </div>
  )
}
