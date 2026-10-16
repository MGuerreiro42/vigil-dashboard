import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WidgetShell } from '@/components/layout/widget-shell'
import { useISSPosition, useISSCoordinates, useISSFuturePath, useISSTLE } from '@/features/iss/api/iss'
import { CompactOverlay } from './compact-overlay'
import { ISSGlobe } from './iss-globe'
import { LivePulse } from './live-pulse'
import { NowPanel } from './now-panel'
import { StatsBar } from './stats-bar'
import { TLEPanel } from './tle-panel'
import { TrajectoryPanel } from './trajectory-panel'
import { ACCENT } from '@/features/iss/lib/iss-display'

const TRAIL_MAX = 45
export type FocusTab = 'now' | 'trajectory' | 'tle'

export function ISSWidget({ isFocused = false }: { isFocused?: boolean }) {

  const { data: position, isLoading, error, refetch, dataUpdatedAt } = useISSPosition()
  const { data: coords, isLoading: coordsLoading } = useISSCoordinates(position)
  const { data: futurePath = [] } = useISSFuturePath(position?.timestamp)
  const { data: tle } = useISSTLE()

  // Accumulated ISS trail
  const trailRef = useRef<Array<{ lat: number; lng: number }>>([])
  const lastTsRef = useRef<number>(0)
  const [trail, setTrail] = useState<Array<{ lat: number; lng: number }>>([])
  const [updateCount, setUpdateCount] = useState(0)
  const [followISS, setFollowISS] = useState(true)
  const [activeTab, setActiveTab] = useState<FocusTab>('now')

  useEffect(() => {
    if (!position || position.timestamp === lastTsRef.current) return
    lastTsRef.current = position.timestamp
    trailRef.current = [...trailRef.current.slice(-(TRAIL_MAX - 1)), { lat: position.lat, lng: position.lng }]
    setTrail([...trailRef.current])
    setUpdateCount((count) => count + 1)
  }, [position])

  useEffect(() => () => { trailRef.current = []; setTrail([]) }, [])

  const handleToggleFollow = useCallback(() => setFollowISS((following) => !following), [])

  const sidePanel = useMemo(() => {
    if (activeTab === 'tle') return <TLEPanel tle={tle} />
    if (activeTab === 'trajectory') return <TrajectoryPanel futurePath={futurePath} position={position ?? null} />
    return (
      <NowPanel
        position={position ?? null}
        countryCode={coords?.countryCode}
        timezoneId={coords?.timezoneId}
        offset={coords?.offset}
        coordsLoading={coordsLoading}
        updateCount={updateCount}
      />
    )
  }, [activeTab, tle, futurePath, position, coords, coordsLoading, updateCount])

  return (
    <WidgetShell
      title="ISS · Estação Espacial"
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>🛸</span>}
      isLoading={isLoading && !position}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight
      isLive
      viewRoute="/iss"
    >
      {/* Stats bar + tabs — focused only */}
      {isFocused && (
        <StatsBar
          position={position ?? null}
          followISS={followISS}
          onToggleFollow={handleToggleFollow}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Globe + side panel */}
      <div className="flex-1 min-h-0 flex gap-3">
        <div className="flex-1 min-w-0 relative">
          <ISSGlobe
            position={position ?? null}
            trail={trail}
            futurePath={isFocused ? futurePath : []}
            followISS={followISS}
            compact={!isFocused}
          />
          <LivePulse />
          {!isFocused && (
            <CompactOverlay
              position={position ?? null}
              countryCode={coords?.countryCode}
              timezoneId={coords?.timezoneId}
              coordsLoading={coordsLoading && !coords}
            />
          )}
        </div>

        {/* Side panel — focused only, animated on tab change */}
        {isFocused && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex' }}
            >
              {sidePanel}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </WidgetShell>
  )
}
