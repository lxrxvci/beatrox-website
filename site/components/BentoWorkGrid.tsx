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
    if (i === 1) return 'work-card-medium aspect-[4/5]'
    return 'work-card-wide aspect-[3/2]'
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
            <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-[var(--ease-expo-out)]">
              {project.client && (
                <p className="mono text-[var(--accent)] mb-2">{project.client}</p>
              )}
              <p className="heading-md text-white leading-[1.2] mb-3">{project.title}</p>
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="mono text-[11px] text-[var(--text-secondary)] uppercase">
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
