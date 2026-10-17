import { autoFitGrid } from '@/components/terminal/grid'
import { SeismicPanel } from '@/features/earthquakes/components/seismic-panel'
import { NaturalEventsPanel } from '@/features/natural-events/components/events-panel'
import { RadarPanel } from '@/features/weather/components/radar-panel'
import { WeatherPanel } from '@/features/weather/components/weather-panel'

export function PlanetPage() {
  return (
    <>
      <NaturalEventsPanel />
      <SeismicPanel />
      <div style={autoFitGrid(460)}>
        <WeatherPanel />
        <RadarPanel />
      </div>
    </>
  )
}
