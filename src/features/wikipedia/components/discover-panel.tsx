import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isTyping } from '@/components/layout/use-terminal-keys'
import { QueryPanel } from '@/components/terminal/query-panel'
import { Tabs } from '@/components/terminal/tabs'
import { BracketButton, ExternalLink } from '@/components/terminal/text'
import { discoverTimer, readingMinutes } from '@/features/news/lib/news-terminal'
import { useRandomWikipedia } from '@/features/wikipedia/api/wikipedia'
import { WIKI_LANGUAGES, type WikiLangCode, type WikiSummary } from '@/features/wikipedia/types'
import { useAutoAdvance } from '@/hooks/use-auto-advance'
import { intlLocale } from '@/i18n'
import { formatShortDate } from '@/lib/terminal-format'

const AUTO_ADVANCE_MS = 120_000
const LANGUAGE_ITEMS = WIKI_LANGUAGES.map((language) => ({ id: language.code, label: language.code }))

/** n / p step through articles while the news screen is open. */
function useDiscoverKeys(onNext: () => void, onPrevious: () => void) {
  const handlers = useRef({ onNext, onPrevious })
  useEffect(() => { handlers.current = { onNext, onPrevious } })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      if (event.key === 'n') handlers.current.onNext()
      else if (event.key === 'p') handlers.current.onPrevious()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

function Article({ article }: { article: WikiSummary }) {
  const { t } = useTranslation()
  const date = new Date(article.timestamp)
  return (
    <div className="flex max-w-[80ch] flex-col gap-[6px]">
      <span className="text-title font-semibold text-text">{article.title}</span>
      {article.description && <span className="text-dim">{article.description}</span>}
      <span className="text-pretty">{article.extract}</span>
      <span className="text-dim">
        {formatShortDate(date, intlLocale())} {date.getFullYear()} · {t('terminal.news.discover.reading', { minutes: readingMinutes(article.extract) })} · {article.lang}
      </span>
      <ExternalLink href={article.content_urls.desktop.page} className="self-start">{t('terminal.news.discover.readFull')}</ExternalLink>
    </div>
  )
}

/** [5.4] A random Wikipedia article that changes every two minutes; n / p step forward and back. */
export function DiscoverPanel() {
  const { t, i18n } = useTranslation()
  const [language, setLanguage] = useState<WikiLangCode>(i18n.resolvedLanguage === 'en' ? 'en' : 'pt')
  // Seeds start at the clock so a reload draws a new article instead of the cached one
  const [firstSeed] = useState(() => Date.now())
  const [seed, setSeed] = useState(firstSeed)
  const [paused, setPaused] = useState(false)
  const query = useRandomWikipedia(language, seed)

  const next = () => setSeed((current) => current + 1)
  // Earlier seeds are still cached, so going back shows the same article again
  const previous = () => setSeed((current) => Math.max(firstSeed, current - 1))
  const progress = useAutoAdvance(AUTO_ADVANCE_MS, `${language}-${seed}`, next, paused)
  useDiscoverKeys(next, previous)
  const timer = discoverTimer(progress, AUTO_ADVANCE_MS)

  return (
    <QueryPanel id="5.4" title={t('terminal.news.discover.title')} gap={12} meta={t('terminal.news.discover.meta')} query={query} source="wikipedia">
      {(article) => (
        <>
          <div className="flex flex-wrap justify-between gap-x-[16px] gap-y-[8px]">
            <Tabs variant="text" label={t('terminal.news.discover.language')} items={LANGUAGE_ITEMS} value={language} onChange={setLanguage} />
            <div className="flex flex-wrap gap-x-[16px]">
              <BracketButton onClick={() => setPaused((current) => !current)}>{t(paused ? 'terminal.news.discover.resume' : 'terminal.news.discover.pause')}</BracketButton>
              <BracketButton onClick={previous} disabled={seed === firstSeed} className="disabled:cursor-default disabled:text-dim disabled:no-underline">{t('terminal.news.discover.previous')}</BracketButton>
              <BracketButton onClick={next}>{t('terminal.news.discover.next')}</BracketButton>
            </div>
          </div>
          <Article article={article} />
          <span className="whitespace-pre text-dim max-sm:whitespace-pre-wrap">
            {paused ? t('terminal.news.discover.paused') : `${t('terminal.news.discover.nextIn', { time: timer.left })}  ${timer.bar}`}
          </span>
        </>
      )}
    </QueryPanel>
  )
}
