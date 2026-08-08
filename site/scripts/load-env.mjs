// Side-effect module: populate process.env from .env / .env.local BEFORE
// payload.config.ts is imported (it captures DATABASE_URI at import time).
// Sets only vars that are not already present in the environment.
import fs from 'node:fs'

for (const envFile of ['.env', '.env.local']) {
  try {
    for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (!match) continue
      const [, key, rawValue] = match
      if (process.env[key]) continue
      process.env[key] = rawValue.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    }
  } catch {
    // env file does not exist, fine
  }
}
