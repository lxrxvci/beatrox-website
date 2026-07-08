import { getPayload } from 'payload'
import config from '../payload.config.ts'

async function main() {
  try {
    const payload = await getPayload({ config })
    const users = await payload.find({ collection: 'users', limit: 5 })
    console.log('DB connected. Users:', users.totalDocs)
    console.log('User emails:', users.docs.map((u: any) => u.email).join(', ') || '(none)')
    process.exit(0)
  } catch (err: any) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

main()
