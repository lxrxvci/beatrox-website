import { assertCredentials, login } from './cms-import-utils.mjs'
import { importMedia } from './cms-import-media.mjs'
import { importProjects } from './cms-import-projects.mjs'
import { importServices } from './cms-import-services.mjs'
import { importTeam } from './cms-import-team.mjs'
import { importPages } from './cms-import-pages.mjs'

async function seed() {
  assertCredentials()
  const token = await login()
  const media = await importMedia(token)
  const projects = await importProjects(token)
  const services = await importServices(token)
  const team = await importTeam(token)
  const pages = await importPages(token)

  console.log(
    `CMS seed completed. media=${media.count}, projects=${projects.count}, services=${services.count}, team=${team.count}, pages=${pages.count}`,
  )
}

seed().catch((error) => {
  console.error('CMS seed failed:', error.message)
  process.exitCode = 1
})
