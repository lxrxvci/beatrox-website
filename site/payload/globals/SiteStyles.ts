import type { GlobalConfig } from 'payload'

export const SiteStyles: GlobalConfig = {
  slug: 'site-styles',
  fields: [
    {
      name: 'brandPrimary',
      type: 'text',
      defaultValue: '#ffffff',
    },
    {
      name: 'brandSecondary',
      type: 'text',
      defaultValue: '#a1a1aa',
    },
    {
      name: 'backgroundColor',
      type: 'text',
      defaultValue: '#000000',
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
      options: [
        { label: 'Sharp', value: 'sharp' },
        { label: 'Rounded', value: 'rounded' },
      ],
    },
  ],
}
