import Link from 'next/link'
import { getTeamResolved } from '@/lib/content'
import ScrollPanel from './ScrollPanel'
import TeamTile from './TeamTile'

export default async function TeamTeaser() {
  const data = await getTeamResolved()
  const members = [...data.members].sort((a, b) => a.order - b.order).slice(0, 4)

  return (
    <ScrollPanel id="team" variant="stagger-side" className="border-t border-white/10 bg-[var(--bg-primary)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="overline mb-4">Team</p>
          <h2 className="heading-lg">The people behind the awe</h2>
        </div>
        <Link
          href="/team"
          className="text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:text-white"
        >
          Meet the Team →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {members.map((member) => (
          <TeamTile
            key={member.name}
            name={member.name}
            title={member.title}
            photoUrl={member.photo?.url}
            photoAlt={member.photo?.alt}
          />
        ))}
      </div>
    </ScrollPanel>
  )
}
