import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReconnectingSocket, reconnectDelay } from './reconnecting-socket'

class FakeSocket {
  static instances: FakeSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((ev: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  closed = false
  url: string

  constructor(url: string) {
    this.url = url
    FakeSocket.instances.push(this)
  }

  close() {
    if (this.closed) return
    this.closed = true
    this.onclose?.()
  }
}

const latest = () => FakeSocket.instances.at(-1)!

// Every socket opened by a test, closed afterwards so its visibility listener doesn't leak
let handles: ReturnType<typeof createReconnectingSocket>[] = []
function open(handlers: Parameters<typeof createReconnectingSocket>[1]) {
  const handle = createReconnectingSocket('wss://x', handlers)
  handles.push(handle)
  return handle
}

let hidden = false
function setHidden(value: boolean) {
  hidden = value
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  FakeSocket.instances = []
  hidden = false
  vi.useFakeTimers()
  vi.stubGlobal('WebSocket', FakeSocket)
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
})

afterEach(() => {
  handles.forEach((handle) => handle.close())
  handles = []
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('reconnectDelay', () => {
  it('follows the 1·2·4·8·16 s schedule', () => {
    expect([1, 2, 3, 4, 5].map(reconnectDelay)).toEqual([1_000, 2_000, 4_000, 8_000, 16_000])
  })
})

describe('createReconnectingSocket', () => {
  it('parses JSON messages and ignores malformed frames', () => {
    const onMessage = vi.fn()
    open({ onMessage })
    latest().onmessage?.({ data: '{"p":1}' })
    latest().onmessage?.({ data: 'not json' })
    expect(onMessage).toHaveBeenCalledExactlyOnceWith({ p: 1 })
  })

  it('reconnects with growing delays and resets them after a successful open', () => {
    open({ onMessage: vi.fn() })
    latest().close()
    vi.advanceTimersByTime(999)
    expect(FakeSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(FakeSocket.instances).toHaveLength(2)

    latest().close()
    vi.advanceTimersByTime(2_000)
    expect(FakeSocket.instances).toHaveLength(3)

    latest().onopen?.()
    latest().close()
    vi.advanceTimersByTime(1_000)
    expect(FakeSocket.instances).toHaveLength(4)
  })

  it('reports each attempt and gives up after five failures', () => {
    const onStatus = vi.fn()
    open({ onMessage: vi.fn(), onStatus })
    expect(onStatus).toHaveBeenLastCalledWith({ state: 'connecting', attempt: 0, nextRetryAt: null })

    for (const delay of [1_000, 2_000, 4_000, 8_000, 16_000]) {
      latest().close()
      expect(onStatus).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'reconnecting', nextRetryAt: Date.now() + delay }))
      vi.advanceTimersByTime(delay)
    }
    expect(FakeSocket.instances).toHaveLength(6)

    latest().close()
    expect(onStatus).toHaveBeenLastCalledWith({ state: 'error', attempt: 5, nextRetryAt: null })
    vi.advanceTimersByTime(60_000)
    expect(FakeSocket.instances).toHaveLength(6)
  })

  it('starts over on retry() after giving up', () => {
    const socket = open({ onMessage: vi.fn() })
    for (let attempt = 0; attempt < 6; attempt++) {
      latest().close()
      vi.advanceTimersByTime(16_000)
    }
    socket.retry()
    expect(FakeSocket.instances).toHaveLength(7)
  })

  it('stops reconnecting after close()', () => {
    const onClose = vi.fn()
    const socket = open({ onMessage: vi.fn(), onClose })
    socket.close()
    vi.advanceTimersByTime(60_000)
    expect(FakeSocket.instances).toHaveLength(1)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('cancels a pending retry on close()', () => {
    const socket = open({ onMessage: vi.fn() })
    latest().close()
    socket.close()
    vi.advanceTimersByTime(60_000)
    expect(FakeSocket.instances).toHaveLength(1)
  })

  it('closes while the tab is hidden and reopens when visible', () => {
    open({ onMessage: vi.fn() })
    setHidden(true)
    expect(latest().closed).toBe(true)
    vi.advanceTimersByTime(60_000)
    expect(FakeSocket.instances).toHaveLength(1)

    setHidden(false)
    expect(FakeSocket.instances).toHaveLength(2)
    expect(latest().closed).toBe(false)
  })

  it('does not connect until a hidden tab becomes visible', () => {
    hidden = true
    open({ onMessage: vi.fn() })
    expect(FakeSocket.instances).toHaveLength(0)
    setHidden(false)
    expect(FakeSocket.instances).toHaveLength(1)
  })
})
