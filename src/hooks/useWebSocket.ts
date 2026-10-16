import { useEffect, useRef } from 'react'

const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000

/** Exponential backoff with jitter, so reconnecting clients don't retry in lockstep. */
export function reconnectDelay(attempt: number): number {
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt)
  return ceiling / 2 + Math.random() * (ceiling / 2)
}

interface Handlers {
  onMessage: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
}

/**
 * One WebSocket per `url` (null disconnects). Reconnects with backoff and
 * closes while the tab is hidden, reopening when it becomes visible again.
 */
export function useWebSocket(url: string | null, handlers: Handlers) {
  const handlersRef = useRef(handlers)
  useEffect(() => { handlersRef.current = handlers })

  useEffect(() => {
    if (!url) return
    // Per-connection state: a closing socket from a previous url can't reconnect or touch the new one
    let active = true
    let socket: WebSocket | null = null
    let retry: ReturnType<typeof setTimeout> | undefined
    let attempt = 0

    function connect() {
      const ws = new WebSocket(url as string)
      socket = ws
      ws.onopen = () => {
        attempt = 0
        handlersRef.current.onOpen?.()
      }
      ws.onmessage = (ev) => {
        try { handlersRef.current.onMessage(JSON.parse(ev.data as string)) } catch { /* ignore malformed frames */ }
      }
      ws.onerror = () => ws.close()
      ws.onclose = () => {
        if (socket === ws) socket = null
        handlersRef.current.onClose?.()
        if (active && !document.hidden) retry = setTimeout(connect, reconnectDelay(attempt++))
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

    return () => {
      active = false
      clearTimeout(retry)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      socket?.close()
    }
  }, [url])
}
