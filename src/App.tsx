import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WidgetSkeleton } from '@/components/ui/WidgetSkeleton'

// Pages — each loads its own heavy chunks on demand
const Dashboard        = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const CryptoPage       = lazy(() => import('@/pages/CryptoPage').then((m) => ({ default: m.CryptoPage })))
const ISSPage          = lazy(() => import('@/pages/ISSPage').then((m) => ({ default: m.ISSPage })))
const EarthquakePage   = lazy(() => import('@/pages/EarthquakePage').then((m) => ({ default: m.EarthquakePage })))
const NaturalEventsPage = lazy(() => import('@/pages/NaturalEventsPage').then((m) => ({ default: m.NaturalEventsPage })))
const GithubPage       = lazy(() => import('@/pages/GithubPage').then((m) => ({ default: m.GithubPage })))
const WeatherPage      = lazy(() => import('@/pages/WeatherPage').then((m) => ({ default: m.WeatherPage })))
const WikipediaPage    = lazy(() => import('@/pages/WikipediaPage').then((m) => ({ default: m.WikipediaPage })))
const NewsPage         = lazy(() => import('@/pages/NewsPage').then((m) => ({ default: m.NewsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  )
}
