import { ParticleBackground } from '@/components/ui/particle-background'

export function AppBackground() {
  return (
    <>
      <ParticleBackground />
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.06) 0%, transparent 60%)' }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 100% 100%, rgba(168,85,247,0.05) 0%, transparent 50%)' }}
      />
    </>
  )
}
