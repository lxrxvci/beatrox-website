'use server'

import config from '@/payload.config'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap.js'

export async function payloadServerFunction(args: { name: string; args?: Record<string, unknown> }) {
  return handleServerFunctions({
    name: args.name,
    args: args.args ?? {},
    config: Promise.resolve(config),
    importMap,
  })
}
