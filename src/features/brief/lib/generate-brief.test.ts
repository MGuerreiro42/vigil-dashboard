import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { pt } from '@/i18n/locales/pt'
import type { CryptoAsset } from '@/features/crypto/types'
import type { Earthquake } from '@/features/earthquakes/types'
import type { SourceRow } from '@/lib/source-registry'
import { thresholdAlerts } from './alert-rules'
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
  latency: null,
  failure: { code: 'rate_limited', status: 429 },
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
    expect(rows[0]).toMatchObject({ sourceName: 'nasa', at: NOW - 60_000, headline: { key: 'healthDegraded', params: { cause: 'rate_limited', code: ' (429)' } } })
  })

  it('flags a big mover and escalates at the alert limit', () => {
    expect(generateDailyBrief({ now: NOW, crypto: { data: [coin('bitcoin', 1), coin('solana', -11)], at: NOW } })[0]).toMatchObject({ severity: 'warning', headline: { key: 'cryptoMover', params: { symbol: 'SOL', change: '−11.00' } } })
    expect(generateDailyBrief({ now: NOW, crypto: { data: [coin('solana', 20)], at: NOW } })[0].severity).toBe('critical')
  })

  it('reports a calm week when no quake reaches M5', () => {
    const [row] = generateDailyBrief({ now: NOW, quakes: { data: [quake('us1', 4.1), quake('us2', 3)], at: NOW } })
    expect(row).toMatchObject({ severity: 'info', headline: { key: 'quakeCalm', params: { count: 2 } } })
  })

  it('stays silent on ok sources', () => {
    expect(generateDailyBrief({ now: NOW, sources: [{ ...neows, status: 'ok', latency: 40, failure: null }] })).toEqual([])
  })
})

describe('brief texts', () => {
  it('resolves nested cause keys after interpolation', async () => {
    await i18n.changeLanguage('pt')
    const [row] = generateDailyBrief({ now: NOW, sources: [neows] })
    expect(i18n.t(`terminal.overview.brief.rows.${row.headline.key}`, row.headline.params)).toBe(`nasa neows degradado: ${pt.terminal.errors.rate_limited} (429)`)
  })

  it('formats pollutant numbers in the UI language', async () => {
    await i18n.changeLanguage('pt')
    const text = i18n.t('terminal.overview.brief.rows.airOver', { pollutant: 'NO₂', value: 42.34, city: 'são paulo', ratio: 1.69 })
    expect(text).toBe('NO₂ 42,3 µg/m³ em são paulo, 1,7× o limite da oms')
  })

  it('formats kp with two decimals in the UI language', async () => {
    await i18n.changeLanguage('pt')
    expect(i18n.t('terminal.overview.brief.rows.geomagneticStorm', { kp: 5.33, scale: 'G1' })).toBe('tempestade geomagnética: kp 5,33 G1')
    await i18n.changeLanguage('en')
    expect(i18n.t('terminal.alerts.kinds.geomagnetic.title', { kp: 5, scale: 'G1' })).toBe('geomagnetic storm kp 5.00 G1')
  })
})

it('gives a quake the same severity as the alerts popover', () => {
  const strong = quake('us9', 6.2)
  const [row] = generateDailyBrief({ now: NOW, quakes: { data: [strong], at: NOW } })
  expect(row.severity).toBe(thresholdAlerts({ now: NOW, quakes: [strong] })[0].severity)
})
