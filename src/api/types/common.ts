export interface DataPoint {
  timestamp: number
  value: number
  label?: string
}

export interface TimeSeries {
  id: string
  name: string
  unit: string
  data: DataPoint[]
  trend: 'up' | 'down' | 'stable'
  changePercent?: number
}

export interface GeoPoint {
  lat: number
  lng: number
  label?: string
}
