import { useTranslation } from 'react-i18next'
import { useGeoStore } from '@/store/geo-store'

/** City shown in the panel and the radar: the picked place, the device location, or the default city. */
export function useCityName() {
  const { t } = useTranslation()
  const placeName = useGeoStore((state) => state.placeName)
  const coords = useGeoStore((state) => state.coords)
  return placeName ?? (coords ? t('terminal.planet.weather.myLocation') : t('terminal.planet.weather.defaultCity'))
}
