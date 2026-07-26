import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import payloadConfig from '@/payload.config'
import {
  FALLBACK_NAVIGATION,
  FALLBACK_SITE_STYLES,
  FALLBACK_SEO_DEFAULTS,
} from '@/lib/fallbacks'
import type {
  NavigationLink,
  SiteStyleSettings,
  SeoDefaultsSettings,
} from '@/lib/fallbacks'

const CONTENT_ROOT = path.join(process.cwd(), 'content')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OgMeta {
  title: string
  description: string
  image: string
}

export interface SeoMeta {
  title: string
  description: string
  og: OgMeta
}

export interface SeoContentPage {
  title: string
  slug: string
  seo: SeoMeta
}

export interface ProjectImageTag {
  id: string
  slug: string
  title: string
}

export interface ProjectImage {
  url: string
  alt: string
  filename?: string
  note?: string
  width?: number
  height?: number
  /** Index into the raw CMS `images` array (set by mapCmsProject before the
   *  empty-url filter drops rows) so inline editing can target `images.N`. */
  sourceIndex?: number
  /** Backend-only tags — drive which /services|/tech pages this photo
   *  appears on. Never rendered on public project pages. */
  serviceTags: ProjectImageTag[]
  techTags: ProjectImageTag[]
}

export interface VideoEmbed {
  title: string
  provider: 'youtube' | 'instagram' | 'vimeo' | 'external'
  url: string
  embedUrl?: string
  note?: string
}

export interface BodyBlock {
  type: string
  heading?: string
  content?: string
  items?: string[]
}

export interface TrustBlock {
  type: 'trust'
  heading?: string
  items: string[]
}

export interface ProcessBlock {
  type: 'process'
  heading?: string
  items: string[]
}

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQBlock {
  type: 'faq'
  heading?: string
  items: FAQItem[]
}

export type ServiceBodyBlock = BodyBlock | TrustBlock | ProcessBlock | FAQBlock

export interface Project {
  id: string
  title: string
  slug: string
  canonicalSlug: string
  tags: string[]
  serviceTags: { id: string; slug: string; title: string }[]
  techTags: { id: string; slug: string; title: string }[]
  seo: SeoMeta
  hero: {
    headline: string
    subheadline: string
    tags: string[]
  }
  metadata: {
    client: string
    location?: string
    locations?: string[]
    type: string
    tech?: string[]
    techniques?: string[]
    materials?: string[]
    spec?: string[]
    software?: string[]
    partners: string[]
  }
  body: BodyBlock[]
  contentBlocks?: CMSPageBlock[]
  images: ProjectImage[]
  videos?: VideoEmbed[]
  /** CMS-only impact stats shown below the hero; JSON fallback emits []. */
  stats: { value: string; label: string }[]
}

export interface CaseStudy extends Project {}

export interface CuratedImageEntry {
  /** Canonical (bare) slug of the pinned project. */
  projectSlug: string
  imageIndex: number
  position: number
  hidden?: boolean
}

export interface Service {
  id: string
  title: string
  slug: string
  seo: SeoMeta
  hero: {
    headline: string
    subheadline: string
    cta: { label: string; url: string }
  }
  category: string
  /** service = sold offering (/services/*), tech = capability (/tech/*), rental = legacy rental page */
  pageType: 'service' | 'tech' | 'rental'
  /** Technologies behind a tech capability — display-only chips, never used for matching. */
  tech?: string[]
  capabilities: string[]
  body: ServiceBodyBlock[]
  contentBlocks?: CMSPageBlock[]
  relatedWork: { title: string; slug: string }[]
  /** Per-page pin/hide overrides for tagged photos (CMS-only; [] in JSON fallback). */
  curatedImages: CuratedImageEntry[]
  media?: {
    heroImage?: string
    galleryImages?: string[]
  }
}

export interface TeamMember {
  /** Payload doc id — present on CMS-backed members, absent on JSON fallback. */
  id?: string
  name: string
  title: string
  bio: string
  expertise: string[]
  order: number
  photo?: {
    url: string
    alt: string
  }
}

export interface Homepage {
  title: string
  slug: string
  seo: SeoMeta
  hero: {
    headline: string
    subheadline: string
    cta: { label: string; url: string }
    secondaryCta: { label: string; url: string }
  }
  sections: {
    type: string
    heading?: string
    body?: string
    columns?: { heading: string; body: string }[]
    items?: { label?: string; icon?: string; title?: string; slug?: string; tags?: string[] }[]
    cta?: { label: string; url: string }
  }[]
  media: {
    heroVideoUrl: string
    droneReelUrl: string
    videos?: VideoEmbed[]
    heroImage?: string
    galleryImages?: string[]
  }
}

export interface WorkIndexContent extends SeoContentPage {}

export interface ServicesIndexContent extends SeoContentPage {}

// ─── Loaders ──────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

export function getHomepage(): Homepage {
  return readJson<Homepage>(path.join(CONTENT_ROOT, 'homepage.json'))
}

export function getWorkIndex(): WorkIndexContent {
  return readJson<WorkIndexContent>(path.join(CONTENT_ROOT, 'work.json'))
}

export function getServicesIndex(): ServicesIndexContent {
  return readJson<ServicesIndexContent>(path.join(CONTENT_ROOT, 'services-index.json'))
}

export function getAbout() {
  return readJson<{
    title: string
    slug: string
    seo: SeoMeta
    hero: { headline: string; subheadline: string; cta: { label: string; url: string } }
    sections: {
      type: string
      heading?: string
      body?: string
      columns?: { heading: string; body: string }[]
      items?: { title?: string; body?: string }[] | string[]
      categories?: { label: string; items: string[] }[]
      cta?: { label: string; url: string }
    }[]
    media?: {
      heroImage?: string
      sectionImages?: string[]
    }
  }>(path.join(CONTENT_ROOT, 'about.json'))
}

export function getTeam() {
  return readJson<{
    title: string
    slug: string
    seo: SeoMeta
    hero: { headline: string; subheadline: string }
    members: TeamMember[]
    cta: { heading: string; body: string; label: string; url: string }
    media?: { heroImage?: string }
  }>(path.join(CONTENT_ROOT, 'team.json'))
}

export function getContact() {
  return readJson<{ title: string; slug: string; seo: SeoMeta; hero: { headline: string; subheadline: string }; address: { company: string; street: string; city: string; state: string; zip: string; formatted: string }; contact: { email: string; phone: string; phoneFormatted: string }; social: { youtube: string; instagram: string }; consultationForm: { heading: string; description: string; fields: { id: string; label: string; type: string; required: boolean; placeholder?: string; options?: string[] }[]; submitLabel: string; successMessage: string }; emailSignup: { heading: string; description: string; placeholder: string; submitLabel: string } }>(path.join(CONTENT_ROOT, 'contact.json'))
}

