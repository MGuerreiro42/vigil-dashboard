/** Pulse-animated placeholder that matches widget shell dimensions while lazy chunks load. */
export function WidgetSkeleton() {
  return (
    <div
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="h-full w-full animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
    </div>
  )
}
