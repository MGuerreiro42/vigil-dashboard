import type { CSSProperties } from 'react'

/** 12-column grid of the overview and space screens. */
export const GRID_12 = 'grid grid-cols-12 gap-x-[22px] gap-y-[28px]'

// Spans per breakpoint (<600 · 600–1023 · 1024–1279 · ≥1280), literal so Tailwind generates them
export const OVERVIEW_SPAN = {
  brief: 'col-span-12 lg:col-span-8',
  sources: 'col-span-12 lg:col-span-4',
  markets: 'col-span-12 sm:col-span-6 xl:col-span-4',
  planet: 'col-span-12 sm:col-span-6 xl:col-span-5',
  space: 'col-span-12 sm:col-span-6 xl:col-span-3',
  news: 'col-span-12 sm:col-span-6',
  tech: 'col-span-12 xl:col-span-6',
} as const

export const SPACE_SPAN = {
  launches: 'col-span-12 sm:col-span-6 xl:col-span-4',
  spaceWeather: 'col-span-12 sm:col-span-6 xl:col-span-5',
  asteroids: 'col-span-12 sm:col-span-6 xl:col-span-3',
  news: 'col-span-12 sm:col-span-6 xl:col-span-12',
} as const

/** Rows of panels that wrap on their own: markets 340, planet 460, news 440. */
export function autoFitGrid(minWidthPx: number): CSSProperties {
  return { display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(${minWidthPx}px, 100%), 1fr))`, gap: '28px 22px' }
}

/** Two-pane panels (list + detail) wrap through flex-basis. */
export const TWO_PANE = 'flex flex-wrap items-start gap-x-[28px] gap-y-[20px]'
