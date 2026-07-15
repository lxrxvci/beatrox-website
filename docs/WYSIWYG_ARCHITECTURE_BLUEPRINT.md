# WYSIWYG Architecture Blueprint — Payload CMS + Next.js

## 1. Executive Summary

This blueprint defines how to evolve the BEATROX CMS from a **structured-field-first** model (textareas, arrays, hardcoded page sections) to a **WYSIWYG-first** editorial experience built on Payload CMS’s native Lexical rich-text editor, while preserving the existing JSON safety net, parity gate, and public/preview rendering rules.

**Scope:**
- Admin WYSIWYG editing experience (Payload Lexical).
- Server-side rendering of rich text in Next.js App Router pages.
- Block-based page composition that mixes WYSIWYG content with structured components.
- Migration path for current JSON/textarea content into Lexical documents.
- Editorial controls: drafts, previews, ISR, and parity compliance.

**Out of scope (for this phase):**
- Live collaborative editing.
- Custom inline video/audio players inside Lexical (keep using dedicated blocks).
- Full visual layout builder (stay within block + WYSIWYG composition).

---

## 2. Current State Assessment

| Area | Current State |
|------|---------------|
| Payload editor | `lexicalEditor()` is already configured as the default editor in `site/payload.config.ts`. |
| Rich-text fields | Only `Pages.blocks` uses `richText` today (`intro.body`, `text.body`). |
| Structured copy | `Projects.body`, `Services.body`, and page sections are arrays of text/textarea fields. |
| Frontend rendering | `site/app/(site)/[slug]/page.tsx` returns `notFound()`. Home/about/contact are hardcoded components driven by `getHomepageResolved` / `getAboutResolved` / `getContactResolved`, which read JSON/structured CMS data. |
| Serialization | `site/lib/content.ts` has `lexicalToPlaintext()` only. No HTML/React serializer exists. |
| Media | CMS `Media` collection + Vercel Blob storage; `resolveCmsMediaUrl()` is the canonical resolver. |
| Parity | `npm run cms:parity` compares CMS resolver output to JSON getters. Any shape change must be mirrored in both. |

**Key gaps:**
1. Rich-text output is not rendered on the site.
2. Editorial users cannot author free-form marketing copy without developer changes.
3. Page blocks exist in schema but have no frontend implementation.
4. Migration path from JSON/textarea content to Lexical is undefined.

---

