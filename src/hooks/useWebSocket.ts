import { useEffect, useRef } from 'react'
import { createReconnectingSocket, type SocketHandlers } from '@/lib/reconnectingSocket'

export function useWebSocket(url: string | null, handlers: SocketHandlers) {
  // Read handlers through a ref so a re-render doesn't reopen the connection
  const handlersRef = useRef(handlers)
  useEffect(() => { handlersRef.current = handlers })

  useEffect(() => {
    if (!url) return
    const socket = createReconnectingSocket(url, {
      onMessage: (data) => handlersRef.current.onMessage(data),
      onOpen: () => handlersRef.current.onOpen?.(),
      onClose: () => handlersRef.current.onClose?.(),
    })
    return () => socket.close()
  }, [url])
}
