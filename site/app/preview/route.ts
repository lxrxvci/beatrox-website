import { NextResponse } from 'next/server'
import { draftMode, headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'

export const dynamic = 'force-dynamic'

function safePath(input: string): string {
  const value = (input || '').trim()
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  return value
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const path = safePath(url.searchParams.get('path') || '/')

  // Verified Payload session check — rejects forged/expired tokens, unlike a
  // raw cookie-substring check.
  const payload = await getPayload({ config: payloadConfig })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  if (!user) {
    return NextResponse.json({ error: 'Preview requires active admin session.' }, { status: 401 })
  }

  const state = await draftMode()
  state.enable()

  // Render previews through the dedicated dynamic preview route so the public
  // routes stay static/ISR (no draftMode() in their render path).
  const target = path === '/' ? '/preview/home' : `/preview${path}`
  return NextResponse.redirect(new URL(target, url.origin))
}
