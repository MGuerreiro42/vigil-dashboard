export interface ISSPosition {
  lat: number
  lng: number
  altitude: number   // km
  velocity: number   // km/h
  visibility: 'daylight' | 'eclipsed'
  timestamp: number  // unix seconds
  footprint: number  // km — diameter of the area visible from the ISS
  solarLat: number   // sub-solar point latitude (where sun is directly overhead)
  solarLng: number   // sub-solar point longitude
  daynum: number     // Julian Day Number
}

export interface ISSCoordinates {
  lat: string
  lng: string
  timezoneId: string
  offset: number
  countryCode: string | null
  mapUrl: string
}

export interface ISSTLE {
  requestedTimestamp: number
  tleTimestamp: number
  id: string
  name: string
  header: string
  line1: string
  line2: string
  // Parsed orbital elements
  inclination: number    // degrees — angle of orbit to equator
  raan: number           // Right Ascension of Ascending Node (degrees)
  eccentricity: number   // nearly 0 for ISS (circular orbit)
  argPerigee: number     // argument of perigee (degrees)
  meanAnomaly: number    // mean anomaly at epoch (degrees)
  meanMotion: number     // revolutions per day
  epochYear: number      // full 4-digit year
  epochDay: number       // day of year (with fractional part)
  bstar: number          // BSTAR drag term
}
