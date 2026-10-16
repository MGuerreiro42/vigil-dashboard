export interface Launch {
  id: string
  name: string
  rocket: string
  mission: string
  missionDescription: string | null
  provider: string | null
  pad: string | null
  orbit: string | null
  /** No-earlier-than time, ISO */
  net: string
  status: string
  image: string | null
}

export interface KpReading {
  /** ISO, UTC */
  time: string
  kp: number
}

export interface SpaceAlert {
  id: string
  issuedAt: string
  /** First "ALERT/WARNING/WATCH/SUMMARY: …" line of the bulletin */
  headline: string
  kind: 'alert' | 'warning' | 'watch' | 'summary' | 'other'
}

export interface NearEarthObject {
  id: string
  name: string
  diameterMinMeters: number
  diameterMaxMeters: number
  hazardous: boolean
  closestApproach: string
  missDistanceLunar: number
  missDistanceKm: number
  velocityKmS: number
  url: string
}

export interface SpaceArticle {
  id: number
  title: string
  site: string
  url: string
  image: string | null
  publishedAt: string
  summary: string
}
