import type { MetadataRoute } from 'next'
import { getProjectSlugsResolved, getAllServicesResolved, getCaseStudySlugsResolved } from '@/lib/content'
import { readManifest } from '@/lib/youtube/storage'

const BASE_URL = 'https://www.beatrox.com'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projectSlugs = await getProjectSlugsResolved()
  // /work/tag/* pages are intentionally excluded, they're noindex
  // (thin template pages, doorway-page risk).
  const services = await getAllServicesResolved()
  const caseStudySlugs = await getCaseStudySlugsResolved()
  const videoManifest = readManifest()

  // Resolved docs carry the legacy "/services/<slug>" slug form regardless of pageType.
  const bareSlug = (slug: string) => slug.replace(/^\/(services|tech)\/+/, '')
  const serviceSlugs = services.filter((s) => s.pageType !== 'tech').map((s) => bareSlug(s.slug))
  const techSlugs = services.filter((s) => s.pageType === 'tech').map((s) => bareSlug(s.slug))

  const rootPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/work`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/services`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tech`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/team`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/book`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/videos`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/case-studies`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // NOTE: As the site grows beyond ~500 URLs, consider splitting into a sitemap index
  // with separate sitemaps for projects, services, and videos.

  const projectPages: MetadataRoute.Sitemap = projectSlugs.map(slug => ({
    url: `${BASE_URL}/work/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const servicePages: MetadataRoute.Sitemap = serviceSlugs.map(slug => ({
    url: `${BASE_URL}/services/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Tech capabilities live at /tech/* (pageType 'tech'), excluded from /services above.
  const techPages: MetadataRoute.Sitemap = techSlugs.map(slug => ({
    url: `${BASE_URL}/tech/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const caseStudyPages: MetadataRoute.Sitemap = caseStudySlugs.map(slug => ({
    url: `${BASE_URL}/case-studies/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const videoPages: MetadataRoute.Sitemap = videoManifest.videos
    .filter((video) => !video.noindex)
    .map((video) => ({
      url: `${BASE_URL}/videos/${video.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

  return [...rootPages, ...projectPages, ...servicePages, ...techPages, ...caseStudyPages, ...videoPages]
}
