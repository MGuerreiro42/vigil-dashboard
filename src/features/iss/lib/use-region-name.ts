import { useTranslation } from 'react-i18next'
import { useISSCoordinates } from '@/features/iss/api/iss'
import { issRegion } from '@/features/iss/lib/iss-track'
import type { ISSPosition } from '@/features/iss/types'
import { intlLocale } from '@/i18n'

const ISO_COUNTRY = /^[A-Z]{2}$/

/** Country from the coordinates lookup over land; the coarse region table over the oceans or while it loads. */
export function useRegionName(position: ISSPosition) {
  const { t } = useTranslation()
  const { data: coordinates } = useISSCoordinates(position)
  const code = coordinates?.countryCode
  if (code && ISO_COUNTRY.test(code)) {
    try {
      return new Intl.DisplayNames([intlLocale()], { type: 'region' }).of(code) ?? code
    } catch {
      return code
    }
  }
  return t(`terminal.space.iss.regions.${issRegion(position.lng, position.lat)}`)
}
