import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scrolls to the section named in the URL hash (/planet#weather), as links from other pages expect. */
function useScrollToHash() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [hash])
}

/** Stacks a screen's sections inside the terminal shell. */
export function PageLayout({ children }: { children: React.ReactNode }) {
  useScrollToHash()
  return <>{children}</>
}

/** A full-height, linkable section of a stacked page; taller on phones, where widget columns stack. */
export function PageSection({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 h-[110vh] min-h-[680px] md:h-[85vh] md:min-h-[560px]">
      {children}
    </section>
  )
}
