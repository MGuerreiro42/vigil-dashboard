import { describe, expect, it } from 'vitest'
import { createProjection, dragRotation, easeRotationToward, gridOffset, gridSize, invertInsideWorld, isOnVisibleHemisphere, maskCellAt, nearestMarkerIndex, type GeoMarker } from './dot-grid'

describe('gridSize', () => {
  it('fits whole 4px dots and drops the remainder', () => {
    expect(gridSize(403, 181)).toEqual({ columns: 100, rows: 45 })
  })

  it('centres the grid in the leftover pixels', () => {
    expect(gridOffset(403, 181)).toEqual([1, 0])
    expect(gridOffset(407, 183)).toEqual([1, 1])
  })
})

describe('createProjection', () => {
  it('fits the whole world edge to edge on the flat map', () => {
    const projection = createProjection('map', 360, 180, {})
    const [westX, northY] = projection([-180, 90]) ?? []
    const [centerX, centerY] = projection([0, 0]) ?? []
    expect(westX).toBeCloseTo(0)
    expect(northY).toBeCloseTo(0)
    expect(centerX).toBeCloseTo(180)
    expect(centerY).toBeCloseTo(90)
  })

  it('fits a bbox so it touches the canvas edges', () => {
    const projection = createProjection('map', 200, 100, { bbox: [-56, -29, -38, -18] })
    const [westX, northY] = projection([-56, -18]) ?? [Number.NaN, Number.NaN]
    const [eastX, southY] = projection([-38, -29]) ?? [Number.NaN, Number.NaN]
    expect(Math.min(westX, northY)).toBeCloseTo(0)
    expect(Math.max(eastX / 200, southY / 100)).toBeCloseTo(1)
  })

  it('puts the negated rotation at the center of the globe', () => {
    const projection = createProjection('globe', 200, 200, { rotation: [30, -8] })
    const [centerX, centerY] = projection([-30, 8]) ?? []
    expect(centerX).toBeCloseTo(100)
    expect(centerY).toBeCloseTo(100)
  })
})

describe('maskCellAt', () => {
  const pixel = (red: number, green: number, blue: number) => new Uint8ClampedArray([red, green, blue, 255])

  it('ranks land over rim over graticule', () => {
    expect(maskCellAt(pixel(255, 255, 255), 0)).toBe('land')
    expect(maskCellAt(pixel(0, 255, 255), 0)).toBe('rim')
    expect(maskCellAt(pixel(0, 0, 200), 0)).toBe('graticule')
    expect(maskCellAt(pixel(60, 40, 30), 0)).toBeNull()
  })
})

describe('isOnVisibleHemisphere', () => {
  it('shows the facing side and hides the far side', () => {
    expect(isOnVisibleHemisphere([30, -8], -30, 8)).toBe(true)
    expect(isOnVisibleHemisphere([30, -8], 150, -8)).toBe(false)
  })
})

describe('nearestMarkerIndex', () => {
  const marker = (lon: number, lat: number): GeoMarker => ({ lon, lat, glyph: 'o', color: '--color-text' })
  const identity = (lonLat: [number, number]): [number, number] => lonLat

  it('picks the closest marker within 14px', () => {
    expect(nearestMarkerIndex([marker(0, 0), marker(10, 0), marker(4, 3)], identity, [5, 2])).toBe(2)
  })

  it('returns null when nothing is within the radius', () => {
    expect(nearestMarkerIndex([marker(0, 0)], identity, [14, 0])).toBeNull()
  })
})

describe('globe rotation', () => {
  it('turns 0.4° per dragged pixel and clamps the tilt', () => {
    expect(dragRotation([30, -8], 10, -500)).toEqual([34, 80])
  })

  it('eases toward the focus the short way around the antimeridian', () => {
    const [longitude] = easeRotationToward([170, 0], 175, 0, 1)
    expect(longitude).toBeCloseTo(185)
  })
})

describe('invertInsideWorld', () => {
  // A 400×100 canvas leaves 100px of empty margin on each side of the 200×100 world
  const projection = createProjection('map', 400, 100, {})

  it('reads coordinates inside the projected world', () => {
    const lonLat = invertInsideWorld(projection, [200, 50])
    expect(lonLat?.[0]).toBeCloseTo(0)
    expect(lonLat?.[1]).toBeCloseTo(0)
  })

  it('reports nothing in the margins instead of a wrapped longitude', () => {
    expect(invertInsideWorld(projection, [20, 50])).toBeNull()
    expect(invertInsideWorld(projection, [390, 50])).toBeNull()
  })
})
