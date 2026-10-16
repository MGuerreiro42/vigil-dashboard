export interface NaturalEventTrackPoint {
  lat: number
  lng: number
  date: string
  magnitude: number | null
}

export interface NaturalEvent {
  id: string
  title: string
  categoryId: string
  categoryTitle: string
  status: 'open' | 'closed'
  date: string
  lat: number
  lng: number
  sourceUrl: string | null
  magnitude: number | null
  magnitudeUnit: string | null
  description: string | null
  track: NaturalEventTrackPoint[]
  /** GDACS alert level (Green / Orange / Red) — undefined for EONET events */
  alertLevel?: 'Green' | 'Orange' | 'Red'
  /** Country name from GDACS — undefined for EONET events */
  country?: string
}

export interface EonetCategory {
  id: string
  title: string
  count: number
}
