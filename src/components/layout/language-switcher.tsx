import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  return (
    <div role="group" aria-label={t('header.language')} className="flex rounded-lg border border-white/[0.08] overflow-hidden">
      {LANGUAGES.map((language) => {
        const active = i18n.resolvedLanguage === language.code
        return (
          <button
            key={language.code}
            onClick={() => i18n.changeLanguage(language.code)}
            aria-pressed={active}
            className={`px-2 py-1 text-[11px] font-semibold transition-colors ${active ? 'bg-white/[0.08] text-white/85' : 'text-fg-subtle hover:text-white/70'}`}
          >
            {language.label}
          </button>
        )
      })}
    </div>
  )
}
