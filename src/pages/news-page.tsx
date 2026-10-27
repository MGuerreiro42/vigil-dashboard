import { autoFitGrid } from '@/components/terminal/grid'
import { WorldPanel } from '@/features/news/components/world-panel'
import { BlueskyTrendsPanel, LiveEditsPanel } from '@/features/pulse/components/pulse-panels'
import { DiscoverPanel } from '@/features/wikipedia/components/discover-panel'

export function NewsPage() {
  return (
    <>
      <WorldPanel />
      <div style={autoFitGrid(440)}>
        <LiveEditsPanel />
        <BlueskyTrendsPanel />
      </div>
      <DiscoverPanel />
    </>
  )
}
