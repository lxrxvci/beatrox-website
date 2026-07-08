import type { CollectionConfig } from 'payload'

export const BlackoutDates: CollectionConfig = {
  slug: 'blackout-dates',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'date', 'isAllDay', 'startTime', 'endTime', 'isEnabled'],
    description: 'Specific dates or times blocked off from booking.',
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
        description: 'E.g. "Company holiday" or "Team offsite".',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'isAllDay',
      type: 'checkbox',
      defaultValue: true,
      label: 'All day',
    },
    {
      name: 'startTime',
      type: 'text',
      admin: {
        description: 'Required if not all day. HH:MM format.',
        condition: (data) => !data?.isAllDay,
      },
      validate: (value: unknown, args: { siblingData?: Record<string, unknown> }) => {
        if (!args.siblingData?.isAllDay) {
          if (typeof value !== 'string' || !/^([0-1]?\d|2[0-3]):([0-5]\d)$/.test(value)) {
            return 'Use 24-hour HH:MM format.'
          }
        }
        return true
      },
    },
    {
      name: 'endTime',
      type: 'text',
      admin: {
        description: 'Required if not all day. HH:MM format.',
        condition: (data) => !data?.isAllDay,
      },
      validate: (value: unknown, args: { siblingData?: Record<string, unknown> }) => {
        if (!args.siblingData?.isAllDay) {
          if (typeof value !== 'string' || !/^([0-1]?\d|2[0-3]):([0-5]\d)$/.test(value)) {
            return 'Use 24-hour HH:MM format.'
          }
        }
        return true
      },
    },
    {
      name: 'reason',
      type: 'textarea',
    },
    {
      name: 'isEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enabled',
    },
  ],
}
