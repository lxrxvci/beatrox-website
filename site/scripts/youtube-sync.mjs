import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'

const ROOT = process.cwd()
const CONTENT_ROOT = path.join(ROOT, '..', 'content', 'youtube')
const RAW_PATH = path.join(CONTENT_ROOT, 'raw-videos.json')
const OVERRIDES_PATH = path.join(CONTENT_ROOT, 'overrides.json')
const MANIFEST_PATH = path.join(CONTENT_ROOT, 'manifest.json')

const DEFAULT_CLIENT_PATH = process.env.YOUTUBE_OAUTH_CLIENT_PATH || path.join(ROOT, '.secrets', 'youtube-client.json')
const DEFAULT_TOKEN_PATH = process.env.YOUTUBE_OAUTH_TOKEN_PATH || path.join(ROOT, '.secrets', 'youtube-token.json')

const STATUS_VALUES = new Set(['public', 'unlisted', 'private'])
const READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'

function parseArgs(argv) {
  const args = {
    status: undefined,
    playlist: undefined,
    authCode: undefined,
    printAuthUrl: false,
  }

  for (const token of argv) {
    if (token.startsWith('--status=')) {
      args.status = token.replace('--status=', '').trim()
    } else if (token.startsWith('--playlist=')) {
      args.playlist = token.replace('--playlist=', '').trim()
    } else if (token.startsWith('--auth-code=')) {
      args.authCode = token.replace('--auth-code=', '').trim()
    } else if (token === '--auth-url') {
      args.printAuthUrl = true
    }
  }

  return args
}

function toList(input) {
  if (!input) return []
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function ensureDir(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function writeJson(filePath, data) {
  ensureDir(filePath)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function createOAuthClient() {
  if (!fs.existsSync(DEFAULT_CLIENT_PATH)) {
    throw new Error(`Missing OAuth client JSON at ${DEFAULT_CLIENT_PATH}`)
  }
  const parsed = JSON.parse(fs.readFileSync(DEFAULT_CLIENT_PATH, 'utf-8'))
  const cfg = parsed.installed || parsed.web
  if (!cfg) throw new Error('OAuth client JSON is invalid.')
  return new google.auth.OAuth2(cfg.client_id, cfg.client_secret, cfg.redirect_uris[0])
}

function getStoredToken() {
  if (!fs.existsSync(DEFAULT_TOKEN_PATH)) return null
  return JSON.parse(fs.readFileSync(DEFAULT_TOKEN_PATH, 'utf-8'))
}

function setStoredToken(token) {
  writeJson(DEFAULT_TOKEN_PATH, token)
}

function chunk(items, size) {
  const out = []
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size))
  }
  return out
}

function buildManifest(raw, overrides, filters) {
  const statuses = new Set(filters.statuses)
  const playlistIds = new Set(filters.playlistIds)

  const videos = raw.videos
    .filter((video) => (statuses.size ? statuses.has(video.status.privacyStatus) : true))
    .filter((video) =>
      playlistIds.size ? video.playlistIds.some((playlistId) => playlistIds.has(playlistId)) : true,
    )
    .map((video) => {
      const override = overrides.overrides[video.id] || {}
      const title = (override.title || video.snippet.title || '').slice(0, 100)
      const description = (override.description || video.snippet.description || '').slice(0, 5000)
      const ogImage =
        override.seo?.ogImage ||
        video.snippet.thumbnails.maxres?.url ||
        video.snippet.thumbnails.high?.url ||
        video.snippet.thumbnails.medium?.url ||
        video.snippet.thumbnails.default?.url

      return {
        id: video.id,
        url: video.url,
        embedUrl: video.embedUrl,
        title,
        description,
        privacyStatus: video.status.privacyStatus,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        thumbnails: video.snippet.thumbnails,
        tags: override.tags || video.snippet.tags || [],
        playlistIds: video.playlistIds,
        siteSlug: override.siteSlug,
        noindex: override.noindex,
        seo: {
          title: (override.seo?.title || title).slice(0, 100),
          description: (override.seo?.description || description).slice(0, 5000),
          ogImage,
        },
      }
    })

  return {
    generatedAt: new Date().toISOString(),
    channel: raw.channel,
    playlists: raw.playlists,
    count: videos.length,
    videos,
  }
}

