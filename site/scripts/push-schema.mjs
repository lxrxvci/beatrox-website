import { getPayload } from 'payload'

async function main() {
  // Load production environment variables before importing the Payload config
  process.loadEnvFile('.env')
  const { default: payloadConfig } = await import('../payload.config.ts')

  console.log('Initializing Payload to push schema...')
  await getPayload({ config: payloadConfig })
  console.log('Schema push complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Schema push failed:', err)
  process.exit(1)
})
