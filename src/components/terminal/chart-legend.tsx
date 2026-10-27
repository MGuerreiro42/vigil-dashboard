import { useTranslation } from 'react-i18next'

/** Line under a chart: the idle hint, or the readout at the cursor. Touch selections persist until the next tap. */
export function ChartLegend({ readout, touch = false }: { readout: string | null; touch?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className="text-dim" aria-live="polite">
      {readout === null ? t(touch ? 'terminal.chart.tap' : 'terminal.chart.hover') : t('terminal.chart.cursor', { readout })}
    </span>
  )
}
