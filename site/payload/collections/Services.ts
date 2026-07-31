import type { CollectionConfig } from 'payload'
import { contentBlocks } from '../blocks/shared'
import { getLivePath, getPreviewPath } from '../utils/previewLinks'
import { revalidateDocument } from '@/lib/revalidate'

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
    group: 'Content',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        return getLivePath('services', slug)
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
    afterChange: [
      ({ doc }) => {
        // Keep ISR pages fresh after admin-UI edits; revalidateDocument
        // swallows its own errors so a failure can never block a save.
        revalidateDocument('services', doc as Record<string, unknown>)
      },
    ],
    beforeValidate: [
      ({ data }) => {
        if (data && typeof data === 'object' && typeof data.title === 'string' && (!data.slug || typeof data.slug !== 'string')) {
          const nextSlug = slugify(data.title)
          return {
            ...data,
            slug: nextSlug,
            liveUrl: getLivePath('services', nextSlug),
            previewUrl: getPreviewPath('services', nextSlug),
          }
        }
        if (data && typeof data === 'object' && typeof data.slug === 'string') {
          return {
            ...data,
            liveUrl: getLivePath('services', data.slug),
            previewUrl: getPreviewPath('services', data.slug),
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
      name: 'pageType',
      type: 'select',
      required: true,
      defaultValue: 'service',
      options: [
        { label: 'Service (sold offering — /services/*)', value: 'service' },
        { label: 'Tech (capability — /tech/*)', value: 'tech' },
        { label: 'Rental (legacy rental page)', value: 'rental' },
      ],
      admin: {
        description: 'Page type determines the route template and tag associations.',
      },
    },
    {
      name: 'tech',
      type: 'array',
      admin: {
        description: 'Technologies behind this capability — shown as chips on tech pages. Display-only, never used for matching.',
        condition: (data) => data?.pageType === 'tech',
      },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
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
          fields: [
            { name: 'value', type: 'text' },
            { name: 'question', type: 'text' },
            { name: 'answer', type: 'textarea' },
          ],
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
      name: 'relatedWork',
      type: 'array',
      fields: [
        { name: 'project', type: 'relationship', relationTo: 'projects' },
        { name: 'title', type: 'text' },
        { name: 'slug', type: 'text' },
      ],
    },
    {
      name: 'curatedImages',
      type: 'array',
      labels: { singular: 'Curated Image', plural: 'Curated Images' },
      admin: {
        description: 'Pin or hide specific tagged photos on this page. Unlisted tagged images fill the highest free slot automatically.',
      },
      fields: [
        { name: 'project', type: 'relationship', relationTo: 'projects', required: true },
        { name: 'imageIndex', type: 'number', required: true },
        { name: 'position', type: 'number', required: true },
        { name: 'hidden', type: 'checkbox', defaultValue: false },
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
        { name: 'ogImageLegacyUrl', type: 'text' },
      ],
    },
    {
      name: 'liveUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open published route for this service.',
      },
    },
    {
      name: 'previewUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Open admin-session draft/private preview route for this service.',
      },
    },
  ],
}
