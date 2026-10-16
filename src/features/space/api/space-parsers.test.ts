import { describe, expect, it } from 'vitest'
import { parseLaunches } from './launches'
import { parseKpIndex, parseSpaceAlerts } from './space-weather'
import { parseNeoFeed } from './asteroids'
import { auroraLatitude, kpToScale } from '@/features/space/lib/geomagnetic'
import { formatCountdown } from '@/features/space/lib/countdown'

describe('parseLaunches', () => {
  it('splits rocket and mission and drops placeholder details', () => {
    const [launch, unknown] = parseLaunches({ results: [
      {
        id: 'a', name: 'H3-24 | Martian Moons eXploration (MMX)', net: '2026-10-19T19:41:03Z',
        status: { abbrev: 'Go' }, image: { thumbnail_url: 'https://img/h3.jpg' },
        launch_service_provider: { name: 'Mitsubishi Heavy Industries' },
        pad: { location: { name: 'Tanegashima Space Center, Japan' } },
        mission: { name: 'Martian Moons eXploration (MMX)', description: 'Lands on Phobos.', orbit: { abbrev: 'Mars' } },
      },
      { id: 'b', name: 'Ceres-1S | Unknown Payload', net: '2026-10-21T03:35:00Z', mission: { description: 'Details TBD.', orbit: { abbrev: 'N/A' } } },
    ] })
    expect(launch).toMatchObject({ rocket: 'H3-24', mission: 'Martian Moons eXploration (MMX)', provider: 'Mitsubishi Heavy Industries', orbit: 'Mars', status: 'Go', image: 'https://img/h3.jpg' })
    expect(unknown).toMatchObject({ rocket: 'Ceres-1S', mission: 'Unknown Payload', missionDescription: null, orbit: null, status: 'TBD', provider: null })
  })
})

describe('space weather', () => {
  it('reads Kp as UTC readings and skips missing values', () => {
    expect(parseKpIndex([
      { time_tag: '2026-10-16T18:00:00', Kp: 3.67 },
      { time_tag: '2026-10-16T21:00:00', Kp: Number.NaN },
    ])).toEqual([{ time: '2026-10-16T18:00:00Z', kp: 3.67 }])
  })

  it('extracts the headline of each bulletin, newest first', () => {
    const alerts = parseSpaceAlerts([
      { product_id: 'K04A', issue_datetime: '2026-10-16 19:39:45.267', message: 'Space Weather Message Code: ALTK04\r\nSerial Number: 2691\r\n\r\nALERT: Geomagnetic K-index of 4 \nThreshold Reached: 2026 Oct 16 1940 UTC' },
      { product_id: 'A20F', issue_datetime: '2026-10-15 08:00:00.000', message: 'Code: WATA20\nWATCH: Geomagnetic Storm Category G1 Predicted' },
      { product_id: 'XXX', issue_datetime: '2026-10-14 08:00:00.000', message: 'no recognizable line' },
    ])
    expect(alerts.map((alert) => [alert.kind, alert.headline])).toEqual([
      ['alert', 'Geomagnetic K-index of 4'],
      ['watch', 'Geomagnetic Storm Category G1 Predicted'],
      ['other', 'XXX'],
    ])
    expect(alerts[0].issuedAt).toBe('2026-10-16T19:39:45.267Z')
  })

  it('maps Kp to the NOAA G-scale and an aurora latitude', () => {
    expect([3.67, 5, 6.33, 7, 8, 9].map(kpToScale)).toEqual(['G0', 'G1', 'G2', 'G3', 'G4', 'G5'])
    expect(auroraLatitude(0)).toBe(66)
    expect(auroraLatitude(8)).toBe(46)
  })
})

describe('parseNeoFeed', () => {
  it('flattens the date map and sorts by miss distance', () => {
    const neo = (id: string, lunar: string) => ({
      id, name: `(2026 ${id})`, nasa_jpl_url: `https://ssd.jpl.nasa.gov/${id}`, is_potentially_hazardous_asteroid: id === 'far',
      estimated_diameter: { meters: { estimated_diameter_min: 9.2, estimated_diameter_max: 20.6 } },
      close_approach_data: [{
        close_approach_date_full: '2026-Oct-16 03:23', epoch_date_close_approach: 1792120980000,
        miss_distance: { lunar, kilometers: '7622017.5' }, relative_velocity: { kilometers_per_second: '5.69' },
      }],
    })
    const objects = parseNeoFeed({ near_earth_objects: { '2026-10-16': [neo('far', '19.8'), neo('near', '2.1')] } })
    expect(objects.map((object) => object.name)).toEqual(['2026 near', '2026 far'])
    expect(objects[1]).toMatchObject({ hazardous: true, missDistanceLunar: 19.8, velocityKmS: 5.69, closestApproach: '2026-10-16T03:23:00.000Z' })
  })
})

describe('formatCountdown', () => {
  it('formats days and a zero-padded clock, and stops at liftoff', () => {
    const now = Date.UTC(2026, 9, 16, 12, 0, 0)
    expect(formatCountdown(now + (2 * 86_400 + 4 * 3_600 + 12 * 60 + 9) * 1000, now)).toBe('2d 04:12:09')
    expect(formatCountdown(now + 65_000, now)).toBe('00:01:05')
    expect(formatCountdown(now - 1_000, now)).toBeNull()
  })
})
