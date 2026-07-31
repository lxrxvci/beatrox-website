import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import type { CollectionSlug } from 'payload'
import payloadConfig from '@/payload.config'
import { revalidateDocument } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

function getTopLevelField(path: string): string {
  return path.split('.')[0]
}

// Allowlist of writable collection -> field-path prefixes, derived from how
// the admin inline-edit UI (components/admin/EditableText, EditableRichText)
// actually calls this endpoint. Anything outside this list is rejected.
const ALLOWED_UPDATE_PATHS: Record<string, string[]> = {
  pages: ['hero.', 'media.', 'consultationForm.', 'address.', 'contactInfo.', 'social.', 'emailSignup.', 'blocks.'],
  projects: ['serviceTags', 'techTags', 'stats.', 'images.', 'body.', 'contentBlocks.', 'blocks.'],
  services: ['capabilities.', 'curatedImages', 'media.', 'body.', 'contentBlocks.', 'blocks.'],
  team: ['photo.'],
}

// Allowlist of writable global -> field-path prefixes (inline-edit UI).
const ALLOWED_GLOBAL_UPDATE_PATHS: Record<string, string[]> = {
  'capability-tiles': ['items'],
}

function isAllowedUpdate(collection: string, path: string): boolean {
  const prefixes = ALLOWED_UPDATE_PATHS[collection]
  if (!prefixes) return false
  return prefixes.some((prefix) => path.startsWith(prefix))
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current: unknown = obj

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i]
    if (!current || typeof current !== 'object') return
    const nextKey = keys[i + 1]
    const isNextIndex = /^\d+$/.test(nextKey)
    const currentObj = current as Record<string, unknown>

    if (currentObj[key] === undefined || currentObj[key] === null) {
      currentObj[key] = isNextIndex ? [] : {}
    }
    current = currentObj[key]
  }

  if (!current || typeof current !== 'object') return
  const lastKey = keys[keys.length - 1]
  ;(current as Record<string, unknown>)[lastKey] = value
}

export async function PATCH(request: Request) {
  try {
    const payload = await getPayload({ config: payloadConfig })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { collection, id, path, value, global: globalSlug } = body

    // Global updates (e.g. capability-tiles items edited inline on /services).
    if (globalSlug) {
      if (typeof globalSlug !== 'string' || typeof path !== 'string') {
        return NextResponse.json({ error: 'Missing global or path' }, { status: 400 })
      }
      const allowedPrefixes = ALLOWED_GLOBAL_UPDATE_PATHS[globalSlug]
      if (!allowedPrefixes || !allowedPrefixes.some((prefix) => path.startsWith(prefix))) {
        return NextResponse.json({ error: 'Global/path is not editable via this endpoint' }, { status: 400 })
      }
      // Mirror the collection flow: setPath on a copy, send only the
      // top-level field that changed.
      const currentGlobal = await payload.findGlobal({ slug: globalSlug as 'capability-tiles', depth: 0 })
      const updateData: Record<string, unknown> = { ...(currentGlobal as unknown as Record<string, unknown>) }
      setPath(updateData, path, value)
      const topLevelField = getTopLevelField(path)
      const updated = await payload.updateGlobal({
        slug: globalSlug as 'capability-tiles',
        data: { [topLevelField]: updateData[topLevelField] },
      })
      try {
        revalidatePath('/services')
        revalidatePath('/')
      } catch {
        // Revalidation must not fail the update.
      }
      return NextResponse.json({ success: true, doc: updated })
    }

    if (!collection || !id || !path) {
      return NextResponse.json({ error: 'Missing collection, id, or path' }, { status: 400 })
    }

    if (typeof collection !== 'string' || typeof path !== 'string' || !isAllowedUpdate(collection, path)) {
      return NextResponse.json({ error: 'Collection/path is not editable via this endpoint' }, { status: 400 })
    }

    // Validated above against ALLOWED_UPDATE_PATHS, so the slug is one of the
    // known editable collections.
    const collectionSlug = collection as CollectionSlug

    // Fetch current document
    const doc = await payload.findByID({
      collection: collectionSlug,
      id,
      depth: 0,
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Apply update to path on a copy of the document, then only send the
    // top-level field that changed. This avoids sending read-only fields
    // like id, createdAt, updatedAt back to Payload.
    const updateData: Record<string, unknown> = { ...doc }
    setPath(updateData, path, value)
    const topLevelField = getTopLevelField(path)

    // Update document
    const updated = await payload.update({
      collection: collectionSlug,
      id,
      data: {
        [topLevelField]: updateData[topLevelField],
      },
    })

    revalidateDocument(collection, updated as unknown as Record<string, unknown>)

    return NextResponse.json({ success: true, doc: updated })
  } catch (error) {
    console.error('Admin update failed:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
