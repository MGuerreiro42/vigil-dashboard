import { expect, it } from 'vitest'
import { generateDailyBrief } from './generate-brief'
import type { CryptoAsset } from '@/features/crypto/types'

const coin = (id: string, change24h: number): CryptoAsset => ({
  id,
  symbol: id.slice(0, 3).toUpperCase(),
  name: id,
  price: 100,
  marketCap: 0,
  volume24h: 0,
  change24h,
  change7d: 0,
  sparkline: [],
  rank: 1,
  imageUrl: '',
})

it('gives each insight a stable id so cards are not remounted on refetch', () => {
  const input = { crypto: [coin('bitcoin', 1), coin('solana', -12)] }
  const ids = generateDailyBrief(input).map((insight) => insight.id)
  expect(ids).toEqual(['crypto-top-mover'])
  expect(generateDailyBrief(input).map((insight) => insight.id)).toEqual(ids)
})

it('reports a calm market when nothing moved 8% or more', () => {
  const [insight] = generateDailyBrief({ crypto: [coin('bitcoin', 1.5)] })
  expect(insight).toMatchObject({ id: 'crypto-stable', severity: 'info' })
})
