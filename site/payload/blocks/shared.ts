import type { Block } from 'payload'
import { createRichTextField } from '../fields/richText'

export const introBlock: Block = {
  slug: 'intro',
  labels: { singular: 'Intro', plural: 'Intro Blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    createRichTextField({ name: 'body', required: true }),
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
  ],
}

export const textBlock: Block = {
  slug: 'text',
  labels: { singular: 'Text', plural: 'Text Blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    createRichTextField({ name: 'body', required: true }),
  ],
}

export const mediaBlock: Block = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media Blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    createRichTextField({ name: 'caption', minimal: true }),
  ],
}

export const galleryBlock: Block = {
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
}

export const featuresBlock: Block = {
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
}

export const capabilitiesGridBlock: Block = {
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
}

export const philosophyBlock: Block = {
  slug: 'philosophy',
  labels: { singular: 'Philosophy Columns', plural: 'Philosophy Column Blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'columns',
      type: 'array',
      fields: [
        { name: 'heading', type: 'text', required: true },
        createRichTextField({ name: 'body', required: true }),
      ],
    },
  ],
}

export const featuredWorkBlock: Block = {
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
}

export const ctaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'CTA', plural: 'CTAs' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    createRichTextField({ name: 'body' }),
    { name: 'label', type: 'text', required: true },
    { name: 'url', type: 'text', required: true },
  ],
}

export const videoBlock: Block = {
  slug: 'video',
  labels: { singular: 'Video', plural: 'Videos' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'url', type: 'text', required: true },
    { name: 'provider', type: 'select', defaultValue: 'external', options: ['youtube', 'vimeo', 'instagram', 'external'] },
  ],
}

export const ctaBarBlock: Block = {
  slug: 'ctaBar',
  labels: { singular: 'CTA Bar', plural: 'CTA Bar Blocks' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    createRichTextField({ name: 'body' }),
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}

export const quoteBlock: Block = {
  slug: 'quote',
  labels: { singular: 'Quote', plural: 'Quotes' },
  fields: [
    createRichTextField({ name: 'quote', required: true }),
    { name: 'attribution', type: 'text' },
  ],
}

export const dividerBlock: Block = {
  slug: 'divider',
  labels: { singular: 'Divider', plural: 'Dividers' },
  fields: [
    { name: 'style', type: 'select', defaultValue: 'line', options: ['line', 'spacer'] },
  ],
}

export const pageBlocks = [
  introBlock,
  textBlock,
  galleryBlock,
  featuresBlock,
  capabilitiesGridBlock,
  philosophyBlock,
  featuredWorkBlock,
  ctaBlock,
  videoBlock,
  ctaBarBlock,
]

export const contentBlocks = [
  textBlock,
  mediaBlock,
  galleryBlock,
  videoBlock,
  featuresBlock,
  quoteBlock,
  ctaBlock,
  ctaBarBlock,
]
