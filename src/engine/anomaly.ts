export type AnomalySeverity = 'warning' | 'critical'

export interface AnomalyResult {
  isAnomaly: boolean
  zScore: number
  direction: 'high' | 'low'
  severity: AnomalySeverity
  message: string
}

function mean(series: number[]): number {
  return series.reduce((a, b) => a + b, 0) / series.length
}

function stddev(series: number[], avg: number): number {
  const variance = series.reduce((sum, v) => sum + (v - avg) ** 2, 0) / series.length
  return Math.sqrt(variance)
}

export function detectAnomaly(
  series: number[],
  currentValue: number,
  threshold = 2.0
): AnomalyResult {
  if (series.length < 3) {
    return { isAnomaly: false, zScore: 0, direction: 'high', severity: 'warning', message: '' }
  }

  const avg = mean(series)
  const sd = stddev(series, avg)
  if (sd === 0) {
    return { isAnomaly: false, zScore: 0, direction: 'high', severity: 'warning', message: '' }
  }

  const zScore = (currentValue - avg) / sd
  const isAnomaly = Math.abs(zScore) >= threshold
  const direction = zScore > 0 ? 'high' : 'low'
  const severity: AnomalySeverity = Math.abs(zScore) >= 3 ? 'critical' : 'warning'

  return { isAnomaly, zScore, direction, severity, message: '' }
}

export function detectCryptoAnomaly(sparkline: number[], currentPrice: number): AnomalyResult {
  const result = detectAnomaly(sparkline, currentPrice, 2.5)
  if (result.isAnomaly) {
    const dir = result.direction === 'high' ? 'spike' : 'drop'
    result.message = `Preço em ${dir} anômalo (z=${result.zScore.toFixed(2)})`
  }
  return result
}

export function detectAQIAnomaly(historicalAqi: number[], currentAqi: number): AnomalyResult {
  const result = detectAnomaly(historicalAqi, currentAqi, 2.0)
  if (result.isAnomaly) {
    result.message = `Qualidade do ar ${result.direction === 'high' ? 'deteriorou' : 'melhorou'} significativamente`
  }
  return result
}
