import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PanelQuery } from './panel-state'
import { QueryPanel } from './query-panel'

const query = (patch: Partial<PanelQuery<number>>): PanelQuery<number> => ({
  data: undefined, error: null, isError: false, dataUpdatedAt: 0, errorUpdatedAt: 0, refetch: () => {}, ...patch,
})

const panel = (patch: Partial<PanelQuery<number>>) => (
  <QueryPanel id="1" title="t" source="test" query={query(patch)}>{(data) => <span>data {data}</span>}</QueryPanel>
)

describe('QueryPanel', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('waits again instead of timing out when the data goes away', () => {
    const { rerender, container } = render(panel({ data: 1 }))
    act(() => vi.advanceTimersByTime(30_000))
    rerender(panel({}))
    act(() => vi.advanceTimersByTime(1_000))
    expect(container.textContent).toContain('terminal.panel.waiting')
  })
})
