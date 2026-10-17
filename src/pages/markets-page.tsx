import { autoFitGrid } from '@/components/terminal/grid'
import { CryptoPanel } from '@/features/crypto/components/crypto-panel'
import { CryptoPulsePanel, FxPanel, RatesPanel } from '@/features/economy/components/economy-panels'

export function MarketsPage() {
  return (
    <>
      <CryptoPanel />
      <div style={autoFitGrid(340)}>
        <FxPanel />
        <RatesPanel />
        <CryptoPulsePanel />
      </div>
    </>
  )
}