export function getAllProjects(): Project[] {
  const dir = path.join(CONTENT_ROOT, 'portfolio')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
  return files.map(file => {
    const legacy = readJson<Project>(path.join(dir, file))
    const canonicalSlug = normalizeProjectSlug(legacy.slug || file.replace('.json', ''))
    const tags = uniqueStrings((legacy.hero?.tags || []).map((tag) => normalizeProjectTag(tag)))
    return {
      ...legacy,
      slug: canonicalSlug,
      canonicalSlug,
      tags,
      images: withEmptyImageTags(legacy.images),
      stats: legacy.stats ?? [],
    }
  })
}

export function getProject(slug: string): Project | null {
  const filePath = path.join(CONTENT_ROOT, 'portfolio', `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  const legacy = readJson<Project>(filePath)
  const canonicalSlug = normalizeProjectSlug(legacy.slug || slug)
  const tags = uniqueStrings((legacy.hero?.tags || []).map((tag) => normalizeProjectTag(tag)))
  return {
    ...legacy,
    slug: canonicalSlug,
    canonicalSlug,
    tags,
    images: withEmptyImageTags(legacy.images),
    stats: legacy.stats ?? [],
  }
}

// Image-level tags are CMS-only; the JSON baseline carries none.
function withEmptyImageTags(images: Project['images'] | undefined): Project['images'] {
  return (images || []).map((img) => ({
    ...img,
    serviceTags: img.serviceTags ?? [],
    techTags: img.techTags ?? [],
  }))
}

export function getAllServices(): Service[] {
  const dir = path.join(CONTENT_ROOT, 'services')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
  return files.map(file => ({
    ...readJson<Service>(path.join(dir, file)),
    // curatedImages is CMS-only; the JSON baseline carries none.
    curatedImages: [],
  }))
}

export function getService(slug: string): Service | null {
  const filePath = path.join(CONTENT_ROOT, 'services', `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  return { ...readJson<Service>(filePath), curatedImages: [] }
}

export function getProjectSlugs(): string[] {
  const dir = path.join(CONTENT_ROOT, 'portfolio')
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).sort()
}

export function getServiceSlugs(): string[] {
  const dir = path.join(CONTENT_ROOT, 'services')
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).sort()
}

function asArray<T>(input: unknown): T[] {
  return Array.isArray(input) ? (input as T[]) : []
}

export function normalizeProjectSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^\/+/, '')
    .replace(/^work\/+/, '')
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|-+$/g, '')
}

export function normalizeProjectTag(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeServiceSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^\/+/, '')
    .replace(/^services\/+/, '')
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|-+$/g, '')
}

export function normalizeCaseStudySlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^\/+/, '')
    .replace(/^case-studies\/+/, '')
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|-+$/g, '')
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

async function isPreviewModeEnabled(): Promise<boolean> {
  try {
    const state = await draftMode()
    return Boolean(state.isEnabled)
  } catch {
    return false
  }
}

function extractProjectTags(doc: Record<string, unknown>): string[] {
  const projectTags = asArray<Record<string, unknown>>(doc.tags)
    .map((row) => normalizeProjectTag(String(row.tag || '')))
    .filter(Boolean)
  const heroTags = asArray<Record<string, unknown>>((doc.hero as unknown as Record<string, unknown>)?.tags)
    .map((row) => normalizeProjectTag(String(row.tag || '')))
    .filter(Boolean)
  return uniqueStrings([...projectTags, ...heroTags])
}

export function resolveCmsMediaUrl(media: unknown): string | undefined {
  if (!media || typeof media !== 'object') return undefined
  const doc = media as { legacyUrl?: string; url?: string }
  if (doc.legacyUrl) return doc.legacyUrl
  if (doc.url) return doc.url
  return undefined
}

function mapCmsContentBlock(block: Record<string, unknown>): CMSPageBlock {
  return {
    blockType: String(block.blockType || '') as CMSPageBlock['blockType'],
    heading: block.heading ? String(block.heading) : undefined,
    body: block.body,
    images: Array.isArray(block.images)
      ? block.images.map((img: unknown) => {
          if (!img || typeof img !== 'object') return { url: '' }
          const image = img as unknown as Record<string, unknown>
          return {
            id: image.id ? String(image.id) : undefined,
            url: resolveCmsMediaUrl(image) || String(image.url || ''),
            alt: image.alt ? String(image.alt) : undefined,
          }
        })
      : undefined,
    items: Array.isArray(block.items)
      ? block.items.map((item: unknown) => {
          if (!item || typeof item !== 'object') return { label: '' }
          const row = item as unknown as Record<string, unknown>
          return {
            label: row.label ? String(row.label) : undefined,
            icon: row.icon ? String(row.icon) : undefined,
            title: row.title ? String(row.title) : undefined,
            body: row.body,
            image: row.image ? String(row.image) : undefined,
            link: row.link ? String(row.link) : undefined,
            textPosition: row.textPosition
              ? (String(row.textPosition) as 'center' | 'top' | 'bottom' | 'below' | 'hidden')
              : undefined,
          }
        })
      : undefined,
    columns: Array.isArray(block.columns)
      ? block.columns.map((col: unknown) => {
          if (!col || typeof col !== 'object') return { heading: '' }
          const row = col as unknown as Record<string, unknown>
          return {
            heading: row.heading ? String(row.heading) : undefined,
            body: row.body,
            image: row.image ? String(row.image) : undefined,
          }
        })
      : undefined,
    projects: Array.isArray(block.projects)
      ? block.projects.map((project: unknown) => {
          if (!project || typeof project !== 'object') return {}
          const doc = project as unknown as Record<string, unknown>
          return {
            slug: doc.slug ? String(doc.slug) : undefined,
            title: doc.title ? String(doc.title) : undefined,
            hero: doc.hero as unknown as Record<string, unknown> | undefined,
            images: Array.isArray(doc.images)
              ? doc.images.map((img: unknown) => {
                  if (!img || typeof img !== 'object') return {}
                  const image = img as unknown as Record<string, unknown>
                  return {
                    url: resolveCmsMediaUrl(image) || String(image.url || ''),
                    alt: image.alt ? String(image.alt) : undefined,
                  }
                })
              : undefined,
            seo: doc.seo as unknown as Record<string, unknown> | undefined,
          }
        })
      : undefined,
    label: block.label ? String(block.label) : undefined,
    url: block.url ? String(block.url) : undefined,
    provider: (block.provider as CMSPageBlock['provider']) || undefined,
    cta:
      block.cta && typeof block.cta === 'object'
        ? {
            label: (block.cta as unknown as Record<string, unknown>).label
              ? String((block.cta as unknown as Record<string, unknown>).label)
              : undefined,
            url: (block.cta as unknown as Record<string, unknown>).url
              ? String((block.cta as unknown as Record<string, unknown>).url)
              : undefined,
          }
        : undefined,
  }
}

