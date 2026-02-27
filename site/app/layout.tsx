import config from '@/payload.config'
import { RootLayout } from '@payloadcms/next/layouts'
import { payloadServerFunction } from './(payload)/serverFunction'
import { importMap } from './(payload)/admin/importMap.js'

export default async function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  return RootLayout({
    children,
    config: Promise.resolve(config),
    importMap,
    serverFunction: payloadServerFunction,
  })
}
