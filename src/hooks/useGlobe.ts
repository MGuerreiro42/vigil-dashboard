import { useEffect, useRef, useState, type ComponentType } from 'react'
import type { GlobeMethods, GlobeProps } from 'react-globe.gl'

type GlobeComponent = ComponentType<GlobeProps & { ref?: React.Ref<GlobeMethods | undefined> }>

export const GLOBE_TEXTURE_URL = '/textures/earth-night.jpg'

/**
 * Lazy-loads react-globe.gl, tracks the container size, and pauses the
 * render loop while the globe is off-screen or `active` is false (e.g. a
 * hidden tab panel). Unmounting disposes the WebGL scene (react-kapsule
 * calls the globe destructor).
 */
export function useGlobe(active = true) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const [Globe, setGlobe] = useState<GlobeComponent | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [inView, setInView] = useState(true)

  useEffect(() => {
    import('react-globe.gl').then((module) => setGlobe(() => module.default as GlobeComponent))
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const resizeObserver = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    const intersectionObserver = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    resizeObserver.observe(container)
    intersectionObserver.observe(container)
    return () => {
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  const mounted = Globe != null && size.width > 0
  useEffect(() => {
    const globe = globeRef.current
    if (!mounted || !globe) return
    if (active && inView) globe.resumeAnimation()
    else globe.pauseAnimation()
  }, [mounted, active, inView])

  return { containerRef, globeRef, Globe, size }
}
