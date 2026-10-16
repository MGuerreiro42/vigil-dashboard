import { lazy, Suspense } from 'react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useGeoStore } from '@/store/geo-store'
import { useAppStore } from '@/store/app-store'
import { ParticleBackground } from '@/components/ui/particle-background'
import { Header } from '@/components/layout/header'
import { DailyBrief } from '@/features/brief/components/daily-brief'
import { BinanceTickerSync } from '@/features/crypto/components/binance-ticker-sync'
import { LiveTickerBar } from '@/features/crypto/components/live-ticker-bar'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { useWeather } from '@/features/weather/api/open-meteo'
import { useAirQuality } from '@/features/weather/api/air-quality'
import { useEarthquakes } from '@/features/earthquakes/api/usgs'
import { useTrendingRepos } from '@/features/github/api/github'
import { motion } from 'framer-motion'

const CryptoWidget        = lazy(() => import('@/features/crypto/components/crypto-widget').then(m => ({ default: m.CryptoWidget })))
const NaturalEventsWidget = lazy(() => import('@/features/natural-events/components/natural-events-widget').then(m => ({ default: m.NaturalEventsWidget })))
const NewsWidget          = lazy(() => import('@/features/news/components/news-widget').then(m => ({ default: m.NewsWidget })))
const GithubWidget        = lazy(() => import('@/features/github/components/github-widget').then(m => ({ default: m.GithubWidget })))
const ISSWidget           = lazy(() => import('@/features/iss/components/iss-widget').then(m => ({ default: m.ISSWidget })))

function WidgetSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl animate-pulse ${className}`}
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    />
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  useGeolocation()
  const coords = useGeoStore((state) => state.coords)
  const cryptoIds = useAppStore((state) => state.cryptoIds)

  const { data: crypto } = useCryptoMarket(cryptoIds)
  const { data: weatherData } = useWeather(coords ?? undefined)
  const { data: air } = useAirQuality(coords ?? undefined)
  const { data: quakes } = useEarthquakes(2.5)
  const { data: repos } = useTrendingRepos()

  return (
    <div className="relative min-h-screen lg:h-screen lg:overflow-hidden" style={{ background: '#080b12' }}>

      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.06) 0%, transparent 60%)' }}
      />
      <div className="fixed inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 100% 100%, rgba(168,85,247,0.05) 0%, transparent 50%)' }}
      />

      <div className="relative z-[2] lg:h-full flex flex-col">
        <div className="flex-shrink-0"><Header /></div>

        <BinanceTickerSync coinIds={cryptoIds} />
        <LiveTickerBar coins={crypto ?? []} />

        <main className="flex-1 min-h-0 px-3 sm:px-4 md:px-6 pb-6 pt-3 md:pt-4 flex flex-col gap-3 md:gap-4 lg:overflow-hidden overflow-y-auto">
          {/* Hero + Wikipedia */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <DailyBrief
              crypto={crypto}
              weather={weatherData?.current}
              forecast={weatherData?.forecast}
              airQuality={air}
              earthquakes={quakes}
              githubTrending={repos}
            />
          </motion.div>

          {/* Widget grid — row 1: 1 col mobile → 2 cols tablet → 3 cols desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:flex-shrink-0 lg:[height:38%]">
            <Suspense fallback={<WidgetSkeleton className="min-h-[280px] lg:h-full" />}>
              <div className="min-h-[280px] lg:min-h-0 lg:h-full"><CryptoWidget /></div>
            </Suspense>
            <Suspense fallback={<WidgetSkeleton className="min-h-[280px] lg:h-full" />}>
              <div className="min-h-[280px] lg:min-h-0 lg:h-full"><NaturalEventsWidget /></div>
            </Suspense>
            <Suspense fallback={<WidgetSkeleton className="min-h-[280px] md:col-span-2 lg:col-span-1 lg:h-full" />}>
              <div className="min-h-[280px] md:col-span-2 lg:col-span-1 lg:min-h-0 lg:h-full"><NewsWidget /></div>
            </Suspense>
          </div>

          {/* Widget grid — row 2: 1 col mobile → 2 cols tablet → 3+2 cols desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 lg:flex-1 lg:min-h-0">
            <div className="md:col-span-2 lg:col-span-3 min-h-[320px] lg:min-h-0 lg:h-full">
              <Suspense fallback={<WidgetSkeleton className="h-full" />}>
                <GithubWidget />
              </Suspense>
            </div>
            <div className="md:col-span-2 lg:col-span-2 min-h-[360px] lg:min-h-0 lg:h-full">
              <Suspense fallback={<WidgetSkeleton className="h-full" />}>
                <ISSWidget />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
