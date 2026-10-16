import { motion } from 'framer-motion'
import { ACCENT } from '@/features/iss/lib/iss-display'

export function LivePulse() {
  return (
    <motion.div
      style={{
        position: 'absolute', top: 8, right: 8,
        display: 'flex', alignItems: 'center', gap: 4,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }}
      />
      <span style={{ fontSize: 9, color: ACCENT, letterSpacing: '0.05em' }}>LIVE</span>
    </motion.div>
  )
}
