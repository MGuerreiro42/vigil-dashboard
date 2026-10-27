import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { pt } from '@/i18n/locales/pt'
import type { CryptoAsset } from '@/features/crypto/types'
import type { Earthquake } from '@/features/earthquakes/types'
import type { SourceRow } from '@/lib/source-registry'
import { generateDailyBrief } from './generate-brief'

const NOW = Date.parse('2026-10-16T18:00:00Z')

const coin = (id: string, change24h: number): CryptoAsset => ({
  id,
  symbol: id.slice(0, 3),
  name: id,
  price: 81_692,
  marketCap: 0,
  volume24h: 1e9,
  change24h,
  change7d: 0,
  sparkline: [],
  rank: 1,
  imageUrl: '',
  source: 'coingecko',
})

const quake = (id: string, magnitude: number, time = NOW - 3_600_000): Earthquake => ({
  id, magnitude, time, place: 'off the coast of Ecuador', depth: 10, location: { lat: 0, lng: -80 }, significance: 0, url: '', tsunamiRisk: false,
})

const neows: SourceRow = {
  entry: { label: 'nasa neows', short: 'nasa', screen: 4 },
  status: 'degraded',
  latency: 429,
  ageMs: 3 * 3_600_000,
  failingSince: NOW - 60_000,
}

describe('generateDailyBrief', () => {
  it('orders rows by severity, then newest first, each pointing at its screen', () => {
    const rows = generateDailyBrief({
      now: NOW,
      sources: [neows],
      crypto: { data: [coin('bitcoin', 1)], at: NOW },
      quakes: { data: [quake('us1', 5.2)], at: NOW },
    })
    expect(rows.map((row) => [row.id, row.severity, row.screen])).toEqual([
      ['health-nasa neows', 'warning', 4],
      ['seismic', 'warning', 3],
      ['crypto', 'info', 2],
    ])
    expect(rows[0]).toMatchObject({ sourceName: 'nasa', at: NOW - 60_000, headline: { key: 'healthDegraded', params: { cause: 'rateLimit', code: ' (429)' } } })
  })

  it('flags a big mover and escalates past 15%', () => {
    expect(generateDailyBrief({ now: NOW, crypto: { data: [coin('bitcoin', 1), coin('solana', -9)], at: NOW } })[0]).toMatchObject({ severity: 'warning', headline: { key: 'cryptoMover', params: { symbol: 'SOL', change: '−9.00' } } })
    expect(generateDailyBrief({ now: NOW, crypto: { data: [coin('solana', 16)], at: NOW } })[0].severity).toBe('critical')
  })

  it('reports a calm week when no quake reaches M5', () => {
    const [row] = generateDailyBrief({ now: NOW, quakes: { data: [quake('us1', 4.1), quake('us2', 3)], at: NOW } })
    expect(row).toMatchObject({ severity: 'info', headline: { key: 'quakeCalm', params: { count: 2 } } })
  })

  it('stays silent on ok sources', () => {
    expect(generateDailyBrief({ now: NOW, sources: [{ ...neows, status: 'ok', latency: 40 }] })).toEqual([])
  })
})

describe('brief texts', () => {
  it('resolves nested cause keys after interpolation', async () => {
    await i18n.changeLanguage('pt')
    const [row] = generateDailyBrief({ now: NOW, sources: [neows] })
    expect(i18n.t(`terminal.overview.brief.rows.${row.headline.key}`, row.headline.params)).toBe(`nasa neows degradado: ${pt.terminal.causes.rateLimit} (429)`)
  })

  it('formats pollutant numbers in the UI language', async () => {
    await i18n.changeLanguage('pt')
    const text = i18n.t('terminal.overview.brief.rows.airOver', { pollutant: 'NO₂', value: 42.34, city: 'são paulo', ratio: 1.69 })
    expect(text).toBe('NO₂ 42,3 µg/m³ em são paulo, 1,7× o limite da oms')
  })
})
