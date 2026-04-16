import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ParticleBackground } from '@/components/ui/ParticleBackground'
import { Header } from '@/components/layout/Header'

interface Props {
  children: React.ReactNode
  /** Optional extra content to show in the bar between header and widget (e.g. live ticker) */
  subheader?: React.ReactNode
}

/**
 * Full-screen page layout used by every widget page (/crypto, /iss, etc.)
 * Provides: particle bg, header, back button, and a flex-1 slot for the widget.
 */
export function PageLayout({ children, subheader }: Props) {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen lg:h-screen lg:overflow-hidden" style={{ background: '#080b12' }}>
      <ParticleBackground />

      {/* Gradient overlays */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.06) 0%, transparent 60%)' }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 100% 100%, rgba(168,85,247,0.05) 0%, transparent 50%)' }}
      />

      <div className="relative z-[2] lg:h-full flex flex-col">
        {/* Shared header */}
        <div className="flex-shrink-0">
          <Header />
        </div>

        {/* Back navigation bar */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-3 md:px-6 py-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ x: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/75 transition-colors text-sm"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11L5 7l4-4" />
            </svg>
            Dashboard
          </motion.button>
        </div>

        {/* Optional subheader (e.g. LiveTickerBar on CryptoPage) */}
        {subheader}

        {/* Widget content — fills remaining height */}
        <main className="flex-1 min-h-0 p-3 md:p-6 flex flex-col overflow-y-auto lg:overflow-hidden">
          <motion.div
            className="flex-1 min-h-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
