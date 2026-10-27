const PADDING_TOP = 10
const PADDING_BOTTOM = 22
const PADDING_RIGHT = 10
const PADDING_RIGHT_WITH_AXIS = 44
// Below this many px between x labels they collide, so only first, middle and last remain
const MIN_X_LABEL_SPACING = 64

export interface ChartLayout {
  left: number
  top: number
  plotWidth: number
  plotHeight: number
  /** Points in the longest series; the cursor moves across this many slots */
  count: number
}

export function chartLayout(width: number, height: number, options: { padLeft: number; hasRightAxis: boolean; count: number }): ChartLayout {
  const right = options.hasRightAxis ? PADDING_RIGHT_WITH_AXIS : PADDING_RIGHT
  return {
    left: options.padLeft,
    top: PADDING_TOP,
    plotWidth: Math.max(0, width - options.padLeft - right),
    plotHeight: Math.max(0, height - PADDING_TOP - PADDING_BOTTOM),
    count: options.count,
  }
}

/** Indices of the x labels to draw; empty strings are placeholders and never drawn. */
export function visibleXLabelIndices(labels: string[], plotWidth: number) {
  const lastIndex = labels.length - 1
  const thinned = lastIndex > 0 && plotWidth / lastIndex < MIN_X_LABEL_SPACING
  const kept = thinned ? new Set([0, Math.round(lastIndex / 2), lastIndex]) : null
  return labels.flatMap((label, index) => (label && (!kept || kept.has(index)) ? [index] : []))
}

/** Data index under a pointer x (relative to the canvas), clamped to the series. */
export function indexAtX(pointerX: number, layout: ChartLayout) {
  if (layout.count < 2 || layout.plotWidth <= 0) return 0
  const index = Math.round(((pointerX - layout.left) / layout.plotWidth) * (layout.count - 1))
  return Math.max(0, Math.min(layout.count - 1, index))
}

export function valueRange(values: number[], min?: number, max?: number): [low: number, high: number] {
  const finite = values.filter(Number.isFinite)
  return [min ?? (finite.length ? Math.min(...finite) : 0), max ?? (finite.length ? Math.max(...finite) : 1)]
}

/** Linear interpolation at a fractional index, so the line is sampled every 3px regardless of length. */
export function interpolateAt(data: number[], fractionalIndex: number) {
  const index = Math.floor(fractionalIndex)
  const next = data[Math.min(data.length - 1, index + 1)]
  return data[index] + (next - data[index]) * (fractionalIndex - index)
}
