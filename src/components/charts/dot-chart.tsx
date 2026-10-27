import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { prepareCanvas, useCanvasSize, useFontsReady } from '@/components/geo/dot-canvas'
import { createColorResolver } from '@/components/geo/dot-palette'
import { chartLayout, indexAtX } from './dot-chart-math'
import { drawDotChart, type ChartAxis, type ChartSeries } from './draw-dot-chart'

interface Props {
  /** Accessible description of what the chart shows */
  label: string
  series: ChartSeries[]
  min?: number
  max?: number
  ticks?: number
  /** Left axis labels; keep it stable (module scope or useCallback) to avoid redraws */
  format?: (value: number) => string
  /** Spread evenly across the plot; '' keeps a slot without text */
  xLabels?: string[]
  padLeft?: number
  rightAxis?: ChartAxis
  /** Dashed horizontal line at this left-axis value */
  referenceLine?: number
  /** Index under the cursor (longest series), null when it leaves; feeds the panel's legend line */
  onCursorChange?: (index: number | null) => void
  /** CSS height, e.g. `170px` or `clamp(200px,32vw,300px)` */
  height: string | number
  className?: string
  style?: CSSProperties
}

const defaultFormat = (value: number) => value.toFixed(0)

/** Canvas dotted line chart with a dotted cursor; hover inspects, a tap pins a point. */
export function DotChart({ label, series, min, max, ticks = 4, format = defaultFormat, xLabels, padLeft = 52, rightAxis, referenceLine, onCursorChange, height, className = '', style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = useCanvasSize(canvasRef)
  const fontsReady = useFontsReady()
  const [cursorIndex, setCursorIndex] = useState<number | null>(null)
  const count = Math.max(0, ...series.map((entry) => entry.data.length))
  const layout = chartLayout(size.width, size.height, { padLeft, hasRightAxis: Boolean(rightAxis), count })
  const { plotWidth, plotHeight } = layout

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = prepareCanvas(canvas, size)
    if (!context) return
    const currentLayout = chartLayout(size.width, size.height, { padLeft, hasRightAxis: Boolean(rightAxis), count })
    drawDotChart(context, { ...size, layout: currentLayout, series, min, max, ticks, format, xLabels, rightAxis, referenceLine, cursorIndex }, createColorResolver())
  }, [size, fontsReady, padLeft, count, series, min, max, ticks, format, xLabels, rightAxis, referenceLine, cursorIndex])

  const updateCursor = (index: number | null) => {
    if (index === cursorIndex) return
    setCursorIndex(index)
    onCursorChange?.(index)
  }
  const inspect = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!count || plotWidth <= 0 || plotHeight <= 0) return
    updateCursor(indexAtX(event.clientX - event.currentTarget.getBoundingClientRect().left, layout))
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={`block w-full ${className}`}
      style={{ height, cursor: 'crosshair', ...style }}
      onPointerMove={(event) => { if (event.pointerType !== 'touch') inspect(event) }}
      onPointerDown={inspect}
      // A tap pins the cursor on touch screens; only a mouse leaving clears it
      onPointerLeave={(event) => { if (event.pointerType === 'mouse') updateCursor(null) }}
    />
  )
}
