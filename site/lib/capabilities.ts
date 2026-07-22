// Shared capability tile data — types plus the curated default grid for
// CapabilitiesGrid. Lives in lib/ (plain TS, no JSX) so both the client
// component and node scripts (scripts/content-audit.mjs) can import it
// without bundling React/Next client modules.

export type CapabilityTextPosition = 'center' | 'top' | 'bottom' | 'below' | 'hidden'

export interface Capability {
  label: string
  href: string
  image: string
  textPosition?: CapabilityTextPosition
}

/** CMS block item shape (capabilitiesGrid items). All fields optional except label. */
export interface CapabilityItem {
  label: string
  image?: string
  link?: string
  textPosition?: CapabilityTextPosition
}

// Default tile grid. Links point to dedicated service landing pages (never
// /work/* projects). A few mappings are best-fit judgments — see
// reports/content-audit.md; each tile can be retargeted via the CMS block
// or the inline gallery widget without code changes.
export const DEFAULT_CAPABILITIES: Capability[] = [
  {
    label: 'Custom Fabrication',
    href: '/services/custom-fabrication',
    image: '/images/capabilities/custom-fabrication.jpg',
  },
  {
    label: 'LED Video Wall',
    href: '/services/led-video-wall-rentals',
    image: '/images/capabilities/led-video-wall.jpg',
  },
  {
    label: 'Drone Light Shows',
    href: '/services/drone-light-shows',
    image: '/images/capabilities/drone-light-shows.png',
  },
  {
    label: 'Stage Design',
    href: '/services/set-scenic-assembly',
    image: '/images/capabilities/stage-design.jpg',
  },
  {
    label: 'Experiential Events',
    href: '/services/event-production',
    image: '/images/capabilities/experiential-events.jpg',
  },
  {
    label: 'Event Production',
    href: '/services/production-management',
    image: '/images/capabilities/event-production.jpg',
  },
  {
    label: 'Immersive Environments',
    href: '/services/environmental-design',
    image: '/images/capabilities/immersive-environments.jpeg',
  },
  {
    label: 'Laser Light Shows',
    href: '/services/laser-shows',
    image: '/images/capabilities/laser-light-shows.jpg',
  },
  {
    label: 'Multimedia Displays',
    href: '/services/av-system-integration',
    image: '/images/capabilities/multimedia-displays.jpg',
  },
  {
    label: 'DJ Equipment Rentals',
    href: '/services/dj-equipment-rentals',
    image: '/images/capabilities/dj-equipment-rentals.jpg',
  },
  {
    label: 'Audio Production',
    href: '/services/sound-equipment-rentals',
    image: '/images/capabilities/audio-production.jpg',
  },
  {
    label: 'Projection Mapping',
    href: '/services/av-content-design',
    image: '/images/capabilities/projection-mapping.jpg',
  },
]
