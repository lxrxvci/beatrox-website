import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import payloadConfig from '@/payload.config'

const CONTENT_ROOT = path.join(process.cwd(), '..', 'content')

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

export interface ProjectImage {
  url: string
  alt: string
  filename?: string
  note?: string
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

export interface Project {
  title: string
  slug: string
  canonicalSlug: string
  tags: string[]
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
  images: ProjectImage[]
  videos?: VideoEmbed[]
}

export interface CaseStudy extends Project {}

export interface Service {
  title: string
  slug: string
  seo: SeoMeta
  hero: {
    headline: string
    subheadline: string
    cta: { label: string; url: string }
  }
  category: string
  capabilities: string[]
  body: BodyBlock[]
  relatedWork: { title: string; slug: string }[]
  media?: {
    heroImage?: string
    galleryImages?: string[]
  }
}

export interface TeamMember {
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
  return readJson<{ title: string; slug: string; seo: SeoMeta; hero: { headline: string; subheadline: string }; address: { company: string; street: string; city: string; state: string; zip: string; formatted: string }; social: { youtube: string; instagram: string }; consultationForm: { heading: string; description: string; fields: { id: string; label: string; type: string; required: boolean; options?: string[] }[]; submitLabel: string; successMessage: string }; emailSignup: { heading: string; description: string; placeholder: string; submitLabel: string } }>(path.join(CONTENT_ROOT, 'contact.json'))
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
  }
}

export function getAllServices(): Service[] {
  const dir = path.join(CONTENT_ROOT, 'services')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
  return files.map(file => readJson<Service>(path.join(dir, file)))
}

