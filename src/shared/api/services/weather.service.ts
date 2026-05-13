import { api } from '../client'
import type { WeatherDaily, TrendSummary } from '../types'

export interface WeatherForecastRow {
  parcel_id: string
  parcel_nr: string
  wx_date: string
  t_max: number | null
  t_min: number | null
  t_avg: number | null
  precip_mm: number | null
  solar: number | null
  rh_pct: number | null
  cloud_cover_pct: number | null
  wind_ms: number | null
  heat_stress: boolean
  frost_risk: boolean
  disease_risk: number | null
  gdd: number | null
}

export const weatherService = {
  async fetchWeatherData(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/weather/fetch')
  },

  async getForecast(days = 10): Promise<WeatherForecastRow[]> {
    return api.get<WeatherForecastRow[]>(`/weather?days=${days}`)
  },

  async getParcelWeather(parcelId: string): Promise<WeatherDaily[]> {
    return api.get<WeatherDaily[]>(`/weather/${parcelId}`)
  },

  async getTrendsSummary(periodDays = 7): Promise<TrendSummary> {
    return api.get<TrendSummary>(`/weather/trends/summary?period_days=${periodDays}`)
  },

  async getParcelTrends(parcelId: string): Promise<unknown[]> {
    return api.get<unknown[]>(`/weather/${parcelId}/trends`)
  },
}

export default weatherService
