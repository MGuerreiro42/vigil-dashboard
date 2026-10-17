import { describe, expect, it } from 'vitest'
import { byteDelta, discoverTimer, readingMinutes } from './news-terminal'

describe('byteDelta', () => {
  it('signs and colours the change in the UI locale', () => {
    expect(byteDelta(41_967, 'en-US')).toEqual({ text: '+41,967', tone: 'ok' })
    expect(byteDelta(-11_177, 'pt-BR')).toEqual({ text: '−11.177', tone: 'err' })
    expect(byteDelta(0, 'en-US')).toEqual({ text: '±0', tone: 'dim' })
  })
})

describe('discoverTimer', () => {
  it('counts down and fills a 30-char bar', () => {
    expect(discoverTimer(0, 120_000)).toEqual({ left: '2:00', bar: '·'.repeat(30) })
    const halfway = discoverTimer(0.5, 120_000)
    expect(halfway.left).toBe('1:00')
    expect(halfway.bar).toBe('█'.repeat(15) + '·'.repeat(15))
  })
})

it('estimates at least a minute of reading', () => {
  expect(readingMinutes('short text')).toBe(1)
  expect(readingMinutes('word '.repeat(600))).toBe(3)
})
