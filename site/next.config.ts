import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  async redirects() {
    return [
      // Canonical host: the production-linked vercel.app deployment must not
      // serve or index duplicate content. Scoped to the exact host so preview
      // deployments on other *.vercel.app subdomains keep working.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'beatrox-website.vercel.app' }],
        destination: 'https://www.beatrox.com/:path*',
        permanent: true,
      },
      // Legacy Squarespace homepage duplicate; canonical homepage is /.
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      // Legacy Squarespace blog carried no lasting content; collapse to /.
      {
        source: '/blog',
        destination: '/',
        permanent: true,
      },
      {
        source: '/blog/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/shop',
        destination: '/',
        permanent: true,
      },
      // Legacy Squarespace utility pages -> closest live equivalent.
      {
        source: '/faq',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/portfolio',
        destination: '/work',
        permanent: true,
      },
      // Legacy rental pages -> matching category on the rentals app.
      {
        source: '/sound-equipment-rentals',
        destination: 'https://rentals.beatrox.com/category/sound',
        permanent: true,
      },
      {
        source: '/led-video-wall-rentals-portland',
        destination: 'https://rentals.beatrox.com/category/led-wall',
        permanent: true,
      },
      // Legacy top-level service slugs -> current service pages.
      ...[
        'drone-light-shows',
        'laser-shows',
      ].map((slug) => ({
        source: `/${slug}`,
        destination: `/services/${slug}`,
        permanent: true,
      })),
      // Legacy Squarespace portfolio slugs -> current /work project pages.
      // Projects with no surviving equivalent fall back to the /work index.
      ...Object.entries({
        '/aku-world-immersive-environment-nft-miami': '/work/aku-world',
        '/buzzfeed-newfronts-event-production': '/work/buzzfeed',
        '/create-our-future-experiential-event': '/work/create-our-future',
        '/destination-experiential-event': '/work/destination',
        '/flir-history-wall-interactive-media-display': '/work/flir',
        '/infinite-playlist-tour-festival-activation-experiential-event': '/work/infinite-playlist',
        '/myshelter-project-immersive-enviroment': '/work/myshelter',
        '/projekt-x-stage-design-and-fabrication': '/work/projekt-x',
        '/run-for-the-oceans-interactive-media-experience': '/work/run-for-the-oceans',
        '/super-bowl-2020-projection-mapping-interactive-ar': '/work/super-bowl-2020',
        '/aspire-sculptural-lighting': '/work',
        '/bird-of-paradise-sculptural-lighting-design': '/work',
        '/bird-song-generative-lighting-installation': '/work',
        '/cameo-no-3-interactive-sculptural-lighting-installation': '/work',
        '/centrifuge-cedars-sinai-lighting-installation': '/work',
        '/converging-influence': '/work',
        '/interactive-architectural-model-jbg-smith-washington-dc': '/work',
        '/seattle-star-an-interactive-lighting-installation': '/work',
        '/wave-interactive-light-sculpture-1': '/work',
      }).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      // Rentals now lives on its own dedicated app (permanent, passes link equity).
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
      // Short rental vanity URLs -> matching category on the rentals app.
      {
        source: '/dj-equipment-rentals',
        destination: 'https://rentals.beatrox.com/category/dj',
        permanent: true,
      },
      // Rental service page moved to the rentals app.
      {
        source: '/services/dj-equipment-rentals',
        destination: 'https://rentals.beatrox.com/category/dj',
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
