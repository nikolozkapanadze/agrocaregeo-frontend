import { useState, useEffect, useCallback, useRef } from 'react'
import { useApi } from '@/shared/hooks/useApi'
import { useProfileStore } from '@/shared/stores'
import type { ZoneStats, TrendSummary } from '@/shared/lib/api'
import {
  fetchSyncStatus,
  fetchZoneStats,
  fetchTrendSummary,
  runAnalysis,
  fetchWeather,
  fetchSatellite,
  type SyncStatus,
  type ActionState,
} from '../services/dashboard.service'

const defaultAction: ActionState = { loading: false, error: null, success: null }

export interface UseDashboardReturn {
  // Data
  stats: ZoneStats | null
  trendSummary: TrendSummary | null
  syncStatus: SyncStatus | null
  
  // Loading states
  statsLoading: boolean
  trendLoading: boolean
  pendingRefresh: boolean
  
  // Errors
  statsError: string | null
  trendError: string | null
  
  // Action states
  analysisState: ActionState
  weatherState: ActionState
  satelliteState: ActionState
  
  // Actions
  runAnalysisAction: () => Promise<void>
  runWeatherAction: () => Promise<void>
  runSatelliteAction: () => Promise<void>
  refetchStats: () => void
  refresh: () => void
  
  // Computed
  totalZones: number
  criticalCount: number
  okCount: number
  daysStale: number | null
}

export function useDashboard(): UseDashboardReturn {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id

  // Action states
  const [analysisState, setAnalysisState] = useState<ActionState>(defaultAction)
  const [weatherState, setWeatherState] = useState<ActionState>(defaultAction)
  const [satelliteState, setSatelliteState] = useState<ActionState>(defaultAction)
  const [pendingRefresh, setPendingRefresh] = useState(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id))
    timeoutsRef.current = []
  }, [])

  useEffect(() => {
    return () => clearAllTimeouts()
  }, [clearAllTimeouts])
  
  // Sync status (separate polling)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  
  // Data fetching via useApi — re-fetches when active profile changes
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useApi<ZoneStats>(() => fetchZoneStats(profileId), [profileId])

  const { 
    data: trendSummary, 
    loading: trendLoading, 
    error: trendError,
    refetch: refetchTrend
  } = useApi<TrendSummary>(() => fetchTrendSummary(7), [])

  // Sync status polling
  useEffect(() => {
    const fetchStatus = async () => {
      const status = await fetchSyncStatus()
      setSyncStatus(status)
    }
    
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  // Generic action runner
  const runAction = useCallback(async (
    fn: () => Promise<{ message: string }>,
    setState: React.Dispatch<React.SetStateAction<ActionState>>,
    refreshDelay = 15000,
  ): Promise<void> => {
    setState({ loading: true, error: null, success: null })
    try {
      const res = await fn()
      setState({ loading: false, error: null, success: res.message || 'Done' })
      clearAllTimeouts()
      timeoutsRef.current.push(setTimeout(() => setState(defaultAction), 4000))
      setPendingRefresh(true)
      timeoutsRef.current.push(setTimeout(() => {
        refetchStats()
        setPendingRefresh(false)
      }, refreshDelay))
    } catch (e) {
      setState({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed',
        success: null,
      })
      clearAllTimeouts()
      timeoutsRef.current.push(setTimeout(() => setState(defaultAction), 5000))
    }
  }, [refetchStats, clearAllTimeouts])

  // Action wrappers
  const runAnalysisAction = useCallback(async () => {
    await runAction(runAnalysis, setAnalysisState)
  }, [runAction])

  const runWeatherAction = useCallback(async () => {
    await runAction(fetchWeather, setWeatherState)
  }, [runAction])

  const runSatelliteAction = useCallback(async () => {
    await runAction(fetchSatellite, setSatelliteState)
  }, [runAction])

  const refresh = useCallback(() => {
    refetchStats()
    refetchTrend()
  }, [refetchStats, refetchTrend])

  // Computed values
  const totalZones = stats?.total ?? 0
  const criticalCount = stats?.critical ?? 0
  const okCount = stats?.ok ?? 0
  
  const daysStale = syncStatus?.latest_observation_date
    ? Math.floor((Date.now() - new Date(syncStatus.latest_observation_date).getTime()) / 86400000)
    : null

  return {
    stats,
    trendSummary,
    syncStatus,
    statsLoading,
    trendLoading,
    pendingRefresh,
    statsError,
    trendError,
    analysisState,
    weatherState,
    satelliteState,
    runAnalysisAction,
    runWeatherAction,
    runSatelliteAction,
    refetchStats,
    refresh,
    totalZones,
    criticalCount,
    okCount,
    daysStale,
  }
}
