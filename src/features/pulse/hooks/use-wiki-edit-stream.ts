import { useEffect, useState } from 'react'
import { summarizeEdits, toLiveEdit, WINDOW_SECONDS, type RawRecentChange } from '@/features/pulse/lib/wiki-edits'
import type { EditStreamSummary, LiveEdit } from '@/features/pulse/types'
import { createReconnectingSocket, openEventSource } from '@/lib/reconnecting-socket'
import { reportStreamStatus } from '@/store/source-health-store'

const STREAM_URL = 'https://stream.wikimedia.org/v2/stream/recentchange'
export const WIKIMEDIA_STREAM = 'wikimedia sse'
const FLUSH_MS = 1000
const FEED_SIZE = 40

interface StreamSnapshot {
  summary: EditStreamSummary
  /** Newest human edits first */
  feed: LiveEdit[]
}

/**
 * Wikimedia's global recent-changes stream (~20 events/s). Events are buffered and
 * rendered once per second; the last snapshot stays frozen while the stream is down.
 */
export function useWikiEditStream() {
  const [snapshot, setSnapshot] = useState<StreamSnapshot | null>(null)

  useEffect(() => {
    let live = false
    let windowEdits: LiveEdit[] = []
    let feed: LiveEdit[] = []

    const connection = createReconnectingSocket(STREAM_URL, {
      onMessage: (raw) => {
        const edit = toLiveEdit(raw as RawRecentChange, Date.now() / 1000)
        if (!edit) return
        windowEdits.push(edit)
        if (!edit.isBot) feed.push(edit)
      },
      // A gap in the stream would make the per-minute rate meaningless
      onClose: () => { windowEdits = [] },
      onStatus: (status) => {
        live = status.state === 'live'
        reportStreamStatus(WIKIMEDIA_STREAM, status)
      },
    }, openEventSource)

    const flush = setInterval(() => {
      if (!live) return
      const now = Date.now() / 1000
      windowEdits = windowEdits.filter((edit) => edit.receivedAt > now - WINDOW_SECONDS)
      feed = feed.slice(-FEED_SIZE)
      setSnapshot({ summary: summarizeEdits(windowEdits, now), feed: feed.toReversed() })
    }, FLUSH_MS)

    return () => {
      clearInterval(flush)
      connection.close()
    }
  }, [])

  return snapshot
}
