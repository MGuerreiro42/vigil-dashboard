import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'
import { BinanceTickerSync } from '@/features/crypto/components/binance-ticker-sync'
import { LiveTickerBar } from '@/features/crypto/components/live-ticker-bar'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { useAppStore } from '@/store/app-store'

const CryptoWidget = lazy(() => import('@/features/crypto/components/crypto-widget').then((module) => ({ default: module.CryptoWidget })))

export function MarketsPage() {
  const cryptoIds = useAppStore((state) => state.cryptoIds)
  const { data: coins } = useCryptoMarket(cryptoIds)

  return (
    <PageLayout subheader={
      <>
        <BinanceTickerSync coinIds={cryptoIds} />
        <LiveTickerBar coins={coins ?? []} />
      </>
    }>
      <Suspense fallback={<WidgetSkeleton />}>
        <CryptoWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
