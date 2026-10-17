import { useEffect, useState } from 'react'
import { geoGraticule, type GeoPermissibleObjects } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'

type LandTopology = Topology<{ land: GeometryCollection }>

export interface LandLayers {
  land: GeoPermissibleObjects
  graticule: GeoPermissibleObjects
}

let layersPromise: Promise<LandLayers> | null = null

// Dynamic import keeps the ~50 KB topology out of the main chunk
function loadLandLayers() {
  layersPromise ??= import('world-atlas/land-110m.json')
    .then((module) => {
      const topology = module.default as unknown as LandTopology
      return { land: feature(topology, topology.objects.land), graticule: geoGraticule().step([30, 30])() }
    })
    .catch((error: unknown) => {
      layersPromise = null
      throw error
    })
  return layersPromise
}

/** Land and graticule geometry, available once the topology and the canvas webfont have loaded. */
export function useLandLayers() {
  const [layers, setLayers] = useState<LandLayers | null>(null)
  useEffect(() => {
    let cancelled = false
    Promise.all([loadLandLayers(), document.fonts?.ready])
      .then(([loaded]) => { if (!cancelled) setLayers(loaded) })
      .catch(() => { /* the map stays blank; the panel around it reports the data state */ })
    return () => { cancelled = true }
  }, [])
  return layers
}
