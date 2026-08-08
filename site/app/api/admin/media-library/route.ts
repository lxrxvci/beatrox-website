import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'
import { getMediaLibrary } from '@/lib/content'

export const dynamic = 'force-dynamic'

/**
 * Media-library list for the admin inline-edit UI. Auth-gated like
 * /api/admin-check so public pages never fetch or serialize the library
 * the admin context fetches this lazily when edit mode turns on.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config: payloadConfig })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mediaLibrary = await getMediaLibrary()
    return NextResponse.json({ mediaLibrary })
  } catch (error) {
    console.error('Admin media library failed:', error)
    return NextResponse.json({ error: 'Failed to load media library' }, { status: 500 })
  }
}
