/** Pulse-animated placeholder that matches widget shell dimensions while lazy chunks load. */
export function WidgetSkeleton({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl animate-pulse ${className}`}
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    />
  )
}