function mapCmsImageTags(rows: unknown, routePrefix: '/services/' | '/tech/'): ProjectImageTag[] {
  return asArray<Record<string, unknown> | number>(rows)
    .map((row) => {
      // Depth-populated relationship docs arrive as objects; bare IDs carry no usable label.
      if (typeof row !== 'object' || row === null) return { id: String(row), slug: '', title: '' }
      return {
        id: String(row.id || ''),
        slug: `${routePrefix}${normalizeServiceSlug(String(row.slug || ''))}`,
        title: String(row.title || ''),
      }
    })
    .filter((tag) => Boolean(tag.title))
}

function mapCmsProject(doc: Record<string, unknown>): Project {
  const images = asArray<Record<string, unknown>>(doc.images).map((row, index) => {
    const media = row.media as unknown as Record<string, unknown> | undefined
    const url = resolveCmsMediaUrl(media) || String(row.legacyUrl || '')
    const width = media?.width ? Number(media.width) : row.width ? Number(row.width) : undefined
    const height = media?.height ? Number(media.height) : row.height ? Number(row.height) : undefined
    return {
      url,
      alt: String(row.alt || 'Project media'),
      filename: row.filename ? String(row.filename) : undefined,
      note: row.note ? String(row.note) : undefined,
      width,
      height,
      sourceIndex: index,
      serviceTags: mapCmsImageTags(row.serviceTags, '/services/'),
      techTags: mapCmsImageTags(row.techTags, '/tech/'),
    }
  })

  return {
    id: String(doc.id || ''),
    title: String(doc.title || ''),
    slug: normalizeProjectSlug(String(doc.slug || '')),
    canonicalSlug: normalizeProjectSlug(String(doc.slug || '')),
    tags: extractProjectTags(doc),
    serviceTags: asArray<Record<string, unknown> | number>(doc.serviceTags)
      .map((row) => {
        // Depth-populated relationship docs arrive as objects; bare IDs carry no usable label.
        if (typeof row !== 'object' || row === null) return { id: String(row), slug: '', title: '' }
        return {
          id: String(row.id || ''),
          slug: `/services/${normalizeServiceSlug(String(row.slug || ''))}`,
          title: String(row.title || ''),
        }
      })
      .filter((tag) => Boolean(tag.title)),
    techTags: asArray<Record<string, unknown> | number>(doc.techTags)
      .map((row) => {
        if (typeof row !== 'object' || row === null) return { id: String(row), slug: '', title: '' }
        return {
          id: String(row.id || ''),
          slug: `/tech/${normalizeServiceSlug(String(row.slug || ''))}`,
          title: String(row.title || ''),
        }
      })
      .filter((tag) => Boolean(tag.title)),
    seo: {
      title: String((doc.seo as unknown as Record<string, unknown>)?.title || ''),
      description: String((doc.seo as unknown as Record<string, unknown>)?.description || ''),
      og: {
        title: String((doc.seo as unknown as Record<string, unknown>)?.ogTitle || ''),
        description: String((doc.seo as unknown as Record<string, unknown>)?.ogDescription || ''),
        image:
          resolveCmsMediaUrl((doc.seo as unknown as Record<string, unknown>)?.ogImage) ||
          String((doc.seo as unknown as Record<string, unknown>)?.ogImageLegacyUrl || '') ||
          '/og-default.jpg',
      },
    },
    hero: {
      headline: String((doc.hero as unknown as Record<string, unknown>)?.headline || ''),
      subheadline: String((doc.hero as unknown as Record<string, unknown>)?.subheadline || ''),
      tags: asArray<Record<string, unknown>>((doc.hero as unknown as Record<string, unknown>)?.tags).map((t) => String(t.tag || '')),
    },
    metadata: {
      client: String((doc.metadata as unknown as Record<string, unknown>)?.client || ''),
      location: (doc.metadata as unknown as Record<string, unknown>)?.location ? String((doc.metadata as unknown as Record<string, unknown>).location) : undefined,
      locations: asArray<Record<string, unknown>>((doc.metadata as unknown as Record<string, unknown>)?.locations).map((l) => String(l.location || '')).filter(Boolean),
      type: String((doc.metadata as unknown as Record<string, unknown>)?.type || ''),
      tech: asArray<Record<string, unknown>>((doc.metadata as unknown as Record<string, unknown>)?.tech).map((v) => String(v.value || '')).filter(Boolean),
      techniques: asArray<Record<string, unknown>>((doc.metadata as unknown as Record<string, unknown>)?.techniques).map((v) => String(v.value || '')).filter(Boolean),
      materials: asArray<Record<string, unknown>>((doc.metadata as unknown as Record<string, unknown>)?.materials).map((v) => String(v.value || '')).filter(Boolean),
      spec: asArray<Record<string, unknown>>((doc.metadata as unknown as Record<string, unknown>)?.spec).map((v) => String(v.value || '')).filter(Boolean),
      software: asArray<Record<string, unknown>>((doc.metadata as unknown as Record<string, unknown>)?.software).map((v) => String(v.value || '')).filter(Boolean),
      partners: asArray<Record<string, unknown>>((doc.metadata as unknown as Record<string, unknown>)?.partners).map((v) => String(v.name || '')).filter(Boolean),
    },
    stats: asArray<Record<string, unknown>>(doc.stats)
      .map((row) => ({ value: String(row.value || ''), label: String(row.label || '') }))
      .filter((row) => row.value && row.label),
    body: asArray<Record<string, unknown>>(doc.body).map((block) => ({
      type: String(block.type || ''),
      heading: block.heading ? String(block.heading) : undefined,
      content: block.content ? String(block.content) : undefined,
      items: asArray<Record<string, unknown>>(block.items).map((item) => String(item.value || '')).filter(Boolean),
    })),
    contentBlocks: asArray<Record<string, unknown>>(doc.contentBlocks).map((block) =>
      mapCmsContentBlock(block),
    ) as CMSPageBlock[],
    images: images.filter((row) => row.url),
    videos: asArray<Record<string, unknown>>(doc.videos).map((video) => ({
      title: String(video.title || 'Video'),
      provider: (video.provider as VideoEmbed['provider']) || 'external',
      url: String(video.url || ''),
      embedUrl: video.embedUrl ? String(video.embedUrl) : undefined,
      note: video.note ? String(video.note) : undefined,
    })),
  }
}

