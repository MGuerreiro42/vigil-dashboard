import { LANG_COLORS } from '@/features/github/lib/github-format'

export function LangBadge({ lang }: { lang: string | null }) {
  if (!lang) return null
  const color = LANG_COLORS[lang] ?? '#8b8fa8'
  return (
    <span className="flex items-center gap-1 text-[11px] text-white/50">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {lang}
    </span>
  )
}
