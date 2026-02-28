import type { CollectionConfig } from 'payload'
import { getLivePath, getPreviewPath } from '../utils/previewLinks'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const Team: CollectionConfig = {
  slug: 'team',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'status', 'order', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        return getLivePath('team', slug)
      },
    },
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && typeof data === 'object' && typeof data.name === 'string' && (!data.slug || typeof data.slug !== 'string')) {
          const nextSlug = slugify(data.name)
          return {
            ...data,
            slug: nextSlug,
            liveUrl: getLivePath('team', nextSlug),
            previewUrl: getPreviewPath('team', nextSlug),
          }
        }
        if (data && typeof data === 'object' && typeof data.slug === 'string') {
          return {
            ...data,
            liveUrl: getLivePath('team', data.slug),
            previewUrl: getPreviewPath('team', data.slug),
          }
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'bio', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'review' },
        { label: 'Published', value: 'published' },
      ],
    },
    { name: 'isEnabled', type: 'checkbox', defaultValue: true },
    { name: 'order', type: 'number', defaultValue: 0, admin: { step: 1 } },
    {
      name: 'expertise',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      name: 'photo',
      type: 'group',
      fields: [
        { name: 'media', type: 'relationship', relationTo: 'media' },
        { name: 'legacyUrl', type: 'text' },
        { name: 'alt', type: 'text' },
      ],
    },
    {
      name: 'liveUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open published route for team page.',
      },
    },
    {
      name: 'previewUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open admin-session draft/private preview route for team page.',
      },
    },
  ],
}
