export const MAX_RECONNECT_ATTEMPTS = 5
// After giving up, a dropped network that comes back still gets the stream again
const GAVE_UP_RETRY_MS = 60_000

/** 1·2·4·8·16 s for attempts 1 to 5; the design shows the attempt count, so no jitter. */
export function reconnectDelay(attempt: number): number {
  return 1_000 * 2 ** (attempt - 1)
}

export type SocketState = 'connecting' | 'live' | 'reconnecting' | 'error'

export interface SocketStatus {
  state: SocketState
  /** Reconnect attempt being waited on (1 to MAX_RECONNECT_ATTEMPTS), 0 otherwise */
  attempt: number
  nextRetryAt: number | null
}

export interface SocketHandlers {
  onMessage: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
  onStatus?: (status: SocketStatus) => void
}

/** What the reconnect loop needs from a connection; a WebSocket already fits. */
export interface StreamConnection {
  onopen: ((event: Event) => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onclose: ((event: CloseEvent) => void) | null
  close: () => void
}

/** Server-sent events behind the WebSocket shape, so both share one backoff. */
export function openEventSource(url: string): StreamConnection {
  const source = new EventSource(url)
  let closed = false
  const connection: StreamConnection = {
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    close() {
      if (closed) return
      closed = true
      source.close()
      connection.onclose?.(new CloseEvent('close'))
    },
  }
  source.onopen = (event) => connection.onopen?.(event)
  source.onmessage = (event) => connection.onmessage?.(event)
  // EventSource would retry on its own schedule; closing hands the retry to the shared backoff
  source.onerror = (event) => connection.onerror?.(event)
  return connection
}

const openWebSocket = (url: string): StreamConnection => new WebSocket(url)

/** Reconnects with backoff, then once a minute after MAX_RECONNECT_ATTEMPTS; stays closed while the tab is hidden. */
export function createReconnectingSocket(url: string, handlers: SocketHandlers, open: (url: string) => StreamConnection = openWebSocket) {
  let socket: StreamConnection | null = null
  let retry: ReturnType<typeof setTimeout> | undefined
  let attempt = 0
  let stopped = false

  const report = (state: SocketState, nextRetryAt: number | null = null) =>
    handlers.onStatus?.({ state, attempt, nextRetryAt })

  function connect() {
    const ws = open(url)
    socket = ws
    if (attempt === 0) report('connecting')
    ws.onopen = () => {
      attempt = 0
      report('live')
      handlers.onOpen?.()
    }
    ws.onmessage = (ev) => {
      try { handlers.onMessage(JSON.parse(ev.data as string)) } catch { /* ignore malformed frames */ }
    }
    ws.onerror = () => ws.close()
    ws.onclose = () => {
      if (socket === ws) socket = null
      handlers.onClose?.()
      if (stopped || document.hidden) return
      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        report('error', Date.now() + GAVE_UP_RETRY_MS)
        retry = setTimeout(restart, GAVE_UP_RETRY_MS)
        return
      }
      attempt += 1
      const delay = reconnectDelay(attempt)
      report('reconnecting', Date.now() + delay)
      retry = setTimeout(connect, delay)
    }
  }

  function restart() {
    clearTimeout(retry)
    attempt = 0
    if (!socket) connect()
  }

  function onVisibilityChange() {
    if (document.hidden) {
      clearTimeout(retry)
      socket?.close()
    } else {
      restart()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  if (!document.hidden) connect()

  return {
    close() {
      stopped = true
      clearTimeout(retry)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      socket?.close()
    },
  }
}
