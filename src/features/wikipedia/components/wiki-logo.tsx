import { ACCENT } from '@/features/wikipedia/lib/article-format'

export function WikiLogo({ size }: { size: number }) {
  return (
    <span
      className="font-serif font-black leading-none select-none"
      style={{ fontSize: size, color: ACCENT }}
    >
      W
    </span>
  )
}
