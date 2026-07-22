import path from 'path'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: path.resolve(process.cwd(), 'public', 'media'),
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'video/*'],
  },
  fields: [
    {
      name: 'legacyUrl',
      type: 'text',
      admin: {
        description: 'Original static path (e.g. /images/...) this asset was imported from. Resolvers prefer it over the Blob CDN URL.',
        readOnly: true,
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: false,
      admin: {
        description: 'Describe this media for accessibility and SEO.',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
