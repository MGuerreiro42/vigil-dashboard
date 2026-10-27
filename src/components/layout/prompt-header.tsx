import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWeather } from '@/features/weather/api/open-meteo'
import { getWMO } from '@/features/weather/lib/wmo-icons'
import { useNow } from '@/hooks/use-now'
import { LANGUAGES } from '@/i18n'
import { useGeoStore } from '@/store/geo-store'
import { AlertsMenu } from './alerts-menu'
import { SCREENS, type Screen } from './sections'

/** "São Paulo" → "sp": initials of the place name. */
function placeInitials(name: string): string {
  return name.split(/[\s,-]+/).filter(Boolean).map((word) => word[0]).join('').toLowerCase()
}

function WeatherSummary() {
  const coords = useGeoStore((state) => state.coords)
  const placeName = useGeoStore((state) => state.placeName)
  const { data } = useWeather(coords ?? undefined)
  const current = data?.current
  if (!current) return null
  // Without a picked place the forecast is for the default city or an unnamed geolocation
  const city = placeName ? placeInitials(placeName) : coords ? null : 'sp'
  return (
    <span>
      {city && `${city} `}{Math.round(current.temp)}° {getWMO(current.weatherCode).label.toLowerCase()}
      <span className="max-sm:hidden"> · {current.humidity}% · {Math.round(current.windSpeed)} km/h</span>
    </span>
  )
}

function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  return (
    <span role="group" aria-label={t('terminal.language')}>
      {LANGUAGES.map((language, index) => (
        <span key={language.code}>
          {index > 0 && '|'}
          <button
            type="button"
            aria-pressed={i18n.resolvedLanguage === language.code}
            onClick={() => i18n.changeLanguage(language.code)}
            className={i18n.resolvedLanguage === language.code ? 'text-ok' : 'text-dim'}
          >
            {language.code}
          </button>
        </span>
      ))}
    </span>
  )
}

function Clock() {
  const now = useNow(1_000)
  return <span className="text-text">{new Date(now).toTimeString().slice(0, 8)}</span>
}

export function PromptHeader({ screen }: { screen: Screen }) {
  const { t } = useTranslation()
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-[24px] gap-y-[8px] border-b border-line px-[20px] py-[10px]">
      <span><span className="text-ok">vigil@live</span>:<span className="text-info">{screen.prompt}</span>$ watch</span>
      <nav aria-label={t('terminal.navLabel')} className="flex flex-wrap gap-x-[18px] gap-y-[4px] max-sm:hidden">
        {SCREENS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `border-b no-underline ${isActive ? 'border-ok text-ok' : 'border-transparent text-dim'}`}
          >
            [{item.number}] {t(`terminal.screens.${item.id}.nav`)}
          </NavLink>
        ))}
      </nav>
      <div className="relative flex flex-wrap items-center gap-x-[16px] gap-y-[4px] text-dim">
        <WeatherSummary />
        <LanguageSwitch />
        <AlertsMenu key={screen.path} />
        <Clock />
      </div>
    </header>
  )
}
