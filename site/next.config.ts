import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  async redirects() {
    return [
      // Rentals now lives on its own dedicated app (permanent — passes link equity).
      {
        source: '/rentals',
        destination: 'https://rentals.beatrox.com/',
        permanent: true,
      },
      {
        source: '/rentals/:path*',
        destination: 'https://rentals.beatrox.com/:path*',
        permanent: true,
      },
      // Tech capabilities moved from /services/* to dedicated /tech/* landing pages.
      ...[
        'environmental-design',
        'lighting-design',
        'pre-visualization',
        '3d-animation-motion-capture',
        'realtime-content-ar-vr-xr',
        'av-content-design',
        'consultation-system-design',
        'interactive-ui-ux-design',
        'set-scenic-assembly',
        'staging-rigging',
        'lighting-integration',
        'trade-convention-booths',
        'permanent-installation',
        'cnc-machining',
        'materials-sourcing-selection',
        'technical-direction',
        'drafting-detail-drawings',
        'engineering-certification',
        'software-development',
        'site-floor-plans',
        'technical-documentation',
        'media-server-playback-solutions',
        'av-system-integration',
        'event-planning-logistics',
        'av-equipment-sourcing-rentals',
        'tour-management',
        'production-management',
        'labor-hire-crew-roles',
        'venue-sourcing-booking',
        'permit-submittal',
        'system-maintenance-support',
      ].map((slug) => ({
        source: `/services/${slug}`,
        destination: `/tech/${slug}`,
        permanent: true,
      })),
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
