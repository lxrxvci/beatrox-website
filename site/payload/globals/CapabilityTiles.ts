import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '@/lib/revalidate'

export const CapabilityTiles: GlobalConfig = {
  slug: 'capability-tiles',
  admin: {
    group: 'Content',
    description: 'The image tile grid on the Services page ("Our Services"). Editable inline on /services in edit mode.',
  },
  hooks: {
    afterChange: [
      () => {
        // Tiles render on /services and the layout shell; revalidateGlobal
        // swallows its own errors so a failure can never block a save.
        revalidateGlobal()
      },
    ],
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'image',
          type: 'text',
          admin: { description: 'Tile image path (e.g. /images/capabilities/foo.jpg).' },
        },
        {
          name: 'link',
          type: 'text',
          admin: { description: 'Tile link (e.g. /services/custom-fabrication).' },
        },
        {
          name: 'textPosition',
          type: 'select',
          defaultValue: 'center',
          options: [
            { label: 'Center overlay', value: 'center' },
            { label: 'Top overlay', value: 'top' },
            { label: 'Bottom overlay', value: 'bottom' },
            { label: 'Below image', value: 'below' },
            { label: 'Hidden', value: 'hidden' },
          ],
        },
      ],
    },
  ],
}
