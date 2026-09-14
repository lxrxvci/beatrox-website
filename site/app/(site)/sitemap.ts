import type { MetadataRoute } from 'next'
import { getProjectSlugsResolved, getAllServicesResolved, getCaseStudySlugsResolved, getCMSPageSitemapEntries } from '@/lib/content'
import { readManifest } from '@/lib/youtube/storage'

const BASE_URL = 'https://www.beatrox.com'

// Project/service/case-study content shapes carry no date field, so hardcoded
// root pages and static content pages share one editorial "last reviewed"
// date. Bump it when static page content changes. Dynamic types with a real
// date (CMS page updatedAt, YouTube publishedAt) use that instead.
const STATIC_LAST_MODIFIED = '2026-09-13'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projectSlugs = await getProjectSlugsResolved()
  // /work/tag/* pages are intentionally excluded, they're noindex
  // (thin template pages, doorway-page risk).
  const services = await getAllServicesResolved()
  const caseStudySlugs = await getCaseStudySlugsResolved()
  const cmsPageEntries = await getCMSPageSitemapEntries()
  const videoManifest = readManifest()

  // Resolved docs carry the legacy "/services/<slug>" slug form regardless of pageType.
  const bareSlug = (slug: string) => slug.replace(/^\/(services|tech)\/+/, '')
  // dj-equipment-rentals 308s to the rentals app; keep it out of the sitemap
  // (sitemaps must list canonical 200 URLs only).
  const RENTALS_APP_SLUGS = new Set(['dj-equipment-rentals'])
  const serviceSlugs = services
    .filter((s) => s.pageType !== 'tech')
    .map((s) => bareSlug(s.slug))
    .filter((slug) => !RENTALS_APP_SLUGS.has(slug))
  const techSlugs = services.filter((s) => s.pageType === 'tech').map((s) => bareSlug(s.slug))

  const rootPages: MetadataRoute.Sitemap = [
    {
      // No trailing slash: matches the homepage canonical exactly.
      url: BASE_URL,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/work`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tech`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/team`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/book`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/videos`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/case-studies`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/sms-terms`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // CMS /[slug] pages that collide with a hardcoded route are served by the
  // hardcoded route (static routes win over the dynamic segment), so listing
  // both would duplicate the URL. /preview and /proposal are app routes too;
  // both are disallowed in robots.txt and must never appear in the sitemap.
  const hardcodedPaths = new Set([
    ...rootPages.map((entry) => new URL(entry.url).pathname),
    '/preview',
    '/proposal',
  ])

  // NOTE: As the site grows beyond ~500 URLs, consider splitting into a sitemap index
  // with separate sitemaps for projects, services, and videos.

  const projectPages: MetadataRoute.Sitemap = projectSlugs.map(slug => ({
    url: `${BASE_URL}/work/${slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const servicePages: MetadataRoute.Sitemap = serviceSlugs.map(slug => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Tech capabilities live at /tech/* (pageType 'tech'), excluded from /services above.
  const techPages: MetadataRoute.Sitemap = techSlugs.map(slug => ({
    url: `${BASE_URL}/tech/${slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const caseStudyPages: MetadataRoute.Sitemap = caseStudySlugs.map(slug => ({
    url: `${BASE_URL}/case-studies/${slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const cmsPages: MetadataRoute.Sitemap = cmsPageEntries
    .filter((entry) => !hardcodedPaths.has(`/${entry.slug}`))
    .map((entry) => ({
      url: `${BASE_URL}/${entry.slug}`,
      lastModified: entry.updatedAt || STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  const videoPages: MetadataRoute.Sitemap = videoManifest.videos
    .filter((video) => !video.noindex)
    .map((video) => ({
      url: `${BASE_URL}/videos/${video.id}`,
      lastModified: video.publishedAt || STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

  return [...rootPages, ...projectPages, ...servicePages, ...techPages, ...caseStudyPages, ...cmsPages, ...videoPages]
}
