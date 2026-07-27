import Image from 'next/image'
import Link from 'next/link'
import { truncateAtWord } from '@/lib/text'

export interface RelatedProjectCardEntry {
  /** Full path, e.g. /work/aku-world */
  slug: string
  title: string
  client?: string
  subheadline: string
  imageUrl?: string
  imageAlt?: string
}

/**
 * Shared related-project card grid (work page Related Projects, service
 * "See It in Action", tech "Projects Using This Tech"): full-brightness
 * 16:9 image block with corner ticks, copy stacked below, tinted-glass
 * hover (accent border + glow, image scale/brightness lift).
 */
export default function RelatedProjectCards({ entries }: { entries: RelatedProjectCardEntry[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {entries.map((entry) => (
        <Link
          key={entry.slug}
          href={entry.slug}
          className="group block border border-white/10 bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-[rgba(var(--accent-rgb),0.65)] hover:shadow-[0_0_18px_rgba(var(--accent-rgb),0.3)]"
        >
          {entry.imageUrl && (
            <div className="relative aspect-video bg-black overflow-hidden">
              <span className="hud-corners" aria-hidden="true" />
              <Image
                src={entry.imageUrl}
                alt={entry.imageAlt || `${entry.title} project image`}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-110"
              />
            </div>
          )}
          <div className="p-5 md:p-6">
            {entry.client && (
              <p className="mono text-[var(--accent)] mb-2">{entry.client}</p>
            )}
            <p className="heading-sm text-white mb-2">{entry.title}</p>
            <p className="text-sm text-white leading-relaxed">
              {truncateAtWord(entry.subheadline)}
            </p>
            <span className="inline-block mt-4 text-sm tracking-[0.14em] uppercase text-white group-hover:text-[var(--accent)] transition-colors">
              View project →
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
