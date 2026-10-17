import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { SCREENS, type Screen } from './sections'

const MIN_REFRESH_FEEDBACK_MS = 900

export function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
}

/** Moves focus to the next or previous tab of the same tablist and selects it. */
function stepTab(tab: HTMLElement, direction: 1 | -1) {
  const tabs = [...(tab.closest('[role="tablist"]')?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])]
  const next = tabs[(tabs.indexOf(tab) + direction + tabs.length) % tabs.length]
  next?.focus()
  next?.click()
}

/** Global shortcuts: 1–6 screens, ←/→ between tabs, r refreshes the current screen. */
export function useTerminalKeys(screen: Screen, onRefreshing: (screenNumber: number | null) => void) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const screenRef = useRef(screen)
  useEffect(() => { screenRef.current = screen })

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined

    async function refresh(current: Screen) {
      clearTimeout(refreshTimer)
      onRefreshing(current.number)
      const roots: readonly string[] | null = current.queryRoots
      const startedAt = Date.now()
      await queryClient.invalidateQueries(roots ? { predicate: (query) => roots.includes(String(query.queryKey[0])) } : undefined)
      refreshTimer = setTimeout(() => onRefreshing(null), Math.max(0, MIN_REFRESH_FEEDBACK_MS - (Date.now() - startedAt)))
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      const target = event.target instanceof HTMLElement ? event.target : null

      if (target?.getAttribute('role') === 'tab' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault()
        stepTab(target, event.key === 'ArrowRight' ? 1 : -1)
        return
      }
      const screenByKey = SCREENS.find((item) => String(item.number) === event.key)
      if (screenByKey) navigate(screenByKey.path)
      else if (event.key === 'r') void refresh(screenRef.current)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(refreshTimer)
    }
  }, [navigate, queryClient, onRefreshing])
}
