import Link from 'next/link'

interface ServiceTagCloudProps {
  tags: { slug: string; title: string; count: number }[]
}

export default function ServiceTagCloud({ tags }: ServiceTagCloudProps) {
  if (tags.length === 0) return null

  const max = Math.max(...tags.map((tag) => tag.count))
  const sizeFor = (count: number): string => {
    if (max >= 3 && count >= Math.ceil(max * 0.66)) return 'text-base'
    if (max >= 2 && count >= Math.ceil(max * 0.33)) return 'text-sm'
    return 'text-xs'
  }

  return (
    <div className="flex flex-wrap gap-3">
      {tags.map((tag) => {
        const bareSlug = tag.slug.replace(/^\/services\/+/, '')
        return (
          <Link
            key={bareSlug}
            href={`/services/${bareSlug}`}
            className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-white/75 hover:border-[var(--accent)]/50 hover:text-white transition-colors ${sizeFor(tag.count)}`}
          >
            <span>{tag.title}</span>
            <span className="mono text-[10px] text-white/50">{tag.count}</span>
          </Link>
        )
      })}
    </div>
  )
}
