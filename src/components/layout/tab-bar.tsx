import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SCREENS } from './sections'

/** Fixed bottom navigation below 600 px, with a spacer so it never covers the last panel. */
export function TabBar() {
  const { t } = useTranslation()
  return (
    <div className="sm:hidden">
      <div className="h-[72px]" />
      <nav
        aria-label={t('terminal.navLabel')}
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-6 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] text-tab"
      >
        {SCREENS.map((screen) => (
          <NavLink
            key={screen.id}
            to={screen.path}
            end={screen.path === '/'}
            className={({ isActive }) =>
              `-mt-px flex min-h-[56px] flex-col items-center justify-center border-t-2 no-underline ${isActive ? 'border-ok text-ok' : 'border-transparent text-dim'}`
            }
          >
            <span>{screen.number}</span>
            <span>{t(`terminal.screens.${screen.id}.tab`)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
