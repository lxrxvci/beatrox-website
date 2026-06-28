import fs from 'fs'
import path from 'path'
import { google, type youtube_v3 } from 'googleapis'
import type { Credentials } from 'google-auth-library'

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>
import type { YouTubePlaylistRef, YouTubeRawData, YouTubeRawVideo } from './types'

export type Scope = 'youtube.readonly' | 'youtube.force-ssl' | 'youtube'

const SCOPE_MAP: Record<Scope, string> = {
  'youtube.readonly': 'https://www.googleapis.com/auth/youtube.readonly',
  'youtube.force-ssl': 'https://www.googleapis.com/auth/youtube.force-ssl',
  youtube: 'https://www.googleapis.com/auth/youtube',
}

interface OAuthClientFile {
  installed?: {
    client_id: string
    client_secret: string
    redirect_uris: string[]
  }
  web?: {
    client_id: string
    client_secret: string
    redirect_uris: string[]
  }
}

interface StoredToken {
  access_token?: string | null
  refresh_token?: string | null
  scope?: string | null
  token_type?: string | null
  expiry_date?: number | null
}

function ensureDevOnly() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('YouTube OAuth actions are local-only and disabled outside development mode.')
  }
}

function getOAuthPaths() {
  const fallbackRoot = path.join(process.cwd(), '.secrets')
  return {
    clientPath: process.env.YOUTUBE_OAUTH_CLIENT_PATH || path.join(fallbackRoot, 'youtube-client.json'),
    tokenPath: process.env.YOUTUBE_OAUTH_TOKEN_PATH || path.join(fallbackRoot, 'youtube-token.json'),
  }
}

function readClientConfig() {
  const { clientPath } = getOAuthPaths()
  if (!fs.existsSync(clientPath)) {
    throw new Error(`Missing OAuth client file at ${clientPath}`)
  }
  const parsed = JSON.parse(fs.readFileSync(clientPath, 'utf-8')) as OAuthClientFile
  const cfg = parsed.installed || parsed.web
  if (!cfg) throw new Error('Invalid OAuth client file format.')
  return cfg
}

function createOAuthClient() {
  const cfg = readClientConfig()
  return new google.auth.OAuth2(cfg.client_id, cfg.client_secret, cfg.redirect_uris[0])
}

function readStoredToken(): StoredToken | null {
  const { tokenPath } = getOAuthPaths()
  if (!fs.existsSync(tokenPath)) return null
  try {
    return JSON.parse(fs.readFileSync(tokenPath, 'utf-8')) as StoredToken
  } catch {
    return null
  }
}

function saveStoredToken(token: StoredToken) {
  const { tokenPath } = getOAuthPaths()
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true })
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2), 'utf-8')
}

function normalizeToken(token: StoredToken): Credentials {
  return {
    access_token: token.access_token || undefined,
    refresh_token: token.refresh_token || undefined,
    scope: token.scope || undefined,
    token_type: token.token_type || undefined,
    expiry_date: token.expiry_date || undefined,
  }
}

export function getAuthorizationUrl(scopes: Scope[]) {
  ensureDevOnly()
  const oauth = createOAuthClient()
  const url = oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes.map((scope) => SCOPE_MAP[scope]),
  })
  return {
    url,
    clientPath: getOAuthPaths().clientPath,
    tokenPath: getOAuthPaths().tokenPath,
  }
}

export async function exchangeCodeForToken(code: string) {
  ensureDevOnly()
  const oauth = createOAuthClient()
  const { tokens } = await oauth.getToken(code.trim())
  oauth.setCredentials(tokens)
  saveStoredToken(tokens)
  return {
    hasRefreshToken: Boolean(tokens.refresh_token),
    scope: tokens.scope || '',
    expiryDate: tokens.expiry_date || null,
  }
}

export function hasSavedToken() {
  return Boolean(readStoredToken())
}

export function getYouTubeAuthClient(requiredScopes: Scope[]): OAuth2Client {
  ensureDevOnly()
  const oauth = createOAuthClient()
  const token = readStoredToken()
  if (!token) throw new Error('No OAuth token found. Connect YouTube first.')

  if (token.scope) {
    const granted = new Set(token.scope.split(' '))
    const missing = requiredScopes
      .map((scope) => SCOPE_MAP[scope])
      .filter((scope) => !granted.has(scope))
    if (missing.length > 0) {
      throw new Error('Saved OAuth token is missing required scopes. Re-connect YouTube with proper access.')
    }
  }

  oauth.setCredentials(normalizeToken(token))
  return oauth
}

