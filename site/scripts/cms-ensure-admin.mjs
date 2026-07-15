import { getPayload } from 'payload'
import config from '../payload.config.ts'

/**
 * Ensures a dedicated admin user exists for CMS seed/import scripts.
 * Uses the Payload local API, so it talks directly to the database
 * (DATABASE_URI / DATABASE_URL) without needing an existing admin login.
 *
 * Usage:
 *   DATABASE_URI="postgresql://..." SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... node scripts/cms-ensure-admin.mjs
 */

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

if (!email || !password) {
  console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.')
  process.exit(1)
}

async function main() {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    console.log(`Admin user already exists: ${email} (id ${existing.docs[0].id})`)
  } else {
    const user = await payload.create({
      collection: 'users',
      data: { email, password, name: 'CMS Seed Bot' },
    })
    console.log(`Created admin user: ${email} (id ${user.id})`)
  }

  const total = await payload.count({ collection: 'users' })
  console.log(`Total users in DB: ${total.totalDocs}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