## 3. Target Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PAYLOAD ADMIN (WYSIWYG)                             │
│  Lexical Editor ──► Custom Toolbar ──► Blocks (intro/text/media/cta/...)    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ JSON (Lexical nodes)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CMS LAYER                                      │
│  Collections: Pages, Projects, Services, CaseStudies, Team                  │
│  Globals:    Navigation, SiteStyles, SeoDefaults                            │
│  Database:   Neon Postgres (via @payloadcms/db-postgres)                    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ REST / GraphQL / direct SDK
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTENT GATEWAY                                     │
│  site/lib/content.ts                                                        │
│  - getPageResolved(slug)                                                    │
│  - getProjectResolved(slug)                                                 │
│  - getServiceResolved(slug)                                                 │
│  - lexicalToPlaintext() (existing)                                          │
│  - lexicalToReact() / lexicalToHtml() (new)                                 │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌─────────────────────┐         ┌─────────────────────┐
        │   BLOCK RENDERER    │         │  RICH-TEXT SERIALIZER│
        │ site/components/blocks│        │ site/components/richtext│
        │  - IntroBlock         │         │  - LexicalReact       │
        │  - TextBlock          │         │  - Node converters    │
        │  - GalleryBlock       │         │  - Link / Media nodes │
        │  - CtaBlock           │         └─────────────────────┘
        │  - FeatureBlock       │
        │  - Custom blocks      │
        └─────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │   NEXT.JS PAGES     │
        │  site/app/(site)/*  │
        └─────────────────────┘
```

---

## 4. Lexical Editor Configuration

Payload 3 ships with Lexical. The default instance is already imported in `site/payload.config.ts`:

```ts
import { lexicalEditor } from '@payloadcms/richtext-lexical'

editor: lexicalEditor(),
```

### 4.1 Recommended Default Feature Pack

Create a shared editor factory so every `richText` field uses the same toolbar and converters.

**New file:** `site/payload/fields/richText.ts`

```ts
import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  HeadingFeature,
  ParagraphFeature,
  AlignFeature,
  UnorderedListFeature,
  OrderedListFeature,
  LinkFeature,
  BlockquoteFeature,
  UploadFeature,
  HorizontalRuleFeature,
  InlineCodeFeature,
  SuperscriptFeature,
  SubscriptFeature,
  ChecklistFeature,
} from '@payloadcms/richtext-lexical'
import type { RichTextField } from 'payload'

export const defaultRichText = (overrides?: Partial<RichTextField>): RichTextField => ({
  name: 'body',
  type: 'richText',
  editor: lexicalEditor({
    features: () => [
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      StrikethroughFeature(),
      InlineCodeFeature(),
      SuperscriptFeature(),
      SubscriptFeature(),
      AlignFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      ChecklistFeature(),
      BlockquoteFeature(),
      HorizontalRuleFeature(),
      LinkFeature({
        enabledCollections: ['pages', 'projects', 'services', 'case-studies'],
        fields: [
          { name: 'rel', type: 'select', options: ['nofollow', 'noopener', 'noreferrer'] },
        ],
      }),
      UploadFeature({
        collections: { media: { fields: [{ name: 'caption', type: 'text' }] } },
      }),
    ],
  }),
  ...overrides,
})
```

### 4.2 Per-Field Overrides

Some fields need a reduced toolbar (e.g., inline blurbs, captions):

```ts
export const minimalRichText = (overrides?: Partial<RichTextField>): RichTextField =>
  defaultRichText({
    name: 'caption',
    editor: lexicalEditor({
      features: () => [
        ParagraphFeature(),
        BoldFeature(),
        ItalicFeature(),
        LinkFeature({ enabledCollections: ['pages'] }),
      ],
    }),
    ...overrides,
  })
```

### 4.3 Custom Lexical Nodes (Future-Proofing)

If the team needs custom inline elements (e.g., a styled highlight span, footnote marker, or inline CTA button), add them via Lexical’s node API:

1. Define the Lexical node class in `site/payload/richtext/nodes/`.
2. Register it in the editor factory via `editorConfig.features` or `editorConfig.nodes`.
3. Provide a server converter in the serializer (see §6).

**Recommendation:** Defer custom nodes until Phase 2. The default feature pack covers 90% of marketing copy needs.

---

## 5. Schema Changes

### 5.1 Pages Collection

The `Pages` collection already has a `blocks` field with `intro` and `text` blocks using `richText`. The target state expands this into a true page builder.

**File:** `site/payload/collections/Pages.ts`

Proposed block inventory:

| Block | Purpose | Key Fields |
|-------|---------|------------|
| `intro` | Hero-ish centered copy | `heading`, `body` (richText), `cta` |
| `text` | Free-form text section | `heading`, `body` (richText), `width` |
| `media` | Image / video embed | `media` (upload), `caption` (richText), `layout` |
| `gallery` | Multi-image grid | `images` (upload hasMany), `columns` |
| `features` | Icon + text list | `items` array: `icon`, `heading`, `body` (richText) |
| `capabilitiesGrid` | Capability chips | `items` array: `label`, `icon` |
| `philosophy` | 3-column copy | `columns` array: `heading`, `body` (richText) |
| `cta` | Call-to-action band | `heading`, `body` (richText), `cta` group |
| `ctaBar` | Full-width CTA | `heading`, `body`, `cta` group |
| `video` | External video embed | `url`, `provider` |
| `featuredWork` | Curated project grid | `projects` relationship hasMany |
| `quote` | Pull quote / testimonial | `quote` (richText), `attribution` |
| `divider` | Visual separator | `style` |

**Important:** Existing `textarea` fields inside blocks (e.g., `philosophy.columns.body`) should migrate to `richText` with the minimal toolbar so editors can use inline links and bold/italic.

### 5.2 Projects & Services Collections

Replace the rigid `body` array with a flexible `contentBlocks` blocks field. Keep the legacy `body` array read-only for a transition window, then drop it after parity passes.

**New field on Projects/Services:**

```ts
{
  name: 'contentBlocks',
  type: 'blocks',
  blocks: [
    'text',
    'media',
    'gallery',
    'video',
    'features',
    'quote',
    'cta',
    'relatedWork', // projects only
  ],
}
```

Reuse the same block definitions from Pages to guarantee rendering consistency.

### 5.3 Globals

No schema changes required for `Navigation`, `SiteStyles`, or `SeoDefaults` in Phase 1. In Phase 2, consider a rich-text `footerBlurb` on `SiteStyles` if needed.

---

## 6. Rich-Text Serialization Layer

Lexical stores documents as JSON. The frontend needs a serializer that converts Lexical nodes into React elements (preferred) or HTML strings.

### 6.1 Recommended Approach: React Serializer

Create a server-safe React component that recursively renders nodes. It runs inside async Server Components and can call `resolveCmsMediaUrl()` for upload nodes.

**New file:** `site/components/richtext/LexicalReact.tsx`

```tsx
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { resolveCmsMediaUrl } from '@/lib/content'
import type { SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'

export type LexicalNode = SerializedLexicalNode & {
  type?: string
  text?: string
  tag?: string
  format?: string | number
  indent?: number
  version?: number
  direction?: 'ltr' | 'rtl' | null
  children?: LexicalNode[]
  fields?: Record<string, unknown>
  url?: string
  doc?: { relationTo: string; value: { slug?: string; id?: string } }
}

export interface LexicalReactProps {
  nodes: LexicalNode[] | undefined
  parentTag?: keyof JSX.IntrinsicElements
}

const TEXT_FORMAT_MAP: Record<string, string> = {
  bold: 'font-bold',
  italic: 'italic',
  underline: 'underline',
  strikethrough: 'line-through',
  code: 'font-mono text-sm bg-white/10 px-1 rounded',
  subscript: 'align-sub text-sm',
  superscript: 'align-super text-sm',
}

function getTextClasses(format?: string | number): string {
  if (typeof format !== 'string') return ''
  return format
    .split(',')
    .map((f) => TEXT_FORMAT_MAP[f.trim()])
    .filter(Boolean)
    .join(' ')
}

function resolveInternalLink(node: LexicalNode): string | undefined {
  if (node.fields?.url) return String(node.fields.url)
  if (node.doc?.value?.slug) {
    const slug = node.doc.value.slug
    const prefix = node.doc.relationTo === 'pages' ? '' : `/${node.doc.relationTo}`
    return `${prefix}/${slug}`
  }
  return node.url
}

export function LexicalReact({ nodes, parentTag: Parent = React.Fragment }: LexicalReactProps) {
  if (!nodes) return null
  return (
    <Parent>
      {nodes.map((node, index) => {
        const key = `lexical-${node.type || 'node'}-${index}`
        const children = node.children ? <LexicalReact nodes={node.children} /> : null

        switch (node.type) {
          case 'text':
            const classes = getTextClasses(node.format)
            return classes ? (
              <span key={key} className={classes}>
                {node.text}
              </span>
            ) : (
              <React.Fragment key={key}>{node.text}</React.Fragment>
            )

          case 'paragraph':
            return <p key={key}>{children}</p>

          case 'heading':
            const HeadingTag = (node.tag || 'h2') as keyof JSX.IntrinsicElements
            return <HeadingTag key={key}>{children}</HeadingTag>

          case 'list':
            const ListTag = node.tag === 'ol' ? 'ol' : 'ul'
            return <ListTag key={key}>{children}</ListTag>

          case 'listitem':
            return <li key={key}>{children}</li>

          case 'quote':
            return <blockquote key={key}>{children}</blockquote>

          case 'link':
            const href = resolveInternalLink(node) || '#'
            const isExternal = /^https?:\/\//.test(href)
            if (isExternal) {
              return (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              )
            }
            return (
              <Link key={key} href={href}>
                {children}
              </Link>
            )

          case 'upload':
            const mediaValue = node.fields?.doc?.value as Record<string, unknown> | undefined
            const src = resolveCmsMediaUrl(mediaValue) || String(mediaValue?.url || '')
            const alt = String(mediaValue?.alt || '')
            return src ? (
              <figure key={key}>
                <Image src={src} alt={alt} width={800} height={600} className="object-cover" />
                {node.fields?.caption && (
                  <figcaption>
                    <LexicalReact nodes={[{ type: 'paragraph', children: [{ type: 'text', text: String(node.fields.caption) }] }]} />
                  </figcaption>
                )}
              </figure>
            ) : null

          case 'horizontalrule':
            return <hr key={key} />

          case 'linebreak':
            return <br key={key} />

          default:
            return children ? <React.Fragment key={key}>{children}</React.Fragment> : null
        }
      })}
    </Parent>
  )
}
```

**Usage in a block:**

```tsx
import { LexicalReact } from '@/components/richtext/LexicalReact'

export function TextBlock({ heading, body }: { heading?: string; body?: { root: LexicalNode } }) {
  return (
    <section className="section">
      <div className="max-w-[1120px] mx-auto">
        {heading && <h2 className="heading-lg mb-8">{heading}</h2>}
        <div className="prose prose-invert max-w-none">
          <LexicalReact nodes={body?.root?.children} />
        </div>
      </div>
    </section>
  )
}
```

### 6.2 Alternative: HTML Serializer

If React recursion proves too heavy for a specific use case (e.g., email templates), use Payload’s `@payloadcms/richtext-lexical/html` converter:

```ts
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

const html = convertLexicalToHTML({ data: richText as any })
```

Then render with `dangerouslySetInnerHTML`. Prefer the React serializer for the site to preserve Next.js `<Link>` and `<Image>` optimizations.

### 6.3 Plaintext Reuse

The existing `lexicalToPlaintext()` remains the canonical source for SEO descriptions, meta excerpts, and search indexing. No change needed.

---

## 7. Block Renderer Architecture

### 7.1 Shared Block Registry

Define each block once and register it for every collection that uses it.

**New file:** `site/payload/blocks/index.ts`

```ts
export { introBlock } from './intro'
export { textBlock } from './text'
export { mediaBlock } from './media'
export { galleryBlock } from './gallery'
export { featuresBlock } from './features'
export { capabilitiesGridBlock } from './capabilitiesGrid'
export { philosophyBlock } from './philosophy'
export { ctaBlock } from './cta'
export { ctaBarBlock } from './ctaBar'
export { videoBlock } from './video'
export { featuredWorkBlock } from './featuredWork'
export { quoteBlock } from './quote'
export { dividerBlock } from './divider'
```

**New file:** `site/components/blocks/index.ts`

```ts
export { IntroBlock } from './IntroBlock'
export { TextBlock } from './TextBlock'
export { MediaBlock } from './MediaBlock'
export { GalleryBlock } from './GalleryBlock'
export { FeaturesBlock } from './FeaturesBlock'
export { CapabilitiesGridBlock } from './CapabilitiesGridBlock'
export { PhilosophyBlock } from './PhilosophyBlock'
export { CtaBlock } from './CtaBlock'
export { CtaBarBlock } from './CtaBarBlock'
export { VideoBlock } from './VideoBlock'
export { FeaturedWorkBlock } from './FeaturedWorkBlock'
export { QuoteBlock } from './QuoteBlock'
export { DividerBlock } from './DividerBlock'
```

### 7.2 Type-Safe Block Mapping

Use a single discriminated union type derived from Payload generated types:

```ts
import type { Page } from '@/payload-types'

export type PageBlock = NonNullable<Page['blocks']>[number]

export function renderPageBlock(block: PageBlock, index: number) {
  switch (block.blockType) {
    case 'intro':
      return <IntroBlock key={index} {...block} />
    case 'text':
      return <TextBlock key={index} {...block} />
    // ...
    default:
      return null
  }
}
```

### 7.3 Generic Page Route

Replace `site/app/(site)/[slug]/page.tsx` with a real dynamic page renderer:

```tsx
import { notFound } from 'next/navigation'
import { getPageResolved, getPageSlugs } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import { renderPageBlock } from '@/components/blocks'
import type { Metadata } from 'next'

export const revalidate = 300
export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await getPageSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageResolved(slug)
  return seoToMetadata(page?.seo)
}

export default async function CMSPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPageResolved(slug)
  if (!page) notFound()

  return (
    <article>
      {page.blocks?.map((block, index) => renderPageBlock(block as any, index))}
    </article>
  )
}
```

### 7.4 Collection Detail Pages

Update `site/app/(site)/work/[slug]/page.tsx`, `services/[slug]/page.tsx`, and `case-studies/[slug]/page.tsx` to render `contentBlocks` after their hero/metadata sections.

---

## 8. Tailwind Typography Integration

Lexical output needs predictable typography without custom per-node classes. Use `@tailwindcss/typography` plugin (if not already installed) or a project-specific `prose` utility.

**Minimal prose styles** (add to `site/app/globals.css` or Tailwind v4 theme):

```css
.prose {
  color: rgba(255, 255, 255, 0.85);
}
.prose h2 { @apply heading-lg mt-12 mb-6; }
.prose h3 { @apply heading-md mt-10 mb-4; }
.prose p { @apply text-base leading-relaxed mb-5; }
.prose ul { @apply list-disc pl-6 mb-5 space-y-2; }
.prose ol { @apply list-decimal pl-6 mb-5 space-y-2; }
.prose a { @apply text-[var(--accent)] hover:underline; }
.prose blockquote { @apply border-l-2 border-[var(--accent)] pl-5 italic my-8; }
.prose hr { @apply border-white/10 my-12; }
.prose figure { @apply my-8; }
.prose figcaption { @apply text-sm text-white/60 mt-2; }
```

---

## 9. Content Gateway Updates

### 9.1 New / Updated Resolvers

In `site/lib/content.ts`:

```ts
export async function getPageResolved(slug: string) {
  const payload = await getPayloadClient()
  const preview = await isPreviewModeEnabled()
  const result = await payload.find({
    collection: 'pages',
    where: preview
      ? { slug: { equals: slug } }
      : { slug: { equals: slug }, status: { equals: 'published' }, isEnabled: { equals: true } },
    limit: 1,
    depth: 2,
    draft: preview,
  })
  return result.docs[0] as Page | undefined
}

export async function getPageSlugs(): Promise<string[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: { status: { equals: 'published' }, isEnabled: { equals: true } },
    limit: 1000,
    select: { slug: true },
  })
  return result.docs.map((doc) => String(doc.slug)).filter(Boolean)
}
```

### 9.2 Resolver Shape Requirements

- Keep JSON fallback for home/about/contact during migration.
- Once `pages` collection becomes authoritative for a slug, the JSON getter can become a thin fallback.
- Ensure `seoToMetadata()` accepts the CMS `seo` group shape.

---

## 10. Migration Strategy

### 10.1 Phase 1: Pages Block Builder (Low Risk)

1. Add the shared `richText.ts` editor factory.
2. Expand `Pages.blocks` with new block types.
3. Build the block React components and `[slug]/page.tsx` renderer.
4. Seed a few test pages in a staging DB.
5. Add `getPageResolved` and `getPageSlugs` resolvers.
6. Keep home/about/contact as hardcoded routes until content parity is achieved.

### 10.2 Phase 2: Convert Hardcoded Pages to CMS

1. Create CMS documents for `/`, `/about`, `/contact` using the new block schema.
2. Refactor `page.tsx` routes to render from `getPageResolved`.
3. Update JSON fallbacks to match the new block-based shape.
4. Run `npm run cms:parity` and fix mismatches.
5. Update seed script `scripts/cms-import-pages.mjs` to emit Lexical JSON for `body` fields instead of plain strings.

### 10.3 Phase 3: Projects & Services Body Migration

1. Add `contentBlocks` to `Projects` and `Services`.
2. Write a migration script that transforms the existing `body` array into `contentBlocks`:
   - `type === 'text'` → `text` block with `body` as Lexical paragraph.
   - `type === 'heading'` → `text` block with `heading` and optional body.
   - `type === 'gallery'` → `gallery` block.
   - `type === 'video'` → `video` block.
3. Run migration against a Neon branch first.
4. Update detail page renderers to use `contentBlocks`.
5. Mark legacy `body` array deprecated, then remove after parity passes.

### 10.4 Lexical JSON Builder Utility

Create a helper to convert plain text/markdown-ish content into Lexical documents for seeding and migration.

**New file:** `site/lib/lexical-builder.ts`

```ts
import type { LexicalNode } from '@/components/richtext/LexicalReact'

export function lexicalParagraph(text: string): LexicalNode {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text }],
  }
}

export function lexicalHeading(tag: 'h2' | 'h3' | 'h4', text: string): LexicalNode {
  return {
    type: 'heading',
    tag,
    children: [{ type: 'text', text }],
  }
}

export function lexicalDocument(nodes: LexicalNode[]): { root: LexicalNode } {
  return {
    root: {
      type: 'root',
      children: nodes,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
```

---

## 11. Media & Link Handling

### 11.1 Upload Nodes

Lexical upload nodes embed a reference to the `media` collection. With `depth: 2` in resolvers, the media document is populated and `resolveCmsMediaUrl()` can resolve `legacyUrl` or Blob URL.

### 11.2 Internal Links

Use Payload’s `LinkFeature` with `enabledCollections`. The serializer in §6 resolves:
- `pages` → `/<slug>`
- `projects` → `/work/<slug>`
- `services` → `/services/<slug>`
- `case-studies` → `/case-studies/<slug>`

### 11.3 External Links

External URLs are detected by `https?://` prefix and rendered with `target="_blank" rel="noopener noreferrer"`.

---

## 12. Draft, Preview, and ISR

- Existing draft preview infrastructure (`site/app/preview/route.ts`, `isPreviewModeEnabled()`) works unchanged.
- Lexical documents are stored in the doc and fetched with `draft: preview` automatically.
- ISR `revalidate = 300` remains. Admin edits to rich text will appear publicly within ~5 minutes.
- For urgent edits, add an on-demand revalidation route or redeploy.

---

## 13. Editorial Guardrails

| Guardrail | Implementation |
|-----------|----------------|
| Heading order | Lexical `HeadingFeature` limits to h2–h4. Page title is h1, so editors cannot create rogue h1s. |
| Link safety | External links auto-render with `rel="noopener noreferrer"`. |
| Image alt text | Upload feature enforces `alt` on the `media` collection; caption is optional. |
| Max image width | Use Next.js `<Image>` with layout constraints to prevent oversized uploads from breaking layout. |
| Block variety | Provide a curated block list rather than infinite layout options to preserve design consistency. |
| Required fields | `body` is required on `intro` and `text` blocks so empty sections cannot be saved. |

---

## 14. Testing & Parity Checklist

Before wiring any page to the CMS:

- [ ] `npm run cms:types` regenerates `site/payload-types.ts` with new block shapes.
- [ ] `npm run cms:importmap` regenerates the admin import map.
- [ ] `npm run cms:parity` passes 100% against updated JSON baselines.
- [ ] Block React components render without hydration errors in dev.
- [ ] Internal Lexical links resolve to correct canonical routes.
- [ ] Upload nodes render with `resolveCmsMediaUrl()` fallback chain.
- [ ] Draft preview shows unpublished rich-text changes.
- [ ] ISR revalidation reflects edits within 5 minutes on production.
- [ ] SEO metadata still populates from `lexicalToPlaintext()` when descriptions are empty.

---

## 15. Implementation Phases (Recommended Order)

| Phase | Work | Deliverable |
|-------|------|-------------|
| 0 | Spike | Working local Lexical serializer + one test page. |
| 1 | Foundation | `richText.ts` factory, `LexicalReact.tsx` serializer, block React components. |
| 2 | Pages Builder | Expanded `Pages.blocks`, generic `[slug]/page.tsx`, `getPageResolved`/`getPageSlugs`. |
| 3 | Home/About/Contact CMS | Migrate hardcoded routes to CMS-driven block rendering; update JSON fallbacks. |
| 4 | Projects/Services Body | Add `contentBlocks`, migration script, detail page rendering. |
| 5 | Polish | Custom nodes (if needed), typography refinements, editor training docs. |

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Schema push fails on Vercel | Run local Payload init against prod DB after each schema change per runbook. |
| Parity gate fails | Update JSON getters and seed scripts together; never change resolver shape alone. |
| Hydration mismatches | Keep serializer deterministic; avoid `Math.random()` or `Date.now()` in render path. |
| Editors create inaccessible content | Enforce heading/alt constraints; run `seo:audit` and accessibility checks. |
| Large uploads break serverless | Keep image compression workflow; Blob storage handles file serving. |
| Legacy `body` array conflicts | Keep old field read-only until migration is verified, then drop in a follow-up PR. |

---

## 17. File Inventory (New & Modified)

### New files
- `site/payload/fields/richText.ts`
- `site/payload/blocks/*.ts`
- `site/components/richtext/LexicalReact.tsx`
- `site/components/blocks/*.tsx`
- `site/lib/lexical-builder.ts`
- `site/scripts/migrate-body-to-blocks.mjs`

### Modified files
- `site/payload.config.ts` (editor factory reference)
- `site/payload/collections/Pages.ts`
- `site/payload/collections/Projects.ts`
- `site/payload/collections/Services.ts`
- `site/lib/content.ts` (new resolvers)
- `site/app/(site)/[slug]/page.tsx`
- `site/app/(site)/page.tsx`
- `site/app/(site)/about/page.tsx`
- `site/app/(site)/contact/page.tsx`
- `site/app/(site)/work/[slug]/page.tsx`
- `site/app/(site)/services/[slug]/page.tsx`
- `site/app/globals.css` (prose styles)

---

## 18. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Editor | Payload Lexical (built-in) | Already installed, officially supported, deep Next.js/Payload integration. |
| Serializer | React component | Preserves Next.js `<Link>`/`<Image>` and avoids `dangerouslySetInnerHTML`. |
| Page composition | Blocks + WYSIWYG | Structured blocks keep design system intact; WYSIWYG inside blocks gives copy freedom. |
| Migration | Staged: pages first, then projects/services | Pages have no live public renderer today, so risk is lowest. |
| Heading limit | h2–h4 only | Page-level h1 is reserved for the route/template. |
| Internal links | Collection-aware `LinkFeature` | Ensures URL consistency with canonical slug policy. |

---

*Next step: Review and approve this blueprint, then begin Phase 0 spike to validate the Lexical serializer against a single test page.*
