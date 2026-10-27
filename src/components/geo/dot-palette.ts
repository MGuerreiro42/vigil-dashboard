// Spec hex values, used until the shell defines the tokens (and in tests, where no CSS loads)
const TOKEN_FALLBACKS: Record<string, string> = {
  '--color-bg': '#0b0d0b',
  '--color-text': '#c8d3c5',
  '--color-dim': '#8d998a',
  '--color-line': '#2a312a',
  '--color-ok': '#7ee08a',
  '--color-err': '#ff7a6e',
  '--color-warn': '#f2c46d',
  '--color-info': '#7fd4e0',
  '--color-land': '#5c6b58',
  '--color-land-iss': '#4f5e4c',
  '--color-rim': '#3d4a3b',
  '--color-grat': '#1f271e',
  '--color-cross': '#232b22',
  '--color-rain-weak': '#2f5f66',
}

export type ColorResolver = (color: string) => string

/** Colors given as a custom property name (`--color-info`) resolve against the root styles. */
export function createColorResolver(): ColorResolver {
  const rootStyle = getComputedStyle(document.documentElement)
  return (color) => {
    if (!color.startsWith('--')) return color
    return rootStyle.getPropertyValue(color).trim() || TOKEN_FALLBACKS[color] || color
  }
}

export const MARKER_FONT = '600 13px "IBM Plex Mono", monospace'
export const LABEL_FONT = '12px "IBM Plex Mono", monospace'
