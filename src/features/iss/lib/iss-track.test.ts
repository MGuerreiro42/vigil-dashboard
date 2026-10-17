import { geoDistance } from 'd3-geo'
import { describe, expect, it } from 'vitest'
import { daylightShare, formatHemisphere, isInEarthShadow, issRegion, orbitalPeriodMinutes, propagateTrack, utcOffsetLabel } from './iss-track'

// Reference ISS element set from the TLE format specification, epoch 2008-09-20 12:25:40 UTC
const LINE_1 = '1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927'
const LINE_2 = '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537'
const EPOCH_MS = Date.UTC(2008, 8, 20, 12, 25, 40)
const DEGREES = 180 / Math.PI

describe('propagateTrack', () => {
  const track = propagateTrack(LINE_1, LINE_2, EPOCH_MS, -46, 46, 1.5)

  it('samples the window at a fixed step without passing its end', () => {
    expect(track).toHaveLength(62)
    expect(track[0].minutes).toBe(-46)
    expect(track.at(-1)?.minutes).toBe(45.5)
    expect(propagateTrack(LINE_1, LINE_2, EPOCH_MS, -46, 92, 1)).toHaveLength(139)
  })

  it('stays inside the inclination band (geodetic latitude runs a little past it) and moves about 4° of arc per minute', () => {
    for (const sample of track) expect(Math.abs(sample.lat)).toBeLessThan(52)
    for (let index = 1; index < track.length; index++) {
      const arc = geoDistance([track[index - 1].lon, track[index - 1].lat], [track[index].lon, track[index].lat]) * DEGREES
      expect(arc / 1.5).toBeGreaterThan(3.3)
      expect(arc / 1.5).toBeLessThan(4.3)
    }
  })

  it('spends most of an orbit in daylight and the rest in one shadow pass', () => {
    const orbit = propagateTrack(LINE_1, LINE_2, EPOCH_MS, 0, orbitalPeriodMinutes(15.72125391), 1)
    const share = daylightShare(orbit)
    expect(share).toBeGreaterThan(55)
    expect(share).toBeLessThan(80)
    const shadowEntries = orbit.filter((sample, index) => index > 0 && sample.eclipsed && !orbit[index - 1].eclipsed)
    expect(shadowEntries.length).toBeLessThanOrEqual(1)
  })
})

describe('isInEarthShadow', () => {
  const sun = [1, 0, 0]
  it('is dark only behind the Earth and inside its shadow cylinder', () => {
    expect(isInEarthShadow({ x: -6800, y: 0, z: 0 }, sun)).toBe(true)
    expect(isInEarthShadow({ x: 6800, y: 0, z: 0 }, sun)).toBe(false)
    expect(isInEarthShadow({ x: -1000, y: 6800, z: 0 }, sun)).toBe(false)
  })
})

describe('region helpers', () => {
  it('names land boxes first and falls back to the oceans', () => {
    expect(issRegion(-47, -23)).toBe('brazil')
    expect(issRegion(-70, -40)).toBe('southAmerica')
    expect(issRegion(61, -0.6)).toBe('indianOcean')
    expect(issRegion(-150, 10)).toBe('pacificOcean')
    expect(issRegion(-30, 10)).toBe('atlanticOcean')
  })

  it('formats the solar time zone and hemispheres', () => {
    expect(utcOffsetLabel(61.1)).toBe('UTC+4')
    expect(utcOffsetLabel(-46.6)).toBe('UTC−3')
    expect(formatHemisphere(-0.5771, 'N', 'S')).toBe('0.577° S')
    expect(formatHemisphere(154.2, 'E', 'W', 1)).toBe('154.2° E')
  })
})
