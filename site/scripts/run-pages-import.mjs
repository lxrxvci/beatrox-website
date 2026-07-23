#!/usr/bin/env node
/**
 * One-off: run the pages import with .env/.env.local loaded (the import
 * script itself doesn't read env files and only auto-runs when executed
 * directly). Requires a running site server (CMS_SEED_BASE_URL).
 */
import './load-env.mjs'
import { login } from './cms-import-utils.mjs'
import { importPages } from './cms-import-pages.mjs'

process.env.CMS_SEED_BASE_URL = process.env.CMS_SEED_BASE_URL || 'http://localhost:3000'

const token = await login()
const result = await importPages(token)
console.log('Pages import result:', JSON.stringify(result))
process.exit(0)
