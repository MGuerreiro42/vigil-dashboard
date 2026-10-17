import { describe, expect, it } from 'vitest'
import { blockBar, pollutantBar, sparkline } from './text-bars'

describe('blockBar', () => {
  it('scales to the width and keeps at least one block', () => {
    expect(blockBar(50, 100, 40)).toHaveLength(20)
    expect(blockBar(0, 100, 40)).toBe('█')
  })
})

describe('sparkline', () => {
  it('maps min to the lowest and max to the highest level', () => {
    expect(sparkline([1, 1, 1, 1, 5])).toBe('▁▁▁▁█')
    expect(sparkline([3, 3])).toBe('▁▁')
  })
})

describe('pollutantBar', () => {
  it('marks the limit at character 12 below it', () => {
    const bar = pollutantBar(11.1, 15)
    expect(bar.filled).toBe('█████████')
    expect(bar.rest).toBe('···|···········')
    expect(bar.overLimit).toBe(false)
  })

  it('drops the marker and flags values above the limit', () => {
    const bar = pollutantBar(42.3, 25)
    expect(bar.filled).toHaveLength(20)
    expect(bar.rest).toBe('····')
    expect(bar.overLimit).toBe(true)
  })
})
