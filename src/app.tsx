import { lazy } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { persistOptions, queryClient } from '@/lib/query-client'
import { TerminalShell } from '@/components/layout/terminal-shell'

// Pages — each loads its own heavy chunks on demand
const Dashboard   = lazy(() => import('@/pages/dashboard-page').then((module) => ({ default: module.Dashboard })))
const MarketsPage = lazy(() => import('@/pages/markets-page').then((module) => ({ default: module.MarketsPage })))
const PlanetPage  = lazy(() => import('@/pages/planet-page').then((module) => ({ default: module.PlanetPage })))
const SpacePage   = lazy(() => import('@/pages/space-page').then((module) => ({ default: module.SpacePage })))
const NewsPage    = lazy(() => import('@/pages/news-page').then((module) => ({ default: module.NewsPage })))
const TechPage    = lazy(() => import('@/pages/tech-page').then((module) => ({ default: module.TechPage })))
// Dev-only sheet of every terminal primitive and panel state; the dead branch keeps it out of builds
const PrimitivesPage = import.meta.env.DEV
  ? lazy(() => import('@/pages/primitives-page').then((module) => ({ default: module.PrimitivesPage })))
  : null

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
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Routes>
            <Route element={<TerminalShell />}>
              <Route path="/"        element={<Dashboard />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/planet"  element={<PlanetPage />} />
              <Route path="/space"   element={<SpacePage />} />
              <Route path="/news"    element={<NewsPage />} />
              <Route path="/tech"    element={<TechPage />} />
              {PrimitivesPage && <Route path="/__primitives" element={<PrimitivesPage />} />}
            </Route>
            {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MotionConfig>
    </PersistQueryClientProvider>
  )
}
