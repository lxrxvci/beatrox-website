'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { markIntroSeen, shouldRunIntro } from './intro-storage'

// Zero SSR: the overlay never renders on the server, so crawlers/bots never
// see it and it adds nothing to the initial HTML.
const IntroOverlay = dynamic(() => import('./IntroOverlay'), { ssr: false })

export interface IntroGateProps {
  heroImage: string
  headline: string
  /** Effective (fallback-applied) hero copy, the beat-3 match-frame renders
      invisible placeholders with these so its headline lands exactly where
      the real HomeHero's does. */
  subheadline: string
  ctaLabel: string
  secondaryCtaLabel: string
  galleryImages: string[]
}

/**
 * Thin client gate for the first-visit intro. Decides once, on mount,
 * whether the intro runs this session (see intro-storage.ts) and marks the
 * session as seen up-front so a mid-intro refresh never replays it.
 */
export default function IntroGate(props: IntroGateProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (shouldRunIntro()) {
      markIntroSeen()
      setShow(true)
    }
  }, [])

  if (!show) return null
  return <IntroOverlay {...props} />
}
