import { Suspense, lazy } from 'react'
import { PageLayout, PageSection } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const CryptoWidget = lazy(() => import('@/features/crypto/components/crypto-widget').then((module) => ({ default: module.CryptoWidget })))
const CurrencyWidget = lazy(() => import('@/features/economy/components/currency-widget').then((module) => ({ default: module.CurrencyWidget })))
const BrazilMacroWidget = lazy(() => import('@/features/economy/components/brazil-macro-widget').then((module) => ({ default: module.BrazilMacroWidget })))
const CryptoPulseWidget = lazy(() => import('@/features/economy/components/crypto-pulse-widget').then((module) => ({ default: module.CryptoPulseWidget })))

export function MarketsPage() {
  return (
    <PageLayout>
      <PageSection id="crypto">
        <Suspense fallback={<WidgetSkeleton />}><CryptoWidget isFocused /></Suspense>
      </PageSection>
      <section id="economy" className="scroll-mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:h-[60vh] lg:min-h-[480px]">
        <div className="h-[60vh] min-h-[440px] lg:h-full"><Suspense fallback={<WidgetSkeleton />}><CurrencyWidget /></Suspense></div>
        <div id="brazil" className="scroll-mt-4 h-[60vh] min-h-[440px] lg:h-full"><Suspense fallback={<WidgetSkeleton />}><BrazilMacroWidget /></Suspense></div>
        <div id="crypto-pulse" className="scroll-mt-4 h-[60vh] min-h-[440px] lg:h-full"><Suspense fallback={<WidgetSkeleton />}><CryptoPulseWidget /></Suspense></div>
      </section>
    </PageLayout>
  )
}
