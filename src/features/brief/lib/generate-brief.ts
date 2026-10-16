import type { CryptoAsset } from '@/features/crypto/types'
import type { WeatherCurrent, ForecastDay } from '@/features/weather/types'
import type { AirQuality } from '@/features/weather/types'
import type { Earthquake } from '@/features/earthquakes/types'
import type { GithubRepo } from '@/features/github/types'

export type InsightCategory = 'crypto' | 'weather' | 'seismic' | 'air' | 'tech'
export type InsightSeverity = 'info' | 'warning' | 'alert'

export interface BriefInsight {
  id: string
  category: InsightCategory
  severity: InsightSeverity
  headline: string
  detail: string
  dataSource: string[]
}

export interface BriefInput {
  crypto?: CryptoAsset[]
  weather?: WeatherCurrent
  forecast?: ForecastDay[]
  airQuality?: AirQuality | null
  earthquakes?: Earthquake[]
  githubTrending?: GithubRepo[]
}

export function generateDailyBrief(input: BriefInput): BriefInsight[] {
  const insights: BriefInsight[] = []

  // --- CRYPTO ---
  if (input.crypto && input.crypto.length > 0) {
    const bigMovers = input.crypto.filter((coin) => Math.abs(coin.change24h) >= 8)
    if (bigMovers.length > 0) {
      const top = bigMovers.sort((first, second) => Math.abs(second.change24h) - Math.abs(first.change24h))[0]
      const dir = top.change24h > 0 ? 'alta' : 'queda'
      insights.push({
        id: 'crypto-top-mover',
        category: 'crypto',
        severity: Math.abs(top.change24h) >= 15 ? 'alert' : 'warning',
        headline: `${top.symbol} em ${dir} de ${Math.abs(top.change24h).toFixed(1)}% nas últimas 24h`,
        detail: `${top.name} negociado a $${top.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}. ${bigMovers.length > 1 ? `Mais ${bigMovers.length - 1} ativo(s) com variação significativa.` : ''}`,
        dataSource: ['CoinGecko'],
      })
    } else {
      const btc = input.crypto.find((coin) => coin.id === 'bitcoin')
      if (btc) {
        insights.push({
          id: 'crypto-stable',
          category: 'crypto',
          severity: 'info',
          headline: `Mercado cripto estável — BTC a $${btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          detail: `Variação de ${btc.change24h.toFixed(2)}% em 24h. Baixa volatilidade pode indicar consolidação.`,
          dataSource: ['CoinGecko'],
        })
      }
    }
  }

  // --- CLIMA ---
  if (input.weather) {
    const { temp, humidity } = input.weather
    if (temp >= 35) {
      insights.push({
        id: 'weather-heat',
        category: 'weather',
        severity: input.airQuality && input.airQuality.aqi > 100 ? 'alert' : 'warning',
        headline: `Calor intenso: ${temp.toFixed(0)}°C na sua região`,
        detail:
          input.airQuality && input.airQuality.aqi > 100
            ? `Combinação crítica: temperatura elevada e qualidade do ar degradada (AQI ${input.airQuality.aqi}).`
            : `Hidratação recomendada. Umidade em ${humidity}%.`,
        dataSource: ['Open-Meteo'],
      })
    } else if (temp <= 5) {
      insights.push({
        id: 'weather-cold',
        category: 'weather',
        severity: 'warning',
        headline: `Frio intenso: ${temp.toFixed(0)}°C na sua região`,
        detail: `Sensação térmica de ${input.weather.feelsLike.toFixed(0)}°C. Atenção ao agasalho.`,
        dataSource: ['Open-Meteo'],
      })
    }

    if (input.forecast) {
      const rainToday = input.forecast[0]?.precipitationProb ?? 0
      if (rainToday >= 70) {
        insights.push({
          id: 'weather-rain',
          category: 'weather',
          severity: 'info',
          headline: `Alta chance de chuva hoje — ${rainToday}% de probabilidade`,
          detail: `Prepare-se: previsão de precipitação significativa nas próximas horas.`,
          dataSource: ['Open-Meteo'],
        })
      }
    }
  }

  // --- QUALIDADE DO AR ---
  if (input.airQuality && input.airQuality.aqi > 0) {
    const { aqi, category } = input.airQuality
    if (category === 'unhealthy' || category === 'very-unhealthy' || category === 'hazardous') {
      insights.push({
        id: 'air-quality',
        category: 'air',
        severity: category === 'hazardous' ? 'alert' : 'warning',
        headline: `Qualidade do ar ${category === 'hazardous' ? 'perigosa' : 'prejudicial'} — AQI ${aqi}`,
        detail: `PM2.5: ${input.airQuality.pm25.toFixed(1)} µg/m³. Evite atividades ao ar livre prolongadas.`,
        dataSource: ['OpenAQ'],
      })
    }
  }

  // --- TERREMOTOS ---
  if (input.earthquakes && input.earthquakes.length > 0) {
    const significant = input.earthquakes.filter((quake) => quake.magnitude >= 5.0)
    if (significant.length > 0) {
      const top = significant[0]
      insights.push({
        id: 'seismic-strongest',
        category: 'seismic',
        severity: top.magnitude >= 6.5 ? 'alert' : 'warning',
        headline: `Terremoto M${top.magnitude.toFixed(1)} em ${top.place}`,
        detail: `${significant.length > 1 ? `${significant.length} terremotos ≥ M5.0 nas últimas 7 dias. ` : ''}Profundidade: ${top.depth.toFixed(0)} km. ${top.tsunamiRisk ? 'Risco de tsunami reportado.' : ''}`,
        dataSource: ['USGS'],
      })
    } else {
      const count = input.earthquakes.length
      insights.push({
        id: 'seismic-count',
        category: 'seismic',
        severity: 'info',
        headline: `${count} evento(s) sísmico(s) registrados nos últimos 7 dias`,
        detail: `Maior: M${Math.max(...input.earthquakes.map((quake) => quake.magnitude)).toFixed(1)}. Nenhum evento significativo (≥M5.0).`,
        dataSource: ['USGS'],
      })
    }
  }

  // --- GITHUB TRENDING ---
  if (input.githubTrending && input.githubTrending.length > 0) {
    const languages = input.githubTrending.map((repo) => repo.language).filter(Boolean) as string[]
    const langCount: Record<string, number> = {}
    languages.forEach((language) => { langCount[language] = (langCount[language] ?? 0) + 1 })
    const topLang = Object.entries(langCount).sort((first, second) => second[1] - first[1])[0]

    if (topLang) {
      const topRepo = input.githubTrending[0]
      insights.push({
        id: 'github-trending',
        category: 'tech',
        severity: 'info',
        headline: `${topLang[0]} domina o trending do GitHub — ${topLang[1]} repos no top`,
        detail: `Repo em destaque: "${topRepo.name}" com ${topRepo.stars.toLocaleString()} ⭐. ${topRepo.description?.slice(0, 80) ?? ''}`,
        dataSource: ['GitHub'],
      })
    }
  }

  return insights
}
