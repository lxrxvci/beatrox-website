import type { CollectionConfig } from 'payload'
import { pageBlocks } from '../blocks/shared'
import { getLivePath, getPreviewPath } from '../utils/previewLinks'

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
        return getLivePath('pages', slug)
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
          const nextSlug = slugify(data.title)
          return {
            ...data,
            slug: nextSlug,
            liveUrl: getLivePath('pages', nextSlug),
            previewUrl: getPreviewPath('pages', nextSlug),
          }
        }
        if (data && typeof data === 'object' && typeof data.slug === 'string') {
          return {
            ...data,
            liveUrl: getLivePath('pages', data.slug),
            previewUrl: getPreviewPath('pages', data.slug),
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
      name: 'media',
      type: 'group',
      fields: [
        { name: 'heroImage', type: 'upload', relationTo: 'media' },
        { name: 'heroImageLegacyUrl', type: 'text' },
        {
          name: 'galleryImages',
          type: 'array',
          fields: [
            { name: 'media', type: 'upload', relationTo: 'media' },
            { name: 'legacyUrl', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'address',
      type: 'group',
      admin: {
        condition: (data) => data?.slug === 'contact',
        description: 'Contact page only.',
      },
      fields: [
        { name: 'company', type: 'text' },
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'zip', type: 'text' },
        { name: 'country', type: 'text' },
        { name: 'formatted', type: 'textarea' },
      ],
    },
    {
      name: 'contactInfo',
      type: 'group',
      admin: {
        condition: (data) => data?.slug === 'contact',
        description: 'Contact page only.',
      },
      fields: [
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'phoneFormatted', type: 'text' },
      ],
    },
    {
      name: 'social',
      type: 'group',
      admin: {
        condition: (data) => data?.slug === 'contact',
        description: 'Contact page only.',
      },
      fields: [
        { name: 'youtube', type: 'text' },
        { name: 'instagram', type: 'text' },
      ],
    },
    {
      name: 'consultationForm',
      type: 'group',
      admin: {
        condition: (data) => data?.slug === 'contact',
        description: 'Contact page only.',
      },
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'submitLabel', type: 'text' },
        { name: 'successMessage', type: 'textarea' },
        {
          name: 'fields',
          type: 'array',
          fields: [
            { name: 'id', type: 'text', required: true },
            { name: 'label', type: 'text', required: true },
            {
              name: 'type',
              type: 'select',
              defaultValue: 'text',
              options: ['text', 'email', 'select', 'multiselect', 'date', 'textarea'],
            },
            { name: 'required', type: 'checkbox', defaultValue: false },
            { name: 'placeholder', type: 'text' },
            {
              name: 'options',
              type: 'array',
              fields: [{ name: 'value', type: 'text', required: true }],
            },
          ],
        },
      ],
    },
    {
      name: 'emailSignup',
      type: 'group',
      admin: {
        condition: (data) => data?.slug === 'contact',
        description: 'Contact page only.',
      },
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'placeholder', type: 'text' },
        { name: 'submitLabel', type: 'text' },
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
      name: 'liveUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open published route for this page.',
      },
    },
    {
      name: 'previewUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open admin-session draft/private preview route for this page.',
      },
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: pageBlocks,
    },
  ],
}
