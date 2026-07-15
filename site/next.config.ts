import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  async redirects() {
    return [
      // Rentals now lives on its own dedicated app.
      {
        source: '/rentals',
        destination: 'https://app-ruby-pi-32.vercel.app/',
        permanent: false,
      },
      {
        source: '/rentals/:path*',
        destination: 'https://app-ruby-pi-32.vercel.app/:path*',
        permanent: false,
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default withPayload(nextConfig)
