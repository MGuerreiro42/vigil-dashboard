import { expect, it } from 'vitest'
import { parseTLE } from './iss'

// Reference ISS element set from the TLE format specification
const LINE_1 = '1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927'
const LINE_2 = '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537'

it('parses epoch, drag term and orbital elements from fixed columns', () => {
  const elements = parseTLE(LINE_1, LINE_2)
  expect(elements).toMatchObject({
    epochYear: 2008,
    inclination: 51.6416,
    raan: 247.4627,
    eccentricity: 0.0006703,
    argPerigee: 130.536,
    meanAnomaly: 325.0288,
    meanMotion: 15.72125391,
  })
  expect(elements.epochDay).toBeCloseTo(264.51782528, 8)
  expect(elements.bstar).toBeCloseTo(-0.11606e-4, 12)
})

it('maps two-digit epoch years 57–99 to the 1900s', () => {
  const line1 = LINE_1.replace('08264', '98264')
  expect(parseTLE(line1, LINE_2).epochYear).toBe(1998)
})