function mapCmsService(doc: Record<string, unknown>): Service {
  return {
    id: String(doc.id || ''),
    title: String(doc.title || ''),
    // JSON service files carry the route-prefixed form ("/services/<slug>"); match it exactly.
    slug: `/services/${normalizeServiceSlug(String(doc.slug || ''))}`,
    seo: {
      title: String((doc.seo as unknown as Record<string, unknown>)?.title || ''),
      description: String((doc.seo as unknown as Record<string, unknown>)?.description || ''),
      og: {
        title: String((doc.seo as unknown as Record<string, unknown>)?.ogTitle || ''),
        description: String((doc.seo as unknown as Record<string, unknown>)?.ogDescription || ''),
        image:
          resolveCmsMediaUrl((doc.seo as unknown as Record<string, unknown>)?.ogImage) ||
          String((doc.seo as unknown as Record<string, unknown>)?.ogImageLegacyUrl || '') ||
          '/og-default.jpg',
      },
    },
    hero: {
      headline: String((doc.hero as unknown as Record<string, unknown>)?.headline || ''),
      subheadline: String((doc.hero as unknown as Record<string, unknown>)?.subheadline || ''),
      cta: {
        label: String(((doc.hero as unknown as Record<string, unknown>)?.cta as unknown as Record<string, unknown>)?.label || 'Contact'),
        url: String(((doc.hero as unknown as Record<string, unknown>)?.cta as unknown as Record<string, unknown>)?.url || '/contact'),
      },
    },
    category: String(doc.category || ''),
    pageType: (['service', 'tech', 'rental'].includes(String(doc.pageType)) ? String(doc.pageType) : 'service') as Service['pageType'],
    tech: asArray<Record<string, unknown>>(doc.tech).map((item) => String(item.value || '')).filter(Boolean),
    capabilities: asArray<Record<string, unknown>>(doc.capabilities).map((item) => String(item.value || '')).filter(Boolean),
    body: asArray<Record<string, unknown>>(doc.body).map((block): ServiceBodyBlock => {
      const type = String(block.type || '')
      if (type === 'faq') {
        // FAQ blocks store {question, answer} pairs; all other blocks use plain `value` strings.
        return {
          type: 'faq',
          heading: block.heading ? String(block.heading) : undefined,
          items: asArray<Record<string, unknown>>(block.items)
            .map((item) => ({ question: String(item.question || ''), answer: String(item.answer || '') }))
            .filter((item) => Boolean(item.question)),
        }
      }
      return {
        type,
        heading: block.heading ? String(block.heading) : undefined,
        content: block.content ? String(block.content) : undefined,
        items: asArray<Record<string, unknown>>(block.items).map((item) => String(item.value || '')).filter(Boolean),
      }
    }),
    contentBlocks: asArray<Record<string, unknown>>(doc.contentBlocks).map((block) =>
      mapCmsContentBlock(block),
    ) as CMSPageBlock[],
    relatedWork: asArray<Record<string, unknown>>(doc.relatedWork).map((row) => ({
      title: String(row.title || ''),
      slug: String(row.slug || ''),
    })),
    curatedImages: asArray<Record<string, unknown>>(doc.curatedImages)
      .map((row): CuratedImageEntry | null => {
        // Depth-populated relationship → resolve to the canonical bare slug.
        // Bare-ID rows (unpopulated) can't be matched and are dropped.
        const project = row.project as unknown
        if (!project || typeof project !== 'object') return null
        const projectSlug = normalizeProjectSlug(String((project as Record<string, unknown>).slug || ''))
        if (!projectSlug) return null
        return {
          projectSlug,
          imageIndex: Number(row.imageIndex ?? 0),
          position: Number(row.position ?? 0),
          hidden: row.hidden === true ? true : undefined,
        }
      })
      .filter((row): row is CuratedImageEntry => Boolean(row)),
    media: {
      heroImage:
        resolveCmsMediaUrl(((doc.media as unknown as Record<string, unknown>)?.heroImage as unknown)) ||
        String((doc.media as unknown as Record<string, unknown>)?.heroImageLegacyUrl || ''),
      galleryImages: asArray<Record<string, unknown>>((doc.media as unknown as Record<string, unknown>)?.galleryImages)
        // No .filter(Boolean) here: the array index doubles as the inline-edit
        // field path (media.galleryImages.N), so empty rows must keep their
        // slot. Renderers skip empty urls themselves.
        .map((item) => resolveCmsMediaUrl(item.media as unknown) || String(item.legacyUrl || '')),
    },
  }
}

export async function getAllProjectsResolved(): Promise<Project[]> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'projects',
      where: preview
        ? undefined
        : {
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      sort: 'listOrder',
      limit: 200,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    if (result.docs.length > 0) {
      return result.docs.map((doc) => mapCmsProject(doc as unknown as Record<string, unknown>))
    }
  } catch (error) {
    console.warn('Failed to load projects from CMS; falling back to JSON:', error)
  }
  return getAllProjects()
}

/**
 * Lightweight project lookup for the homepage featured grid: only the slugs
 * asked for, and only the fields the cards read (title/slug/tags/hero/
 * metadata/images/seo) — body, contentBlocks, and videos stay in Postgres.
 */
