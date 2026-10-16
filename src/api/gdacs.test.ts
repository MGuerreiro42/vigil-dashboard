import { expect, it } from 'vitest'
import { parseGdacsRss } from './gdacs'

const rss = (items: string) => `<?xml version="1.0"?>
<rss xmlns:gdacs="http://www.gdacs.org" xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:georss="http://www.georss.org/georss">
  <channel>${items}</channel>
</rss>`

const EARTHQUAKE = `<item>
  <title>Orange earthquake alert in Chile</title>
  <link>https://www.gdacs.org/report.aspx?eventid=1</link>
  <gdacs:eventtype>EQ</gdacs:eventtype>
  <gdacs:alertlevel>Orange</gdacs:alertlevel>
  <gdacs:country>Chile</gdacs:country>
  <gdacs:eventid>1</gdacs:eventid>
  <gdacs:episodeid>2</gdacs:episodeid>
  <gdacs:eventname></gdacs:eventname>
  <gdacs:fromdate>Wed, 15 Oct 2026 10:00:00 GMT</gdacs:fromdate>
  <gdacs:severity value="6.4" unit="">Magnitude 6.4M, Depth:10km</gdacs:severity>
  <geo:Point><geo:lat>-33.4</geo:lat><geo:long>-70.6</geo:long></geo:Point>
</item>`

it('maps a GDACS item to a natural event', () => {
  expect(parseGdacsRss(rss(EARTHQUAKE))).toEqual([
    expect.objectContaining({
      id: 'gdacs-EQ-1-2',
      title: 'Orange earthquake alert in Chile',
      categoryId: 'earthquakes',
      alertLevel: 'Orange',
      country: 'Chile',
      lat: -33.4,
      lng: -70.6,
      magnitude: 6.4,
      magnitudeUnit: 'M',
      date: '2026-10-15T10:00:00.000Z',
    }),
  ])
})

it('falls back to georss:point and to the alert level as magnitude', () => {
  const storm = `<item>
    <title>Storm</title>
    <gdacs:eventtype>TC</gdacs:eventtype>
    <gdacs:alertlevel>Red</gdacs:alertlevel>
    <gdacs:eventname>MILTON</gdacs:eventname>
    <gdacs:country>USA</gdacs:country>
    <georss:point>27.1 -82.4</georss:point>
  </item>`
  expect(parseGdacsRss(rss(storm))[0]).toMatchObject({
    title: 'MILTON – USA',
    categoryId: 'severeStorms',
    lat: 27.1,
    lng: -82.4,
    magnitude: 6,
    magnitudeUnit: 'alert',
  })
})

it('skips items without coordinates', () => {
  expect(parseGdacsRss(rss('<item><title>No location</title></item>'))).toEqual([])
})

it('rejects malformed XML', () => {
  expect(() => parseGdacsRss('<rss><channel>')).toThrow('GDACS: XML parse error')
})