export function getService(slug: string): Service | null {
  const filePath = path.join(CONTENT_ROOT, 'services', `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  return readJson<Service>(filePath)
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
  const heroTags = asArray<Record<string, unknown>>((doc.hero as Record<string, unknown>)?.tags)
    .map((row) => normalizeProjectTag(String(row.tag || '')))
    .filter(Boolean)
  return uniqueStrings([...projectTags, ...heroTags])
}

function resolveCmsMediaUrl(media: unknown): string | undefined {
  if (!media || typeof media !== 'object') return undefined
  const doc = media as { legacyUrl?: string; url?: string }
  if (doc.legacyUrl) return doc.legacyUrl
  if (doc.url) return doc.url
  return undefined
}

function mapCmsProject(doc: Record<string, unknown>): Project {
  const images = asArray<Record<string, unknown>>(doc.images).map((row) => {
    const media = row.media as unknown
    return {
      url: resolveCmsMediaUrl(media) || String(row.legacyUrl || ''),
      alt: String(row.alt || 'Project media'),
      filename: row.filename ? String(row.filename) : undefined,
      note: row.note ? String(row.note) : undefined,
    }
  })

  return {
    title: String(doc.title || ''),
    slug: normalizeProjectSlug(String(doc.slug || '')),
    canonicalSlug: normalizeProjectSlug(String(doc.slug || '')),
    tags: extractProjectTags(doc),
    seo: {
      title: String((doc.seo as Record<string, unknown>)?.title || ''),
      description: String((doc.seo as Record<string, unknown>)?.description || ''),
      og: {
        title: String((doc.seo as Record<string, unknown>)?.ogTitle || ''),
        description: String((doc.seo as Record<string, unknown>)?.ogDescription || ''),
        image: resolveCmsMediaUrl((doc.seo as Record<string, unknown>)?.ogImage) || '/og-default.jpg',
      },
    },
    hero: {
      headline: String((doc.hero as Record<string, unknown>)?.headline || ''),
      subheadline: String((doc.hero as Record<string, unknown>)?.subheadline || ''),
      tags: asArray<Record<string, unknown>>((doc.hero as Record<string, unknown>)?.tags).map((t) => String(t.tag || '')),
    },
    metadata: {
      client: String((doc.metadata as Record<string, unknown>)?.client || ''),
      location: (doc.metadata as Record<string, unknown>)?.location ? String((doc.metadata as Record<string, unknown>).location) : undefined,
      locations: asArray<Record<string, unknown>>((doc.metadata as Record<string, unknown>)?.locations).map((l) => String(l.location || '')).filter(Boolean),
      type: String((doc.metadata as Record<string, unknown>)?.type || ''),
      tech: asArray<Record<string, unknown>>((doc.metadata as Record<string, unknown>)?.tech).map((v) => String(v.value || '')).filter(Boolean),
      techniques: asArray<Record<string, unknown>>((doc.metadata as Record<string, unknown>)?.techniques).map((v) => String(v.value || '')).filter(Boolean),
      materials: asArray<Record<string, unknown>>((doc.metadata as Record<string, unknown>)?.materials).map((v) => String(v.value || '')).filter(Boolean),
      spec: asArray<Record<string, unknown>>((doc.metadata as Record<string, unknown>)?.spec).map((v) => String(v.value || '')).filter(Boolean),
      software: asArray<Record<string, unknown>>((doc.metadata as Record<string, unknown>)?.software).map((v) => String(v.value || '')).filter(Boolean),
      partners: asArray<Record<string, unknown>>((doc.metadata as Record<string, unknown>)?.partners).map((v) => String(v.name || '')).filter(Boolean),
    },
    body: asArray<Record<string, unknown>>(doc.body).map((block) => ({
      type: String(block.type || ''),
      heading: block.heading ? String(block.heading) : undefined,
      content: block.content ? String(block.content) : undefined,
      items: asArray<Record<string, unknown>>(block.items).map((item) => String(item.value || '')).filter(Boolean),
    })),
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
    title: String(doc.title || ''),
    slug: String(doc.slug || ''),
    seo: {
      title: String((doc.seo as Record<string, unknown>)?.title || ''),
      description: String((doc.seo as Record<string, unknown>)?.description || ''),
      og: {
        title: String((doc.seo as Record<string, unknown>)?.ogTitle || ''),
        description: String((doc.seo as Record<string, unknown>)?.ogDescription || ''),
        image: resolveCmsMediaUrl((doc.seo as Record<string, unknown>)?.ogImage) || '/og-default.jpg',
      },
    },
    hero: {
      headline: String((doc.hero as Record<string, unknown>)?.headline || ''),
      subheadline: String((doc.hero as Record<string, unknown>)?.subheadline || ''),
      cta: {
        label: String(((doc.hero as Record<string, unknown>)?.cta as Record<string, unknown>)?.label || 'Contact'),
        url: String(((doc.hero as Record<string, unknown>)?.cta as Record<string, unknown>)?.url || '/contact'),
      },
    },
    category: String(doc.category || ''),
    capabilities: asArray<Record<string, unknown>>(doc.capabilities).map((item) => String(item.value || '')).filter(Boolean),
    body: asArray<Record<string, unknown>>(doc.body).map((block) => ({
      type: String(block.type || ''),
      heading: block.heading ? String(block.heading) : undefined,
      content: block.content ? String(block.content) : undefined,
      items: asArray<Record<string, unknown>>(block.items).map((item) => String(item.value || '')).filter(Boolean),
    })),
    relatedWork: asArray<Record<string, unknown>>(doc.relatedWork).map((row) => ({
      title: String(row.title || ''),
      slug: String(row.slug || ''),
    })),
    media: {
      heroImage:
        resolveCmsMediaUrl(((doc.media as Record<string, unknown>)?.heroImage as unknown)) ||
        String((doc.media as Record<string, unknown>)?.heroImageLegacyUrl || ''),
      galleryImages: asArray<Record<string, unknown>>((doc.media as Record<string, unknown>)?.galleryImages)
        .map((item) => resolveCmsMediaUrl(item.media as unknown) || String(item.legacyUrl || ''))
        .filter(Boolean),
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
    })
    return result.docs.map((doc) => mapCmsProject(doc as Record<string, unknown>))
  } catch (error) {
    console.error('Failed to load projects from CMS:', error)
    return []
  }
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
    })
    const canonicalDoc = resultByCanonical.docs[0]
    if (canonicalDoc) return mapCmsProject(canonicalDoc as Record<string, unknown>)

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
    })
    const legacyDoc = legacyResult.docs[0]
    if (legacyDoc) return mapCmsProject(legacyDoc as Record<string, unknown>)
  } catch (error) {
    console.error(`Failed to load project from CMS for slug "${canonicalSlug}":`, error)
  }
  return null
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
    })
    return uniqueStrings(
      result.docs
        .map((doc) => normalizeProjectSlug(String((doc as Record<string, unknown>).slug || '')))
        .filter(Boolean),
    ).sort()
  } catch (error) {
    console.error('Failed to load project slugs from CMS:', error)
    return []
  }
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
    })
    if (result.docs.length > 0) {
      return result.docs.map((doc) => mapCmsService(doc as Record<string, unknown>))
    }
  } catch {
    // fallback
  }
  return getAllServices()
}

export async function getServiceResolved(slug: string): Promise<Service | null> {
  try {
    const payload = await getPayloadClient()
    const preview = await isPreviewModeEnabled()
    const result = await payload.find({
      collection: 'services',
      where: preview
        ? {
            slug: { equals: slug },
          }
        : {
            slug: { equals: slug },
            status: { equals: 'published' },
            isEnabled: { equals: true },
          },
      limit: 1,
      depth: 2,
      draft: preview,
    })
    const doc = result.docs[0]
    if (doc) return mapCmsService(doc as Record<string, unknown>)
  } catch {
    // fallback
  }
  return getService(slug)
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
    })
    if (result.docs.length > 0) {
      return result.docs
        .map((doc) => String((doc as Record<string, unknown>).slug || ''))
        .filter(Boolean)
        .sort()
    }
  } catch {
    // fallback
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
    })
    const page = pageResult.docs[0] as Record<string, unknown> | undefined
    const teamHeroImage = resolveCmsMediaUrl(((page?.seo as Record<string, unknown>)?.ogImage as unknown))
    if (teamMembersResult.docs.length === 0) return fallback

    return {
      title: page?.title ? String(page.title) : fallback.title,
      slug: page?.slug ? String(page.slug) : fallback.slug,
      seo: {
        title: String(((page?.seo as Record<string, unknown>)?.title as string) || fallback.seo.title),
        description: String(((page?.seo as Record<string, unknown>)?.description as string) || fallback.seo.description),
        og: {
          title: String(((page?.seo as Record<string, unknown>)?.ogTitle as string) || fallback.seo.og.title),
          description: String(((page?.seo as Record<string, unknown>)?.ogDescription as string) || fallback.seo.og.description),
          image: teamHeroImage || fallback.seo.og.image,
        },
      },
      hero: {
        headline: String(((page?.hero as Record<string, unknown>)?.headline as string) || fallback.hero.headline),
        subheadline: String(((page?.hero as Record<string, unknown>)?.subheadline as string) || fallback.hero.subheadline),
      },
      members: teamMembersResult.docs.map((doc) => {
        const row = doc as Record<string, unknown>
        const photo = row.photo as Record<string, unknown> | undefined
        return {
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

export interface NavigationLink {
  label: string
  href: string
}

export interface SiteStyleSettings {
  brandPrimary: string
  brandSecondary: string
  backgroundColor: string
  fontFamilyHeading: string
  fontFamilyBody: string
  buttonStyle: 'sharp' | 'rounded'
}

export interface SeoDefaultsSettings {
  siteName: string
  defaultTitle: string
  titleTemplate: string
  defaultDescription: string
  noindexByDefault: boolean
}

export interface CMSPageBlock {
  blockType: 'text' | 'gallery' | 'features' | 'cta' | 'video'
  heading?: string
  body?: unknown
  images?: Array<{ id?: string; url?: string; alt?: string }>
  items?: Array<{ label: string }>
  label?: string
  url?: string
  provider?: 'youtube' | 'vimeo' | 'instagram' | 'external'
}

export interface CMSPageData {
  title: string
  slug: string
  hero?: {
    headline?: string
    subheadline?: string
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

const FALLBACK_NAVIGATION: NavigationLink[] = [
  { label: 'About', href: '/about' },
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/services' },
  { label: 'Team', href: '/team' },
  { label: 'Contact', href: '/contact' },
]

const FALLBACK_SITE_STYLES: SiteStyleSettings = {
  brandPrimary: '#ffffff',
  brandSecondary: '#a1a1aa',
  backgroundColor: '#000000',
  fontFamilyHeading: 'inherit',
  fontFamilyBody: 'inherit',
  buttonStyle: 'sharp',
}

const FALLBACK_SEO_DEFAULTS: SeoDefaultsSettings = {
  siteName: 'BEATROX',
  defaultTitle: 'BEATROX — Experiential Design & Event Production',
  titleTemplate: '%s | BEATROX',
  defaultDescription:
    'Portland-based experiential design and event production. Drone light shows, LED video walls, projection mapping, custom fabrication, and full-service event production.',
  noindexByDefault: false,
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
    })

    const page = result.docs[0] as unknown as
      | {
          title: string
          slug: string
          hero?: { headline?: string; subheadline?: string }
          seo?: { title?: string; description?: string; ogTitle?: string; ogDescription?: string; ogImage?: unknown }
          blocks?: CMSPageBlock[]
        }
      | undefined

    if (!page) return null

    return {
      title: page.title,
      slug: page.slug,
      hero: page.hero,
      seo: {
        title: page.seo?.title,
        description: page.seo?.description,
        ogTitle: page.seo?.ogTitle,
        ogDescription: page.seo?.ogDescription,
        ogImage: resolveMediaUrl(page.seo?.ogImage),
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
    })
    return result.docs.map((doc) => mapCmsCaseStudy(doc as Record<string, unknown>))
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
    })
    const doc = result.docs[0]
    if (doc) return mapCmsCaseStudy(doc as Record<string, unknown>)
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
    })
    return uniqueStrings(
      result.docs
        .map((doc) => normalizeCaseStudySlug(String((doc as Record<string, unknown>).slug || '')))
        .filter(Boolean),
    ).sort()
  } catch (error) {
    console.error('Failed to load case study slugs from CMS:', error)
    return []
  }
}