export async function getFeaturedProjectsResolved(slugs: string[]): Promise<Project[]> {
  const canonicalSlugs = uniqueStrings(slugs.map((slug) => normalizeProjectSlug(slug)))
  if (canonicalSlugs.length === 0) return []
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    // Match both canonical slugs and the legacy "work/<slug>" stored form.
    const slugCandidates = [...canonicalSlugs, ...canonicalSlugs.map((slug) => `work/${slug}`)]
    const result = await payload.find({
      collection: 'projects',
      where: preview
        ? {
            slug: { in: slugCandidates },
          }
        : {
            slug: { in: slugCandidates },
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      select: {
        title: true,
        slug: true,
        tags: true,
        hero: true,
        metadata: true,
        images: true,
        seo: true,
      },
      limit: canonicalSlugs.length,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    if (result.docs.length > 0) {
      return result.docs.map((doc) => mapCmsProject(doc as unknown as Record<string, unknown>))
    }
  } catch (error) {
    console.warn('Failed to load featured projects from CMS; falling back to JSON:', error)
  }
  const bySlug = new Map(getAllProjects().map((project) => [project.canonicalSlug, project]))
  return canonicalSlugs
    .map((slug) => bySlug.get(slug))
    .filter((project): project is Project => Boolean(project))
}

export async function getProjectResolved(slug: string): Promise<Project | null> {
  const canonicalSlug = normalizeProjectSlug(slug)
  if (!canonicalSlug) return null
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const resultByCanonical = await payload.find({
      collection: 'projects',
      where: preview
        ? {
            slug: { equals: canonicalSlug },
          }
        : {
            slug: { equals: canonicalSlug },
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      limit: 1,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    const canonicalDoc = resultByCanonical.docs[0]
    if (canonicalDoc) return mapCmsProject(canonicalDoc as unknown as Record<string, unknown>)

    const legacyResult = await payload.find({
      collection: 'projects',
      where: preview
        ? {
            slug: { equals: `work/${canonicalSlug}` },
          }
        : {
            slug: { equals: `work/${canonicalSlug}` },
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      limit: 1,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    const legacyDoc = legacyResult.docs[0]
    if (legacyDoc) return mapCmsProject(legacyDoc as unknown as Record<string, unknown>)
  } catch (error) {
    console.warn(`Failed to load project from CMS for slug "${canonicalSlug}"; falling back to JSON:`, error)
  }
  return getProject(canonicalSlug)
}

export async function getProjectSlugsResolved(): Promise<string[]> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'projects',
      where: preview
        ? undefined
        : {
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      limit: 500,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    const slugs = uniqueStrings(
      result.docs
        .map((doc) => normalizeProjectSlug(String((doc as unknown as Record<string, unknown>).slug || '')))
        .filter(Boolean),
    ).sort()
    if (slugs.length > 0) return slugs
  } catch (error) {
    console.warn('Failed to load project slugs from CMS; falling back to JSON:', error)
  }
  return getProjectSlugs()
}

export async function getProjectTagsResolved(): Promise<string[]> {
  const projects = await getAllProjectsResolved()
  return uniqueStrings(projects.flatMap((project) => project.tags.map((tag) => normalizeProjectTag(tag)))).sort()
}

export async function getProjectsByTagResolved(tag: string): Promise<Project[]> {
  const normalizedTag = normalizeProjectTag(tag)
  if (!normalizedTag) return []
  const projects = await getAllProjectsResolved()
  return projects.filter((project) => project.tags.includes(normalizedTag))
}

export interface TaggedImageEntry {
  project: Project
  image: ProjectImage
  /** Index into the project doc's raw `images` array (inline-edit field path). */
  imageIndex: number
}

/** Bare-slug comparison for resolved tag slugs ("/services/<slug>" / "/tech/<slug>"). */
function bareTagSlug(slug: string): string {
  return slug.replace(/^\/(services|tech)\/+/, '')
}

/**
 * All project images tagged with the given service/tech bare slug, in the
 * stable automatic order: project order (getAllProjectsResolved sort), then
 * image order within each project.
 */
export async function getTaggedImagesForSlug(
  bareSlug: string,
  kind: 'service' | 'tech',
): Promise<TaggedImageEntry[]> {
  const projects = await getAllProjectsResolved()
  const entries: TaggedImageEntry[] = []
  for (const project of projects) {
    project.images.forEach((image, arrayIndex) => {
      if (!image.url || image.url.trim() === '') return
      const tags = kind === 'service' ? image.serviceTags : image.techTags
      if ((tags || []).some((tag) => bareTagSlug(tag.slug) === bareSlug)) {
        // sourceIndex is the raw CMS `images` row index — the same numbering
        // Payload admin and the inline editor (images.N) use.
        entries.push({ project, image, imageIndex: image.sourceIndex ?? arrayIndex })
      }
    })
  }
  return entries
}

function taggedImageKey(entry: { project: Project; imageIndex: number }): string {
  return `${entry.project.canonicalSlug}#${entry.imageIndex}`
}

/**
 * Merge the automatic tagged-image order with a page's curatedImages
 * pin/hide overrides:
 * 1. Entries with a `hidden` curated row are dropped.
 * 2. Pinned entries are removed from the auto pool and inserted at their
 *    `position` (ascending order, clamped to list length).
 * 3. Remaining auto entries fill the free slots top-down — so a newly tagged
 *    image (no curated row) lands in the highest unpinned slot.
 */
export function mergeCuratedTaggedImages(
  tagged: TaggedImageEntry[],
  curated: CuratedImageEntry[],
): TaggedImageEntry[] {
  if (curated.length === 0) return tagged

  const hiddenKeys = new Set(
    curated.filter((row) => row.hidden).map((row) => `${row.projectSlug}#${row.imageIndex}`),
  )
  const visible = tagged.filter((entry) => !hiddenKeys.has(taggedImageKey(entry)))

  const pins = curated
    .filter((row) => !row.hidden)
    .slice()
    .sort((a, b) => a.position - b.position)

  const result = visible.filter(
    (entry) => !pins.some((pin) => `${pin.projectSlug}#${pin.imageIndex}` === taggedImageKey(entry)),
  )
  for (const pin of pins) {
    const entry = visible.find(
      (candidate) => taggedImageKey(candidate) === `${pin.projectSlug}#${pin.imageIndex}`,
    )
    if (!entry) continue
    const at = Math.max(0, Math.min(pin.position, result.length))
    result.splice(at, 0, entry)
  }
  return result
}

export async function getAllServicesResolved(): Promise<Service[]> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'services',
      where: preview
        ? undefined
        : {
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      sort: 'listOrder',
      limit: 200,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    if (result.docs.length > 0) {
      return result.docs.map((doc) => mapCmsService(doc as unknown as Record<string, unknown>))
    }
  } catch (error) {
    console.warn('Failed to load services from CMS; falling back to JSON:', error)
  }
  return getAllServices()
}

export async function getServiceResolved(slug: string): Promise<Service | null> {
  const bareSlug = normalizeServiceSlug(slug)
  if (!bareSlug) return null
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    // Seeded docs store the slug as "services/<slug>"; accept any caller form.
    const candidates = [`services/${bareSlug}`, bareSlug, `/services/${bareSlug}`]
    const result = await payload.find({
      collection: 'services',
      where: preview
        ? {
            slug: { in: candidates },
          }
        : {
            slug: { in: candidates },
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      limit: 1,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    const doc = result.docs[0]
    if (doc) return mapCmsService(doc as unknown as Record<string, unknown>)
  } catch (error) {
    console.warn(`Failed to load service from CMS for slug "${slug}"; falling back to JSON:`, error)
  }
  return getService(bareSlug)
}

export async function getServiceSlugsResolved(): Promise<string[]> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'services',
      where: preview
        ? undefined
        : {
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      limit: 500,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    if (result.docs.length > 0) {
      return uniqueStrings(
        result.docs
          .map((doc) => normalizeServiceSlug(String((doc as unknown as Record<string, unknown>).slug || '')))
          .filter(Boolean),
      ).sort()
    }
  } catch (error) {
    console.warn('Failed to load service slugs from CMS; falling back to JSON:', error)
  }
  return getServiceSlugs()
}

export async function getTeamResolved() {
  const fallback = getTeam()
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const teamMembersResult = await payload.find({
      collection: 'team',
      where: preview
        ? undefined
        : {
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      sort: 'order',
      limit: 200,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    const pageResult = await payload.find({
      collection: 'pages',
      where: preview
        ? { slug: { equals: 'team' } }
        : {
            slug: { equals: 'team' },
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      limit: 1,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    const page = pageResult.docs[0] as unknown as Record<string, unknown> | undefined
    const teamHeroImage = resolveCmsMediaUrl(((page?.seo as unknown as Record<string, unknown>)?.ogImage as unknown))
    if (teamMembersResult.docs.length === 0) return fallback

    return {
      title: page?.title ? String(page.title) : fallback.title,
      // JSON content carries the route-prefixed form ("/team"); match it exactly.
      slug: page?.slug ? `/${String(page.slug).replace(/^\/+/, '')}` : fallback.slug,
      seo: {
        title: String(((page?.seo as unknown as Record<string, unknown>)?.title as string) || fallback.seo.title),
        description: String(((page?.seo as unknown as Record<string, unknown>)?.description as string) || fallback.seo.description),
        og: {
          title: String(((page?.seo as unknown as Record<string, unknown>)?.ogTitle as string) || fallback.seo.og.title),
          description: String(((page?.seo as unknown as Record<string, unknown>)?.ogDescription as string) || fallback.seo.og.description),
          image: teamHeroImage || fallback.seo.og.image,
        },
      },
      hero: {
        headline: String(((page?.hero as unknown as Record<string, unknown>)?.headline as string) || fallback.hero.headline),
        subheadline: String(((page?.hero as unknown as Record<string, unknown>)?.subheadline as string) || fallback.hero.subheadline),
      },
      members: teamMembersResult.docs.map((doc) => {
        const row = doc as unknown as Record<string, unknown>
        const photo = row.photo as unknown as Record<string, unknown> | undefined
        return {
          id: String(row.id || ''),
          name: String(row.name || ''),
          title: String(row.title || ''),
          bio: String(row.bio || ''),
          expertise: asArray<Record<string, unknown>>(row.expertise).map((item) => String(item.value || '')).filter(Boolean),
          order: Number(row.order || 0),
          photo: {
            url: resolveCmsMediaUrl(photo?.media) || String(photo?.legacyUrl || ''),
            alt: String(photo?.alt || row.name || 'Team member'),
          },
        }
      }),
      cta: fallback.cta,
      media: {
        heroImage: teamHeroImage || fallback.media?.heroImage,
      },
    }
  } catch {
    return fallback
  }
}

function lexicalNodeToPlaintext(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as unknown as Record<string, unknown>
  if (typeof n.text === 'string') return n.text
  const children = Array.isArray(n.children) ? n.children : []
  const text = children.map((child) => lexicalNodeToPlaintext(child)).join('')
  const type = typeof n.type === 'string' ? n.type : ''
  if (type === 'paragraph' || type === 'heading' || type === 'listitem' || type === 'quote') {
    return text + '\n\n'
  }
  return text
}

export function lexicalToPlaintext(richText: unknown): string {
  const root = (richText as { root?: unknown } | null | undefined)?.root
  return lexicalNodeToPlaintext(root).replace(/\n{3,}/g, '\n\n').trim()
}

// ─── Page resolvers (home / about / contact) ────────────────────────────────
// CMS drives seo, hero, media (and, for contact, the flat groups). Section
// copy passes through from JSON: rendered copy is component-hardcoded or
// structurally lossy in the blocks schema.

type CmsPageDoc = Record<string, unknown>

async function findCmsPageDoc(slug: string): Promise<CmsPageDoc | undefined> {
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
    // Trusted server-side read: the where clause above already enforces
    // published-only outside preview mode, and preview needs draft access.
    overrideAccess: true,
  })
  return result.docs[0] as unknown as CmsPageDoc | undefined
}

function pageSeo(page: CmsPageDoc | undefined, fallback: SeoMeta): SeoMeta {
  const seo = ((page?.seo as unknown as Record<string, unknown> | undefined) || {})
  return {
    title: String(seo.title || fallback.title),
    description: String(seo.description || fallback.description),
    og: {
      title: String(seo.ogTitle || fallback.og.title),
      description: String(seo.ogDescription || fallback.og.description),
      image: resolveCmsMediaUrl(seo.ogImage) || fallback.og.image,
    },
  }
}

function pageMediaAssets(page: CmsPageDoc | undefined): { heroImage: string; galleryImages: string[] } {
  const media = ((page?.media as unknown as Record<string, unknown> | undefined) || {})
  return {
    heroImage: resolveCmsMediaUrl(media.heroImage) || String(media.heroImageLegacyUrl || ''),
    galleryImages: asArray<Record<string, unknown>>(media.galleryImages)
      .map((row) => resolveCmsMediaUrl(row.media) || String(row.legacyUrl || ''))
      .filter(Boolean),
  }
}

function pageHeroCta(value: unknown, fallback: { label: string; url: string }): { label: string; url: string } {
  const cta = ((value as unknown as Record<string, unknown> | undefined) || {})
  return {
    label: String(cta.label || fallback.label),
    url: String(cta.url || fallback.url),
  }
}

export async function getHomepageResolved(): Promise<Homepage> {
  const fallback = getHomepage()
  try {
    const page = await findCmsPageDoc('home')
    if (!page) return fallback
    const hero = ((page.hero as unknown as Record<string, unknown> | undefined) || {})
    const media = pageMediaAssets(page)
    return {
      ...fallback,
      title: page.title ? String(page.title) : fallback.title,
      slug: fallback.slug,
      seo: pageSeo(page, fallback.seo),
      hero: {
        headline: String(hero.headline || fallback.hero.headline),
        subheadline: String(hero.subheadline || fallback.hero.subheadline),
        cta: pageHeroCta(hero.cta, fallback.hero.cta),
        secondaryCta: pageHeroCta(hero.secondaryCta, fallback.hero.secondaryCta),
      },
      sections: fallback.sections,
      media: {
        ...fallback.media,
        heroImage: media.heroImage || fallback.media.heroImage,
        galleryImages: media.galleryImages.length > 0 ? media.galleryImages : fallback.media.galleryImages,
      },
    }
  } catch {
    return fallback
  }
}

export async function getAboutResolved(): Promise<ReturnType<typeof getAbout>> {
  const fallback = getAbout()
  try {
    const page = await findCmsPageDoc('about')
    if (!page) return fallback
    const hero = ((page.hero as unknown as Record<string, unknown> | undefined) || {})
    const media = pageMediaAssets(page)
    return {
      ...fallback,
      title: page.title ? String(page.title) : fallback.title,
      slug: fallback.slug,
      seo: pageSeo(page, fallback.seo),
      hero: {
        headline: String(hero.headline || fallback.hero.headline),
        subheadline: String(hero.subheadline || fallback.hero.subheadline),
        cta: pageHeroCta(hero.cta, fallback.hero.cta),
      },
      sections: fallback.sections,
      media: {
        ...fallback.media,
        heroImage: media.heroImage || fallback.media?.heroImage,
        sectionImages: media.galleryImages.length > 0 ? media.galleryImages : fallback.media?.sectionImages,
      },
    }
  } catch {
    return fallback
  }
}

export async function getContactResolved(): Promise<ReturnType<typeof getContact>> {
  const fallback = getContact()
  try {
    const page = await findCmsPageDoc('contact')
    if (!page) return fallback
    const hero = ((page.hero as unknown as Record<string, unknown> | undefined) || {})
    const address = ((page.address as unknown as Record<string, unknown> | undefined) || {})
    const contactInfo = ((page.contactInfo as unknown as Record<string, unknown> | undefined) || {})
    const social = ((page.social as unknown as Record<string, unknown> | undefined) || {})
    const form = ((page.consultationForm as unknown as Record<string, unknown> | undefined) || {})
    const signup = ((page.emailSignup as unknown as Record<string, unknown> | undefined) || {})
    const cmsFields = asArray<Record<string, unknown>>(form.fields).map((field) => ({
      id: String(field.id || ''),
      label: String(field.label || ''),
      type: String(field.type || 'text'),
      required: Boolean(field.required),
      ...(field.placeholder ? { placeholder: String(field.placeholder) } : {}),
      ...(asArray<Record<string, unknown>>(field.options).length > 0
        ? { options: asArray<Record<string, unknown>>(field.options).map((o) => String(o.value || '')).filter(Boolean) }
        : {}),
    }))
    const resolved = {
      ...fallback,
      title: page.title ? String(page.title) : fallback.title,
      slug: fallback.slug,
      seo: pageSeo(page, fallback.seo),
      hero: {
        headline: String(hero.headline || fallback.hero.headline),
        subheadline: String(hero.subheadline || fallback.hero.subheadline),
      },
      address: {
        ...fallback.address,
        company: String(address.company || fallback.address.company),
        street: String(address.street || fallback.address.street),
        city: String(address.city || fallback.address.city),
        state: String(address.state || fallback.address.state),
        zip: String(address.zip || fallback.address.zip),
        formatted: String(address.formatted || fallback.address.formatted),
      },
      contact: {
        email: String(contactInfo.email || (fallback as { contact?: { email: string } }).contact?.email || ''),
        phone: String(contactInfo.phone || (fallback as { contact?: { phone: string } }).contact?.phone || ''),
        phoneFormatted: String(contactInfo.phoneFormatted || (fallback as { contact?: { phoneFormatted: string } }).contact?.phoneFormatted || ''),
      },
      social: {
        youtube: String(social.youtube || fallback.social.youtube),
        instagram: String(social.instagram || fallback.social.instagram),
      },
      consultationForm: {
        heading: String(form.heading || fallback.consultationForm.heading),
        description: String(form.description || fallback.consultationForm.description),
        submitLabel: String(form.submitLabel || fallback.consultationForm.submitLabel),
        successMessage: String(form.successMessage || fallback.consultationForm.successMessage),
        fields: (cmsFields.length > 0 ? cmsFields : fallback.consultationForm.fields) as typeof fallback.consultationForm.fields,
      },
      emailSignup: {
        heading: String(signup.heading || fallback.emailSignup.heading),
        description: String(signup.description || fallback.emailSignup.description),
        placeholder: String(signup.placeholder || fallback.emailSignup.placeholder),
        submitLabel: String(signup.submitLabel || fallback.emailSignup.submitLabel),
      },
    }
    return resolved as ReturnType<typeof getContact>
  } catch {
    return fallback
  }
}

export interface CMSPageBlock {
  blockType:
    | 'intro'
    | 'text'
    | 'gallery'
    | 'features'
    | 'capabilitiesGrid'
    | 'philosophy'
    | 'featuredWork'
    | 'cta'
    | 'video'
    | 'ctaBar'
  heading?: string
  body?: unknown
  images?: Array<{ id?: string; url?: string; alt?: string }>
  items?: Array<{ label?: string; icon?: string; title?: string; body?: unknown; image?: string; link?: string; textPosition?: 'center' | 'top' | 'bottom' | 'below' | 'hidden' }>
  columns?: Array<{ heading?: string; body?: unknown; image?: string }>
  projects?: Array<{
    slug?: string
    title?: string
    hero?: { tags?: string[] }
    images?: Array<{ url?: string; alt?: string }>
    seo?: { og?: { image?: string } }
  }>
  label?: string
  url?: string
  provider?: 'youtube' | 'vimeo' | 'instagram' | 'external'
  cta?: { label?: string; url?: string }
}

export interface CMSPageData {
  id: string
  title: string
  slug: string
  hero?: {
    eyebrow?: string
    headline?: string
    subheadline?: string
    cta?: { label?: string; url?: string }
    secondaryCta?: { label?: string; url?: string }
  }
  seo?: {
    title?: string
    description?: string
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
  }
  blocks: CMSPageBlock[]
}

let payloadClientPromise: ReturnType<typeof getPayload> | null = null

async function getPayloadClient() {
  if (!payloadClientPromise) {
    payloadClientPromise = getPayload({
      config: payloadConfig,
    })
  }
  return payloadClientPromise
}

export interface MediaLibraryItem {
  id: string
  url: string
  filename: string
}

// Lightweight media list for the inline gallery editor's library picker.
export async function getMediaLibrary(): Promise<MediaLibraryItem[]> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'media',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    return result.docs
      .map((doc) => ({
        id: String(doc.id),
        url: doc.url || doc.legacyUrl || '',
        filename: doc.filename || '',
      }))
      .filter((item) => item.url !== '')
  } catch {
    return []
  }
}

export interface CapabilityTileItem {
  label: string
  image?: string
  link?: string
  textPosition?: 'center' | 'top' | 'bottom' | 'below' | 'hidden'
}

/**
 * The Services page tile grid, from the capability-tiles global (inline-
 * editable on /services). Returns [] when unset — callers fall back to
 * the curated defaults in lib/capabilities.
 */
export async function getCapabilityTiles(): Promise<CapabilityTileItem[]> {
  try {
    const payload = await getPayloadClient()
    const global = await payload.findGlobal({ slug: 'capability-tiles', depth: 0 })
    const items = (global as { items?: unknown[] }).items
    if (!Array.isArray(items)) return []
    return items
      .map((row): CapabilityTileItem | null => {
        if (!row || typeof row !== 'object') return null
        const item = row as Record<string, unknown>
        if (!item.label) return null
        return {
          label: String(item.label),
          image: item.image ? String(item.image) : undefined,
          link: item.link ? String(item.link) : undefined,
          textPosition: item.textPosition
            ? (String(item.textPosition) as CapabilityTileItem['textPosition'])
            : undefined,
        }
      })
      .filter((item): item is CapabilityTileItem => Boolean(item))
  } catch {
    return []
  }
}

function resolveMediaUrl(media: unknown): string | undefined {
  if (!media || typeof media !== 'object') return undefined
  const maybeUrl = (media as { url?: string }).url
  if (typeof maybeUrl === 'string' && maybeUrl.length > 0) return maybeUrl
  return undefined
}

export async function getNavigationLinks(): Promise<NavigationLink[]> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const nav = await payload.findGlobal({
      slug: 'navigation',
      depth: 1,
    })

    const items = Array.isArray((nav as { items?: unknown[] }).items) ? (nav as { items: unknown[] }).items : []
    const links = items
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as { enabled?: boolean; label?: string; path?: string; order?: number }
        if (row.enabled === false) return null
        if (!row.label || !row.path) return null
        return {
          label: row.label,
          href: row.path,
          order: typeof row.order === 'number' ? row.order : 0,
        }
      })
      .filter((row): row is { label: string; href: string; order: number } => Boolean(row))
      .sort((a, b) => a.order - b.order)
      .map(({ label, href }) => ({ label, href }))

    if (links.length > 0) return links

    const pages = await payload.find({
      collection: 'pages',
      where: preview
        ? {
            showInNav: { equals: true },
          }
        : {
            status: { equals: 'published' },
            isEnabled: { equals: true },
            showInNav: { equals: true },
          },
      sort: 'navOrder',
      limit: 50,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })

    const pageLinks = pages.docs
      .map((page) => {
        const doc = page as { slug?: string; navLabel?: string; title?: string }
        const slug = doc.slug || ''
        if (!slug || slug === 'homepage' || slug === 'home') return null
        return {
          label: doc.navLabel || doc.title || slug,
          href: `/${slug}`,
        }
      })
      .filter((entry): entry is NavigationLink => Boolean(entry))

    return pageLinks.length > 0 ? pageLinks : FALLBACK_NAVIGATION
  } catch {
    return FALLBACK_NAVIGATION
  }
}

export async function getSiteStyles(): Promise<SiteStyleSettings> {
  try {
    const payload = await getPayloadClient()
    const styles = await payload.findGlobal({ slug: 'site-styles' })
    return {
      brandPrimary: (styles as { brandPrimary?: string }).brandPrimary || FALLBACK_SITE_STYLES.brandPrimary,
      brandSecondary: (styles as { brandSecondary?: string }).brandSecondary || FALLBACK_SITE_STYLES.brandSecondary,
      backgroundColor: (styles as { backgroundColor?: string }).backgroundColor || FALLBACK_SITE_STYLES.backgroundColor,
      fontFamilyHeading: (styles as { fontFamilyHeading?: string }).fontFamilyHeading || FALLBACK_SITE_STYLES.fontFamilyHeading,
      fontFamilyBody: (styles as { fontFamilyBody?: string }).fontFamilyBody || FALLBACK_SITE_STYLES.fontFamilyBody,
      buttonStyle: ((styles as { buttonStyle?: 'sharp' | 'rounded' }).buttonStyle || FALLBACK_SITE_STYLES.buttonStyle),
    }
  } catch {
    return FALLBACK_SITE_STYLES
  }
}

export async function getSeoDefaults(): Promise<SeoDefaultsSettings> {
  try {
    const payload = await getPayloadClient()
    const seo = await payload.findGlobal({ slug: 'seo-defaults' })
    return {
      siteName: (seo as { siteName?: string }).siteName || FALLBACK_SEO_DEFAULTS.siteName,
      defaultTitle: (seo as { defaultTitle?: string }).defaultTitle || FALLBACK_SEO_DEFAULTS.defaultTitle,
      titleTemplate: (seo as { titleTemplate?: string }).titleTemplate || FALLBACK_SEO_DEFAULTS.titleTemplate,
      defaultDescription: (seo as { defaultDescription?: string }).defaultDescription || FALLBACK_SEO_DEFAULTS.defaultDescription,
      noindexByDefault:
        typeof (seo as { noindexByDefault?: boolean }).noindexByDefault === 'boolean'
          ? (seo as { noindexByDefault: boolean }).noindexByDefault
          : FALLBACK_SEO_DEFAULTS.noindexByDefault,
    }
  } catch {
    return FALLBACK_SEO_DEFAULTS
  }
}

export async function getCMSPageSlugs(): Promise<string[]> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'pages',
      where: preview
        ? {
            slug: {
              not_equals: 'home',
            },
          }
        : {
            slug: {
              not_equals: 'home',
            },
            status: {
              equals: 'published',
            },
            isEnabled: {
              equals: true,
            },
          },
      limit: 500,
      select: {
        slug: true,
      },
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })

    return (result.docs as Array<{ slug?: string }>)
      .map((doc) => doc.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
      .sort()
  } catch {
    return []
  }
}

