import { GRID_12 } from '@/components/terminal/grid'
import { IssPanel } from '@/features/iss/components/iss-panel'
import { AsteroidsPanel, LaunchesPanel, SpaceNewsPanel, SpaceWeatherPanel } from '@/features/space/components/space-panels'

export function SpacePage() {
  return (
    <>
      <IssPanel />
      <div className={GRID_12}>
        <LaunchesPanel />
        <SpaceWeatherPanel />
        <AsteroidsPanel />
        <SpaceNewsPanel />
      </div>
    </>
  )
}
