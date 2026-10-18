/** One cell of breathing room between a marker centre and its label */
const LABEL_GAP = 14
const EDGE_MARGIN = 8
const BOX_PADDING = 3
const BOX_HEIGHT = 16

export interface LabelBox {
  left: number
  top: number
  width: number
  height: number
}

export interface LabelRequest {
  /** Marker centre in canvas px */
  x: number
  y: number
  text: string
  color: string
  /** Ranked labels share the width quota, highest first; unranked ones (a place name) are always tried */
  rank?: number
  /** Hovered or selected: always tried, ahead of every other label */
  pinned?: boolean
}

export interface PlacedLabel {
  text: string
  textX: number
  y: number
  color: string
  box: LabelBox
}

/** Fixed labels by map width: 3 from 720px, 1 from 360px, none below. */
export function fixedLabelCount(mapWidth: number) {
  if (mapWidth >= 720) return 3
  if (mapWidth >= 360) return 1
  return 0
}

/** Right of the marker; left of it when that would pass the right edge; else the magnitude alone; else nothing. */
export function placeLabel(x: number, label: string, measure: (text: string) => number, mapWidth: number) {
  const fit = (text: string) => {
    const textWidth = measure(text)
    if (x + LABEL_GAP + textWidth <= mapWidth - EDGE_MARGIN) return { text, textX: x + LABEL_GAP, textWidth }
    if (x - LABEL_GAP - textWidth >= EDGE_MARGIN) return { text, textX: x - LABEL_GAP - textWidth, textWidth }
    return null
  }
  return fit(label) ?? fit(label.split(' ')[0])
}

const overlaps = (first: LabelBox, second: LabelBox) =>
  first.left < second.left + second.width && second.left < first.left + first.width && first.top < second.top + second.height && second.top < first.top + first.height

/** Pinned labels first, then unranked, then the top ranked ones; a label overlapping one already placed is dropped. */
export function layoutLabels(requests: LabelRequest[], measure: (text: string) => number, mapWidth: number): PlacedLabel[] {
  const pinned = requests.filter((request) => request.pinned)
  const unranked = requests.filter((request) => !request.pinned && request.rank === undefined)
  const ranked = requests
    .filter((request) => !request.pinned && request.rank !== undefined)
    .sort((first, second) => (second.rank ?? 0) - (first.rank ?? 0))
    .slice(0, fixedLabelCount(mapWidth))
  const placed: PlacedLabel[] = []
  for (const request of [...pinned, ...unranked, ...ranked]) {
    const spot = placeLabel(request.x, request.text, measure, mapWidth)
    if (!spot) continue
    const box = { left: spot.textX - BOX_PADDING, top: request.y - BOX_HEIGHT / 2, width: spot.textWidth + BOX_PADDING * 2, height: BOX_HEIGHT }
    if (placed.some((label) => overlaps(label.box, box))) continue
    placed.push({ text: spot.text, textX: spot.textX, y: request.y, color: request.color, box })
  }
  return placed
}
