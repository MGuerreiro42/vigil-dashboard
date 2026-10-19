import { useTranslation } from 'react-i18next'
import { BlockBar, LegendGrid, ToneText } from '@/components/terminal/text'
import { QUAKE_BANDS_DOWN, QUAKE_SCALE, quakeBandCounts, quakeTone, shortPlace, sortQuakes } from '@/features/earthquakes/lib/quake-terminal'
import type { Earthquake } from '@/features/earthquakes/types'

const BAR_WIDTH = 20
const PHONE_BAR_WIDTH = 10

/** Symbol in its level colour, name in text, range in dim; one row on desktop, 2×2 at 390. */
export function QuakeLegend() {
  const { t } = useTranslation()
  return (
    <LegendGrid minItem={150} gap="4px 24px">
      {QUAKE_BANDS_DOWN.map((band) => (
        <span key={band} className="flex gap-[8px]">
          <ToneText tone={QUAKE_SCALE[band].tone} className="font-semibold">{QUAKE_SCALE[band].glyph}</ToneText>
          <span>{t(`terminal.planet.quakes.bands.${band}`)}</span>
          <span className="text-dim">{QUAKE_SCALE[band].range}</span>
        </span>
      ))}
    </LegendGrid>
  )
}

/** [3.2] distribution: one row per level, bars on one scale with the largest count at full width. */
export function QuakeDistribution({ quakes }: { quakes: Earthquake[] }) {
  const { t } = useTranslation()
  const counts = quakeBandCounts(quakes)
  const maxCount = Math.max(...Object.values(counts))
  const largest = sortQuakes(quakes, 'magnitudeDown')[0]

  return (
    <div className="flex max-w-[640px] flex-col gap-[6px]">
      {/* The range lives only in the legend on phones */}
      <div className="grid grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] items-center gap-x-[14px] gap-y-[3px] max-sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] max-sm:gap-x-[10px]">
        {QUAKE_BANDS_DOWN.map((band) => {
          const { glyph, tone, range } = QUAKE_SCALE[band]
          const count = counts[band]
          return (
            <div key={band} className="contents">
              <ToneText tone={tone} className="font-semibold">{glyph}</ToneText>
              <span>{t(`terminal.planet.quakes.bands.${band}`)}</span>
              <span className="text-dim max-sm:hidden">{range}</span>
              <span className="min-w-0 overflow-hidden">
                {count > 0 && <BlockBar value={count} max={maxCount} width={BAR_WIDTH} phoneWidth={PHONE_BAR_WIDTH} tone={tone} />}
              </span>
              <ToneText tone={band === 'minor' ? 'text' : tone} className="text-right">{count}</ToneText>
            </div>
          )
        })}
      </div>
      {/* Two items in a flex-wrap, so a wrapped line never starts with "·" */}
      <span className="flex flex-wrap gap-x-[16px] text-dim">
        <span>
          {t('terminal.planet.quakes.distributionNote', { count: quakes.length })}{' '}
          <ToneText tone={quakeTone(largest.magnitude)}>M{largest.magnitude.toFixed(1)}</ToneText> {shortPlace(largest.place)}
        </span>
        <span className="whitespace-nowrap">{t('terminal.planet.quakes.barNote')}</span>
      </span>
    </div>
  )
}
