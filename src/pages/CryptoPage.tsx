import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { BinanceTickerSync } from '@/components/layout/BinanceTickerSync'
import { LiveTickerBar } from '@/components/ui/LiveTickerBar'
import { WidgetSkeleton } from '@/components/ui/WidgetSkeleton'
import { useAppStore } from '@/store/app.store'
import { useCryptoMarket } from '@/api/coingecko'

const CryptoWidget = lazy(() => import('@/widgets/crypto/CryptoWidget').then((m) => ({ default: m.CryptoWidget })))

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
