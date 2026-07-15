import { getNavigationLinks } from '@/lib/content'
import NavClient from '@/components/NavClient'

export default async function Nav() {
  const links = await getNavigationLinks()
  return <NavClient links={links} />
}
