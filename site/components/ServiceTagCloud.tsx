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
            className="hud-chip"
          >
            <span>{tag.title}</span>
            <span className="text-[10px] text-white/40">{tag.count}</span>
          </Link>
        )
      })}
    </div>
  )
}
