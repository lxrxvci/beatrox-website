import fs from 'fs'
import path from 'path'
import type { YouTubeManifestData, YouTubeOverridesData, YouTubeRawData } from './types'

const CONTENT_ROOT = path.join(process.cwd(), '..', 'content')
const YOUTUBE_ROOT = path.join(CONTENT_ROOT, 'youtube')

const RAW_PATH = path.join(YOUTUBE_ROOT, 'raw-videos.json')
const OVERRIDES_PATH = path.join(YOUTUBE_ROOT, 'overrides.json')
const MANIFEST_PATH = path.join(YOUTUBE_ROOT, 'manifest.json')

const EMPTY_RAW: YouTubeRawData = {
  fetchedAt: '',
  channel: {
    id: '',
    title: '',
    uploadsPlaylistId: '',
  },
  playlists: [],
  videos: [],
}

const EMPTY_OVERRIDES: YouTubeOverridesData = {
  updatedAt: '',
  overrides: {},
}

const EMPTY_MANIFEST: YouTubeManifestData = {
  generatedAt: '',
  channel: {
    id: '',
    title: '',
    uploadsPlaylistId: '',
  },
  playlists: [],
  count: 0,
  videos: [],
}

function ensureDir() {
  fs.mkdirSync(YOUTUBE_ROOT, { recursive: true })
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(filePath: string, data: T) {
  ensureDir()
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function getYouTubePaths() {
  return {
    root: YOUTUBE_ROOT,
    raw: RAW_PATH,
    overrides: OVERRIDES_PATH,
    manifest: MANIFEST_PATH,
  }
}

export function readRawVideos(): YouTubeRawData {
  return readJson(RAW_PATH, EMPTY_RAW)
}

export function readOverrides(): YouTubeOverridesData {
  return readJson(OVERRIDES_PATH, EMPTY_OVERRIDES)
}

export function readManifest(): YouTubeManifestData {
  return readJson(MANIFEST_PATH, EMPTY_MANIFEST)
}

export function writeRawVideos(data: YouTubeRawData) {
  writeJson(RAW_PATH, data)
}

export function writeOverrides(data: YouTubeOverridesData) {
  writeJson(OVERRIDES_PATH, data)
}

export function writeManifest(data: YouTubeManifestData) {
  writeJson(MANIFEST_PATH, data)
}
