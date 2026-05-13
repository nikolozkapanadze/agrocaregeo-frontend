import { useState, useEffect, useCallback } from 'react'
import { cropApi, CropParcel, CropDashboardStats, PhenologyData, DiseasePressure } from '@/shared/lib/api'

interface UseCropDataReturn {
  parcels: CropParcel[]
  stats: CropDashboardStats | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCropData(cropType: string): UseCropDataReturn {
  const [parcels, setParcels] = useState<CropParcel[]>([])
  const [stats, setStats] = useState<CropDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [parcelsData, statsData] = await Promise.all([
        cropApi.parcels(cropType),
        cropApi.dashboardStats(cropType),
      ])
      
      setParcels(parcelsData)
      setStats(statsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load crop data')
    } finally {
      setLoading(false)
    }
  }, [cropType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { parcels, stats, loading, error, refetch: fetchData }
}

// Vine-specific hook
export function useVineData(parcelId?: string) {
  const [phenology, setPhenology] = useState<PhenologyData | null>(null)
  const [diseasePressure, setDiseasePressure] = useState<DiseasePressure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parcelId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [phenData, diseaseData] = await Promise.all([
          cropApi.vinePhenology(parcelId),
          cropApi.vineDiseasePressure(parcelId),
        ])
        setPhenology(phenData)
        setDiseasePressure(diseaseData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [parcelId])

  return { phenology, diseasePressure, loading, error }
}

// Wheat-specific hook
export function useWheatData(parcelId?: string) {
  const [mineralAnalysis, setMineralAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parcelId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await cropApi.wheatMineralAnalysis(parcelId)
        setMineralAnalysis(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [parcelId])

  return { mineralAnalysis, loading, error }
}

// Blueberry-specific hook
export function useBlueberryData(parcelId?: string) {
  const [phenology, setPhenology] = useState<any>(null)
  const [diseasePressure, setDiseasePressure] = useState<any>(null)
  const [satellite, setSatellite] = useState<any>(null)
  const [fertilizer, setFertilizer] = useState<any>(null)
  const [irrigation, setIrrigation] = useState<any>(null)
  const [yieldForecast, setYieldForecast] = useState<any>(null)
  const [alerts, setAlerts] = useState<any>(null)
  const [sprayLog, setSprayLog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parcelId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [
          phenData, diseaseData, satData, fertData,
          irrigData, yieldData, alertData, sprayData,
        ] = await Promise.all([
          cropApi.blueberryPhenology(parcelId),
          cropApi.blueberryDiseasePressure(parcelId),
          cropApi.blueberrySatellite(parcelId),
          cropApi.blueberryFertilizer(parcelId),
          cropApi.blueberryIrrigation(parcelId),
          cropApi.blueberryYieldForecast(parcelId),
          cropApi.blueberryAlerts(parcelId),
          cropApi.blueberrySprayLog(parcelId),
        ])
        setPhenology(phenData)
        setDiseasePressure(diseaseData)
        setSatellite(satData)
        setFertilizer(fertData)
        setIrrigation(irrigData)
        setYieldForecast(yieldData)
        setAlerts(alertData)
        setSprayLog(sprayData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [parcelId])

  return {
    phenology, diseasePressure, satellite, fertilizer,
    irrigation, yieldForecast, alerts, sprayLog,
    loading, error,
  }
}

// Generic hook for any crop
export function useCropFeatures(cropType: string) {
  const [features, setFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cropApi.features(cropType)
      .then(setFeatures)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [cropType])

  return { features, loading }
}
