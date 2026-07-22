import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import type { CollectionSlug } from 'payload'
import payloadConfig from '@/payload.config'

export const dynamic = 'force-dynamic'

function revalidateDocument(collection: string, doc: Record<string, unknown>) {
  try {
    const slug = typeof doc.slug === 'string' ? doc.slug : ''

    if (collection === 'pages') {
      if (slug) revalidatePath(slug === 'home' ? '/' : `/${slug}`)
      // Homepage composes page content (hero/blocks), so any page edit may
      // affect it.
      revalidatePath('/')
      return
    }

    if (collection === 'team') {
      // Team members render on the /team index; there are no /team/[slug] pages.
      revalidatePath('/team')
      return
    }

    const prefixMap: Record<string, string> = {
      projects: '/work',
      services: '/services',
    }

    const prefix = prefixMap[collection]
    if (prefix) {
      if (slug) revalidatePath(`${prefix}/${slug}`)
      // Index pages list every document, and the homepage features both
      // projects and services.
      revalidatePath(prefix)
      revalidatePath('/')
    }

    if (collection === 'projects') {
      // Tag pages are keyed by tag value; invalidate the whole dynamic segment.
      revalidatePath('/work/tag/[tag]', 'page')
      // Service pages auto-list tagged projects; invalidate them all.
      revalidatePath('/services')
      revalidatePath('/services/[slug]', 'page')
    }
  } catch (err) {
    // Don't fail the update if revalidation throws.
    console.error('Revalidation failed:', err)
  }
}

function getTopLevelField(path: string): string {
  return path.split('.')[0]
}

// Allowlist of writable collection -> field-path prefixes, derived from how
// the admin inline-edit UI (components/admin/EditableText, EditableRichText)
// actually calls this endpoint. Anything outside this list is rejected.
const ALLOWED_UPDATE_PATHS: Record<string, string[]> = {
  pages: ['hero.', 'consultationForm.', 'address.', 'contactInfo.', 'social.', 'emailSignup.', 'blocks.'],
  projects: ['serviceTags', 'body.', 'contentBlocks.', 'blocks.'],
  services: ['capabilities.', 'body.', 'contentBlocks.', 'blocks.'],
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
    const { collection, id, path, value } = body

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
