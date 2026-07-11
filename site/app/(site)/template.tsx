'use client'

import { motion } from 'motion/react'

/**
 * Route-level page transition. template.tsx remounts on every navigation,
 * so each page enters with a fade + rise using the quart in-out easing
 * from the design tokens.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
    >
      {children}
    </motion.div>
  )
}
