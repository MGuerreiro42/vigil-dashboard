import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

// Pages — each loads its own heavy chunks on demand
const Dashboard   = lazy(() => import('@/pages/dashboard-page').then((module) => ({ default: module.Dashboard })))
const MarketsPage = lazy(() => import('@/pages/markets-page').then((module) => ({ default: module.MarketsPage })))
const PlanetPage  = lazy(() => import('@/pages/planet-page').then((module) => ({ default: module.PlanetPage })))
const SpacePage   = lazy(() => import('@/pages/space-page').then((module) => ({ default: module.SpacePage })))
const NewsPage    = lazy(() => import('@/pages/news-page').then((module) => ({ default: module.NewsPage })))
const TechPage    = lazy(() => import('@/pages/tech-page').then((module) => ({ default: module.TechPage })))

// Routes from the one-widget-per-page layout, kept so old links still land in the right place
const LEGACY_REDIRECTS: Record<string, string> = {
  '/crypto': '/markets',
  '/iss': '/space',
  '/natural-events': '/planet#natural-events',
  '/earthquakes': '/planet#earthquakes',
  '/weather': '/planet#weather',
  '/wikipedia': '/news#discover',
  '/github': '/tech',
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Suspense fallback={<WidgetSkeleton />}>
            <Routes>
              <Route path="/"        element={<Dashboard />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/planet"  element={<PlanetPage />} />
              <Route path="/space"   element={<SpacePage />} />
              <Route path="/news"    element={<NewsPage />} />
              <Route path="/tech"    element={<TechPage />} />
              {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
                <Route key={from} path={from} element={<Navigate to={to} replace />} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  )
}
