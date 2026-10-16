import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

// Pages — each loads its own heavy chunks on demand
const Dashboard        = lazy(() => import('@/pages/dashboard-page').then((m) => ({ default: m.Dashboard })))
const CryptoPage       = lazy(() => import('@/pages/crypto-page').then((m) => ({ default: m.CryptoPage })))
const ISSPage          = lazy(() => import('@/pages/iss-page').then((m) => ({ default: m.ISSPage })))
const EarthquakePage   = lazy(() => import('@/pages/earthquake-page').then((m) => ({ default: m.EarthquakePage })))
const NaturalEventsPage = lazy(() => import('@/pages/natural-events-page').then((m) => ({ default: m.NaturalEventsPage })))
const GithubPage       = lazy(() => import('@/pages/github-page').then((m) => ({ default: m.GithubPage })))
const WeatherPage      = lazy(() => import('@/pages/weather-page').then((m) => ({ default: m.WeatherPage })))
const WikipediaPage    = lazy(() => import('@/pages/wikipedia-page').then((m) => ({ default: m.WikipediaPage })))
const NewsPage         = lazy(() => import('@/pages/news-page').then((m) => ({ default: m.NewsPage })))

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Suspense fallback={<WidgetSkeleton />}>
            <Routes>
              <Route path="/"               element={<Dashboard />} />
              <Route path="/crypto"         element={<CryptoPage />} />
              <Route path="/iss"            element={<ISSPage />} />
              <Route path="/earthquakes"    element={<EarthquakePage />} />
              <Route path="/natural-events" element={<NaturalEventsPage />} />
              <Route path="/github"         element={<GithubPage />} />
              <Route path="/weather"        element={<WeatherPage />} />
              <Route path="/wikipedia"      element={<WikipediaPage />} />
              <Route path="/news"           element={<NewsPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  )
}
