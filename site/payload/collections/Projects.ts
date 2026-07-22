import type { CollectionConfig } from 'payload'
import { contentBlocks } from '../blocks/shared'
import { getLivePath, getPreviewPath } from '../utils/previewLinks'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeProjectSlug(value: string): string {
  const stripped = value.trim().replace(/^\/+/, '').replace(/^work\/+/i, '')
  return slugify(stripped)
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'listOrder', 'updatedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? normalizeProjectSlug(data.slug) : ''
        return getLivePath('projects', slug)
      },
    },
  },
  access: {
    read: ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } }),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && typeof data === 'object' && typeof data.title === 'string' && (!data.slug || typeof data.slug !== 'string')) {
          const nextSlug = normalizeProjectSlug(slugify(data.title))
          return {
            ...data,
            slug: nextSlug,
            liveUrl: getLivePath('projects', nextSlug),
            previewUrl: getPreviewPath('projects', nextSlug),
          }
        }
        if (data && typeof data === 'object' && typeof data.slug === 'string') {
          const nextSlug = normalizeProjectSlug(data.slug)
          return {
            ...data,
            slug: nextSlug,
            liveUrl: getLivePath('projects', nextSlug),
            previewUrl: getPreviewPath('projects', nextSlug),
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (operation !== 'update') return data
        const nextSlug = typeof data?.slug === 'string' ? data.slug : ''
        const prevSlug = typeof originalDoc?.slug === 'string' ? originalDoc.slug : ''
        if (!nextSlug || !prevSlug || nextSlug === prevSlug) return data

        const previousPath = `/work/${prevSlug}`
        const nextPath = `/work/${nextSlug}`
        try {
          const existing = await req.payload.find({
            collection: 'redirects',
            where: { from: { equals: previousPath } },
            limit: 1,
            req,
          })
          if (existing.docs.length > 0) {
            await req.payload.update({
              collection: 'redirects',
              id: existing.docs[0].id,
              data: { to: nextPath, statusCode: '301', isEnabled: true },
              req,
            })
          } else {
            await req.payload.create({
              collection: 'redirects',
              data: {
                from: previousPath,
                to: nextPath,
                statusCode: '301',
                isEnabled: true,
                note: 'Auto-created from project slug change',
              },
              req,
            })
          }
        } catch {
          // Non-blocking QoL guardrail.
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'review' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        description: 'Workflow state for editorial quality control.',
      },
    },
    { name: 'isEnabled', type: 'checkbox', defaultValue: true },
    {
      name: 'listOrder',
      type: 'number',
      defaultValue: 0,
      admin: { step: 1, description: 'Lower numbers appear first in listings.' },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'projects',
      admin: {
        description: 'Optional hierarchy parent for grouped project navigation.',
      },
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'headline', type: 'text' },
        { name: 'subheadline', type: 'textarea' },
        {
          name: 'tags',
          type: 'array',
          fields: [{ name: 'tag', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        { name: 'client', type: 'text' },
        { name: 'location', type: 'text' },
        {
          name: 'locations',
          type: 'array',
          fields: [{ name: 'location', type: 'text', required: true }],
        },
        { name: 'type', type: 'text' },
        { name: 'partners', type: 'array', fields: [{ name: 'name', type: 'text', required: true }] },
        { name: 'tech', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
        { name: 'techniques', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
        { name: 'materials', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
        { name: 'spec', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
        { name: 'software', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
      ],
    },
    {
      name: 'serviceTags',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: {
        description: 'Services used on this project — drives service-page related work and the /work service tag cloud.',
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'ogTitle', type: 'text' },
        { name: 'ogDescription', type: 'textarea' },
        { name: 'canonicalUrl', type: 'text' },
        { name: 'noindex', type: 'checkbox', defaultValue: false },
        { name: 'ogImage', type: 'relationship', relationTo: 'media' },
        { name: 'ogImageLegacyUrl', type: 'text' },
      ],
    },
    {
      name: 'body',
      type: 'array',
      labels: { singular: 'Body Block', plural: 'Body Blocks' },
      admin: {
        description: 'Deprecated — use Content Blocks below.',
      },
      fields: [
        { name: 'type', type: 'text', required: true },
        { name: 'heading', type: 'text' },
        { name: 'content', type: 'textarea' },
        {
          name: 'items',
          type: 'array',
          fields: [{ name: 'value', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'contentBlocks',
      type: 'blocks',
      labels: { singular: 'Content Block', plural: 'Content Blocks' },
      blocks: contentBlocks,
    },
    {
      name: 'images',
      type: 'array',
      labels: { singular: 'Image', plural: 'Images' },
      fields: [
        { name: 'media', type: 'relationship', relationTo: 'media' },
        { name: 'legacyUrl', type: 'text' },
        { name: 'alt', type: 'text', required: true },
        { name: 'filename', type: 'text' },
        { name: 'note', type: 'textarea' },
      ],
    },
    {
      name: 'videos',
      type: 'array',
      labels: { singular: 'Video', plural: 'Videos' },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'provider',
          type: 'select',
          defaultValue: 'external',
          options: ['youtube', 'instagram', 'vimeo', 'external'],
        },
        { name: 'url', type: 'text', required: true },
        { name: 'embedUrl', type: 'text' },
        { name: 'note', type: 'textarea' },
      ],
    },
    {
      name: 'liveUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open published route for this project.',
      },
    },
    {
      name: 'previewUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open admin-session draft/private preview route for this project.',
      },
    },
  ],
}
