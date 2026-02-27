import { buildManifest } from './merge'
import { fetchRawVideoSnapshot, getYouTubeClient } from './client'
import { readOverrides, readRawVideos, writeManifest, writeRawVideos } from './storage'
import type { PrivacyStatus, YouTubeFilters } from './types'

export function parseStatusFilter(input?: string | string[]): PrivacyStatus[] | undefined {
  const values = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',').map((value) => value.trim())
      : []

  const allowed = new Set<PrivacyStatus>(['public', 'unlisted', 'private'])
  const parsed = values.filter((value): value is PrivacyStatus => allowed.has(value as PrivacyStatus))
  return parsed.length ? parsed : undefined
}

export function parsePlaylistFilter(input?: string | string[]): string[] | undefined {
  const values = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',').map((value) => value.trim())
      : []
  const parsed = values.filter(Boolean)
  return parsed.length ? parsed : undefined
}

export async function syncFromYouTube(filters?: YouTubeFilters) {
  const yt = getYouTubeClient(['youtube.readonly'])
  const raw = await fetchRawVideoSnapshot(yt)
  writeRawVideos(raw)
  const overrides = readOverrides()
  const manifest = buildManifest(raw, overrides, filters)
  writeManifest(manifest)
  return {
    rawCount: raw.videos.length,
    manifestCount: manifest.count,
    playlists: raw.playlists.length,
  }
}

export function regenerateManifest(filters?: YouTubeFilters) {
  const raw = readRawVideos()
  const overrides = readOverrides()
  const manifest = buildManifest(raw, overrides, filters)
  writeManifest(manifest)
  return manifest
}
