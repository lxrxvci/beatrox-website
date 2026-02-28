import type { CollectionConfig } from 'payload'
import { getLivePath, getPreviewPath } from '../utils/previewLinks'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeCaseStudySlug(value: string): string {
  const stripped = value.trim().replace(/^\/+/, '').replace(/^case-studies\/+/i, '')
  return slugify(stripped)
}

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'listOrder', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? normalizeCaseStudySlug(data.slug) : ''
        return getLivePath('case-studies', slug)
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
        if (data && typeof data === 'object' && typeof data.title === 'string' && (!data.slug || typeof data.slug !== 'string')) {
          const nextSlug = normalizeCaseStudySlug(slugify(data.title))
          return {
            ...data,
            slug: nextSlug,
            liveUrl: getLivePath('case-studies', nextSlug),
            previewUrl: getPreviewPath('case-studies', nextSlug),
          }
        }
        if (data && typeof data === 'object' && typeof data.slug === 'string') {
          const nextSlug = normalizeCaseStudySlug(data.slug)
          return {
            ...data,
            slug: nextSlug,
            liveUrl: getLivePath('case-studies', nextSlug),
            previewUrl: getPreviewPath('case-studies', nextSlug),
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

        const previousPath = `/case-studies/${prevSlug}`
        const nextPath = `/case-studies/${nextSlug}`
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
                note: 'Auto-created from case study slug change',
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
    },
    { name: 'isEnabled', type: 'checkbox', defaultValue: true },
    {
      name: 'listOrder',
      type: 'number',
      defaultValue: 0,
      admin: { step: 1, description: 'Lower numbers appear first in listings.' },
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
        { name: 'type', type: 'text' },
        { name: 'investmentRange', type: 'text' },
        { name: 'partners', type: 'array', fields: [{ name: 'name', type: 'text', required: true }] },
      ],
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
      ],
    },
    {
      name: 'body',
      type: 'array',
      labels: { singular: 'Body Block', plural: 'Body Blocks' },
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
      name: 'images',
      type: 'array',
      labels: { singular: 'Image', plural: 'Images' },
      fields: [
        { name: 'media', type: 'relationship', relationTo: 'media' },
        { name: 'legacyUrl', type: 'text' },
        { name: 'alt', type: 'text', required: true },
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
      ],
    },
    {
      name: 'liveUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open published route for this case study.',
      },
    },
    {
      name: 'previewUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open admin-session draft/private preview route for this case study.',
      },
    },
  ],
}
