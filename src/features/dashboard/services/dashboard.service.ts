import { 
  analysis as analysisApi, 
  weather as weatherApi, 
  satellite as satelliteApi,
  weatherTrends,
  type TrendSummary,
  type ZoneStats,
} from '@/shared/lib/api'

export interface ActionState {
  loading: boolean
  error: string | null
  success: string | null
}

export interface SyncStatus {
  latest_observation_date: string | null
  total_observations: number
  last_sync: string | null
}

export interface DashboardData {
  stats: ZoneStats | null
  trendSummary: TrendSummary | null
  syncStatus: SyncStatus | null
  statsLoading: boolean
  trendLoading: boolean
  statsError: Error | null
  trendError: Error | null
}

export async function fetchSyncStatus(): Promise<SyncStatus | null> {
  try {
    const res = await satelliteApi.syncStatus()
    return res
  } catch (e) {
    // Silent fail - freshness indicator is non-critical
    return null
  }
}

export async function fetchZoneStats(profileId?: string): Promise<ZoneStats> {
  return analysisApi.stats(profileId)
}

export async function fetchTrendSummary(days: number = 7): Promise<TrendSummary> {
  return weatherTrends.summary(days)
}

export async function runAnalysis(): Promise<{ message: string }> {
  return analysisApi.run()
}

export async function fetchWeather(): Promise<{ message: string }> {
  return weatherApi.fetch()
}

export async function fetchSatellite(): Promise<{ message: string }> {
  return satelliteApi.fetch()
}
