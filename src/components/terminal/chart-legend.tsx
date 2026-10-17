import { useTranslation } from 'react-i18next'

/**
 * Line under a chart: the idle hint, or the readout at the cursor. Touch selections persist until the next tap.
 * Without `touch` the idle hint follows the layout, as in the design: the tap wording below 600px.
 */
export function ChartLegend({ readout, touch }: { readout: string | null; touch?: boolean }) {
  const { t } = useTranslation()
  const idle = touch === undefined
    ? <><span className="max-sm:hidden">{t('terminal.chart.hover')}</span><span className="sm:hidden">{t('terminal.chart.tap')}</span></>
    : t(touch ? 'terminal.chart.tap' : 'terminal.chart.hover')
  return <span className="text-dim" aria-live="polite">{readout === null ? idle : t('terminal.chart.cursor', { readout })}</span>
}
