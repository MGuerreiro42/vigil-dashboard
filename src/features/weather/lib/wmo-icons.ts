import i18n from '@/i18n'

export const WMO_ICONS: Record<number, string> = {
  0:  '☀️',
  1:  '🌤️',
  2:  '⛅',
  3:  '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '❄️',
  73: '❄️',
  75: '❄️',
  77: '🌨️',
  80: '🌦️',
  81: '🌧️',
  82: '⛈️',
  85: '🌨️',
  86: '🌨️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
}

/** Icon and translated description for a WMO weather code (label read at call time). */
export function getWMO(code: number): { icon: string; label: string } {
  const icon = WMO_ICONS[code]
  if (!icon) return { icon: '🌡️', label: i18n.t('weather.conditions.unknown') }
  return { icon, label: i18n.t(`weather.conditions.c${code}` as 'weather.conditions.c0') }
}
