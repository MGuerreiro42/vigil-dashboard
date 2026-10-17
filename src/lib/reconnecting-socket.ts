export const MAX_RECONNECT_ATTEMPTS = 5

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

/** Reconnects with backoff and gives up after MAX_RECONNECT_ATTEMPTS; stays closed while the tab is hidden. */
export function createReconnectingSocket(url: string, handlers: SocketHandlers) {
  let socket: WebSocket | null = null
  let retry: ReturnType<typeof setTimeout> | undefined
  let attempt = 0
  let stopped = false

  const report = (state: SocketState, nextRetryAt: number | null = null) =>
    handlers.onStatus?.({ state, attempt, nextRetryAt })

  function connect() {
    const ws = new WebSocket(url)
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
        report('error')
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
    /** Starts over after giving up, e.g. from a "retry now" action */
    retry: restart,
    close() {
      stopped = true
      clearTimeout(retry)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      socket?.close()
    },
  }
}
