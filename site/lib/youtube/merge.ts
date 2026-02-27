import type {
  PrivacyStatus,
  YouTubeFilters,
  YouTubeManifestData,
  YouTubeManifestVideo,
  YouTubeOverridesData,
  YouTubeRawData,
} from './types'

export const YOUTUBE_LIMITS = {
  title: 100,
  description: 5000,
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return value.slice(0, max)
}

function matchesPrivacyFilter(raw: YouTubeRawData['videos'][number], filters?: YouTubeFilters) {
  const statuses = filters?.privacyStatuses
  if (!statuses || statuses.length === 0) return true
  return statuses.includes((raw.status?.privacyStatus as PrivacyStatus) || 'private')
}

function matchesPlaylistFilter(raw: YouTubeRawData['videos'][number], filters?: YouTubeFilters) {
  const playlists = filters?.playlistIds
  if (!playlists || playlists.length === 0) return true
  return (raw.playlistIds ?? []).some((playlistId) => playlists.includes(playlistId))
}

export function buildManifest(
  rawData: YouTubeRawData,
  overridesData: YouTubeOverridesData,
  filters?: YouTubeFilters,
): YouTubeManifestData {
  const videos: YouTubeManifestVideo[] = (rawData.videos ?? [])
    .filter((item) => matchesPrivacyFilter(item, filters) && matchesPlaylistFilter(item, filters))
    .map((item) => {
      const override = overridesData.overrides[item.id]
      const snip = item.snippet ?? {}
      const title = truncate(override?.title?.trim() || snip.title || '', YOUTUBE_LIMITS.title)
      const description = truncate(
        override?.description?.trim() || snip.description || '',
        YOUTUBE_LIMITS.description,
      )
      const thumbs = snip.thumbnails
      const ogImage =
        override?.seo?.ogImage ||
        thumbs?.maxres?.url ||
        thumbs?.high?.url ||
        thumbs?.medium?.url ||
        thumbs?.default?.url

      return {
        id: item.id,
        url: item.url,
        embedUrl: item.embedUrl,
        title,
        description,
        privacyStatus: (item.status?.privacyStatus as PrivacyStatus) || 'private',
        publishedAt: snip.publishedAt,
        duration: item.contentDetails?.duration,
        thumbnails: thumbs ?? {},
        tags: override?.tags ?? snip.tags ?? [],
        playlistIds: item.playlistIds ?? [],
        siteSlug: override?.siteSlug,
        noindex: override?.noindex,
        seo: {
          title: truncate(override?.seo?.title || title, YOUTUBE_LIMITS.title),
          description: truncate(override?.seo?.description || description, YOUTUBE_LIMITS.description),
          ogImage,
        },
        source: {
          title: override?.title ? 'override' : 'raw',
          description: override?.description ? 'override' : 'raw',
        },
      }
    })

  return {
    generatedAt: new Date().toISOString(),
    channel: rawData.channel ?? { id: '', title: '', uploadsPlaylistId: '' },
    playlists: rawData.playlists ?? [],
    count: videos.length,
    videos,
  }
}

export interface YouTubeFieldLimitIssue {
  videoId: string
  field: 'title' | 'description'
  length: number
  max: number
}

export function validateOverrideLimits(overridesData: YouTubeOverridesData): YouTubeFieldLimitIssue[] {
  const issues: YouTubeFieldLimitIssue[] = []

  for (const [videoId, override] of Object.entries(overridesData.overrides)) {
    if (override.title && override.title.length > YOUTUBE_LIMITS.title) {
      issues.push({
        videoId,
        field: 'title',
        length: override.title.length,
        max: YOUTUBE_LIMITS.title,
      })
    }
    if (override.description && override.description.length > YOUTUBE_LIMITS.description) {
      issues.push({
        videoId,
        field: 'description',
        length: override.description.length,
        max: YOUTUBE_LIMITS.description,
      })
    }
  }

  return issues
}
