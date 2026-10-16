export interface WeatherCurrent {
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  weatherCode: number
  isDay: boolean
}

export interface ForecastDay {
  date: string
  tempMax: number
  tempMin: number
  precipitationProb: number
  weatherCode: number
  sunrise: string
  sunset: string
  uvIndexMax: number
}

export interface HourlyPoint {
  time: string
  temp: number
  precipProb: number
  windSpeed: number
}

export interface WeatherData {
  current: WeatherCurrent
  forecast: ForecastDay[]
  hourly: HourlyPoint[]
  location: { lat: number; lng: number }
}

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
