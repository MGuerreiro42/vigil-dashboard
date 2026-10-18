import type { ReactNode } from 'react'

/** p1 always shown, p2 hidden below 600px, p3 hidden below 1024px. */
export type Priority = 'p1' | 'p2' | 'p3'

// Literal class names so Tailwind generates them
export const PRIORITY_CLASS: Record<Priority, string> = {
  p1: '',
  p2: 'max-sm:hidden',
  p3: 'max-lg:hidden',
}

/** Metadata segment: plain text is p1; the object form also carries coloured text or links. */
export type MetaSegment = string | { text: ReactNode; priority: Priority }

export interface MetaPiece {
  text: ReactNode
  /** Shown below 600px */
  phone: boolean
  /** First segment shown below 600px: its " · " separator is dropped there */
  phoneFirst: boolean
}

const PHONE_SEGMENTS = 2

/** Below 600px a metadata line keeps at most two p1 segments, in order. */
export function metaPieces(segments: (MetaSegment | null | undefined | false)[]): MetaPiece[] {
  const present = segments.filter((segment): segment is MetaSegment => Boolean(segment))
  let phoneCount = 0
  return present.map((segment) => {
    const { text, priority } = typeof segment === 'string' ? { text: segment, priority: 'p1' as Priority } : segment
    const phone = priority === 'p1' && phoneCount < PHONE_SEGMENTS
    if (phone) phoneCount += 1
    return { text, phone, phoneFirst: phone && phoneCount === 1 }
  })
}
