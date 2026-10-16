import { ACCENT } from '@/features/github/lib/github-format'
import type { GithubRepo } from '@/features/github/types'
import { LangBadge } from './lang-badge'
import { useTranslation } from 'react-i18next'

export function RepoDetail({ repo }: { repo: GithubRepo | null }) {
  const { t } = useTranslation()
  if (!repo) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-fg-subtle">{t('github.selectRepo')}</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#06080f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
      <div className="mb-3">
        <div className="text-base font-bold text-white/90">{repo.name}</div>
        <div className="text-[12px] text-fg-muted mt-0.5">{repo.fullName}</div>
      </div>
      {repo.description && (
        <p className="text-sm text-white/60 leading-relaxed mb-3">{repo.description}</p>
      )}
      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {repo.topics.map((topic) => (
            <span key={topic} className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: ACCENT + '18', color: ACCENT, border: `1px solid ${ACCENT}30` }}>
              #{topic}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[12px] text-white/60">⭐ {repo.stars.toLocaleString()}</span>
        <span className="text-[12px] text-white/60">🍴 {repo.forks.toLocaleString()}</span>
        <LangBadge lang={repo.language} />
      </div>
      <a
        href={repo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: ACCENT + '20', color: ACCENT, border: `1px solid ${ACCENT}40` }}
      >
        {t('github.openOnGithub')}
      </a>
    </div>
  )
}
