import { useEffect } from 'react'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { useEarthquakes } from '@/features/earthquakes/api/usgs'
import { useKpIndex } from '@/features/space/api/space-weather'
import { useAirQuality } from '@/features/weather/api/air-quality'
import { useCityName } from '@/features/weather/lib/use-city-name'
import { useAlertsStore } from '@/store/alerts-store'
import { useAppStore } from '@/store/app-store'
import { useGeoStore } from '@/store/geo-store'
import { thresholdAlerts } from '../lib/alert-rules'

/** Feeds the header's alerts from any screen: the four threshold sources are watched app-wide. */
export function AlertProducers() {
  const coords = useGeoStore((state) => state.coords)
  const cryptoIds = useAppStore((state) => state.cryptoIds)
  const city = useCityName()
  const { data: quakes } = useEarthquakes(2.5)
  const { data: air } = useAirQuality(coords ?? undefined)
  const { data: kp } = useKpIndex()
  const { data: coins } = useCryptoMarket(cryptoIds)
  const addAlert = useAlertsStore((state) => state.addAlert)

  useEffect(() => {
    for (const alert of thresholdAlerts({ now: Date.now(), quakes, air: air ?? undefined, city, kp, coins })) addAlert(alert)
  }, [quakes, air, city, kp, coins, addAlert])

  return null
}
