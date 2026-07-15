import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'

export const dynamic = 'force-dynamic'

function getTopLevelField(path: string): string {
  return path.split('.')[0]
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

    // Fetch current document
    const doc = await payload.findByID({
      collection,
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
      collection,
      id,
      data: {
        [topLevelField]: updateData[topLevelField],
      },
    })

    return NextResponse.json({ success: true, doc: updated })
  } catch (error) {
    console.error('Admin update failed:', error)
    const message = error instanceof Error ? error.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
