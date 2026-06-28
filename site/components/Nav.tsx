import { FALLBACK_NAVIGATION } from '@/lib/fallbacks'
import NavClient from '@/components/NavClient'

export default function Nav() {
  return <NavClient links={FALLBACK_NAVIGATION} />
}
