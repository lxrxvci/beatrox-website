export type PrivacyStatus = 'public' | 'unlisted' | 'private'

export interface YouTubePlaylistRef {
  id: string
  title: string
}

export interface YouTubeRawVideo {
  id: string
  url: string
  embedUrl: string
  playlistIds: string[]
  snippet: {
    title: string
    description: string
    publishedAt: string
    channelTitle: string
    thumbnails: Record<string, { url: string; width?: number; height?: number }>
    tags?: string[]
    defaultLanguage?: string
    categoryId?: string
  }
  status: {
    privacyStatus: PrivacyStatus
    embeddable?: boolean
    license?: string
    publishAt?: string
    publicStatsViewable?: boolean
    madeForKids?: boolean
    selfDeclaredMadeForKids?: boolean
  }
  contentDetails: {
    duration?: string
    definition?: string
    caption?: string
    dimension?: string
  }
}

export interface YouTubeRawData {
  fetchedAt: string
  channel: {
    id: string
    title: string
    uploadsPlaylistId: string
  }
  playlists: YouTubePlaylistRef[]
  videos: YouTubeRawVideo[]
}

export interface YouTubeOverrideEntry {
  title?: string
  description?: string
  tags?: string[]
  siteSlug?: string
  noindex?: boolean
  seo?: {
    title?: string
    description?: string
    ogImage?: string
  }
}

export interface YouTubeOverridesData {
  updatedAt: string
  overrides: Record<string, YouTubeOverrideEntry>
}

export interface YouTubeManifestVideo {
  id: string
  url: string
  embedUrl: string
  title: string
  description: string
  privacyStatus: PrivacyStatus
  publishedAt: string
  duration?: string
  thumbnails: Record<string, { url: string; width?: number; height?: number }>
  tags: string[]
  playlistIds: string[]
  siteSlug?: string
  noindex?: boolean
  seo: {
    title: string
    description: string
    ogImage?: string
  }
  source: {
    title: 'raw' | 'override'
    description: 'raw' | 'override'
  }
}

export interface YouTubeManifestData {
  generatedAt: string
  channel: YouTubeRawData['channel']
  playlists: YouTubePlaylistRef[]
  count: number
  videos: YouTubeManifestVideo[]
}

export interface YouTubeFilters {
  privacyStatuses?: PrivacyStatus[]
  playlistIds?: string[]
}
