export const SCREENS = [
  // queryRoots: first element of the query keys a screen shows, refreshed by the `r` key
  { number: 1, id: 'overview', path: '/', prompt: '~', queryRoots: null },
  { number: 2, id: 'markets', path: '/markets', prompt: '~/markets', queryRoots: ['crypto', 'economy'] },
  { number: 3, id: 'planet', path: '/planet', prompt: '~/planet', queryRoots: ['earthquakes', 'natural-events', 'weather', 'air-quality', 'radar-frames'] },
  { number: 4, id: 'space', path: '/space', prompt: '~/space', queryRoots: ['iss', 'space'] },
  { number: 5, id: 'news', path: '/news', prompt: '~/news', queryRoots: ['news', 'wikipedia', 'bluesky-trends'] },
  { number: 6, id: 'tech', path: '/tech', prompt: '~/tech', queryRoots: ['github', 'hacker-news'] },
] as const

export type Screen = (typeof SCREENS)[number]

/** Screen for a pathname; unknown paths (like the dev primitives sheet) fall back to the overview. */
export function screenForPath(pathname: string): Screen {
  return SCREENS.find((screen) => screen.path !== '/' && pathname.startsWith(screen.path)) ?? SCREENS[0]
}
