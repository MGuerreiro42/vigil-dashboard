export const SECTIONS = [
  { id: 'overview', path: '/', icon: '◉' },
  { id: 'markets', path: '/markets', icon: '📈' },
  { id: 'planet', path: '/planet', icon: '🌍' },
  { id: 'space', path: '/space', icon: '🛰️' },
  { id: 'news', path: '/news', icon: '📰' },
  { id: 'tech', path: '/tech', icon: '💻' },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']
