import { describe, expect, it } from 'vitest'
import { isLaunchConfirmed, kpColumn, kpTone, noaaTag } from './space-terminal'

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

  it('confirms only launches with a Go status', () => {
    expect(['Go', 'TBC', 'TBD', 'Hold'].map(isLaunchConfirmed)).toEqual([true, false, false, false])
  })
})
