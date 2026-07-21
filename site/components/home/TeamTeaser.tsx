import Image from 'next/image'
import Link from 'next/link'
import { getTeamResolved } from '@/lib/content'
import ScrollPanel from './ScrollPanel'

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
          className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white"
        >
          Meet the Team →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {members.map((member) => (
          <div key={member.name} className="group">
            {member.photo?.url && (
              <div className="relative mb-4 aspect-square overflow-hidden border border-white/10 bg-neutral-950">
                <Image
                  src={member.photo.url}
                  alt={member.photo.alt || member.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover grayscale transition duration-700 group-hover:grayscale-0"
                />
              </div>
            )}
            <p className="text-sm font-semibold uppercase tracking-[0.11em] text-white">{member.name}</p>
            <p className="mt-1 text-sm text-white/60">{member.title}</p>
          </div>
        ))}
      </div>
    </ScrollPanel>
  )
}
