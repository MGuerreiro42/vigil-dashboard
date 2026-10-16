import { motion } from 'framer-motion'
import type { WikiSummary } from '@/features/wikipedia/types'
import { WikiThumb } from './wiki-thumb'
import { ACCENT } from '@/features/wikipedia/lib/article-format'

export function HistoryItem({
  article,
  index,
  isActive,
  onClick,
}: {
  article: WikiSummary
  index: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="flex gap-2 p-2 rounded-lg text-left w-full transition-colors hover:bg-white/[0.04] flex-shrink-0"
      style={{
        background: isActive ? ACCENT + '12' : undefined,
        outline: isActive ? `1px solid ${ACCENT}35` : 'none',
      }}
    >
      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
        <WikiThumb
          src={article.thumbnail?.source}
          alt=""
          className="w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-white/78 leading-tight line-clamp-1">
          {article.title}
        </div>
        {article.description && (
          <div className="text-[11px] text-white/32 leading-tight line-clamp-1 mt-0.5">
            {article.description}
          </div>
        )}
      </div>
    </motion.button>
  )
}
