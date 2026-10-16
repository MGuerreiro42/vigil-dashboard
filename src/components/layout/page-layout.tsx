import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppBackground } from './app-background'
import { Header } from './header'

interface Props {
  children: React.ReactNode
  /** Optional bar between header and content (e.g. the live ticker) */
  subheader?: React.ReactNode
  /** Several full-height sections that scroll, instead of one widget filling the viewport */
  stacked?: boolean
}

/** Scrolls to the section named in the URL hash (/planet#weather), as links from other pages expect. */
function useScrollToHash() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [hash])
}

export function PageLayout({ children, subheader, stacked = false }: Props) {
  useScrollToHash()

  return (
    <div
      className={`relative min-h-screen ${stacked ? '' : 'lg:h-screen lg:overflow-hidden'}`}
      style={{ background: '#080b12' }}
    >
      <AppBackground />

      <div className={`relative z-[2] flex flex-col ${stacked ? '' : 'lg:h-full'}`}>
        <div className="flex-shrink-0">
          <Header />
        </div>

        {subheader}

        {/* pb-20 leaves room for the mobile bottom nav */}
        <main
          className={`flex-1 min-h-0 p-3 md:p-6 pb-20 lg:pb-6 flex flex-col ${stacked ? 'gap-4 md:gap-6' : 'overflow-y-auto lg:overflow-hidden'}`}
        >
          <motion.div
            className={stacked ? 'flex flex-col gap-4 md:gap-6' : 'flex-1 min-h-0'}
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

/** A full-height, linkable section of a stacked page; taller on phones, where widget columns stack. */
export function PageSection({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 h-[110vh] min-h-[680px] md:h-[85vh] md:min-h-[560px]">
      {children}
    </section>
  )
}