async function listPlaylistVideoIds(yt, playlistId) {
  const ids = []
  let nextPageToken = undefined
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

async function fetchRawSnapshot(yt) {
  const channelRes = await yt.channels.list({
    mine: true,
    part: ['snippet', 'contentDetails'],
    maxResults: 1,
  })
  const channel = channelRes.data.items?.[0]
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads
  if (!channel?.id || !channel.snippet?.title || !uploadsPlaylistId) {
    throw new Error('Unable to resolve channel uploads playlist.')
  }

  let nextPageToken = undefined
  const playlists = []
  do {
    const response = await yt.playlists.list({
      mine: true,
      part: ['snippet'],
      maxResults: 50,
      pageToken: nextPageToken,
    })
    for (const item of response.data.items || []) {
      if (item.id && item.snippet?.title) {
        playlists.push({ id: item.id, title: item.snippet.title })
      }
    }
    nextPageToken = response.data.nextPageToken || undefined
  } while (nextPageToken)

  const uploadVideoIds = await listPlaylistVideoIds(yt, uploadsPlaylistId)
  const membership = new Map()
  for (const playlist of playlists) {
    const ids = await listPlaylistVideoIds(yt, playlist.id)
    for (const id of ids) {
      if (!membership.has(id)) membership.set(id, new Set())
      membership.get(id).add(playlist.id)
    }
  }

  const videos = []
  for (const ids of chunk(uploadVideoIds, 50)) {
    const response = await yt.videos.list({
      id: ids,
      part: ['snippet', 'status', 'contentDetails'],
      maxResults: 50,
    })
    for (const item of response.data.items || []) {
      if (!item.id || !item.snippet?.title) continue
      videos.push({
        id: item.id,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        embedUrl: `https://www.youtube.com/embed/${item.id}`,
        playlistIds: Array.from(membership.get(item.id) || []),
        snippet: {
          title: item.snippet.title || '',
          description: item.snippet.description || '',
          publishedAt: item.snippet.publishedAt || '',
          channelTitle: item.snippet.channelTitle || '',
          thumbnails: item.snippet.thumbnails || {},
          tags: item.snippet.tags || [],
          defaultLanguage: item.snippet.defaultLanguage || undefined,
          categoryId: item.snippet.categoryId || undefined,
        },
        status: {
          privacyStatus: item.status?.privacyStatus || 'private',
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
    channel: {
      id: channel.id,
      title: channel.snippet.title,
      uploadsPlaylistId,
    },
    playlists,
    videos,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const statuses = toList(args.status).filter((value) => STATUS_VALUES.has(value))
  const playlistIds = toList(args.playlist)

  const oauth = createOAuthClient()
  const token = getStoredToken()
  if (token) {
    oauth.setCredentials(token)
  }

  if (args.printAuthUrl || (!token && !args.authCode)) {
    const authUrl = oauth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [READONLY_SCOPE],
    })
    console.log('Open this URL, approve, then rerun with --auth-code=<code>')
    console.log(authUrl)
    return
  }

  if (args.authCode) {
    const { tokens } = await oauth.getToken(args.authCode)
    oauth.setCredentials(tokens)
    setStoredToken(tokens)
    console.log(`Saved OAuth token to ${DEFAULT_TOKEN_PATH}`)
  }

  const yt = google.youtube({ version: 'v3', auth: oauth })
  const raw = await fetchRawSnapshot(yt)
  const overrides = readJson(OVERRIDES_PATH, { updatedAt: '', overrides: {} })
  const manifest = buildManifest(raw, overrides, { statuses, playlistIds })

  writeJson(RAW_PATH, raw)
  writeJson(MANIFEST_PATH, manifest)

  console.log(`Raw videos: ${raw.videos.length}`)
  console.log(`Manifest videos: ${manifest.count}`)
  console.log(`Wrote ${RAW_PATH}`)
  console.log(`Wrote ${MANIFEST_PATH}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
