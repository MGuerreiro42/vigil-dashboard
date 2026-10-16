import { useNavigate } from 'react-router-dom'
import { useAlertsStore } from '@/store/alerts-store'
import { useGeoStore } from '@/store/geo-store'
import { useWeather } from '@/features/weather/api/open-meteo'
import { getWMO } from '@/features/weather/lib/wmo-icons'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './language-switcher'

// ─── Weather pill ──────────────────────────────────────────────────────────────
function WeatherPill() {
  const coords = useGeoStore((state) => state.coords)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: weather } = useWeather(coords ?? undefined)
  const current = weather?.current

  // Reserve fixed space while loading to prevent CLS
  if (!current) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          minWidth: 180,
          height: 34,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-white/8 animate-pulse" />
        <div className="w-10 h-3 rounded bg-white/8 animate-pulse" />
        <div className="w-px h-3 bg-white/10" />
        <div className="w-16 h-3 rounded bg-white/6 animate-pulse" />
      </div>
    )
  }

  const wmo = getWMO(current.weatherCode)

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      onClick={() => navigate('/weather')}
      title={t('header.weatherPill.title')}
      className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 rounded-xl transition-all hover:bg-white/[0.07] active:scale-95"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span className="text-base leading-none">{wmo.icon}</span>
      <span className="text-sm font-semibold text-white/80 tabular-nums">
        {Math.round(current.temp)}°C
      </span>
      {/* Extra details only on md+ */}
      <div className="hidden md:flex items-center gap-2">
        <div className="h-3 w-px bg-white/10 flex-shrink-0" />
        <span className="text-[11px] text-fg-muted whitespace-nowrap">
          {t('header.weatherPill.feelsLike', { temperature: Math.round(current.feelsLike) })}
        </span>
        <div className="h-3 w-px bg-white/10 flex-shrink-0" />
        <span className="text-[11px] text-fg-muted whitespace-nowrap">💧 {current.humidity}%</span>
        <div className="h-3 w-px bg-white/10 flex-shrink-0" />
        <span className="text-[11px] text-fg-muted whitespace-nowrap">💨 {Math.round(current.windSpeed)} km/h</span>
      </div>
    </motion.button>
  )
}

export function Header() {
  const unreadCount = useAlertsStore((state) => state.unreadCount)
  const alerts = useAlertsStore((state) => state.alerts)
  const markAllRead = useAlertsStore((state) => state.markAllRead)
  const status = useGeoStore((state) => state.status)
  const coords = useGeoStore((state) => state.coords)
  const [showAlerts, setShowAlerts] = useState(false)
  const { t } = useTranslation()

  return (
    <header className="flex items-center justify-between py-3 md:py-4 px-3 md:px-6 relative z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative">
          <div
            className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #22d3ee22, #a855f722)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-sm">⚡</span>
          </div>
          <div
            className="absolute -inset-1 rounded-xl opacity-30 blur-md -z-10"
            style={{ background: 'linear-gradient(135deg, #22d3ee, #a855f7)' }}
          />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-widest text-white/85 uppercase">Vigil</div>
          <div className="hidden sm:block text-[11px] text-fg-subtle -mt-0.5">{t('header.tagline')}</div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Geo status — hidden on mobile, and until a page asks for the location */}
        {status !== 'idle' && <div className="hidden sm:flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: status === 'granted' ? '#10b981' : status === 'denied' ? '#f43f5e' : '#f59e0b',
              boxShadow: status === 'granted' ? '0 0 6px #10b981' : 'none',
            }}
          />
          <span className="text-[11px] text-fg-subtle">
            {status === 'granted' && coords
              ? `${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`
              : t(status === 'loading' ? 'header.location.detecting' : 'header.location.denied')}
          </span>
        </div>}

        <LanguageSwitcher />

        {/* Weather pill */}
        <WeatherPill />

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts((isOpen) => !isOpen)}
            aria-label={unreadCount > 0 ? t('header.alerts.openWithCount', { count: unreadCount }) : t('header.alerts.open')}
            aria-expanded={showAlerts}
            className="relative p-2 rounded-lg text-fg-muted hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-[13px] font-bold flex items-center justify-center"
                style={{ background: '#f43f5e', color: 'white' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          {/* Alerts dropdown */}
          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-50"
                style={{
                  background: 'rgba(19, 24, 34, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                }}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/6">
                  <span className="text-xs font-medium text-white/60">{t('header.alerts.title')}</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[12px] text-fg-subtle hover:text-white/60 transition-colors">
                      {t('header.alerts.markAllRead')}
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-3 py-4 text-[13px] text-fg-subtle text-center">{t('header.alerts.empty')}</div>
                  ) : (
                    alerts.slice(0, 10).map((alert) => (
                      <div
                        key={alert.id}
                        className="px-3 py-2 border-b border-white/4 flex items-start gap-2"
                        style={{ opacity: alert.read ? 0.5 : 1 }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                          style={{
                            background: alert.severity === 'critical' ? '#f43f5e' : alert.severity === 'warning' ? '#f59e0b' : '#22d3ee',
                          }}
                        />
                        <div>
                          <div className="text-[13px] font-medium text-white/75">{alert.title}</div>
                          <div className="text-[12px] text-fg-muted">{alert.body}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
