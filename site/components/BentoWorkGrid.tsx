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
}



/**
 * Asymmetric bento grid: first project is the featured card (8 cols × 2
 * rows), second is a vertical medium card, the rest alternate wide cards.
 * Collapses to a 2-column equal grid on mobile.
 */
export default function BentoWorkGrid({ projects, className = '' }: BentoWorkGridProps) {
  const sizeFor = (i: number) => {
    if (i === 0) return 'work-card-featured aspect-[16/9]'
    // Uniform squares on mobile: equal row heights, and the overlay copy
    // (client/title/2 tags) fits without clipping. Desktop keeps the bento.
    if (i === 1) return 'work-card-medium aspect-square sm:aspect-[4/5]'
    return 'work-card-wide aspect-square sm:aspect-[3/2]'
  }

  return (
    <div className={`work-grid ${className}`}>
      {projects.map((project, i) => (
        <Link
          key={project.slug}
          href={`/work/${project.slug}`}
          className={`project-card group relative overflow-hidden bg-neutral-950 block ${sizeFor(i)}`}
        >
          <FluidImage
            src={project.image}
            alt={project.alt || project.title}
            sizes="(max-width: 768px) 50vw, 66vw"
            priority={i === 0}
          />
          <div className="project-card-overlay">
            {/* No translate on mobile: the shift pushed copy past the card's
                bottom edge on small cards, and hover doesn't exist on touch. */}
            <div className="sm:translate-y-2 sm:group-hover:translate-y-0 transition-transform duration-500 ease-[var(--ease-expo-out)]">
              {project.client && (
                <p className="mono text-[var(--accent)] mb-1 sm:mb-2">{project.client}</p>
              )}
              <p className="heading-md text-white leading-[1.2] mb-2 sm:mb-3">{project.title}</p>
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                  {/* Mobile cards are too small for 3 tags — cap at 2 below sm. */}
                  {project.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tag}
                      className={`mono text-[10px] sm:text-[11px] text-[var(--text-secondary)] uppercase${
                        tagIndex > 1 ? ' hidden sm:inline' : ''
                      }`}
                    >
                      {humanizeTag(tag)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
