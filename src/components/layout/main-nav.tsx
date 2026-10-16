import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SECTIONS } from './sections'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
    isActive ? 'bg-white/[0.08] text-white/90' : 'text-fg-muted hover:text-white/80 hover:bg-white/[0.04]'
  }`

/** Section tabs in the header on desktop. */
export function MainNav() {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('nav.label')} className="hidden lg:flex items-center gap-1">
      {SECTIONS.map((section) => (
        <NavLink key={section.id} to={section.path} end={section.path === '/'} className={linkClass}>
          <span className="max-w-full truncate px-0.5">{t(section.id === 'overview' ? 'nav.home' : `nav.${section.id}`)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

/** Bottom tab bar below the lg breakpoint, where the header has no room for tabs. */
export function MobileNav() {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('nav.label')}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-6 border-t border-white/[0.08] bg-[#0b0f17]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      {SECTIONS.map((section) => (
        <NavLink
          key={section.id}
          to={section.path}
          end={section.path === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2 min-h-[52px] min-w-0 text-[10px] ${isActive ? 'text-white/90' : 'text-fg-subtle'}`
          }
        >
          <span aria-hidden className="text-base leading-none">{section.icon}</span>
          <span className="max-w-full truncate px-0.5">{t(section.id === 'overview' ? 'nav.home' : `nav.${section.id}`)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
