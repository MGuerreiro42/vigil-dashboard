import type { CSSProperties, HTMLAttributes } from 'react'

/**
 * Props for a panel that stays mounted and cross-fades (keeps charts, maps and
 * globes alive between tab switches). Hidden panels are inert, so keyboard
 * focus and screen readers skip them.
 */
export function tabPanel(active: boolean, style?: CSSProperties) {
  return {
    role: 'tabpanel',
    inert: !active,
    style: {
      position: 'absolute',
      inset: 0,
      opacity: active ? 1 : 0,
      pointerEvents: active ? 'auto' : 'none',
      transition: 'opacity 0.2s ease',
      ...style,
    },
  } satisfies HTMLAttributes<HTMLDivElement> & { inert: boolean }
}
