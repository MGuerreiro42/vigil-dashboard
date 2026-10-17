const STORAGE_KEY = 'vigil-last-visit'

type VisitStorage = Pick<Storage, 'getItem' | 'setItem'>

function browserStorage(): VisitStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** When the user last left the app, or null on a first visit or without storage. */
export function readLastVisit(storage: VisitStorage | null = browserStorage()): number | null {
  try {
    const stored = Number(storage?.getItem(STORAGE_KEY))
    return Number.isFinite(stored) && stored > 0 ? stored : null
  } catch {
    return null
  }
}

export function recordVisit(at: number, storage: VisitStorage | null = browserStorage()) {
  try {
    storage?.setItem(STORAGE_KEY, String(at))
  } catch {
    // Private mode or full storage: the brief falls back to the session start
  }
}

// Read once per page load, so the previous visit does not move while the user switches screens
const sessionStart = Date.now()
const previousVisit = readLastVisit()

/** "desde HH:MM": the previous visit, or this session's start on a first visit. */
export function sinceLastVisit(): number {
  return previousVisit ?? sessionStart
}

/** Stamps the visit whenever the page is hidden, which also covers closing the tab. */
export function trackVisits() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') recordVisit(Date.now())
  })
  window.addEventListener('pagehide', () => recordVisit(Date.now()))
}
