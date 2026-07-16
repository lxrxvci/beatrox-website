import Image from 'next/image'
import Link from 'next/link'
import type { CMSPageBlock } from '@/lib/json-content'
import { LexicalReact, type LexicalNode } from '@/components/richtext'
import { EditableRichText, EditableText } from '@/components/admin'
import BentoWorkGrid from './BentoWorkGrid'
import CapabilitiesGrid from './CapabilitiesGrid'

interface BentoProjectInput {
  slug: string
  title: string
  client?: string
  tags?: string[]
  image: string
  alt?: string
}

interface Props {
  blocks: CMSPageBlock[]
  collection?: string
  documentId?: string
  resolvedProjects?: BentoProjectInput[]
}

function hasLexicalRoot(value: unknown): value is { root: { children?: LexicalNode[] } } {
  return !!value && typeof value === 'object' && 'root' in (value as object)
}

function extractText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const root = (value as { root?: { children?: unknown[] } }).root?.children
  if (!Array.isArray(root)) return ''

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

  return readNodes(root)
}

function renderBody(body: unknown) {
  if (hasLexicalRoot(body)) {
    return <LexicalReact nodes={body.root.children} />
  }
  if (typeof body === 'string' && body.length > 0) {
    return <p className="whitespace-pre-line">{body}</p>
  }
  return null
}

function renderEditableBody(
  body: unknown,
  collection: string | undefined,
  documentId: string | undefined,
  fieldPath: string,
) {
  if (!collection || !documentId) return renderBody(body)
  return (
    <EditableRichText collection={collection} documentId={documentId} fieldPath={fieldPath} value={body}>
      {renderBody(body)}
    </EditableRichText>
  )
}

