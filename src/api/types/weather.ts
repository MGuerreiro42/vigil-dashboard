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
