import type { CollectionConfig } from 'payload'

export const AvailabilityRules: CollectionConfig = {
  slug: 'availability-rules',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'dayOfWeek', 'startTime', 'endTime', 'timezone', 'isEnabled'],
    group: 'Scheduling',
    description: 'Recurring weekly windows when consultations can be booked.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'E.g. "Weekday mornings" or "Portland hours".',
      },
    },
    {
      name: 'dayOfWeek',
      type: 'select',
      required: true,
      options: [
        { label: 'Sunday', value: '0' },
        { label: 'Monday', value: '1' },
        { label: 'Tuesday', value: '2' },
        { label: 'Wednesday', value: '3' },
        { label: 'Thursday', value: '4' },
        { label: 'Friday', value: '5' },
        { label: 'Saturday', value: '6' },
      ],
    },
    {
      name: 'startTime',
      type: 'text',
      required: true,
      defaultValue: '09:00',
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !/^([0-1]?\d|2[0-3]):([0-5]\d)$/.test(value)) {
          return 'Use 24-hour HH:MM format (e.g. 09:00).'
        }
        return true
      },
    },
    {
      name: 'endTime',
      type: 'text',
      required: true,
      defaultValue: '17:00',
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !/^([0-1]?\d|2[0-3]):([0-5]\d)$/.test(value)) {
          return 'Use 24-hour HH:MM format (e.g. 17:00).'
        }
        return true
      },
    },
    {
      name: 'timezone',
      type: 'text',
      required: true,
      defaultValue: 'America/Los_Angeles',
      admin: {
        description: 'IANA timezone (e.g. America/Los_Angeles).',
      },
    },
    {
      name: 'consultationTypes',
      type: 'relationship',
      relationTo: 'consultation-types',
      hasMany: true,
      admin: {
        description: 'Leave empty to allow all enabled consultation types.',
      },
    },
    {
      name: 'isEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enabled',
    },
  ],
}