export async function getCMSPageBySlug(slug: string): Promise<CMSPageData | null> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'pages',
      where: preview
        ? {
            slug: {
              equals: slug,
            },
          }
        : {
            slug: {
              equals: slug,
            },
            status: {
              equals: 'published',
            },
            isEnabled: {
              equals: true,
            },
          },
      limit: 1,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })

    const page = result.docs[0] as unknown as
      | {
          id: string
          title: string
          slug: string
          hero?: CMSPageData['hero']
          seo?: { title?: string; description?: string; ogTitle?: string; ogDescription?: string; ogImage?: unknown }
          blocks?: CMSPageBlock[]
        }
      | undefined

    if (!page) return null

    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      hero: page.hero,
      seo: {
        title: page.seo?.title,
        description: page.seo?.description,
        ogTitle: page.seo?.ogTitle,
        ogDescription: page.seo?.ogDescription,
        ogImage: resolveCmsMediaUrl(page.seo?.ogImage),
      },
      blocks: page.blocks || [],
    }
  } catch {
    return null
  }
}

function mapCmsCaseStudy(doc: Record<string, unknown>): CaseStudy {
  const mapped = mapCmsProject(doc)
  const canonicalSlug = normalizeCaseStudySlug(String(doc.slug || mapped.slug))
  return {
    ...mapped,
    slug: canonicalSlug,
    canonicalSlug,
  }
}

