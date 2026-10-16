import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { usePriceFlash } from './usePriceFlash'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('flashes the direction of a price change, then clears', () => {
  const { result, rerender } = renderHook(({ price }) => usePriceFlash(price), { initialProps: { price: 100 as number | undefined } })
  expect(result.current).toBeNull()

  rerender({ price: 101 })
  expect(result.current).toBe('up')

  rerender({ price: 99 })
  expect(result.current).toBe('down')

  act(() => vi.advanceTimersByTime(500))
  expect(result.current).toBeNull()
})

it('restarts the flash timer when the price keeps moving the same way', () => {
  const { result, rerender } = renderHook(({ price }) => usePriceFlash(price), { initialProps: { price: 100 } })
  rerender({ price: 101 })
  act(() => vi.advanceTimersByTime(400))
  rerender({ price: 102 })
  act(() => vi.advanceTimersByTime(400))
  expect(result.current).toBe('up')
})

it('does not flash when a live price first arrives', () => {
  const { result, rerender } = renderHook(({ price }) => usePriceFlash(price), { initialProps: { price: undefined as number | undefined } })
  rerender({ price: 100 })
  expect(result.current).toBeNull()
})
