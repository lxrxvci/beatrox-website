import type { MetadataRoute } from 'next'
import { getProjectSlugs, getProjectTags, getServiceSlugs } from '@/lib/json-content'
import { readManifest } from '@/lib/youtube/storage'

const BASE_URL = 'https://www.beatrox.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const projectSlugs = getProjectSlugs()
  const projectTags = getProjectTags()
  const serviceSlugs = getServiceSlugs()
  const videoManifest = readManifest()

  const rootPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/work`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/videos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/rentals`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/case-studies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // NOTE: As the site grows beyond ~500 URLs, consider splitting into a sitemap index
  // with separate sitemaps for projects, services, and videos.

  const projectPages: MetadataRoute.Sitemap = projectSlugs.map(slug => ({
    url: `${BASE_URL}/work/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const projectTagPages: MetadataRoute.Sitemap = projectTags.map(tag => ({
    url: `${BASE_URL}/work/tag/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  const servicePages: MetadataRoute.Sitemap = serviceSlugs.map(slug => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const videoPages: MetadataRoute.Sitemap = videoManifest.videos
    .filter((video) => !video.noindex)
    .map((video) => ({
      url: `${BASE_URL}/videos/${video.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

  return [...rootPages, ...projectPages, ...projectTagPages, ...servicePages, ...videoPages]
}
