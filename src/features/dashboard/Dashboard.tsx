import React, { useCallback } from 'react'
import { useDashboard } from './hooks/useDashboard'
import DashboardView from './components/DashboardView'

export default function Dashboard(): React.ReactElement {
  const {
    stats,
    trendSummary,
    syncStatus,
    statsLoading,
    trendLoading,
    pendingRefresh,
    analysisState,
    weatherState,
    satelliteState,
    runAnalysisAction,
    runWeatherAction,
    runSatelliteAction,
    refresh,
    totalZones,
    criticalCount,
    okCount,
    daysStale,
  } = useDashboard()

  const handleParcelsRefresh = useCallback(() => {
    refresh()
  }, [refresh])

  return (
    <DashboardView
      stats={stats}
      trendSummary={trendSummary}
      syncStatus={syncStatus}
      statsLoading={statsLoading}
      trendLoading={trendLoading}
      pendingRefresh={pendingRefresh}
      analysisState={analysisState}
      weatherState={weatherState}
      satelliteState={satelliteState}
      onRunAnalysis={runAnalysisAction}
      onRunWeather={runWeatherAction}
      onRunSatellite={runSatelliteAction}
      onParcelsRefresh={handleParcelsRefresh}
      totalZones={totalZones}
      criticalCount={criticalCount}
      okCount={okCount}
      daysStale={daysStale}
    />
  )
}
