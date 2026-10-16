const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000

/** Exponential backoff with jitter, so reconnecting clients don't retry in lockstep. */
export function reconnectDelay(attempt: number): number {
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt)
  return ceiling / 2 + Math.random() * (ceiling / 2)
}

export interface SocketHandlers {
  onMessage: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
}

/** Reconnects with backoff; stays closed while the tab is hidden. */
export function createReconnectingSocket(url: string, handlers: SocketHandlers) {
  let socket: WebSocket | null = null
  let retry: ReturnType<typeof setTimeout> | undefined
  let attempt = 0
  let stopped = false

  function connect() {
    const ws = new WebSocket(url)
    socket = ws
    ws.onopen = () => {
      attempt = 0
      handlers.onOpen?.()
    }
    ws.onmessage = (ev) => {
      try { handlers.onMessage(JSON.parse(ev.data as string)) } catch { /* ignore malformed frames */ }
    }
    ws.onerror = () => ws.close()
    ws.onclose = () => {
      if (socket === ws) socket = null
      handlers.onClose?.()
      if (!stopped && !document.hidden) retry = setTimeout(connect, reconnectDelay(attempt++))
    }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      clearTimeout(retry)
      socket?.close()
    } else if (!socket) {
      attempt = 0
      connect()
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
