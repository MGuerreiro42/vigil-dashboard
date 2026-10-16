

export function WikiThumb({
  src,
  alt,
  className,
}: {
  src?: string
  alt?: string
  className?: string
}) {
  return src ? (
    <img src={src} alt={alt ?? ''} className={`object-cover ${className ?? ''}`} />
  ) : (
    <div
      className={`flex items-center justify-center ${className ?? ''}`}
      style={{
        background:
          'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 100%)',
      }}
    >
      <span className="font-serif font-bold text-fg-subtle select-none" style={{ fontSize: 28 }}>
        W
      </span>
    </div>
  )
}
