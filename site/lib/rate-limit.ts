import crypto from 'crypto'

// Best-effort in-memory sliding-window rate limiter for public form actions.
// NOTE: on serverless platforms each function instance has its own memory,
// so this only limits per instance, for strict limiting use a shared store
// (e.g. Redis/Upstash). It still meaningfully blunts naive spam bursts.
const WINDOW_MS = 10 * 60 * 1000
const MAX_SUBMISSIONS = 5
const MAX_KEYS = 5000

const hits = new Map<string, number[]>()

export function hashIp(ip: string | null): string | undefined {
  if (!ip) return undefined
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export function isRateLimited(key: string | undefined, now: number = Date.now()): boolean {
  if (!key) return false
  const timestamps = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS)

  if (timestamps.length >= MAX_SUBMISSIONS) {
    hits.set(key, timestamps)
    return true
  }

  timestamps.push(now)
  hits.set(key, timestamps)

  // Keep the map from growing unbounded across many distinct IPs.
  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k)
    }
  }

  return false
}
