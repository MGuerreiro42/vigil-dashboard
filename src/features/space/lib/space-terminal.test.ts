import { describe, expect, it } from 'vitest'
import { asteroidLabel, formatKp, kpColumn, kpTone, launchStatus, noaaTag } from './space-terminal'

const chars = (kp: number) => kpColumn(kp).map((cell) => cell.char).join('')

describe('kpColumn', () => {
  it('stacks eighth blocks from the bottom row up', () => {
    expect(chars(0)).toBe(' -  ')
    expect(chars(2.25)).toBe(' - █')
    expect(chars(3.67)).toBe(' -▅█')
    expect(chars(9)).toBe('████')
  })

  it('keeps the G1 dash on the threshold row only below kp 5 and colours by storm level', () => {
    expect(kpColumn(4.8)[1]).toEqual({ char: '▁', tone: 'ok' })
    expect(kpColumn(3)[1]).toEqual({ char: '-', tone: 'rim' })
    expect([4.99, 5, 6].map(kpTone)).toEqual(['ok', 'warn', 'err'])
  })
})

describe('labels', () => {
  it('maps NOAA bulletin kinds to tags and tones', () => {
    expect(noaaTag('alert')).toEqual({ tag: 'alert', tone: 'err' })
    expect(noaaTag('watch')).toEqual({ tag: 'watch', tone: 'warn' })
    expect(noaaTag('other')).toEqual({ tag: 'summary', tone: 'dim' })
  })

  it('maps every Launch Library status to a label key and tone', () => {
    const statuses = ['Go', 'TBC', 'TBD', 'Hold', 'In Flight', 'Success', 'Partial Failure', 'Failure'].map(launchStatus)
    expect(statuses.map((entry) => entry.status)).toEqual(['go', 'tbc', 'tbd', 'hold', 'inFlight', 'success', 'partial', 'failure'])
    expect(statuses.map((entry) => entry.tone)).toEqual(['ok', 'warn', 'dim', 'warn', 'info', 'ok', 'warn', 'err'])
    expect(launchStatus('Something New')).toEqual({ status: 'tbd', tone: 'dim' })
  })

  it('formats kp with the locale decimal separator', () => {
    expect(formatKp(3.67, 'pt-BR')).toBe('3,67')
    expect(formatKp(4, 'en-US')).toBe('4.00')
  })
})

describe('asteroidLabel', () => {
  it('drops the catalogue number and keeps the designation or the name', () => {
    expect(asteroidLabel('144900 (2004 VG64)')).toBe('2004 VG64')
    expect(asteroidLabel('433 Eros (A898 PA)')).toBe('Eros')
    expect(asteroidLabel('2026 TX3')).toBe('2026 TX3')
    expect(asteroidLabel('2019 GT3')).toBe('2019 GT3')
  })
})
