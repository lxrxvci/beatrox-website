import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// TEMPORARY diagnostic — remove after Blob activation is verified.
export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN || ''
  return NextResponse.json({
    blobTokenPresent: Boolean(token),
    blobTokenPrefix: token ? token.slice(0, 16) : null,
    storeId: process.env.BLOB_STORE_ID || null,
    nodeEnv: process.env.NODE_ENV,
  })
}
