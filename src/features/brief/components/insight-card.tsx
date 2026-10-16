import { motion } from 'framer-motion'
import { type BriefInsight } from '@/features/brief/lib/generate-brief'


const CATEGORY_ICONS: Record<string, string> = {
  crypto: '₿', weather: '🌤', seismic: '🌍', air: '💨', tech: '💻',
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#22d3ee', warning: '#f59e0b', alert: '#f43f5e',
}

const SEVERITY_LABELS: Record<string, string> = {
  info: 'Info', warning: 'Atenção', alert: 'Alerta',
}

// Insight card — cards de alerta/warning são maiores e mais proeminentes
export function InsightCard({ insight, index }: { insight: BriefInsight; index: number }) {
  const color = SEVERITY_COLORS[insight.severity]
  const icon = CATEGORY_ICONS[insight.category]
  const isUrgent = insight.severity !== 'info'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 320, damping: 28 }}
      className={`relative flex-shrink-0 rounded-xl overflow-hidden ${isUrgent ? 'min-w-[220px] max-w-[260px]' : 'min-w-[190px] max-w-[230px]'}`}
      style={{
        background: isUrgent
          ? `linear-gradient(135deg, ${color}18, ${color}08)`
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}${isUrgent ? '35' : '18'}`,
        boxShadow: isUrgent ? `0 0 24px ${color}12` : 'none',
      }}
    >
      {/* Top accent bar — hierarquia visual: urgentes têm barra mais espessa */}
      <div
        className="absolute top-0 inset-x-0"
        style={{
          height: isUrgent ? '2px' : '1px',
          background: `linear-gradient(90deg, ${color}, transparent)`,
          opacity: isUrgent ? 1 : 0.5,
        }}
      />

      <div className="px-3 py-3">
        {/* Header do card */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={isUrgent ? 'text-base' : 'text-sm'}>{icon}</span>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color }}
            >
              {SEVERITY_LABELS[insight.severity]}
            </span>
          </div>
          {/* Pulse dot apenas em alertas */}
          {isUrgent && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full"
              style={{ background: color, boxShadow: `0 0 6px ${color}` }}
            />
          )}
        </div>

        {/* Headline — fonte maior em urgentes (Gestalt: figura-fundo, contraste) */}
        <p
          className={`font-semibold leading-snug ${isUrgent ? 'text-sm text-white/92' : 'text-[13px] text-white/75'}`}
        >
          {insight.headline}
        </p>

        {/* Detail — secundário, menor */}
        <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed line-clamp-2">
          {insight.detail}
        </p>

        {/* Sources — mínimo, só para referência */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {insight.dataSource.map((src) => (
            <span
              key={src}
              className="text-[10px] px-1.5 py-px rounded-sm"
              style={{ background: `${color}12`, color: `${color}80` }}
            >
              {src}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
