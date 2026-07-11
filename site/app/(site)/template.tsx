'use client'

import { MotionConfig, motion } from 'motion/react'

/**
 * Route-level page transition. template.tsx remounts on every navigation,
 * so each page enters with a fade + rise using the quart in-out easing
 * from the design tokens. MotionConfig disables transform animations
 * for prefers-reduced-motion users (resolved client-side, so server and
 * client markup stay identical — no hydration mismatch).
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}
