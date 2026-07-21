import type { CollectionConfig } from 'payload'

export const Consultations: CollectionConfig = {
  slug: 'consultations',
  admin: {
    useAsTitle: 'clientName',
    defaultColumns: ['clientName', 'clientEmail', 'type', 'startTime', 'status'],
    description: 'Booked consultations and discovery calls.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    // Public bookings are written by the trusted server action
    // (app/(site)/book/actions.ts) via the local API with overrideAccess.
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'consultation-types',
      required: true,
    },
    {
      name: 'startTime',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'endTime',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'timezone',
      type: 'text',
      required: true,
      defaultValue: 'America/Los_Angeles',
    },
    {
      name: 'clientName',
      type: 'text',
      required: true,
    },
    {
      name: 'clientEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'clientCompany',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'projectSummary',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Completed', value: 'completed' },
      ],
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: 'source',
      type: 'text',
      defaultValue: 'website',
    },
    {
      name: 'googleCalendarEventId',
      type: 'text',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        readOnly: true,
        description: 'Auto-populated when synced to Google Calendar.',
      },
    },
    {
      name: 'googleMeetLink',
      type: 'text',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        readOnly: true,
        description: 'Auto-populated when a Google Meet conference is created.',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        description: 'Private admin notes.',
      },
    },
  ],
}
