import type { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'email', 'source', 'lastActivityAt'],
    group: 'CRM',
    description: 'Unified client/contact records. Auto-linked from contact submissions and consultation bookings.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Contact Form', value: 'contact-form' },
        { label: 'Booking', value: 'booking' },
        { label: 'Manual', value: 'manual' },
        { label: 'Referral', value: 'referral' },
        { label: 'Ads', value: 'ads' },
      ],
    },
    {
      name: 'tags',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Premium Production', value: 'premium-production' },
        { label: 'Agency Partner', value: 'agency-partner' },
        { label: 'Rental', value: 'rental' },
        { label: 'Repeat Client', value: 'repeat-client' },
        { label: 'VIP', value: 'vip' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'acquisitionSource',
      type: 'text',
      admin: {
        description: 'First-touch attribution (e.g. google, newsletter, google-ads via gclid). Auto-set from intake UTM params.',
      },
    },
    {
      name: 'acquisitionCampaign',
      type: 'text',
      admin: {
        description: 'First-touch UTM campaign. Auto-set from intake UTM params.',
      },
    },
    {
      name: 'lastActivityAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Auto-stamped by CRM activity (submissions, bookings, deals).',
      },
    },
    {
      name: 'submissions',
      type: 'join',
      collection: 'contact-submissions',
      on: 'client',
      admin: {
        description: 'Contact form submissions linked to this client.',
      },
    },
    {
      name: 'consultations',
      type: 'join',
      collection: 'consultations',
      on: 'client',
    },
    {
      name: 'deals',
      type: 'join',
      collection: 'deals',
      on: 'client',
    },
    {
      name: 'activities',
      type: 'join',
      collection: 'activities',
      on: 'client',
    },
  ],
}
