'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  DEFAULT_CAPABILITIES,
  type Capability,
  type CapabilityItem,
  type CapabilityTextPosition,
} from '@/lib/capabilities'

export type { Capability, CapabilityItem, CapabilityTextPosition }
export { DEFAULT_CAPABILITIES }

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const CAPABILITY_BY_LABEL = new Map(DEFAULT_CAPABILITIES.map((c) => [normalizeLabel(c.label), c]))

interface CapabilitiesGridProps {
  /** CMS block items. Explicit image/link/textPosition win; otherwise the label maps to the curated default tile. */
  items?: CapabilityItem[]
}

const POSITION_CLASSES: Record<Exclude<CapabilityTextPosition, 'below' | 'hidden'>, string> = {
  center: 'items-center justify-center text-center',
  top: 'items-start justify-center text-center pt-6',
  bottom: 'items-end justify-center text-center pb-6',
}

function Tile({ cap, index }: { cap: Capability; index: number }) {
  const position = cap.textPosition || 'center'
  const label = (
    <span className="font-[family-name:var(--font-heading)] text-[clamp(1.05rem,1.6vw,1.5rem)] font-semibold uppercase tracking-[0.08em] leading-snug">
      <span className="hud-index mr-2" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      {cap.label}
    </span>
  )

  const image = (
    <Image
      src={cap.image}
      alt={cap.label}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover transition-all duration-500 group-hover:brightness-110"
    />
  )

  if (position === 'below') {
    return (
      <Link href={cap.href} className="group block" aria-label={cap.label}>
        <span className="card-glow scanlines relative block aspect-video overflow-hidden bg-neutral-900 border border-white/10">
          <span className="hud-corners" aria-hidden="true" />
          {image}
        </span>
        <span className="block pt-3 text-white/85 group-hover:text-white transition-colors">{label}</span>
      </Link>
    )
  }

  return (
    <Link
      href={cap.href}
      className="card-glow scanlines group relative block aspect-video overflow-hidden bg-neutral-900 border border-white/10"
      aria-label={cap.label}
    >
      <span className="hud-corners" aria-hidden="true" />
      {image}
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/50"
        aria-hidden="true"
      />
      {position !== 'hidden' && (
        <span
          className={`pointer-events-none absolute inset-0 flex bg-black/0 text-white transition-colors duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-black/50 ${POSITION_CLASSES[position]}`}
          aria-hidden="true"
        >
          {label}
        </span>
      )}
    </Link>
  )
}

export default function CapabilitiesGrid({ items }: CapabilitiesGridProps) {
  // CMS-driven label lists use a different vocabulary than the curated grid
  // labels (e.g. "3D Animation & Motion Capture"); matching is normalized
  // (& ↔ and, case, punctuation). Explicit per-item fields always win.
  const mapped = items
    ? items
        .map((item) => {
          const base = CAPABILITY_BY_LABEL.get(normalizeLabel(item.label))
          if (!base && !item.image) return null
          return {
            label: item.label,
            href: item.link || base?.href || '/services',
            image: item.image || base?.image || '',
            textPosition: item.textPosition || base?.textPosition,
          } as Capability
        })
        .filter((cap): cap is Capability => Boolean(cap && cap.image))
    : null

  const capabilities = mapped && mapped.length > 0 ? mapped : DEFAULT_CAPABILITIES

  if (capabilities.length === 0) return null

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-[1.3vw]"
      style={{ width: 'auto' }}
    >
      {capabilities.map((cap, i) => (
        <Tile key={cap.label} cap={cap} index={i} />
      ))}
    </div>
  )
}
