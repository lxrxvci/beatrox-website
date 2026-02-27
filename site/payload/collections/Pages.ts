import type { CollectionConfig } from 'payload'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'isEnabled', 'showInNav', 'navOrder', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        if (!slug || slug === 'home' || slug === 'homepage') return '/'
        return `/${slug}`
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

        const previousPath = prevSlug === 'home' ? '/' : `/${prevSlug}`
        const nextPath = nextSlug === 'home' ? '/' : `/${nextSlug}`
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
                note: 'Auto-created from page slug change',
              },
              req,
            })
          }
        } catch {
          // Redirect creation failure should not block editorial updates.
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
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
        description: 'Editorial workflow state.',
      },
    },
    {
      name: 'isEnabled',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showInNav',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'navLabel',
      type: 'text',
    },
    {
      name: 'navOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        step: 1,
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        description: 'Optional parent for hierarchy and breadcrumbs.',
      },
    },
    {
      name: 'category',
      type: 'text',
      admin: {
        description: 'Optional content grouping for filtering in admin.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      name: 'pagination',
      type: 'group',
      fields: [
        {
          name: 'pageSize',
          type: 'number',
          defaultValue: 24,
          admin: { step: 1, description: 'Optional list page size for index pages.' },
        },
      ],
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'headline', type: 'text' },
        { name: 'subheadline', type: 'textarea' },
        {
          name: 'cta',
          type: 'group',
          fields: [{ name: 'label', type: 'text' }, { name: 'url', type: 'text' }],
        },
        {
          name: 'secondaryCta',
          type: 'group',
          fields: [{ name: 'label', type: 'text' }, { name: 'url', type: 'text' }],
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
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'previewPath',
      type: 'text',
      admin: {
        description: 'Optional custom preview path. Defaults to slug route.',
      },
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'intro',
          labels: { singular: 'Intro', plural: 'Intro Blocks' },
          fields: [
            { name: 'heading', type: 'text' },
            { name: 'body', type: 'richText', required: true },
          ],
        },
        {
          slug: 'text',
          labels: { singular: 'Text', plural: 'Text Blocks' },
          fields: [
            { name: 'heading', type: 'text' },
            { name: 'body', type: 'richText', required: true },
          ],
        },
        {
          slug: 'gallery',
          labels: { singular: 'Gallery', plural: 'Galleries' },
          fields: [
            { name: 'heading', type: 'text' },
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              required: true,
            },
          ],
        },
        {
          slug: 'features',
          labels: { singular: 'Features', plural: 'Feature Blocks' },
          fields: [
            { name: 'heading', type: 'text' },
            {
              name: 'items',
              type: 'array',
              required: true,
              fields: [{ name: 'label', type: 'text', required: true }],
            },
          ],
        },
        {
          slug: 'capabilitiesGrid',
          labels: { singular: 'Capabilities Grid', plural: 'Capabilities Grids' },
          fields: [
            { name: 'heading', type: 'text' },
            {
              name: 'items',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'icon', type: 'text' },
              ],
            },
          ],
        },
        {
          slug: 'philosophy',
          labels: { singular: 'Philosophy Columns', plural: 'Philosophy Column Blocks' },
          fields: [
            { name: 'heading', type: 'text' },
            {
              name: 'columns',
              type: 'array',
              fields: [
                { name: 'heading', type: 'text', required: true },
                { name: 'body', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          slug: 'featuredWork',
          labels: { singular: 'Featured Work', plural: 'Featured Work Blocks' },
          fields: [
            { name: 'heading', type: 'text' },
            {
              name: 'projects',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
            },
          ],
        },
        {
          slug: 'cta',
          labels: { singular: 'CTA', plural: 'CTAs' },
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'body', type: 'textarea' },
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
        {
          slug: 'video',
          labels: { singular: 'Video', plural: 'Videos' },
          fields: [
            { name: 'heading', type: 'text' },
            { name: 'url', type: 'text', required: true },
            { name: 'provider', type: 'select', defaultValue: 'external', options: ['youtube', 'vimeo', 'instagram', 'external'] },
          ],
        },
        {
          slug: 'ctaBar',
          labels: { singular: 'CTA Bar', plural: 'CTA Bar Blocks' },
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'body', type: 'textarea' },
            {
              name: 'cta',
              type: 'group',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}
