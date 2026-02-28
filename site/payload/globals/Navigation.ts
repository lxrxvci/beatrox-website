import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: {
    description: 'Primary site navigation links shown in header/footer. Keep paths internal (start with /).',
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      labels: {
        singular: 'Navigation Item',
        plural: 'Navigation Items',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'path',
          type: 'text',
          required: true,
          admin: {
            placeholder: '/work',
            description: 'Internal route path. Example: /work or /services/led-video-wall-rentals',
          },
          validate: (value: unknown) => {
            const path = String(value || '').trim()
            if (!path.startsWith('/')) return 'Path must start with /.'
            return true
          },
        },
        {
          name: 'order',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Lower numbers appear first.',
          },
        },
      ],
    },
  ],
}
