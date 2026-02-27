import type { GlobalConfig } from 'payload'

export const SeoDefaults: GlobalConfig = {
  slug: 'seo-defaults',
  fields: [
    {
      name: 'siteName',
      type: 'text',
      defaultValue: 'BEATROX',
    },
    {
      name: 'defaultTitle',
      type: 'text',
      defaultValue: 'BEATROX — Experiential Design & Event Production',
    },
    {
      name: 'titleTemplate',
      type: 'text',
      defaultValue: '%s | BEATROX',
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
      defaultValue:
        'Portland-based experiential design and event production. Drone light shows, LED video walls, projection mapping, custom fabrication, and full-service event production.',
    },
    {
      name: 'defaultOgImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'noindexByDefault',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
