#!/usr/bin/env node
/**
 * Type / import-map generator runner.
 *
 * The `payload generate:types` / `payload generate:importmap` CLI loads
 * payload.config.ts via require() (this package has no "type": "module"),
 * which crashes on top-level await in @payloadcms/richtext-lexical.
 * This entry is bundled to ESM by esbuild (same pattern as
 * cms-parity-check.mjs) so the config is loaded with real import() instead.
 *
 * Run (from site/): `npm run cms:types` or `npm run cms:importmap`.
 */
import './load-env.mjs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getPayload } from 'payload'
import { generateTypes } from 'payload/node'
import config from '../payload.config.ts'

const mode = process.argv[2] || 'types'

// typescript.outputFile is resolved from the config file's location — after
// esbuild bundling that is scripts/.tmp/, so pin the real output path.
process.env.PAYLOAD_TS_OUTPUT_PATH = path.join(process.cwd(), 'payload-types.ts')

// getPayload resolves the db adapter factory and fully sanitizes the config
// (generateTypes needs config.db.defaultIDType, only present after init).
const payload = await getPayload({ config })

if (mode === 'types' || mode === 'all') {
  await generateTypes(payload.config)
}

if (mode === 'importmap' || mode === 'all') {
  // importMap.baseDir is resolved from the config file's location — after
  // esbuild bundling that is scripts/.tmp/, so pin the real project root.
  payload.config.admin.importMap.baseDir = process.cwd()

  // generateImportMap is not part of payload's public exports — import the
  // dist file directly (relative to site/, the npm script's cwd).
  const importMapModule = await import(
    pathToFileURL(path.join(process.cwd(), 'node_modules/payload/dist/bin/generateImportMap/index.js')).href
  )
  await importMapModule.generateImportMap(payload.config)
}

process.exit(0)
