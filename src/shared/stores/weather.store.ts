import { create } from 'zustand'
import { weatherService, type WeatherForecastRow } from '../api/services/weather.service'
import type { TrendSummary } from '../api/types'

interface WeatherState {
  // State
  forecast: WeatherForecastRow[]
  trendSummary: TrendSummary | null
  isLoading: boolean
  isFetching: boolean
  error: string | null
  lastFetched: number | null
  
  // Actions
  fetchForecast: (days?: number) => Promise<void>
  fetchTrends: (periodDays?: number) => Promise<void>
  refreshWeather: () => Promise<void>
  clearError: () => void
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  // Initial state
  forecast: [],
  trendSummary: null,
  isLoading: false,
  isFetching: false,
  error: null,
  lastFetched: null,

  // Fetch weather forecast
  fetchForecast: async (days = 10) => {
    set({ isLoading: true, error: null })
    try {
      const forecast = await weatherService.getForecast(days)
      set({ 
        forecast, 
        isLoading: false, 
        lastFetched: Date.now() 
      })
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch forecast' 
      })
    }
  },

  // Fetch trends summary
  fetchTrends: async (periodDays = 7) => {
    set({ isLoading: true, error: null })
    try {
      const trendSummary = await weatherService.getTrendsSummary(periodDays)
      set({ 
        trendSummary, 
        isLoading: false, 
        lastFetched: Date.now() 
      })
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch trends' 
      })
    }
  },

  // Refresh weather data (trigger fetch from backend)
  refreshWeather: async () => {
    set({ isFetching: true, error: null })
    try {
      await weatherService.fetchWeatherData()
      // After triggering fetch, get the updated data
      await Promise.all([
        get().fetchForecast(),
        get().fetchTrends(),
      ])
      set({ isFetching: false })
    } catch (error) {
      set({ 
        isFetching: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh weather' 
      })
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}))

export default useWeatherStore
