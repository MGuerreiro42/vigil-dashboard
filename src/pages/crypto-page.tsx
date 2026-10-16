import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { BinanceTickerSync } from '@/features/crypto/components/binance-ticker-sync'
import { LiveTickerBar } from '@/features/crypto/components/live-ticker-bar'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'
import { useAppStore } from '@/store/app-store'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'

const CryptoWidget = lazy(() => import('@/features/crypto/components/crypto-widget').then((m) => ({ default: m.CryptoWidget })))

export function CryptoPage() {
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
