export interface CorrelationResult {
  datasetA: string
  datasetB: string
  coefficient: number
  strength: 'strong' | 'moderate' | 'weak' | 'none'
  direction: 'positive' | 'negative'
  interpretation: string
}

export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 2) return 0

  const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n
  const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n

  let num = 0
  let denomA = 0
  let denomB = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    num += da * db
    denomA += da * da
    denomB += db * db
  }

  const denom = Math.sqrt(denomA * denomB)
  return denom === 0 ? 0 : num / denom
}

function strengthLabel(coef: number): 'strong' | 'moderate' | 'weak' | 'none' {
  const abs = Math.abs(coef)
  if (abs >= 0.7) return 'strong'
  if (abs >= 0.4) return 'moderate'
  if (abs >= 0.2) return 'weak'
  return 'none'
}

export function buildCorrelation(
  nameA: string,
  seriesA: number[],
  nameB: string,
  seriesB: number[]
): CorrelationResult {
  const coef = pearsonCorrelation(seriesA, seriesB)
  const strength = strengthLabel(coef)
  const direction = coef >= 0 ? 'positive' : 'negative'

  const interp =
    strength === 'none'
      ? `${nameA} e ${nameB} não apresentam correlação significativa`
      : `${nameA} e ${nameB} têm correlação ${direction === 'positive' ? 'positiva' : 'negativa'} ${strength === 'strong' ? 'forte' : 'moderada'} (r=${coef.toFixed(2)})`

  return { datasetA: nameA, datasetB: nameB, coefficient: coef, strength, direction, interpretation: interp }
}
