'use client'

import type { ReactNode } from 'react'
import { trackRentalsClick } from '@/lib/analytics/track'

interface TrackedRentalsLinkProps {
  href: string
  linkLocation: 'footer' | 'home_teaser' | 'services_index' | 'service_handoff'
  className?: string
  children: ReactNode
}

/** Outbound rentals.beatrox.com anchor that reports a rentals_click event to GA4. */
export default function TrackedRentalsLink({ href, linkLocation, className, children }: TrackedRentalsLinkProps) {
  return (
    <a href={href} className={className} onClick={() => trackRentalsClick(href, linkLocation)}>
      {children}
    </a>
  )
}
