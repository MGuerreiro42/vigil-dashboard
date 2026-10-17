import { useEffect, useState, type RefObject } from 'react'

export interface CanvasSize {
  width: number
  height: number
}

/** CSS size of the canvas (or any element laid over one), tracked with a ResizeObserver. */
export function useCanvasSize(canvasRef: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 })
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const measure = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      setSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [canvasRef])
  return size
}

/** Sizes the backing store for the device pixel ratio and returns a context drawing in CSS px. */
export function prepareCanvas(canvas: HTMLCanvasElement, size: CanvasSize) {
  if (!size.width || !size.height) return null
  const pixelRatio = window.devicePixelRatio || 1
  const backingWidth = Math.round(size.width * pixelRatio)
  const backingHeight = Math.round(size.height * pixelRatio)
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth
    canvas.height = backingHeight
  }
  const context = canvas.getContext('2d')
  context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  return context
}

/** Flips to true once webfonts load, so canvas text redraws in IBM Plex Mono. */
export function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    void (document.fonts?.ready ?? Promise.resolve()).then(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [])
  return ready
}

/** True while the element is on screen and the tab is visible; animation loops pause otherwise. */
export function useIsActive(elementRef: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(true)
  const [tabVisible, setTabVisible] = useState(() => document.visibilityState !== 'hidden')
  useEffect(() => {
    const element = elementRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef])
  useEffect(() => {
    const update = () => setTabVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return onScreen && tabVisible
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}
