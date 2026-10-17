import { expect, it } from 'vitest'
import { parsePlaces } from './geocoding'
import { parseRadarFrames } from './rainviewer'

it('labels a place with its state and country', () => {
  expect(parsePlaces({ results: [
    { id: 1, name: 'Curitiba', latitude: -25.43, longitude: -49.27, country: 'Brasil', admin1: 'Paraná' },
    { id: 2, name: 'Monaco', latitude: 43.73, longitude: 7.42, country: 'Monaco' },
  ] })).toEqual([
    { id: 1, name: 'Curitiba', region: 'Paraná, Brasil', lat: -25.43, lng: -49.27 },
    { id: 2, name: 'Monaco', region: 'Monaco', lat: 43.73, lng: 7.42 },
  ])
  expect(parsePlaces({})).toEqual([])
})

it('drops places that repeat the name, state and country of an earlier one', () => {
  const place = { name: 'Curitiba', latitude: -22.9, longitude: -43.2, country: 'Brasil', admin1: 'Rio de Janeiro' }
  const places = parsePlaces({ results: [
    { ...place, id: 1, admin1: 'Paraná' },
    { ...place, id: 2 },
    { ...place, id: 3 },
    { ...place, id: 4, country: 'México', admin1: 'Puebla' },
  ] })
  expect(places.map((entry) => entry.id)).toEqual([1, 2, 4])
})

it('builds a tile URL template for each radar frame, past then nowcast', () => {
  const frames = parseRadarFrames({ host: 'https://tilecache.rainviewer.com', radar: {
    past: [{ time: 100, path: '/v2/radar/aaa' }],
    nowcast: [{ time: 200, path: '/v2/radar/bbb' }],
  } })
  expect(frames).toEqual([
    { time: 100, tileUrl: 'https://tilecache.rainviewer.com/v2/radar/aaa/256/{z}/{x}/{y}/2/1_1.png' },
    { time: 200, tileUrl: 'https://tilecache.rainviewer.com/v2/radar/bbb/256/{z}/{x}/{y}/2/1_1.png' },
  ])
})
