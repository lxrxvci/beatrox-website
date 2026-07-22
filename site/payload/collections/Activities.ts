import type { CollectionConfig } from 'payload'

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['type', 'subject', 'client', 'dueDate', 'completed'],
    group: 'CRM',
    description: 'Notes, tasks, and call/email log for clients and deals.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data
        if (data.completed && !data.completedAt) {
          return { ...data, completedAt: new Date().toISOString() }
        }
        if (!data.completed && data.completedAt) {
          return { ...data, completedAt: null }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'note',
      options: [
        { label: 'Note', value: 'note' },
        { label: 'Call', value: 'call' },
        { label: 'Email', value: 'email' },
        { label: 'Meeting', value: 'meeting' },
        { label: 'Task', value: 'task' },
      ],
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
    },
    {
      name: 'deal',
      type: 'relationship',
      relationTo: 'deals',
    },
    {
      name: 'consultation',
      type: 'relationship',
      relationTo: 'consultations',
    },
    {
      name: 'dueDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'completed',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
}
