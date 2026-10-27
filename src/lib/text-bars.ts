const SPARK_LEVELS = '▁▂▃▄▅▆▇█'

/** Text bar scaled to `max`; never empty so the smallest value still shows. */
export function blockBar(value: number, max: number, width: number): string {
  return '█'.repeat(Math.max(1, Math.round((value / (max || 1)) * width)))
}

export function sparkline(values: number[]): string {
  const min = Math.min(...values)
  const max = Math.max(...values)
  return values.map((value) => SPARK_LEVELS[Math.round(((value - min) / (max - min || 1)) * 7)]).join('')
}

const POLLUTANT_WIDTH = 24
const LIMIT_MARK = 12

/** Bar from 0 to 2× the limit; `|` marks the limit while the bar has not reached it. */
export function pollutantBar(value: number, limit: number) {
  const filled = Math.min(POLLUTANT_WIDTH, Math.round((value / limit) * LIMIT_MARK))
  const rest = Array.from({ length: POLLUTANT_WIDTH - filled }, (_, offset) => (filled + offset === LIMIT_MARK && filled <= LIMIT_MARK ? '|' : '·'))
  return { filled: '█'.repeat(filled), rest: rest.join(''), overLimit: value > limit }
}
