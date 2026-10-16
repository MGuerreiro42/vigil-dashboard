import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReconnectingSocket, reconnectDelay } from './reconnectingSocket'

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
  vi.spyOn(Math, 'random').mockReturnValue(1) // upper bound of the jitter range
})

afterEach(() => {
  handles.forEach((h) => h.close())
  handles = []
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('reconnectDelay', () => {
  it('doubles per attempt and caps at 30s', () => {
    expect([0, 1, 2, 5, 10].map(reconnectDelay)).toEqual([1_000, 2_000, 4_000, 30_000, 30_000])
  })

  it('jitters between half and the full ceiling', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(reconnectDelay(2)).toBe(2_000)
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
