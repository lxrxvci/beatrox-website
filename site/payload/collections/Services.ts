import type { CollectionConfig } from 'payload'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', 'status', 'listOrder', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        return slug ? `/services/${slug}` : '/services'
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
          return {
            ...data,
            slug: slugify(data.title),
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

        const previousPath = `/services/${prevSlug}`
        const nextPath = `/services/${nextSlug}`
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
                note: 'Auto-created from service slug change',
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
    { name: 'category', type: 'text' },
    {
      name: 'listOrder',
      type: 'number',
      defaultValue: 0,
      admin: { step: 1, description: 'Lower numbers appear first in listings.' },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'services',
      admin: {
        description: 'Optional hierarchy parent for grouped service navigation.',
      },
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'headline', type: 'text' },
        { name: 'subheadline', type: 'textarea' },
        {
          name: 'cta',
          type: 'group',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'url', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'capabilities',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }],
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
      name: 'relatedWork',
      type: 'array',
      fields: [
        { name: 'project', type: 'relationship', relationTo: 'projects' },
        { name: 'title', type: 'text' },
        { name: 'slug', type: 'text' },
      ],
    },
    {
      name: 'media',
      type: 'group',
      fields: [
        { name: 'heroImage', type: 'relationship', relationTo: 'media' },
        {
          name: 'heroImageLegacyUrl',
          type: 'text',
        },
        {
          name: 'galleryImages',
          type: 'array',
          fields: [
            { name: 'media', type: 'relationship', relationTo: 'media' },
            { name: 'legacyUrl', type: 'text' },
          ],
        },
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
  ],
}
