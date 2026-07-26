import Link from 'next/link'

export interface ServiceLinkItem {
  label: string
  slug: string
}

export interface ServiceLinkGroup {
  label: string
  items: ServiceLinkItem[]
}

// The full tech-capabilities catalog, grouped — previously inlined in
// app/(site)/services/page.tsx. Moved here so the About page renders the
// same list after the About↔Services content swap. Every entry is a tech
// capability (pageType "tech") with a dedicated landing page at /tech/<slug>;
// sold offerings like Custom Fabrication stay on /services and are not listed.
export const SERVICE_CATEGORIES: ServiceLinkGroup[] = [
  {
    label: 'Design',
    items: [
      { label: 'Environmental Design', slug: 'environmental-design' },
      { label: 'Lighting Design', slug: 'lighting-design' },
      { label: 'Pre-Visualization', slug: 'pre-visualization' },
      { label: '3D Animation and Motion Capture', slug: '3d-animation-motion-capture' },
      { label: 'Realtime Content (AR, VR, XR)', slug: 'realtime-content-ar-vr-xr' },
      { label: 'Audio, Video, and Lighting Content Design', slug: 'av-content-design' },
      { label: 'Consultation and System Design', slug: 'consultation-system-design' },
      { label: 'Interactive UI / UX Design', slug: 'interactive-ui-ux-design' },
    ],
  },
  {
    label: 'Build',
    items: [
      { label: 'Set and Scenic Assembly', slug: 'set-scenic-assembly' },
      { label: 'Staging and Rigging', slug: 'staging-rigging' },
      { label: 'Lighting Integration', slug: 'lighting-integration' },
      { label: 'Trade and Convention Booths', slug: 'trade-convention-booths' },
      { label: 'Permanent Installation', slug: 'permanent-installation' },
      { label: 'CNC Machining', slug: 'cnc-machining' },
      { label: 'Materials Sourcing and Selection', slug: 'materials-sourcing-selection' },
    ],
  },
  {
    label: 'Technical',
    items: [
      { label: 'Technical Direction', slug: 'technical-direction' },
      { label: 'Drafting and Detail Drawings', slug: 'drafting-detail-drawings' },
      { label: 'Engineering Certification', slug: 'engineering-certification' },
      { label: 'Software Development', slug: 'software-development' },
      { label: 'Site and Floor Plans', slug: 'site-floor-plans' },
      { label: 'Technical Documentation', slug: 'technical-documentation' },
      { label: 'Media Server and Playback Solutions', slug: 'media-server-playback-solutions' },
      { label: 'AV System Integration', slug: 'av-system-integration' },
    ],
  },
  {
    label: 'Production',
    items: [
      { label: 'Event Planning and Logistics', slug: 'event-planning-logistics' },
      { label: 'AV Equipment Sourcing and Rentals', slug: 'av-equipment-sourcing-rentals' },
      { label: 'Tour Management', slug: 'tour-management' },
      { label: 'Production Management', slug: 'production-management' },
      { label: 'Labor Hire Roles: TD, PM, A1 A2, V1 V2, L1, L2', slug: 'labor-hire-crew-roles' },
      { label: 'Venue Sourcing and Booking', slug: 'venue-sourcing-booking' },
      { label: 'Permit Submittal', slug: 'permit-submittal' },
      { label: 'System Maintenance and Support', slug: 'system-maintenance-support' },
    ],
  },
]

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const LOOKUP = new Map(
  SERVICE_CATEGORIES.flatMap((cat) => cat.items.map((item) => [normalizeLabel(item.label), item] as const)),
)

interface ServicesLinkGridProps {
  /**
   * Optional CMS block items (capabilitiesGrid labels). When every label
   * resolves to a catalog tech capability, the CMS list is rendered (grouped by
   * catalog category, preserving catalog order). Otherwise the full
   * catalog is shown — links never rot because of an unrecognized label.
   */
  items?: Array<{ label: string }>
}

export default function ServicesLinkGrid({ items }: ServicesLinkGridProps) {
  let groups = SERVICE_CATEGORIES

  if (items && items.length > 0) {
    const matched = items.map((item) => LOOKUP.get(normalizeLabel(item.label)))
    if (matched.every(Boolean) && matched.length > 0) {
      const slugs = new Set(matched.map((item) => item!.slug))
      groups = SERVICE_CATEGORIES.map((cat) => ({
        label: cat.label,
        items: cat.items.filter((item) => slugs.has(item.slug)),
      })).filter((cat) => cat.items.length > 0)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
      {groups.map((cat) => (
        <div key={cat.label}>
          <h3 className="overline mb-6 pb-4 border-b border-white/10">{cat.label}</h3>
          <ul className="space-y-3">
            {cat.items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/tech/${item.slug}`}
                  className="group flex items-baseline gap-2.5 text-sm text-white leading-relaxed hover:text-white transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className="text-[var(--accent)] opacity-40 md:opacity-0 md:-translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
                  >
                    →
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
