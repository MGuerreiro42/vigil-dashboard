import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BinanceTickerSync } from '@/features/crypto/components/binance-ticker-sync'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useAppStore } from '@/store/app-store'
import { Keybar } from './keybar'
import { PromptHeader } from './prompt-header'
import { screenForPath } from './sections'
import { TabBar } from './tab-bar'
import { TickerStrip } from './ticker-strip'
import { useTerminalKeys } from './use-terminal-keys'

/** Prompt header, ticker, the current screen, and the keybar (or the tab bar on phones). */
export function TerminalShell() {
  useGeolocation()
  const { pathname } = useLocation()
  const screen = screenForPath(pathname)
  const cryptoIds = useAppStore((state) => state.cryptoIds)
  const [refreshingScreen, setRefreshingScreen] = useState<number | null>(null)
  useTerminalKeys(screen, setRefreshingScreen)

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <BinanceTickerSync coinIds={cryptoIds} />
      <PromptHeader screen={screen} />
      <TickerStrip />
      <main className="flex flex-1 flex-col gap-[28px] px-[20px] pt-[24px] pb-[28px] max-sm:px-[12px] max-sm:pt-[20px] max-sm:pb-[24px]">
        <Suspense fallback={null}><Outlet /></Suspense>
      </main>
      <Keybar screen={screen} refreshingScreen={refreshingScreen} />
      <TabBar />
    </div>
  )
}
