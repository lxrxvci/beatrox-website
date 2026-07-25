import fs from 'fs'
import path from 'path'

const SITE_CONTENT_ROOT = path.join(process.cwd(), 'content')
const REPO_CONTENT_ROOT = path.resolve(process.cwd(), '..', 'content')
const CONTENT_ROOT = fs.existsSync(SITE_CONTENT_ROOT)
  ? SITE_CONTENT_ROOT
  : fs.existsSync(REPO_CONTENT_ROOT)
    ? REPO_CONTENT_ROOT
    : SITE_CONTENT_ROOT

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
  /** CMS-only backend tags — absent in the JSON baseline. */
  serviceTags?: { id: string; slug: string; title: string }[]
  techTags?: { id: string; slug: string; title: string }[]
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
  images: ProjectImage[]
  videos?: VideoEmbed[]
}

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
  /** service = sold offering (/services/*), tech = capability (/tech/*), rental = legacy rental page */
  pageType: 'service' | 'tech' | 'rental'
  /** Technologies behind a tech capability — display-only chips, never used for matching. */
  tech?: string[]
  capabilities: string[]
  body: ServiceBodyBlock[]
  relatedWork: { title: string; slug: string }[]
  /** CMS-only per-page pin/hide overrides — absent in the JSON baseline. */
  curatedImages?: { projectSlug: string; imageIndex: number; position: number; hidden?: boolean }[]
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

export function normalizeProjectSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^\/+/, '')
    .replace(/^work\/+/, '')
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|--+|-+$/g, '')
}

export function normalizeProjectTag(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|--+|-+$/g, '')
}

// ─── Loaders ──────────────────────────────────────────────────────────────────

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
  return readJson<{
    title: string
    slug: string
    seo: SeoMeta
    hero: { headline: string; subheadline: string }
    address: {
      company: string
      street: string
      city: string
      state: string
      zip: string
      formatted: string
    }
    contact: { email: string; phone: string; phoneFormatted: string }
    social: { youtube: string; instagram: string }
    consultationForm: {
      heading: string
      description: string
      fields: { id: string; label: string; type: string; required: boolean; options?: string[] }[]
      submitLabel: string
      successMessage: string
    }
    emailSignup: {
      heading: string
      description: string
      placeholder: string
      submitLabel: string
    }
  }>(path.join(CONTENT_ROOT, 'contact.json'))
}

export function getAllProjects(): Project[] {
  const dir = path.join(CONTENT_ROOT, 'portfolio')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  return files.map((file) => {
    const legacy = readJson<Project>(path.join(dir, file))
    const canonicalSlug = normalizeProjectSlug(legacy.slug || file.replace('.json', ''))
    const tags = uniqueStrings((legacy.hero?.tags || []).map((tag) => normalizeProjectTag(tag)))
    return {
      ...legacy,
      slug: canonicalSlug,
      canonicalSlug,
      tags,
      serviceTags: [],
      techTags: [],
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
    serviceTags: [],
    techTags: [],
  }
}

export function getProjectSlugs(): string[] {
  const dir = path.join(CONTENT_ROOT, 'portfolio')
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort()
}

export function getProjectTags(): string[] {
  const projects = getAllProjects()
  return uniqueStrings(projects.flatMap((p) => p.tags)).sort()
}

export function getProjectsByTag(tag: string): Project[] {
  const normalizedTag = normalizeProjectTag(tag)
  if (!normalizedTag) return []
  return getAllProjects().filter((p) => p.tags.includes(normalizedTag))
}

export function getAllServices(): Service[] {
  const dir = path.join(CONTENT_ROOT, 'services')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  return files.map((file) => readJson<Service>(path.join(dir, file)))
}

export function getService(slug: string): Service | null {
  const filePath = path.join(CONTENT_ROOT, 'services', `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  return readJson<Service>(filePath)
}

export function getServiceSlugs(): string[] {
  const dir = path.join(CONTENT_ROOT, 'services')
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort()
}

export function getRentals() {
  return readJson<{
    title: string
    slug: string
    seo: SeoMeta
    hero: { headline: string; subheadline: string }
    categories: {
      name: string
      description: string
      items: {
        name: string
        description: string
        specs: string[]
        available: boolean
      }[]
    }[]
    cta: { heading: string; subheading: string; label: string; url: string }
  }>(path.join(CONTENT_ROOT, 'rentals.json'))
}
