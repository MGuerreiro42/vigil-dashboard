export type GeomagneticScale = 'G0' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5'

/** NOAA G-scale for a Kp value: Kp 5 → G1 (minor) … Kp 9 → G5 (extreme). */
export function kpToScale(kp: number): GeomagneticScale {
  if (kp >= 9) return 'G5'
  if (kp >= 8) return 'G4'
  if (kp >= 7) return 'G3'
  if (kp >= 6) return 'G2'
  if (kp >= 5) return 'G1'
  return 'G0'
}

/**
 * Rough lowest geomagnetic latitude where aurora may be seen overhead.
 * NOAA's rule of thumb: about 66° at Kp 0, moving ~2.5° equatorward per Kp step.
 */
export function auroraLatitude(kp: number): number {
  return Math.round(66 - kp * 2.5)
}

export const SCALE_COLORS: Record<GeomagneticScale, string> = {
  G0: '#10b981',
  G1: '#facc15',
  G2: '#f59e0b',
  G3: '#f97316',
  G4: '#ef4444',
  G5: '#a855f7',
}
