import { NextResponse } from 'next/server'
import { draftMode } from 'next/headers'

function safePath(input: string): string {
  const value = (input || '').trim()
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  return value
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const path = safePath(url.searchParams.get('path') || '/')

  const cookieHeader = request.headers.get('cookie') || ''
  const hasAdminSession = cookieHeader.includes('payload-token=')
  if (!hasAdminSession) {
    return NextResponse.json({ error: 'Preview requires active admin session.' }, { status: 401 })
  }

  const state = await draftMode()
  state.enable()

  return NextResponse.redirect(new URL(path, url.origin))
}
