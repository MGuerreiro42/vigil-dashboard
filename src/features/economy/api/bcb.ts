import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { SeriesPoint } from '@/features/economy/types'

// Banco Central do Brasil SGS series
export const BCB_SERIES = {
  selic: 432,          // Selic target, % per year (daily)
  ipca12m: 13522,      // IPCA accumulated over 12 months, % (monthly)
  ipcaMonthly: 433,    // IPCA month-over-month, % (monthly)
} as const
export type BcbSeries = keyof typeof BCB_SERIES

const pad = (value: number) => String(value).padStart(2, '0')
const toBcbDate = (date: Date) => `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`

/** "16/10/2026" + "13.75" rows → ISO-dated points. */
export function parseBcbSeries(raw: { data: string; valor: string }[]): SeriesPoint[] {
  return raw
    .map((row) => {
      const [day, month, year] = row.data.split('/')
      return { date: `${year}-${month}-${day}`, value: Number.parseFloat(row.valor) }
    })
    .filter((point) => Number.isFinite(point.value))
}

/**
 * Last ~13 months of a series. The "ultimos/N" endpoint intermittently returns an empty body,
 * so this asks for an explicit date range instead.
 */
export function useBcbSeries(series: BcbSeries) {
  return useQuery({
    queryKey: queryKeys.economy.bcb(series),
    queryFn: async ({ signal }) => {
      const end = new Date()
      const start = new Date(Date.UTC(end.getUTCFullYear() - 1, end.getUTCMonth() - 1, 1))
      const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${BCB_SERIES[series]}/dados?formato=json&dataInicial=${toBcbDate(start)}&dataFinal=${toBcbDate(end)}`
      return parseBcbSeries(await (await fetchOk(url, 'Banco Central', { signal })).json())
    },
    staleTime: 6 * 60 * 60_000,
  })
}
