export function ArticleThumb({ src, size }: { src: string | null; size: number }) {
  if (!src) {
    return <div className="rounded-lg bg-white/[0.05] flex-shrink-0" style={{ width: size, height: size }} aria-hidden />
  }
  return <img src={src} alt="" loading="lazy" className="rounded-lg object-cover flex-shrink-0" style={{ width: size, height: size }} />
}
