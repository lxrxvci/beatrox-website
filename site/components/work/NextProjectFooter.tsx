import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/content'
import { getProjectTheme, themeToCssVars } from './project-themes'

interface NextProjectFooterProps {
  project: Project
}

/**
 * Full-bleed next-project card that closes every work page: the next
 * project's hero image (brightening on hover), its own theme accent scoped
 * via CSS vars, a [ NEXT PROJECT ] mono label, and a huge title. Creates the
 * page-to-page flow between case studies; replaces the generic site CTA on
 * work pages only.
 */
export default function NextProjectFooter({ project }: NextProjectFooterProps) {
  const theme = getProjectTheme(project.canonicalSlug)
  const heroImage = project.images?.find((img) => img.url && img.url.trim() !== '')

  return (
    <section className="border-t border-white/10">
      <Link
        href={`/work/${project.canonicalSlug}`}
        className="group relative flex items-end overflow-hidden min-h-[70vh] bg-black"
        style={themeToCssVars(theme) as CSSProperties}
      >
        {heroImage && (
          <>
            <Image
              src={heroImage.url}
              alt={heroImage.alt}
              fill
              sizes="100vw"
              className="object-cover opacity-35 transition-all duration-700 group-hover:opacity-55 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
          </>
        )}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
          <p className="hud-label mb-6">Next Project</p>
          {project.metadata.client && (
            <p className="mono text-[var(--accent)] uppercase tracking-[0.22em] mb-4">
              {project.metadata.client}
            </p>
          )}
          <h2 className="heading-xl max-w-4xl">{project.title}</h2>
          <span className="mono mt-10 inline-block uppercase tracking-[0.22em] text-white/60 group-hover:text-white transition-colors">
            View case study →
          </span>
        </div>
      </Link>
    </section>
  )
}
