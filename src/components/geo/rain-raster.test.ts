import { describe, expect, it } from 'vitest'
import { lonLatToWorldPixel, radarTiles, rainBandForIntensity, rainBandFromColor, RAIN_BAND_INTENSITY, tileRangeForBbox, worldPixelToLonLat, zoomForBbox } from './rain-raster'

describe('rainBandFromColor', () => {
  // Pixels sampled from real RainViewer scheme 2 tiles
  it.each([
    [[102, 99, 90, 25], null],
    [[222, 208, 151, 190], 'weak'],
    [[0, 71, 104, 255], 'weak'],
    [[0, 119, 170, 255], 'weak'],
    [[0, 163, 224, 255], 'moderate'],
    [[136, 221, 238, 255], 'moderate'],
    [[255, 238, 0, 255], 'strong'],
    [[255, 139, 0, 255], 'strong'],
    [[193, 0, 0, 255], 'extreme'],
    [[255, 68, 0, 255], 'extreme'],
    [[255, 0, 255, 255], 'extreme'],
    [[255, 255, 255, 255], 'extreme'],
  ] as const)('maps %j to %s', (rgba, band) => {
    expect(rainBandFromColor(rgba[0], rgba[1], rgba[2], rgba[3])).toBe(band)
  })
})

describe('rainBandForIntensity', () => {
  it('round-trips every band through its representative intensity', () => {
    for (const [band, intensity] of Object.entries(RAIN_BAND_INTENSITY)) expect(rainBandForIntensity(intensity)).toBe(band)
  })

  it('draws nothing below 0.18', () => {
    expect(rainBandForIntensity(0.17)).toBeNull()
  })
})

describe('tile math', () => {
  it('places the origin at the center of the world image', () => {
    expect(lonLatToWorldPixel(0, 0, 0)).toEqual([128, 128])
  })

  it('picks a zoom near two tiles across the bbox, capped at 7', () => {
    expect(zoomForBbox([-56, -29, -38, -18])).toBe(6)
    expect(zoomForBbox([-180, -85, 180, 85])).toBe(1)
    expect(zoomForBbox([-46.7, -23.6, -46.6, -23.5])).toBe(7)
  })

  it('covers the bbox with tiles', () => {
    expect(tileRangeForBbox([-56, -29, -38, -18], 6)).toEqual({ minX: 22, maxX: 25, minY: 35, maxY: 37 })
  })

  it('inverts the world pixel back to a coordinate', () => {
    const [lon, lat] = worldPixelToLonLat(...lonLatToWorldPixel(-46.63, -23.55, 6), 6)
    expect(lon).toBeCloseTo(-46.63, 6)
    expect(lat).toBeCloseTo(-23.55, 6)
  })

  it('lists the covering tiles with their bounds', () => {
    const { zoom, tiles } = radarTiles('https://tiles/{z}/{x}/{y}.png', [-56, -29, -38, -18])
    expect(zoom).toBe(6)
    expect(tiles).toHaveLength(12)
    expect(tiles[0].url).toBe('https://tiles/6/22/35.png')
    expect(tiles[0].bounds[0]).toBeCloseTo(-56.25, 6)
    expect(tiles[0].bounds[2]).toBeCloseTo(-50.625, 6)
  })
})
