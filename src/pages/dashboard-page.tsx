import { lazy, Suspense } from 'react'
import { useGeoStore } from '@/store/geo-store'
import { useAppStore } from '@/store/app-store'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'
import { DailyBrief } from '@/features/brief/components/daily-brief'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { useWeather } from '@/features/weather/api/open-meteo'
import { useAirQuality } from '@/features/weather/api/air-quality'
import { useEarthquakes } from '@/features/earthquakes/api/usgs'
import { useTrendingRepos } from '@/features/github/api/github'

const CryptoWidget        = lazy(() => import('@/features/crypto/components/crypto-widget').then((module) => ({ default: module.CryptoWidget })))
const NaturalEventsWidget = lazy(() => import('@/features/natural-events/components/natural-events-widget').then((module) => ({ default: module.NaturalEventsWidget })))
const NewsWidget          = lazy(() => import('@/features/news/components/news-widget').then((module) => ({ default: module.NewsWidget })))
const IssPanel            = lazy(() => import('@/features/iss/components/iss-panel').then((module) => ({ default: module.IssPanel })))
const GithubWidget        = lazy(() => import('@/features/github/components/github-widget').then((module) => ({ default: module.GithubWidget })))

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const coords = useGeoStore((state) => state.coords)
  const cryptoIds = useAppStore((state) => state.cryptoIds)

  const { data: crypto } = useCryptoMarket(cryptoIds)
  const { data: weatherData } = useWeather(coords ?? undefined)
  const { data: air } = useAirQuality(coords ?? undefined)
  const { data: quakes } = useEarthquakes(2.5)
  const { data: repos } = useTrendingRepos()

  return (
    <>
      <DailyBrief
        crypto={crypto}
        weather={weatherData?.current}
        forecast={weatherData?.forecast}
        airQuality={air}
        earthquakes={quakes}
        githubTrending={repos}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Suspense fallback={<WidgetSkeleton className="h-[420px]" />}>
          <div className="h-[420px]"><CryptoWidget /></div>
        </Suspense>
        <Suspense fallback={<WidgetSkeleton className="h-[420px]" />}>
          <div className="h-[420px]"><NaturalEventsWidget /></div>
        </Suspense>
        <Suspense fallback={<WidgetSkeleton className="h-[420px] md:col-span-2 lg:col-span-1" />}>
          <div className="h-[420px] md:col-span-2 lg:col-span-1"><NewsWidget /></div>
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-[480px]">
          <Suspense fallback={<WidgetSkeleton className="h-full" />}><GithubWidget /></Suspense>
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<WidgetSkeleton className="h-full" />}><IssPanel /></Suspense>
        </div>
      </div>
    </>
  )
}
