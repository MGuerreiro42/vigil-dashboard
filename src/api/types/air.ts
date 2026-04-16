export type AQICategory = 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous'

export interface AirQuality {
  location: { lat: number; lng: number; name?: string }
  aqi: number
  pm25: number
  pm10: number
  no2: number
  o3: number
  category: AQICategory
  updatedAt: number
}
