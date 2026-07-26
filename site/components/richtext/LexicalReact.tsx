import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { resolveCmsMediaUrl } from '@/lib/content'

export type LexicalDirection = 'ltr' | 'rtl' | null

export interface LexicalTextNode {
  type: 'text'
  version: number
  text: string
  format?: number | string
  style?: string
  mode?: string
  detail?: number
}

export interface LexicalElementNode {
  type:
    | 'root'
    | 'paragraph'
    | 'heading'
    | 'list'
    | 'listitem'
    | 'quote'
    | 'link'
    | 'upload'
    | 'horizontalrule'
    | 'linebreak'
    | (string & {})
  version: number
  tag?: string
  format?: number | string
  indent?: number
  direction?: LexicalDirection
  children?: LexicalNode[]
  url?: string
  fields?: Record<string, unknown>
}

export type LexicalNode = LexicalTextNode | LexicalElementNode

export interface LexicalDocument {
  root: LexicalElementNode
}

export interface LexicalReactProps {
  nodes: LexicalNode[] | undefined
  parentTag?: React.ElementType
}

const FORMAT_BITS: Record<string, number> = {
  bold: 1,
  italic: 2,
  underline: 4,
  strikethrough: 8,
  code: 16,
  subscript: 32,
  superscript: 64,
}

function getFormatClasses(format?: number | string): string {
  if (format === undefined || format === 0 || format === '') return ''

  const classes: string[] = []

  if (typeof format === 'number') {
    if (format & FORMAT_BITS.bold) classes.push('font-bold')
    if (format & FORMAT_BITS.italic) classes.push('italic')
    if (format & FORMAT_BITS.underline) classes.push('underline')
    if (format & FORMAT_BITS.strikethrough) classes.push('line-through')
    if (format & FORMAT_BITS.code) classes.push('font-mono text-sm bg-white/10 px-1 rounded')
    if (format & FORMAT_BITS.subscript) classes.push('align-sub text-sm')
    if (format & FORMAT_BITS.superscript) classes.push('align-super text-sm')
    return classes.join(' ')
  }

  const names = String(format)
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)

  for (const name of names) {
    if (name === 'bold') classes.push('font-bold')
    if (name === 'italic') classes.push('italic')
    if (name === 'underline') classes.push('underline')
    if (name === 'strikethrough') classes.push('line-through')
    if (name === 'code') classes.push('font-mono text-sm bg-white/10 px-1 rounded')
    if (name === 'subscript') classes.push('align-sub text-sm')
    if (name === 'superscript') classes.push('align-super text-sm')
  }

  return classes.join(' ')
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function resolveInternalLink(node: LexicalElementNode): string | undefined {
  const fields = node.fields
  if (!fields || typeof fields !== 'object') return node.url

  const linkUrl = (fields.url as string | undefined) || node.url
  if (typeof linkUrl === 'string' && linkUrl.length > 0) return linkUrl

  const doc = fields.doc as
    | {
        relationTo?: string
        value?: { slug?: string; id?: string | number }
      }
    | undefined

  if (doc?.value?.slug) {
    const slug = doc.value.slug
    switch (doc.relationTo) {
      case 'pages':
        return slug === 'home' ? '/' : `/${slug}`
      case 'projects':
        return `/work/${slug}`
      case 'services':
        return `/services/${slug}`
      case 'case-studies':
        return `/case-studies/${slug}`
      default:
        return `/${slug}`
    }
  }

  return node.url
}


function getMediaAlt(media: unknown): string {
  if (!media || typeof media !== 'object') return ''
  const doc = media as { alt?: string; filename?: string }
  return typeof doc.alt === 'string' ? doc.alt : typeof doc.filename === 'string' ? doc.filename : ''
}

export function LexicalReact({ nodes, parentTag: Parent = React.Fragment }: LexicalReactProps) {
  if (!nodes || nodes.length === 0) return null

  return (
    <Parent>
      {nodes.map((node, index) => {
        if (!node) return null
        const key = `lexical-${node.type}-${index}`

        if (node.type === 'text') {
          const textNode = node as LexicalTextNode
          const classes = getFormatClasses(textNode.format)
          if (classes) {
            return (
              <span key={key} className={classes}>
                {textNode.text}
              </span>
            )
          }
          return <React.Fragment key={key}>{textNode.text}</React.Fragment>
        }

        const elementNode = node as LexicalElementNode
        const children = elementNode.children ? <LexicalReact nodes={elementNode.children} /> : null

        switch (elementNode.type) {
          case 'paragraph':
            return <p key={key}>{children}</p>

          case 'heading': {
            const HeadingTag = (elementNode.tag || 'h2') as React.ElementType
            return <HeadingTag key={key}>{children}</HeadingTag>
          }

          case 'list': {
            const ListTag = elementNode.tag === 'ol' ? 'ol' : 'ul'
            return <ListTag key={key}>{children}</ListTag>
          }

          case 'listitem':
            return <li key={key}>{children}</li>

          case 'quote':
            return <blockquote key={key}>{children}</blockquote>

          case 'link': {
            const href = resolveInternalLink(elementNode) || '#'
            const rel = (elementNode.fields?.rel as string | undefined) || ''
            const rels = rel ? rel.split(',').map((r) => r.trim()) : []
            const isExternal = isExternalUrl(href)

            if (isExternal) {
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel={['noopener', 'noreferrer', ...rels].join(' ')}
                >
                  {children}
                </a>
              )
            }

            return (
              <Link key={key} href={href} rel={rels.join(' ') || undefined}>
                {children}
              </Link>
            )
          }

          case 'upload': {
            const fields = elementNode.fields as
              | {
                  doc?: { value?: unknown }
                  caption?: string | { root?: { children?: LexicalNode[] } }
                }
              | undefined
            const mediaValue = fields?.doc?.value
            const src = resolveCmsMediaUrl(mediaValue)
            const alt = getMediaAlt(mediaValue)
            if (!src) return null

            return (
              <figure key={key} className="my-8">
                <Image
                  src={src}
                  alt={alt}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
                {fields?.caption && (
                  <figcaption className="mt-2 text-sm text-white">
                    {typeof fields.caption === 'string' ? (
                      fields.caption
                    ) : (
                      <LexicalReact nodes={fields.caption.root?.children} />
                    )}
                  </figcaption>
                )}
              </figure>
            )
          }

          case 'horizontalrule':
            return <hr key={key} />

          case 'linebreak':
            return <br key={key} />

          case 'root':
            return <React.Fragment key={key}>{children}</React.Fragment>

          default:
            return children ? <React.Fragment key={key}>{children}</React.Fragment> : null
        }
      })}
    </Parent>
  )
}

export default LexicalReact
