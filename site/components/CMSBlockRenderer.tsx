import Image from 'next/image'
import Link from 'next/link'
import type { CMSPageBlock } from '@/lib/content'

interface Props {
  blocks: CMSPageBlock[]
}

function extractText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const root = value as { root?: { children?: unknown[] } }
  const rootChildren = root.root?.children
  if (!Array.isArray(rootChildren)) return ''

  const readNodes = (nodes: unknown[]): string =>
    nodes
      .map((node) => {
        if (!node || typeof node !== 'object') return ''
        const current = node as { text?: string; children?: unknown[] }
        if (typeof current.text === 'string') return current.text
        if (Array.isArray(current.children)) return readNodes(current.children)
        return ''
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

  return readNodes(rootChildren)
}

export default function CMSBlockRenderer({ blocks }: Props) {
  return (
    <section className="border-t border-white/10">
      <div className="max-w-[1120px] mx-auto px-6 lg:px-10 py-16 space-y-14">
        {blocks.map((block, index) => {
          if (block.blockType === 'text') {
            return (
              <article key={`${block.blockType}-${index}`} className="space-y-4">
                {block.heading && <h2 className="heading-md">{block.heading}</h2>}
                <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                  {extractText(block.body)}
                </p>
              </article>
            )
          }

          if (block.blockType === 'gallery') {
            const images = block.images || []
            if (images.length === 0) return null
            return (
              <article key={`${block.blockType}-${index}`} className="space-y-6">
                {block.heading && <h2 className="heading-md">{block.heading}</h2>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-white/10">
                  {images.map((image, imageIndex) => {
                    if (!image.url) return null
                    return (
                      <div key={`${image.url}-${imageIndex}`} className="relative h-56 bg-neutral-950 overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.alt || 'Gallery media'}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          }

          if (block.blockType === 'features') {
            const items = block.items || []
            if (items.length === 0) return null
            return (
              <article key={`${block.blockType}-${index}`} className="space-y-6">
                {block.heading && <h2 className="heading-md">{block.heading}</h2>}
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((item, itemIndex) => (
                    <li key={`${item.label}-${itemIndex}`} className="text-sm text-white/75">
                      {item.label}
                    </li>
                  ))}
                </ul>
              </article>
            )
          }

          if (block.blockType === 'cta') {
            if (!block.label || !block.url) return null
            return (
              <article key={`${block.blockType}-${index}`} className="border border-white/10 p-8 text-center space-y-4">
                {block.heading && <h2 className="heading-md">{block.heading}</h2>}
                {Boolean(block.body) && <p className="text-sm text-white/65">{extractText(block.body)}</p>}
                <Link href={block.url} className="btn-primary">
                  {block.label}
                </Link>
              </article>
            )
          }

          if (block.blockType === 'video') {
            if (!block.url) return null
            return (
              <article key={`${block.blockType}-${index}`} className="space-y-4">
                {block.heading && <h2 className="heading-md">{block.heading}</h2>}
                <p className="text-sm text-white/70">
                  {block.provider ? `${block.provider.toUpperCase()} video: ` : 'Video: '}
                  <a href={block.url} target="_blank" rel="noreferrer" className="underline">
                    {block.url}
                  </a>
                </p>
              </article>
            )
          }

          return null
        })}
      </div>
    </section>
  )
}
