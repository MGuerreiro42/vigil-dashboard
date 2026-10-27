import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWeather } from '@/features/weather/api/open-meteo'
import { conditionLabel, shortConditionLabel } from '@/features/weather/lib/conditions'
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
  const lead = `${city ? `${city} ` : ''}${Math.round(current.temp)}° `
  const extras = ` · ${current.humidity}% · ${Math.round(current.windSpeed)} km/h`
  const long = conditionLabel(current.weatherCode)
  // Drop order as the header narrows: wind and humidity, then the long description; the ellipsis comes last
  return (
    <span title={`${lead}${long}${extras}`} className="min-w-0 overflow-hidden text-ellipsis max-sm:flex-1">
      {lead}
      <span className="min-[1440px]:hidden">{shortConditionLabel(current.weatherCode)}</span>
      <span className="max-[1439px]:hidden">{long}{extras}</span>
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

/**
 * One line from 1024px, two below, never three. Phones: prompt and clock, then weather, alerts and
 * language. 600–1023px: prompt and weather, then the screens.
 */
export function PromptHeader({ screen }: { screen: Screen }) {
  const { t } = useTranslation()
  return (
    <header className="flex flex-wrap items-center gap-x-[24px] gap-y-[8px] whitespace-nowrap border-b border-line px-[20px] py-[10px] lg:flex-nowrap">
      <span className="flex shrink-0 gap-[12px] max-sm:basis-full">
        <span><span className="text-ok">vigil@live</span>:<span className="text-info">{screen.prompt}</span>$ watch</span>
        <span className="ml-auto sm:hidden"><Clock /></span>
      </span>
      <nav aria-label={t('terminal.navLabel')} className="flex shrink-0 gap-x-[12px] max-lg:order-last max-lg:basis-full max-sm:hidden lg:gap-x-[18px]">
        {SCREENS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `border-b no-underline ${isActive ? 'border-ok text-ok' : 'border-transparent text-dim'}`}
          >
            {/* The number is the 1–6 shortcut; 1024–1279px is too narrow to keep it on one line */}
            <span className="lg:max-xl:hidden">[{item.number}] </span>{t(`terminal.screens.${item.id}.tab`)}
          </NavLink>
        ))}
      </nav>
      <div className="relative flex min-w-0 flex-1 items-center justify-end gap-x-[16px] text-dim max-sm:basis-full">
        <WeatherSummary />
        <span className="shrink-0 max-sm:order-2"><LanguageSwitch /></span>
        <span className="shrink-0 max-sm:order-1"><AlertsMenu key={screen.path} /></span>
        <span className="shrink-0 max-sm:hidden"><Clock /></span>
      </div>
    </header>
  )
}
