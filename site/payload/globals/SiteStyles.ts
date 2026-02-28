import type { GlobalConfig } from 'payload'

export const SiteStyles: GlobalConfig = {
  slug: 'site-styles',
  admin: {
    description: 'Brand-level visual settings used by frontend rendering.',
  },
  fields: [
    {
      name: 'brandPrimary',
      type: 'text',
      defaultValue: '#ffffff',
      admin: {
        placeholder: '#ffffff',
        description: 'Hex color only.',
      },
      validate: (value: unknown) => {
        const color = String(value || '').trim()
        if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return 'Use valid hex color (#fff or #ffffff).'
        return true
      },
    },
    {
      name: 'brandSecondary',
      type: 'text',
      defaultValue: '#a1a1aa',
      admin: {
        placeholder: '#a1a1aa',
        description: 'Hex color only.',
      },
      validate: (value: unknown) => {
        const color = String(value || '').trim()
        if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return 'Use valid hex color (#fff or #ffffff).'
        return true
      },
    },
    {
      name: 'backgroundColor',
      type: 'text',
      defaultValue: '#000000',
      admin: {
        placeholder: '#000000',
        description: 'Hex color only.',
      },
      validate: (value: unknown) => {
        const color = String(value || '').trim()
        if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return 'Use valid hex color (#fff or #ffffff).'
        return true
      },
    },
    {
      name: 'fontFamilyHeading',
      type: 'text',
      defaultValue: 'inherit',
    },
    {
      name: 'fontFamilyBody',
      type: 'text',
      defaultValue: 'inherit',
    },
    {
      name: 'buttonStyle',
      type: 'select',
      defaultValue: 'sharp',
      admin: {
        description: 'Controls default button corner style.',
      },
      options: [
        { label: 'Sharp', value: 'sharp' },
        { label: 'Rounded', value: 'rounded' },
      ],
    },
  ],
}