export async function getAllCaseStudiesResolved(): Promise<CaseStudy[]> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'case-studies',
      where: preview
        ? undefined
        : {
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      sort: 'listOrder',
      limit: 200,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    return result.docs.map((doc) => mapCmsCaseStudy(doc as unknown as Record<string, unknown>))
  } catch (error) {
    console.error('Failed to load case studies from CMS:', error)
    return []
  }
}

export async function getCaseStudyResolved(slug: string): Promise<CaseStudy | null> {
  const canonicalSlug = normalizeCaseStudySlug(slug)
  if (!canonicalSlug) return null
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'case-studies',
      where: preview
        ? {
            slug: { equals: canonicalSlug },
          }
        : {
            slug: { equals: canonicalSlug },
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      limit: 1,
      depth: 2,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    const doc = result.docs[0]
    if (doc) return mapCmsCaseStudy(doc as unknown as Record<string, unknown>)
  } catch (error) {
    console.error(`Failed to load case study from CMS for slug "${canonicalSlug}":`, error)
  }
  return null
}

export async function getCaseStudySlugsResolved(): Promise<string[]> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'case-studies',
      where: preview
        ? undefined
        : {
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      limit: 500,
      draft: preview,
      // Trusted server-side reads: the where clauses above already enforce
      // published-only outside preview mode, and preview needs draft access.
      overrideAccess: true,
    })
    return uniqueStrings(
      result.docs
        .map((doc) => normalizeCaseStudySlug(String((doc as unknown as Record<string, unknown>).slug || '')))
        .filter(Boolean),
    ).sort()
  } catch (error) {
    console.error('Failed to load case study slugs from CMS:', error)
    return []
  }
}
