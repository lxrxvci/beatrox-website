'use client'

import type { ReactNode } from 'react'
import { trackPhoneClick } from '@/lib/analytics/track'

interface TrackedPhoneLinkProps {
  href: string
  linkLocation: 'footer' | 'contact_page' | 'home_section'
  className?: string
  children: ReactNode
}

/** tel: anchor that reports a phone_click event to GA4 on tap. */
export default function TrackedPhoneLink({ href, linkLocation, className, children }: TrackedPhoneLinkProps) {
  return (
    <a href={href} className={className} onClick={() => trackPhoneClick(href, linkLocation)}>
      {children}
    </a>
  )
}
