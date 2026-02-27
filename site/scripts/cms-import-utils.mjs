import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export const BASE_URL = process.env.CMS_SEED_BASE_URL || 'http://localhost:3000'
export const ADMIN_EMAIL = process.env.CMS_SEED_EMAIL
export const ADMIN_PASSWORD = process.env.CMS_SEED_PASSWORD

export function assertCredentials() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Missing CMS credentials. Set CMS_SEED_EMAIL and CMS_SEED_PASSWORD.')
  }
}

export async function api(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, options)
  const text = await response.text()
  const json = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new Error(`${pathname} failed (${response.status}): ${text}`)
  }
  return json
}

export async function login() {
  const data = await api('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  })
  return data.token
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

export function normalizeSlug(input) {
  if (!input) return ''
  return String(input).replace(/^\/+/, '').replace(/\/+$/, '')
}

export function toLexicalText(value) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
          children: [
            {
              mode: 'normal',
              text: value || '',
              type: 'text',
              style: '',
              detail: 0,
              format: 0,
              version: 1,
            },
          ],
        },
      ],
    },
  }
}

export function humanizeFilename(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function toPosixPath(inputPath) {
  return inputPath.split(path.sep).join('/')
}

export function hashFile(filePath) {
  const content = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(content).digest('hex')
}

export function scanDirectory(rootDir, extensions) {
  const out = []
  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const abs = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(abs)
        continue
      }
      const ext = path.extname(entry.name).toLowerCase()
      if (extensions.has(ext)) out.push(abs)
    }
  }
  walk(rootDir)
  return out
}

export async function findOneByField(collection, field, value, token) {
  try {
    const query = new URLSearchParams({
      [`where[${field}][equals]`]: value,
      limit: '1',
    })
    const result = await api(`/api/${collection}?${query.toString()}`, {
      headers: { Authorization: `JWT ${token}` },
    })
    return result.docs?.[0] || null
  } catch {
    return null
  }
}

export async function upsertBySlug(collection, slug, data, token) {
  const existing = await findOneByField(collection, 'slug', slug, token)
  if (existing?.id) {
    return api(`/api/${collection}/${existing.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }
  return api(`/api/${collection}`, {
    method: 'POST',
    headers: {
      Authorization: `JWT ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export async function uploadMediaDoc({
  token,
  filePath,
  alt,
  caption,
  tags = [],
}) {
  const existing = await findOneByField('media', 'filename', path.basename(filePath), token)
  if (existing?.id) {
    return api(`/api/media/${existing.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alt, caption, tags: tags.map((tag) => ({ tag })) }),
    })
  }

  const bytes = fs.readFileSync(filePath)
  const mime = guessMimeType(filePath)
  const form = new FormData()
  form.set(
    '_payload',
    JSON.stringify({
      alt,
      caption,
      tags: tags.map((tag) => ({ tag })),
    }),
  )
  form.set('file', new Blob([bytes], { type: mime }), path.basename(filePath))

  const response = await fetch(`${BASE_URL}/api/media`, {
    method: 'POST',
    headers: {
      Authorization: `JWT ${token}`,
    },
    body: form,
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`/api/media failed (${response.status}): ${text}`)
  }
  return text ? JSON.parse(text) : {}
}

function guessMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.mp4') return 'video/mp4'
  if (ext === '.webm') return 'video/webm'
  if (ext === '.mov') return 'video/quicktime'
  return 'application/octet-stream'
}

export async function upsertGlobal(slug, data, token) {
  return api(`/api/globals/${slug}`, {
    method: 'POST',
    headers: {
      Authorization: `JWT ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export async function resolveMediaByLegacyUrl(legacyUrl, token) {
  if (!legacyUrl || typeof legacyUrl !== 'string' || !legacyUrl.startsWith('/')) return null
  const filename = legacyUrl.split('/').pop() || ''
  if (!filename) return null
  return findOneByField('media', 'filename', filename, token)
}
