import { expect, it } from 'vitest'
import { parseGdacsEvents } from './gdacs'

type Overrides = Record<string, unknown>

const feature = (properties: Overrides, coordinates: [number, number] = [-70.6, -33.4]) => ({
  geometry: { type: 'Point', coordinates },
  properties: {
    eventtype: 'EQ',
    eventid: 1,
    episodeid: 2,
    eventname: '',
    name: 'Earthquake in Chile',
    alertlevel: 'Orange',
    iscurrent: 'true',
    country: 'Chile',
    fromdate: '2026-10-15T10:00:00',
    url: { report: 'https://www.gdacs.org/report.aspx?eventid=1' },
    severitydata: { severity: 6.4, severitytext: 'Magnitude 6.4M, Depth:10km', severityunit: 'M' },
    ...properties,
  },
})

it('maps a GDACS feature to a natural event', () => {
  expect(parseGdacsEvents({ features: [feature({})] as never })).toEqual([{
    id: 'gdacs-EQ-1-2',
    title: 'Earthquake in Chile',
    categoryId: 'earthquakes',
    categoryTitle: 'earthquakes',
    status: 'open',
    date: '2026-10-15T10:00:00.000Z',
    lat: -33.4,
    lng: -70.6,
    sourceUrl: 'https://www.gdacs.org/report.aspx?eventid=1',
    magnitude: 6.4,
    magnitudeUnit: 'M',
    description: 'Magnitude 6.4M, Depth:10km',
    alertLevel: 'Orange',
    country: 'Chile',
  }])
})

it('names cyclones by event name and converts wind to knots', () => {
  const [storm] = parseGdacsEvents({ features: [feature({
    eventtype: 'TC', eventname: 'SIMON-26', country: 'México',
    severitydata: { severity: 250, severitytext: 'Tropical Depression (maximum wind speed of 250 km/h)', severityunit: 'km/h' },
  })] as never })
  expect(storm).toMatchObject({ title: 'SIMON-26 – México', categoryId: 'severeStorms', magnitude: 135, magnitudeUnit: 'kts' })
})

it('reads fire area in hectares', () => {
  const [fire] = parseGdacsEvents({ features: [feature({ eventtype: 'WF', severitydata: { severity: 8988, severitytext: 'Green impact for forestfire in 8988 ha', severityunit: 'ha' } })] as never })
  expect(fire).toMatchObject({ categoryId: 'wildfires', magnitude: 8988, magnitudeUnit: 'hectare' })
})

it('falls back to the alert level when there is no severity', () => {
  const [flood] = parseGdacsEvents({ features: [feature({ eventtype: 'FL', alertlevel: 'Red', severitydata: { severity: 0, severitytext: 'Magnitude 0 ', severityunit: '' } })] as never })
  expect(flood).toMatchObject({ categoryId: 'floods', magnitude: 6, magnitudeUnit: 'alert', description: 'Magnitude 0' })
})

it('marks past events closed and skips non-point geometry', () => {
  const events = parseGdacsEvents({ features: [
    feature({ iscurrent: 'false' }),
    { ...feature({}), geometry: { type: 'Polygon', coordinates: [0, 0] } },
  ] as never })
  expect(events).toHaveLength(1)
  expect(events[0].status).toBe('closed')
})
