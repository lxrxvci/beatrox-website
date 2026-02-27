import path from 'path'
import { pathToFileURL } from 'url'
import {
  assertCredentials,
  humanizeFilename,
  login,
  scanDirectory,
  uploadMediaDoc,
} from './cms-import-utils.mjs'

const SITE_ROOT = process.cwd()
const IMAGE_ROOT = path.join(SITE_ROOT, 'public', 'images')
const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp4', '.webm', '.mov'])

export async function importMedia(token) {
  const files = scanDirectory(IMAGE_ROOT, MEDIA_EXTENSIONS)
  let imported = 0
  for (const filePath of files) {
    const filename = path.basename(filePath)
    const alt = humanizeFilename(filename) || filename
    const relFromImages = path.relative(IMAGE_ROOT, filePath)
    const tags = relFromImages.split(path.sep).filter(Boolean).slice(0, -1)

    await uploadMediaDoc({
      token,
      filePath,
      alt,
      tags,
    })
    imported += 1
  }
  return { count: imported }
}

async function run() {
  assertCredentials()
  const token = await login()
  const result = await importMedia(token)
  console.log(`Imported media docs: ${result.count}`)
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  run().catch((error) => {
    console.error('Media import failed:', error.message)
    process.exitCode = 1
  })
}
