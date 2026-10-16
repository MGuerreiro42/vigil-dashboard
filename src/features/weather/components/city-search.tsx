import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCitySearch } from '@/features/weather/api/geocoding'
import { useGeoStore } from '@/store/geo-store'

const DEBOUNCE_MS = 300

export function CitySearch() {
  const { t } = useTranslation()
  const setPlace = useGeoStore((state) => state.setPlace)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const { data: places } = useCitySearch(debouncedQuery)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const isOpen = query.trim().length >= 2 && places !== undefined

  return (
    <div className="relative w-full sm:w-64">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && setQuery('')}
        placeholder={t('weather.search.placeholder')}
        aria-label={t('weather.search.placeholder')}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/85 placeholder:text-fg-subtle focus:outline-none focus:border-white/25"
      />
      {isOpen && (
        <ul className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-xl">
          {places.length === 0 && <li className="px-3 py-2 text-sm text-fg-subtle">{t('weather.search.noResults')}</li>}
          {places.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => { setPlace(place); setQuery('') }}
                className="flex w-full items-baseline gap-2 px-3 py-2 text-left hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none"
              >
                <span className="text-sm text-white/85">{place.name}</span>
                <span className="truncate text-[11px] text-fg-subtle">{place.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
