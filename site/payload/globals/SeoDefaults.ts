import type { GlobalConfig } from 'payload'

export const SeoDefaults: GlobalConfig = {
  slug: 'seo-defaults',
  admin: {
    description: 'Fallback SEO settings used when page-level values are missing.',
  },
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
      admin: {
        description: 'Use %s placeholder for the page title.',
      },
      validate: (value: unknown) => {
        const template = String(value || '').trim()
        if (!template.includes('%s')) return 'Title template must include %s placeholder.'
        return true
      },
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
      admin: {
        description: 'Default social image when a page has no custom OG image.',
      },
    },
    {
      name: 'noindexByDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'If enabled, new pages default to noindex unless overridden.',
      },
    },
  ],
}
