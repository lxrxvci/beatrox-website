import { getPayload } from 'payload'

async function main() {
  const newPassword = process.argv[2]
  if (!newPassword || newPassword.length < 8) {
    console.error('Usage: node scripts/reset-cms-seed.mjs <new-password>')
    process.exit(1)
  }

  // Load env before importing the Payload config so secret/DB values are present.
  process.loadEnvFile('.env')
  const { default: payloadConfig } = await import('../payload.config.ts')

  const payload = await getPayload({ config: payloadConfig })

  // Find existing cms-seed user
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: 'cms-seed@beatrox.com' } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: { password: newPassword },
    })
    console.log('Updated cms-seed@beatrox.com password')
  } else {
    await payload.create({
      collection: 'users',
      data: {
        email: 'cms-seed@beatrox.com',
        password: newPassword,
        role: 'admin',
      },
    })
    console.log('Created cms-seed@beatrox.com user')
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
