import { getPayload } from 'payload'
import config from '../payload.config.ts'

const DEFAULT_TIMEZONE = 'America/Los_Angeles'

async function main() {
  const payload = await getPayload({ config })

  // Seed consultation types
  const existingTypes = await payload.find({
    collection: 'consultation-types',
    where: { slug: { in: ['discovery-call', 'site-visit-quote-review'] } },
    limit: 10,
  })

  const existingSlugs = new Set(existingTypes.docs.map((doc) => doc.slug))

  if (!existingSlugs.has('discovery-call')) {
    await payload.create({
      collection: 'consultation-types',
      data: {
        name: 'Discovery Call',
        slug: 'discovery-call',
        duration: 30,
        description: 'A quick call to learn about your project and how BEATROX can help.',
        color: '#3B82F6',
        isEnabled: true,
        listOrder: 10,
      },
    })
    console.log('Created consultation type: Discovery Call')
  } else {
    console.log('Consultation type already exists: Discovery Call')
  }

  if (!existingSlugs.has('site-visit-quote-review')) {
    await payload.create({
      collection: 'consultation-types',
      data: {
        name: 'Site Visit & Quote Review',
        slug: 'site-visit-quote-review',
        duration: 60,
        description: 'An on-site or virtual walkthrough to scope your event and review a custom quote.',
        color: '#10B981',
        isEnabled: true,
        listOrder: 20,
      },
    })
    console.log('Created consultation type: Site Visit & Quote Review')
  } else {
    console.log('Consultation type already exists: Site Visit & Quote Review')
  }

  // Seed availability rules (Mon-Fri 9am-5pm PT)
  const existingRules = await payload.find({
    collection: 'availability-rules',
    where: { label: { equals: 'Default weekday availability' } },
    limit: 10,
  })

  if (existingRules.docs.length === 0) {
    const days = ['1', '2', '3', '4', '5'] // Monday to Friday
    for (const dayOfWeek of days) {
      await payload.create({
        collection: 'availability-rules',
        data: {
          label: 'Default weekday availability',
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
          timezone: DEFAULT_TIMEZONE,
          isEnabled: true,
        },
      })
    }
    console.log('Created availability rules: Monday–Friday 9am–5pm PT')
  } else {
    console.log('Availability rules already exist')
  }

  console.log('Scheduling seed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Scheduling seed failed:', err)
  process.exit(1)
})
