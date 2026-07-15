import { NextResponse } from 'next/server'
import { draftMode } from 'next/headers'

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

  const state = await draftMode()
  state.disable()

  return NextResponse.redirect(new URL(path, url.origin))
}
