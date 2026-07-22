import Link from 'next/link'

interface ServiceTagCloudProps {
  tags: { slug: string; title: string; count: number }[]
}

export default function ServiceTagCloud({ tags }: ServiceTagCloudProps) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const bareSlug = tag.slug.replace(/^\/services\/+/, '')
        return (
          <Link
            key={bareSlug}
            href={`/services/${bareSlug}`}
            className="inline-flex items-center gap-2 border border-white/10 rounded-full px-3 py-1 text-xs text-white/75 hover:text-white hover:border-[var(--accent)] transition-colors"
          >
            <span>{tag.title}</span>
            <span className="text-[10px] text-white/40">{tag.count}</span>
          </Link>
        )
      })}
    </div>
  )
}
