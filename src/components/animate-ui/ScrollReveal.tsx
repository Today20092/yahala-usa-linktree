import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

// Cnippet Scroll Reveal pattern; the shared CSS also honors pause and focus.
export function ScrollReveal({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      data-scroll-reveal
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
      className="h-full [&>[data-slot=card]]:h-full"
    >
      {children}
    </motion.div>
  )
}
