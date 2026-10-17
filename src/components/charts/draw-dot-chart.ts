import type { ColorResolver } from '@/components/geo/dot-palette'
import { interpolateAt, valueRange, visibleXLabelIndices, type ChartLayout } from './dot-chart-math'

// Decision 14: no text below 12px, canvas axes included
const AXIS_FONT = '12px "IBM Plex Mono", monospace'

export interface ChartSeries {
  data: number[]
  /** Hex or custom property name, e.g. `--color-warn` */
  color: string
  /** Dotted area under the line */
  fill?: boolean
}

export interface ChartAxis {
  min: number
  max: number
  format?: (value: number) => string
  series: ChartSeries[]
}

export interface ChartScene {
  width: number
  height: number
  layout: ChartLayout
  series: ChartSeries[]
  min?: number
  max?: number
  ticks: number
  format: (value: number) => string
  xLabels?: string[]
  rightAxis?: ChartAxis
  referenceLine?: number
  cursorIndex: number | null
}

const defaultFormat = (value: number) => value.toFixed(0)

export function drawDotChart(context: CanvasRenderingContext2D, scene: ChartScene, resolveColor: ColorResolver) {
  const { width, height, layout, ticks } = scene
  const { left, top, plotWidth, plotHeight } = layout
  const background = resolveColor('--color-bg')
  const dim = resolveColor('--color-dim')
  const [low, high] = valueRange(scene.series.flatMap((series) => series.data), scene.min, scene.max)
  const yFor = (value: number, rangeLow: number, rangeHigh: number) => top + plotHeight - ((value - rangeLow) / (rangeHigh - rangeLow || 1)) * plotHeight

  context.fillStyle = background
  context.fillRect(0, 0, width, height)
  context.font = AXIS_FONT
  context.textBaseline = 'middle'

  for (let tick = 0; tick <= ticks; tick++) {
    const y = top + plotHeight - (plotHeight * tick) / ticks
    context.fillStyle = resolveColor('--color-grat')
    for (let x = left; x < left + plotWidth; x += 4) context.fillRect(x, y, 1.5, 1.5)
    context.fillStyle = dim
    context.textAlign = 'right'
    context.fillText(scene.format(low + ((high - low) * tick) / ticks), left - 8, y)
    if (scene.rightAxis) {
      const axis = scene.rightAxis
      context.textAlign = 'left'
      context.fillText((axis.format ?? defaultFormat)(axis.min + ((axis.max - axis.min) * tick) / ticks), left + plotWidth + 8, y)
    }
  }

  if (scene.xLabels) {
    const labels = scene.xLabels
    const lastIndex = labels.length - 1
    context.fillStyle = dim
    for (const index of visibleXLabelIndices(labels, plotWidth)) {
      context.textAlign = lastIndex === 0 ? 'center' : index === 0 ? 'left' : index === lastIndex ? 'right' : 'center'
      context.fillText(labels[index], lastIndex === 0 ? left + plotWidth / 2 : left + (plotWidth * index) / lastIndex, height - 9)
    }
  }

  const plot = (series: ChartSeries, rangeLow: number, rangeHigh: number) => {
    const { data } = series
    if (!data.length) return
    const color = resolveColor(series.color)
    let previousY: number | null = null
    for (let x = 0; x <= plotWidth; x += 3) {
      const y = yFor(interpolateAt(data, plotWidth ? (x / plotWidth) * (data.length - 1) : 0), rangeLow, rangeHigh)
      if (series.fill) {
        context.fillStyle = color
        context.globalAlpha = 0.16
        for (let fillY = y + 4; fillY < top + plotHeight; fillY += 4) context.fillRect(left + x, fillY, 1.6, 1.6)
        context.globalAlpha = 1
      }
      context.fillStyle = color
      if (previousY === null) {
        context.fillRect(left + x - 1, y - 1, 2.2, 2.2)
      } else {
        // Vertical runs between samples make the stair-stepped dotted line
        for (let runY = Math.min(previousY, y); runY <= Math.max(previousY, y); runY += 2) context.fillRect(left + x - 1, runY - 1, 2.2, 2.2)
      }
      previousY = y
    }
  }
  scene.series.forEach((series) => plot(series, low, high))
  const { rightAxis } = scene
  rightAxis?.series.forEach((series) => plot(series, rightAxis.min, rightAxis.max))

  if (scene.referenceLine != null) {
    const y = yFor(scene.referenceLine, low, high)
    context.fillStyle = resolveColor('--color-warn')
    for (let x = left; x < left + plotWidth; x += 6) context.fillRect(x, y, 3, 1)
  }

  const { count } = layout
  if (scene.cursorIndex == null || count < 1) return
  const cursorIndex = Math.min(scene.cursorIndex, count - 1)
  const cursorX = count > 1 ? left + (plotWidth * cursorIndex) / (count - 1) : left
  context.fillStyle = resolveColor('--color-text')
  for (let y = top; y < top + plotHeight; y += 4) context.fillRect(Math.round(cursorX), y, 1, 2)
  const marker = (series: ChartSeries, rangeLow: number, rangeHigh: number) => {
    if (!series.data.length) return
    const dataIndex = count > 1 ? Math.round((cursorIndex / (count - 1)) * (series.data.length - 1)) : 0
    const y = yFor(series.data[dataIndex], rangeLow, rangeHigh)
    context.fillStyle = background
    context.fillRect(cursorX - 5, y - 5, 10, 10)
    context.fillStyle = resolveColor(series.color)
    context.fillRect(cursorX - 3, y - 3, 6, 6)
  }
  scene.series.forEach((series) => marker(series, low, high))
  rightAxis?.series.forEach((series) => marker(series, rightAxis.min, rightAxis.max))
}
