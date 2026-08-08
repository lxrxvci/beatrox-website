import { getAllServicesResolved } from '@/lib/content'
import ScrollPanel from './ScrollPanel'

const RENTALS_URL = 'https://rentals.beatrox.com/'

export default async function RentalsTeaser() {
  const services = await getAllServicesResolved()
  const rentalsService =
    services.find((s) => s.slug === '/services/led-video-wall-rentals') ??
    services.find((s) => s.slug.includes('rental'))
  const bgImage = rentalsService?.media?.heroImage

  return (
    <ScrollPanel id="rentals" variant="media" bgSrc={bgImage} bgAlt="BEATROX rental equipment" className="border-t border-white/10">
      <div className="max-w-2xl">
        <p className="overline mb-4">Rentals</p>
        <h2 className="heading-lg mb-6">Need the gear without the show?</h2>
        <p className="mb-4 text-base leading-relaxed text-white">
          LED walls, sound, lighting, backline, and staging — the same
          production-grade inventory, available dry-hire.
        </p>
        <p className="text-base leading-relaxed text-white">
          Our rentals shop lives on its own site with live inventory and booking.
        </p>
      </div>
      <div>
        {/* Plain <a> on purpose: CSP blocks cross-origin RSC prefetch from next/link. */}
        <a href={RENTALS_URL} className="btn-primary inline-block">
          Open Beatrox Rentals ↗
        </a>
      </div>
    </ScrollPanel>
  )
}
