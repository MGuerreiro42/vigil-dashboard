import { useEffect, useState } from 'react'
import { summarizeEdits, toLiveEdit, WINDOW_SECONDS } from '@/features/pulse/lib/wiki-edits'
import type { EditStreamSummary, LiveEdit } from '@/features/pulse/types'

const STREAM_URL = 'https://stream.wikimedia.org/v2/stream/recentchange'
const FLUSH_MS = 1000
const FEED_SIZE = 40

export type StreamStatus = 'connecting' | 'live' | 'reconnecting'

interface StreamSnapshot {
  summary: EditStreamSummary
  /** Newest human edits first */
  feed: LiveEdit[]
}

/**
 * Wikimedia's global recent-changes stream (~20 events/s). Events are buffered and
 * rendered once per second; the stream is closed while the tab is hidden.
 */
export function useWikiEditStream() {
  const [snapshot, setSnapshot] = useState<StreamSnapshot | null>(null)
  const [status, setStatus] = useState<StreamStatus>('connecting')

  useEffect(() => {
    let source: EventSource | null = null
    let windowEdits: LiveEdit[] = []
    let feed: LiveEdit[] = []

    const open = () => {
      source = new EventSource(STREAM_URL)
      source.onopen = () => setStatus('live')
      // EventSource retries on its own; this only reflects it in the UI
      source.onerror = () => setStatus('reconnecting')
      source.onmessage = (message) => {
        const edit = toLiveEdit(JSON.parse(message.data), Date.now() / 1000)
        if (!edit) return
        windowEdits.push(edit)
        if (!edit.isBot) feed.push(edit)
      }
    }
    const close = () => {
      source?.close()
      source = null
      // A gap while hidden would make the rate meaningless
      windowEdits = []
      feed = []
    }
    const onVisibilityChange = () => {
      if (document.hidden) close()
      else if (!source) { setStatus('connecting'); open() }
    }

    const flush = setInterval(() => {
      if (!source) return
      const now = Date.now() / 1000
      windowEdits = windowEdits.filter((edit) => edit.receivedAt > now - WINDOW_SECONDS)
      feed = feed.slice(-FEED_SIZE)
      setSnapshot({ summary: summarizeEdits(windowEdits, now), feed: feed.toReversed() })
    }, FLUSH_MS)

    document.addEventListener('visibilitychange', onVisibilityChange)
    if (!document.hidden) open()
    return () => {
      clearInterval(flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      close()
    }
  }, [])

  return { snapshot, status }
}
