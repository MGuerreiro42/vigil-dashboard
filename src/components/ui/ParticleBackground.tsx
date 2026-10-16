import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 280

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string // cyan or purple
}

/**
 * Lightweight CSS/Canvas2D particle field — replaces the previous
 * @react-three/fiber + three.js background (which added ~850 KB to the bundle).
 * Runs on a single <canvas> with requestAnimationFrame; zero external deps.
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Reduced motion: draw one static frame instead of running the loop
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf: number
    let w = 0
    let h = 0
    let particles: Particle[] = []

    function resize() {
      if (!canvas) return
      w = canvas.width  = window.innerWidth
      h = canvas.height = window.innerHeight
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: Math.random() * 1.2 + 0.4,
        opacity: Math.random() * 0.45 + 0.08,
        color: Math.random() < 0.65 ? '#22d3ee' : '#a855f7',
      }))
    }

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)

      // Subtle parallax offset from mouse
      const ox = (mouseRef.current.x - 0.5) * 12
      const oy = (mouseRef.current.y - 0.5) * 8

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        // Wrap around edges
        if (p.x < -4) p.x = w + 4
        else if (p.x > w + 4) p.x = -4
        if (p.y < -4) p.y = h + 4
        else if (p.y > h + 4) p.y = -4

        ctx.beginPath()
        ctx.arc(p.x + ox * p.size * 0.4, p.y + oy * p.size * 0.4, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
      }

      ctx.globalAlpha = 1
      if (!reducedMotion) raf = requestAnimationFrame(draw)
    }

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / w, y: e.clientY / h }
    }

    const onResize = () => {
      resize()
      if (reducedMotion) draw()
    }

    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('mousemove', onMouse, { passive: true })
    resize()
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.7,
      }}
    />
  )
}