export default function CMSBlockRenderer({ blocks, collection, documentId, resolvedProjects }: Props) {
  return (
    <section className="border-t border-white/10">
      <div className="max-w-[1120px] mx-auto px-6 lg:px-10 py-16 space-y-20">
        {blocks.map((block, index) => {
          const key = `${block.blockType}-${index}`

          if (block.blockType === 'intro') {
            return (
              <article key={key} className="text-center max-w-3xl mx-auto space-y-6">
                {block.heading && <h2 className="heading-lg"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                <div className="prose prose-invert mx-auto">
                  {renderEditableBody(block.body, collection, documentId, `blocks.${index}.body`)}
                </div>
                {block.cta?.label && block.cta?.url && (
                  <Link href={block.cta.url} className="btn-primary inline-block mt-4"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.cta.label`} value={block.cta.label}>{block.cta.label}</EditableText>
        </Link>
                )}
              </article>
            )
          }

          if (block.blockType === 'text') {
            return (
              <article key={key} className="space-y-4">
                {block.heading && <h2 className="heading-md"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                <div className="prose prose-invert">
                  {renderEditableBody(block.body, collection, documentId, `blocks.${index}.body`)}
                </div>
              </article>
            )
          }

          if (block.blockType === 'gallery') {
            const images = block.images || []
            if (images.length === 0) return null
            return (
              <article key={key} className="space-y-6">
                {block.heading && <h2 className="heading-md"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-white/10">
                  {images.map((image, imageIndex) => {
                    if (!image.url) return null
                    return (
                      <div
                        key={`${image.url}-${imageIndex}`}
                        className="relative h-56 bg-neutral-950 overflow-hidden"
                      >
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
              <article key={key} className="space-y-6">
                {block.heading && <h2 className="heading-md"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((item, itemIndex) => (
                    <li key={`${item.label}-${itemIndex}`} className="text-base text-white/80">
                      <EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.items.${itemIndex}.label`} value={item.label}>{item.label}</EditableText>
                    </li>
                  ))}
                </ul>
              </article>
            )
          }

          if (block.blockType === 'capabilitiesGrid') {
            const items = block.items || []
            if (items.length === 0) return null
            return (
              <article key={key} className="space-y-6">
                <h2 className="heading-md">Tech Capabilities</h2>
                <CapabilitiesGrid items={items.filter((item): item is { label: string } => Boolean(item.label))} />
              </article>
            )
          }

          if (block.blockType === 'philosophy') {
            const columns = block.columns || []
            if (columns.length === 0) return null
            return (
              <article key={key} className="space-y-8">
                {block.heading && <h2 className="heading-md text-center"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {columns.map((col, colIndex) => (
                    <div key={`${col.heading}-${colIndex}`}>
                      {col.heading && <h3 className="heading-sm text-white mb-4"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.columns.${colIndex}.heading`} value={col.heading}>{col.heading}</EditableText></h3>}
                      <div className="prose prose-invert">
                      {renderEditableBody(col.body, collection, documentId, `blocks.${index}.columns.${colIndex}.body`)}
                    </div>
                    </div>
                  ))}
                </div>
              </article>
            )
          }

          if (block.blockType === 'featuredWork') {
            const projects = resolvedProjects && resolvedProjects.length > 0
              ? resolvedProjects
              : (block.projects as Array<{
                  slug?: string
                  title?: string
                  hero?: { tags?: string[] }
                  images?: Array<{ url?: string; alt?: string }>
                  seo?: { og?: { image?: string } }
                }> | undefined)
            if (!Array.isArray(projects) || projects.length === 0) return null
            if (resolvedProjects) {
              return (
                <article key={key} className="space-y-6">
                  {block.heading && <h2 className="heading-md"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                  <BentoWorkGrid projects={resolvedProjects} />
                </article>
              )
            }
            return (
              <article key={key} className="space-y-6">
                {block.heading && <h2 className="heading-md"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
                  {projects.map((project, projectIndex) => {
                    const p = project as {
                      slug?: string
                      title?: string
                      hero?: { tags?: string[] }
                      images?: Array<{ url?: string; alt?: string }>
                      seo?: { og?: { image?: string } }
                    }
                    const firstImage = p.images?.find((img) => img.url && img.url !== '')
                    const image = firstImage?.url || p.seo?.og?.image || '/og-default.jpg'
                    const href = `/work/${p.slug || ''}`
                    return (
                      <Link
                        key={`${p.slug}-${projectIndex}`}
                        href={href}
                        className="relative h-64 bg-neutral-950 overflow-hidden group block"
                      >
                        <Image
                          src={image}
                          alt={firstImage?.alt || p.title || 'Project'}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="project-card-overlay">
                          <div>
                            <h3 className="heading-sm text-white">{p.title}</h3>
                            {p.hero?.tags && p.hero.tags.length > 0 && (
                              <p className="text-xs text-white/60 mt-1">{p.hero.tags.join(' / ')}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </article>
            )
          }

          if (block.blockType === 'cta') {
            if (!block.label || !block.url) return null
            return (
              <article key={key} className="border border-white/10 p-8 text-center space-y-4">
                {block.heading && <h2 className="heading-md"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                {Boolean(block.body) && (
                  <div className="prose prose-invert mx-auto">
                    {renderEditableBody(block.body, collection, documentId, `blocks.${index}.body`)}
                  </div>
                )}
                <Link href={block.url} className="btn-primary inline-block"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.label`} value={block.label}>{block.label}</EditableText>
        </Link>
              </article>
            )
          }

          if (block.blockType === 'ctaBar') {
            if (!block.cta?.label || !block.cta?.url) return null
            return (
              <article key={key} className="bg-[var(--bg-elevated)] border border-white/10 p-10 md:p-14 text-center space-y-5">
                {block.heading && <h2 className="heading-lg"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                {Boolean(block.body) && (
                  <div className="prose prose-invert mx-auto max-w-2xl">
                    {renderEditableBody(block.body, collection, documentId, `blocks.${index}.body`)}
                  </div>
                )}
                <Link href={block.cta.url} className="btn-primary inline-block"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.cta.label`} value={block.cta.label}>{block.cta.label}</EditableText>
        </Link>
              </article>
            )
          }

          if (block.blockType === 'video') {
            if (!block.url) return null
            return (
              <article key={key} className="space-y-4">
                {block.heading && <h2 className="heading-md"><EditableText collection={collection} documentId={documentId} fieldPath={`blocks.${index}.heading`} value={block.heading}>{block.heading}</EditableText></h2>}
                <p className="text-base text-white/75">
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
