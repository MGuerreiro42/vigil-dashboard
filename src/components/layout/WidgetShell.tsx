import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/surfaces/GlassCard'
import type { WidgetId } from '@/store/app.store'

interface WidgetShellProps {
  id: WidgetId
  title: string
  icon: React.ReactNode
  isLoading: boolean
  error: Error | null
  lastUpdated?: number
  onRetry?: () => void
  accentColor?: string
  children: React.ReactNode
  className?: string
  isFocused?: boolean
  /** When true shows a pulsing LIVE badge — use for WebSocket / fast-polling widgets */
  isLive?: boolean
  /** Route to navigate to when the expand icon is clicked (compact mode only) */
  viewRoute?: string
  /** When true the content wrapper fills height and does not scroll.
   *  Use for widgets that need a flex-1 chain down to fixed-size panels (e.g. maps). */
  fillHeight?: boolean
}

function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function SkeletonLine({ width = 'full' }: { width?: string }) {
  return (
    <motion.div
      className={`h-3 rounded-full bg-white/8 w-${width}`}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
    />
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <SkeletonLine width="3/4" />
      <SkeletonLine />
      <SkeletonLine width="5/6" />
      <SkeletonLine width="2/3" />
      <SkeletonLine />
    </div>
  )
}

export function WidgetShell({
  id: _id,
  title,
  icon,
  isLoading,
  error,
  lastUpdated,
  onRetry,
  accentColor,
  children,
  className = '',
  isFocused = false,
  isLive = false,
  viewRoute,
  fillHeight = false,
}: WidgetShellProps) {
  return (
    <GlassCard
      accentColor={accentColor}
      className={`flex flex-col h-full ${className}`}
      whileHover={isFocused ? undefined : { y: -2, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center"
            style={{ color: accentColor ?? 'rgba(255,255,255,0.5)', minWidth: isFocused ? 28 : 22 }}
          >
            {icon}
          </span>
          <span className={`font-medium text-white/80 tracking-wide ${isFocused ? 'text-base' : 'text-sm'}`}>
            {title}
          </span>
        </div>
        <div className={`flex items-center gap-2 ${isFocused ? 'pr-10' : ''}`}>
          {/* LIVE indicator for real-time widgets */}
          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <motion.div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#10b981' }}
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              />
              <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-400">live</span>
            </div>
          )}
          {lastUpdated && (
            <span className="text-[12px] text-white/28 tabular-nums">
              {formatRelative(lastUpdated)}
            </span>
          )}
          {/* Expand → navigate to dedicated page (only in compact mode) */}
          {viewRoute && !isFocused && (
            <Link
              to={viewRoute}
              className="text-white/28 hover:text-white/60 transition-colors p-0.5 rounded"
              aria-label="Abrir página completa"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M7.5 1.5h3v3M4.5 10.5h-3v-3M10.5 1.5L7 5M1.5 10.5L5 7"/>
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Accent line */}
      {accentColor && (
        <div
          className="mx-4 h-px mb-3 flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${accentColor}60, transparent)` }}
        />
      )}

      {/* Content */}
      <div className={`flex-1 px-4 pb-4 min-h-0 ${isFocused && !fillHeight ? 'overflow-auto' : 'overflow-hidden'}`}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-3 py-8"
            >
              <span className="text-white/30 text-sm">Falha ao carregar dados</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs px-3 py-1.5 rounded-md border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
                >
                  Tentar novamente
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={fillHeight ? 'h-full flex flex-col' : ''}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}
