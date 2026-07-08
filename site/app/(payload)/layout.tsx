import { RootLayout } from '@payloadcms/next/layouts'

import config from '@/payload.config'

import { importMap } from './admin/importMap.js'
import { serverFunction } from './serverFunction'

export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={Promise.resolve(config)} importMap={importMap} serverFunction={serverFunction as any}>
      {children}
    </RootLayout>
  )
}
