import { useTranslation } from 'react-i18next'
import { useNow } from '@/hooks/use-now'
import { intlLocale } from '@/i18n'
import { formatCountdown } from '@/features/space/lib/countdown'
import { ACCENT } from '@/features/space/lib/space-style'
import type { Launch } from '@/features/space/types'

/** The ticking countdown lives here alone, so only this card re-renders every second. */
export function NextLaunchCard({ launch }: { launch: Launch }) {
  const { t } = useTranslation()
  const now = useNow()
  const countdown = formatCountdown(Date.parse(launch.net), now)
  const date = new Date(launch.net).toLocaleString(intlLocale(), { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex gap-4">
      {launch.image && <img src={launch.image} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-fg-subtle">{t('space.launches.next')}</div>
        <div className="text-[15px] font-semibold text-white/90 truncate mt-0.5">{launch.mission}</div>
        <div className="text-[12px] text-fg-muted truncate">{launch.rocket}{launch.provider && ` · ${launch.provider}`}</div>
        <div className="mt-2 font-mono text-[26px] font-bold leading-none tabular-nums" style={{ color: ACCENT }} aria-live="off">
          {countdown ? `${t('space.launches.countdown')} ${countdown}` : t('space.launches.liftoff')}
        </div>
        <div className="text-[11px] text-fg-subtle mt-1.5">{date}{launch.pad && ` · ${launch.pad}`}</div>
      </div>
    </div>
  )
}
