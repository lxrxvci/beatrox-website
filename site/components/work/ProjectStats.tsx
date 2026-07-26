import RevealOnScroll from '@/components/RevealOnScroll'
import { EditableText } from '@/components/admin'

interface ProjectStat {
  value: string
  label: string
}

interface ProjectStatsProps {
  stats: ProjectStat[]
  collection: string
  documentId: string
}

/** lg column count per stat total (CMS maxRows is 4) — literal class names so Tailwind emits them. */
const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

/**
 * Impact strip directly below the project hero: huge accent numerals with
 * mono uppercase labels and hairline column dividers, rising in via
 * RevealOnScroll. Hidden entirely when the project has no stats.
 * Inline-editable via the stats.N.value / stats.N.label field paths.
 */
export default function ProjectStats({ stats, collection, documentId }: ProjectStatsProps) {
  if (!stats.length) return null

  return (
    <section className="border-t border-white/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <RevealOnScroll>
          <div
            className={`grid grid-cols-2 gap-x-6 gap-y-10 lg:gap-x-0 lg:divide-x lg:divide-white/10 ${LG_COLS[Math.min(stats.length, 4)]}`}
          >
            {stats.slice(0, 4).map((stat, i) => (
              <div key={i} className="lg:px-10 lg:first:pl-0 lg:last:pr-0">
                <p className="stat-numeral">
                  <EditableText
                    collection={collection}
                    documentId={documentId}
                    fieldPath={`stats.${i}.value`}
                    value={stat.value}
                  >
                    {stat.value}
                  </EditableText>
                </p>
                <p className="mono text-[11px] uppercase tracking-[0.24em] text-white/50 mt-4">
                  <EditableText
                    collection={collection}
                    documentId={documentId}
                    fieldPath={`stats.${i}.label`}
                    value={stat.label}
                  >
                    {stat.label}
                  </EditableText>
                </p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
