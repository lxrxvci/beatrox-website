/**
 * P3-04 service mesh: curated cross-links between the /services/* offer pages
 * and the /tech/* capability pages.
 *
 * The JSON content carries no reliable relationship data (tech pages hold
 * display-only product chips in `tech`; service pages carry no tags), so the
 * mapping is maintained here by bare slug. Each entry mirrors the service's
 * own capabilities list where it names a /tech discipline. The tech to
 * services direction is derived by inverting SERVICE_TO_TECH, so a
 * relationship only ever edits one place.
 */
export const SERVICE_TO_TECH: Record<string, string[]> = {
  'event-production': [
    'event-planning-logistics',
    'production-management',
    'technical-direction',
    'labor-hire-crew-roles',
    'venue-sourcing-booking',
    'permit-submittal',
    'tour-management',
    'system-maintenance-support',
    'site-floor-plans',
  ],
  'experiential-events': [
    'environmental-design',
    'interactive-ui-ux-design',
    'realtime-content-ar-vr-xr',
    'av-content-design',
    'trade-convention-booths',
    'event-planning-logistics',
  ],
  'stage-design': [
    'pre-visualization',
    'drafting-detail-drawings',
    'staging-rigging',
    'set-scenic-assembly',
    'engineering-certification',
    'technical-documentation',
  ],
  'immersive-environments': [
    'environmental-design',
    'realtime-content-ar-vr-xr',
    'media-server-playback-solutions',
    'interactive-ui-ux-design',
    'av-content-design',
  ],
  'led-video-wall-rentals': [
    'media-server-playback-solutions',
    'av-system-integration',
    'av-equipment-sourcing-rentals',
    'av-content-design',
  ],
  'projection-mapping': [
    'media-server-playback-solutions',
    'pre-visualization',
    '3d-animation-motion-capture',
    'av-content-design',
  ],
  'multimedia-displays': [
    'interactive-ui-ux-design',
    'media-server-playback-solutions',
    'av-system-integration',
    'permanent-installation',
    'software-development',
  ],
  'custom-fabrication': [
    'cnc-machining',
    'materials-sourcing-selection',
    'set-scenic-assembly',
    'drafting-detail-drawings',
    'engineering-certification',
  ],
  'audio-production': [
    'av-system-integration',
    'av-equipment-sourcing-rentals',
    'consultation-system-design',
  ],
  'sound-equipment-rentals': [
    'av-equipment-sourcing-rentals',
    'av-system-integration',
    'consultation-system-design',
  ],
  'dj-equipment-rentals': [
    'av-equipment-sourcing-rentals',
    'av-system-integration',
  ],
  'backline-stage-rental': [
    'staging-rigging',
    'av-equipment-sourcing-rentals',
    'labor-hire-crew-roles',
  ],
  'drone-light-shows': [
    '3d-animation-motion-capture',
    'pre-visualization',
    'permit-submittal',
  ],
  'laser-shows': [
    'pre-visualization',
    'lighting-design',
    'permit-submittal',
  ],
  'lighting-services': [
    'lighting-design',
    'lighting-integration',
    'pre-visualization',
  ],
}

/** Tech capability slugs related to a /services/[slug] page (bare slugs). */
export function getRelatedTechSlugs(serviceSlug: string): string[] {
  return SERVICE_TO_TECH[serviceSlug] ?? []
}

/** Service slugs that own a /tech/[slug] page, derived by inversion. */
export function getRelatedServiceSlugs(techSlug: string): string[] {
  return Object.entries(SERVICE_TO_TECH)
    .filter(([, techSlugs]) => techSlugs.includes(techSlug))
    .map(([serviceSlug]) => serviceSlug)
}
