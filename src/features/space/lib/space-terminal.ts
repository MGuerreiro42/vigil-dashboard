import type { Tone } from '@/lib/terminal-format'
import { SPARK_LEVELS } from '@/lib/text-bars'
import type { NearEarthObject, SpaceAlert } from '@/features/space/types'

export const kpTone = (kp: number): Tone => (kp >= 6 ? 'err' : kp >= 5 ? 'warn' : 'ok')

export interface KpCell {
  char: string
  tone: Tone | 'rim'
}

const KP_ROWS = 4
const KP_PER_ROW = 9 / KP_ROWS
// Row 2 (kp 4.5–6.75) draws the dashed G1 threshold where it is empty
const THRESHOLD_ROW = 2
const G1_KP = 5

/** One reading as a column of 4 block characters, top row first; kp 0–9 maps to 32 eighths. */
export function kpColumn(kp: number): KpCell[] {
  return Array.from({ length: KP_ROWS }, (_, index) => {
    const row = KP_ROWS - 1 - index
    const level = Math.max(0, Math.min(8, Math.round(((kp - row * KP_PER_ROW) / KP_PER_ROW) * 8)))
    if (level > 0) return { char: SPARK_LEVELS[level - 1], tone: kpTone(kp) }
    if (row === THRESHOLD_ROW) return { char: kp < G1_KP ? '-' : ' ', tone: 'rim' }
    return { char: ' ', tone: kpTone(kp) }
  })
}

export type NoaaTag = 'alert' | 'warning' | 'watch' | 'summary'

const NOAA_TONE: Record<NoaaTag, Tone> = { alert: 'err', warning: 'warn', watch: 'warn', summary: 'dim' }

/** Bulletins without a recognizable headline are shown as summaries, as the design does with "A30F". */
export function noaaTag(kind: SpaceAlert['kind']): { tag: NoaaTag; tone: Tone } {
  const tag = kind === 'other' ? 'summary' : kind
  return { tag, tone: NOAA_TONE[tag] }
}

export type LaunchStatus = 'go' | 'tbc' | 'tbd' | 'hold' | 'inFlight' | 'success' | 'partial' | 'failure'

const LAUNCH_STATUS: Record<string, { status: LaunchStatus; tone: Tone }> = {
  Go: { status: 'go', tone: 'ok' },
  TBC: { status: 'tbc', tone: 'warn' },
  TBD: { status: 'tbd', tone: 'dim' },
  Hold: { status: 'hold', tone: 'warn' },
  'In Flight': { status: 'inFlight', tone: 'info' },
  Success: { status: 'success', tone: 'ok' },
  'Partial Failure': { status: 'partial', tone: 'warn' },
  Failure: { status: 'failure', tone: 'err' },
}

/** Launch Library status abbreviation → label key and tone; an unknown status reads as "no date yet". */
export const launchStatus = (abbrev: string) => LAUNCH_STATUS[abbrev] ?? LAUNCH_STATUS.TBD

/** "144900 (2004 VG64)" → "2004 VG64", "433 Eros (A898 PA)" → "Eros": the catalogue number stays in the title. */
export function asteroidLabel(name: string): string {
  const numbered = /^\d+ (?:\((.+)\)|(.+?) \(.+\))$/.exec(name)
  return numbered ? (numbered[1] ?? numbered[2]) : name
}

/** kp with two decimals in the active language: pt "3,67", en "3.67". */
export const formatKp = (kp: number, locale: string) => kp.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const meanDiameter = (neo: NearEarthObject) => (neo.diameterMinMeters + neo.diameterMaxMeters) / 2