export function getYouTubeClient(requiredScopes: Scope[]) {
  const auth = getYouTubeAuthClient(requiredScopes)
  return google.youtube({
    version: 'v3',
    auth,
  })
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function normalizeThumbnails(thumbnails: youtube_v3.Schema$ThumbnailDetails | null | undefined) {
  const out: Record<string, { url: string; width?: number; height?: number }> = {}
  if (!thumbnails) return out
  for (const [key, value] of Object.entries(thumbnails)) {
    if (!value?.url) continue
    out[key] = {
      url: value.url,
      width: value.width || undefined,
      height: value.height || undefined,
    }
  }
  return out
}

export async function listChannelAndUploads(yt: youtube_v3.Youtube) {
  const response = await yt.channels.list({
    mine: true,
    part: ['snippet', 'contentDetails'],
    maxResults: 1,
  })
  const item = response.data.items?.[0]
  if (!item?.contentDetails?.relatedPlaylists?.uploads || !item.snippet?.title || !item.id) {
    throw new Error('Could not load channel uploads playlist.')
  }
  return {
    id: item.id,
    title: item.snippet.title,
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
  }
}

export async function listMyPlaylists(yt: youtube_v3.Youtube): Promise<YouTubePlaylistRef[]> {
  const playlists: YouTubePlaylistRef[] = []
  let nextPageToken: string | undefined

  do {
    const response = await yt.playlists.list({
      mine: true,
      part: ['snippet'],
      maxResults: 50,
      pageToken: nextPageToken,
    })
    for (const item of response.data.items || []) {
      if (item.id && item.snippet?.title) {
        playlists.push({
          id: item.id,
          title: item.snippet.title,
        })
      }
    }
    nextPageToken = response.data.nextPageToken || undefined
  } while (nextPageToken)

  return playlists
}

async function listPlaylistVideoIds(yt: youtube_v3.Youtube, playlistId: string) {
  const ids: string[] = []
  let nextPageToken: string | undefined

  do {
    const response = await yt.playlistItems.list({
      playlistId,
      part: ['contentDetails'],
      maxResults: 50,
      pageToken: nextPageToken,
    })
    for (const item of response.data.items || []) {
      if (item.contentDetails?.videoId) ids.push(item.contentDetails.videoId)
    }
    nextPageToken = response.data.nextPageToken || undefined
  } while (nextPageToken)

  return ids
}

export async function listUploadsVideoIds(yt: youtube_v3.Youtube, uploadsPlaylistId: string) {
  return listPlaylistVideoIds(yt, uploadsPlaylistId)
}

export async function fetchRawVideoSnapshot(yt: youtube_v3.Youtube): Promise<YouTubeRawData> {
  const channel = await listChannelAndUploads(yt)
  const [playlistRefs, uploadVideoIds] = await Promise.all([
    listMyPlaylists(yt),
    listUploadsVideoIds(yt, channel.uploadsPlaylistId),
  ])

  const playlistMembership = new Map<string, Set<string>>()
  for (const playlist of playlistRefs) {
    const videoIds = await listPlaylistVideoIds(yt, playlist.id)
    for (const videoId of videoIds) {
      if (!playlistMembership.has(videoId)) {
        playlistMembership.set(videoId, new Set())
      }
      playlistMembership.get(videoId)?.add(playlist.id)
    }
  }

  const videos: YouTubeRawVideo[] = []
  for (const batch of chunk(uploadVideoIds, 50)) {
    const response = await yt.videos.list({
      id: batch,
      part: ['snippet', 'status', 'contentDetails'],
      maxResults: 50,
    })
    for (const item of response.data.items || []) {
      if (!item.id || !item.snippet?.title) continue
      videos.push({
        id: item.id,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        embedUrl: `https://www.youtube.com/embed/${item.id}`,
        playlistIds: Array.from(playlistMembership.get(item.id) ?? []),
        snippet: {
          title: item.snippet.title || '',
          description: item.snippet.description || '',
          publishedAt: item.snippet.publishedAt || '',
          channelTitle: item.snippet.channelTitle || '',
          thumbnails: normalizeThumbnails(item.snippet.thumbnails),
          tags: item.snippet.tags || [],
          defaultLanguage: item.snippet.defaultLanguage || undefined,
          categoryId: item.snippet.categoryId || undefined,
        },
        status: {
          privacyStatus: (item.status?.privacyStatus as YouTubeRawVideo['status']['privacyStatus']) || 'private',
          embeddable: item.status?.embeddable || undefined,
          license: item.status?.license || undefined,
          publishAt: item.status?.publishAt || undefined,
          publicStatsViewable: item.status?.publicStatsViewable || undefined,
          madeForKids: item.status?.madeForKids || undefined,
          selfDeclaredMadeForKids: item.status?.selfDeclaredMadeForKids || undefined,
        },
        contentDetails: {
          duration: item.contentDetails?.duration || undefined,
          definition: item.contentDetails?.definition || undefined,
          caption: item.contentDetails?.caption || undefined,
          dimension: item.contentDetails?.dimension || undefined,
        },
      })
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    channel,
    playlists: playlistRefs,
    videos,
  }
}

export async function pushVideoMetadataUpdate(
  yt: youtube_v3.Youtube,
  input: { videoId: string; title: string; description: string },
) {
  const existing = await yt.videos.list({
    id: [input.videoId],
    part: ['snippet'],
    maxResults: 1,
  })
  const current = existing.data.items?.[0]
  if (!current?.snippet || !current.id) {
    throw new Error(`Unable to load current snippet for video ${input.videoId}`)
  }

  const snippet: youtube_v3.Schema$VideoSnippet = {
    categoryId: current.snippet.categoryId || '22',
    title: input.title,
    description: input.description,
    tags: current.snippet.tags || [],
    defaultLanguage: current.snippet.defaultLanguage || undefined,
    defaultAudioLanguage: current.snippet.defaultAudioLanguage || undefined,
  }

  await yt.videos.update({
    part: ['snippet'],
    requestBody: {
      id: current.id,
      snippet,
    },
  })
}
