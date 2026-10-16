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
    let width = 0
    let height = 0
    let particles: Particle[] = []

    function resize() {
      if (!canvas) return
      width = canvas.width  = window.innerWidth
      height = canvas.height = window.innerHeight
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: Math.random() * 1.2 + 0.4,
        opacity: Math.random() * 0.45 + 0.08,
        color: Math.random() < 0.65 ? '#22d3ee' : '#a855f7',
      }))
    }

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      // Subtle parallax offset from mouse
      const ox = (mouseRef.current.x - 0.5) * 12
      const oy = (mouseRef.current.y - 0.5) * 8

      for (const particle of particles) {
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around edges
        if (particle.x < -4) particle.x = width + 4
        else if (particle.x > width + 4) particle.x = -4
        if (particle.y < -4) particle.y = height + 4
        else if (particle.y > height + 4) particle.y = -4

        ctx.beginPath()
        ctx.arc(particle.x + ox * particle.size * 0.4, particle.y + oy * particle.size * 0.4, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity
        ctx.fill()
      }

      ctx.globalAlpha = 1
      if (!reducedMotion) raf = requestAnimationFrame(draw)
    }

    const onMouse = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX / width, y: event.clientY / height }
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
