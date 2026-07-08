import type { CollectionConfig } from 'payload'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const ConsultationTypes: CollectionConfig = {
  slug: 'consultation-types',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'duration', 'isEnabled', 'listOrder'],
    description: 'Types of meetings prospects can book.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && typeof data === 'object' && typeof data.name === 'string' && (!data.slug || typeof data.slug !== 'string')) {
          return { ...data, slug: slugify(data.name) }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated from name if left blank.',
      },
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      min: 5,
      defaultValue: 30,
      admin: {
        description: 'Duration in minutes.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Optional hex color (e.g. #FF5733) used in calendar views.',
      },
    },
    {
      name: 'isEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enabled',
    },
    {
      name: 'listOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        step: 1,
        description: 'Lower numbers appear first in booking type lists.',
      },
    },
  ],
}
