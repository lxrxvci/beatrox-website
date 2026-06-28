import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type RedirectRow = {
  from?: string
  to?: string
  statusCode?: '301' | '302' | string
}

const EXCLUDED_PREFIXES = ['/api', '/admin', '/_next', '/images', '/favicon', '/robots', '/sitemap']

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (isExcludedPath(pathname)) return NextResponse.next()

  const origin = request.nextUrl.origin
  const url = new URL('/api/redirects', origin)
  url.searchParams.set('limit', '1')
  url.searchParams.set('depth', '0')
  url.searchParams.set('where[from][equals]', pathname)
  url.searchParams.set('where[isEnabled][equals]', 'true')

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 600)
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    clearTimeout(timer)
    if (!response.ok) return NextResponse.next()

    const payload = (await response.json()) as { docs?: RedirectRow[] }
    const row = payload.docs?.[0]
    const to = row?.to || ''
    if (!to || to === pathname) return NextResponse.next()

    const code = row?.statusCode === '302' ? 302 : 301
    const destination = new URL(to, origin)
    destination.search = search
    return NextResponse.redirect(destination, code)
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next|api|admin|favicon.ico|robots.txt|sitemap.xml).*)'],
}
