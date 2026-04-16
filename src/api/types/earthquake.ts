export interface Earthquake {
  id: string
  magnitude: number
  place: string
  time: number
  depth: number
  location: { lat: number; lng: number }
  significance: number
  url: string
  tsunamiRisk: boolean
}
