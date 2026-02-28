import { NextResponse } from 'next/server'
import { draftMode } from 'next/headers'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const state = await draftMode()
  state.disable()
  return NextResponse.redirect(new URL('/', url.origin))
}
