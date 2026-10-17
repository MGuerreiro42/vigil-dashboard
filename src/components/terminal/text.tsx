import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AlertSeverity } from '@/store/alerts-store'
import type { Tone } from '@/lib/terminal-format'
import { blockBar, pollutantBar, sparkline } from '@/lib/text-bars'
import { metaPieces, type MetaSegment } from './priority'
import { TONE_CLASS } from './tone'

/** Coloured inline text: badges and levels are plain text, never a filled chip. */
export function ToneText({ tone, className = '', children }: { tone: Tone; className?: string; children: ReactNode }) {
  return <span className={`${TONE_CLASS[tone]} ${className}`}>{children}</span>
}

const LEVEL_TONE: Record<AlertSeverity, Tone> = { critical: 'err', warning: 'warn', info: 'info' }

/** ERRO / AVISO / INFO. */
export function Level({ severity }: { severity: AlertSeverity }) {
  const { t } = useTranslation()
  return <ToneText tone={LEVEL_TONE[severity]}>{t(`terminal.levels.${severity}`)}</ToneText>
}

export function BlockBar({ value, max, width, tone = 'text' }: { value: number; max: number; width: number; tone?: Tone }) {
  return <ToneText tone={tone} className="overflow-hidden whitespace-nowrap">{blockBar(value, max, width)}</ToneText>
}

export function Sparkline({ values, tone = 'info' }: { values: number[]; tone?: Tone }) {
  return <ToneText tone={tone} className="whitespace-nowrap">{sparkline(values)}</ToneText>
}

export function PollutantBar({ value, limit }: { value: number; limit: number }) {
  const bar = pollutantBar(value, limit)
  return (
    <span className="whitespace-nowrap">
      <ToneText tone={bar.overLimit ? 'err' : 'ok'}>{bar.filled}</ToneText>
      <ToneText tone="dim">{bar.rest}</ToneText>
    </span>
  )
}

/** `[dispensar]`, `[r] tentar agora`: an inline text button. */
export function BracketButton({ tone = 'info', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return <button type="button" className={`inline ${TONE_CLASS[tone]} hover:underline ${className}`} {...props} />
}

/** Link that opens outside the app; `↗` is part of the label, as in the design. */
export function ExternalLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a target="_blank" rel="noopener noreferrer" {...props} />
}

/**
 * Metadata line: every segment joined by " · " from 600px; below, the first two p1 segments and the
 * last of them truncates. Never wraps.
 */
export function MetaLine({ segments, className = '' }: { segments: (MetaSegment | null | undefined | false)[]; className?: string }) {
  const pieces = metaPieces(segments)
  return (
    <span className={`flex min-w-0 overflow-hidden whitespace-pre text-dim ${className}`}>
      {pieces.map((piece, index) => {
        const last = index === pieces.length - 1
        // The truncating segment gives way first; the others shrink only once it is gone, so nothing overflows
        const shrink = last ? 'shrink-[999]' : piece.phoneLast ? 'shrink max-sm:shrink-[999]' : 'shrink'
        const fit = `min-w-0 overflow-hidden text-ellipsis ${shrink}`
        return (
          <span key={index} className={`${fit} ${piece.phone ? '' : 'max-sm:hidden'}`}>
            {index > 0 && <span className={piece.phoneFirst ? 'max-sm:hidden' : ''}> · </span>}
            {piece.text}
          </span>
        )
      })}
    </span>
  )
}

/** Legend as a grid of items that never break in the middle; names in text, the glyph carries the colour. */
export function LegendGrid({ minItem, gap = '4px 20px', className = '', children }: { minItem: number; gap?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`grid whitespace-nowrap ${className}`} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${minItem}px, 100%), max-content))`, gap }}>
      {children}
    </div>
  )
}

/** "what is empty" plus "why, or when it comes back"; never just "no data". */
export function EmptyState({ title, hint }: { title: ReactNode; hint: ReactNode }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <span>{title}</span>
      <span className="text-dim">{hint}</span>
    </div>
  )
}
