import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const cache = new Map<string, { width: number; height: number } | null>()

/**
 * Probe image dimensions from the local public folder.
 * URLs are expected to be root-relative (e.g. /images/...).
 * Results are cached for the process lifetime.
 */
export async function getImageDimensions(
  url: string,
): Promise<{ width: number; height: number } | undefined> {
  if (!url || !url.startsWith('/')) return undefined
  if (cache.has(url)) {
    const cached = cache.get(url)
    return cached ? { ...cached } : undefined
  }

  const filePath = path.join(process.cwd(), 'public', url)
  if (!fs.existsSync(filePath)) {
    cache.set(url, null)
    return undefined
  }

  try {
    const metadata = await sharp(filePath).metadata()
    if (metadata.width && metadata.height) {
      const dims = { width: metadata.width, height: metadata.height }
      cache.set(url, dims)
      return { ...dims }
    }
  } catch {
    // ignore probe failures
  }

  cache.set(url, null)
  return undefined
}
