import { useState, useEffect, useCallback, useMemo } from 'react'
import { recommendations, analysis, parcels, type Recommendation } from '@/shared/lib/api'
import { getMoonInfo, type MoonInfo } from '@/shared/lib/moon'
import { countZonesByPriority } from '@/domain/recommendations'
import { useProfileStore } from '@/shared/stores'

export type FilterPriority = 'all' | 1 | 2 | 3
export type SortKey = 'priority' | 'code' | 'ndvi' | 'n_remaining' | 'area'

export interface UseRecommendationsReturn {
  // Data
  data: Recommendation[]
  moonInfo: MoonInfo
  
  // Loading states
  loading: boolean
  error: string | null
  recalculating: boolean
  recalcMsg: string | null
  
  // Filters & Sort
  filterPriority: FilterPriority
  sortKey: SortKey
  setFilterPriority: (p: FilterPriority) => void
  setSortKey: (k: SortKey) => void
  
  // Processed data
  filteredData: Recommendation[]
  sortedData: Recommendation[]
  stats: {
    total: number
    critical: number
    high: number
    ok: number
  }

  // Empty state
  emptyMessage: string | null
  
  // Actions
  recalculate: () => Promise<void>
  refresh: () => void
}

export function useRecommendations(): UseRecommendationsReturn {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [data, setData] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recalculating, setRecalculating] = useState(false)
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null)

  const moonInfo = useMemo(() => getMoonInfo(new Date()), [])

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    setEmptyMessage(null)
    recommendations
      .list(profileId)
      .then((recs) => {
        setData(recs)
        // If no recommendations returned, check if there are parcels with VRA zones
        if (recs.length === 0) {
          parcels
            .list(1, 100, undefined, profileId)
            .then((parcelData) => {
              if (parcelData.items.length > 0) {
                const cropTypes = [
                  ...new Set(parcelData.items.map((p) => p.crop_type)),
                ]
                const cropNames = cropTypes.join(', ')
                setEmptyMessage(
                  `სასუქის რეკომენდაციები კულტურისთვის „${cropNames}“ მზადდება. VRA ზონების მონაცემები ხელმისაწვდომია.`
                )
              }
            })
            .catch(() => {
              /* silently fail — empty state will show default */
            })
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [profileId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const recalculate = useCallback(async () => {
    setRecalculating(true)
    setRecalcMsg(null)
    try {
      await analysis.recalculate()
      setRecalcMsg('გადათვლა დაიწყო — 30 წამში განახლდება მონაცემები')
      setTimeout(() => {
        loadData()
        setRecalcMsg(null)
      }, 30000)
    } catch (err) {
      setRecalcMsg(`შეცდომა: ${(err as Error).message}`)
    } finally {
      setRecalculating(false)
    }
  }, [loadData])

  // Filter
  const filteredData = useMemo(() => {
    if (filterPriority === 'all') return data
    return data.filter((r) => r.priority === filterPriority)
  }, [data, filterPriority])

  // Sort
  const sortedData = useMemo(() => {
    const sorted = [...filteredData]
    switch (sortKey) {
      case 'priority':
        sorted.sort((a, b) => a.priority - b.priority)
        break
      case 'code':
        sorted.sort((a, b) => (a.parcel_nr || '').localeCompare(b.parcel_nr || ''))
        break
      case 'ndvi':
        sorted.sort((a, b) => (a.ndvi ?? 1) - (b.ndvi ?? 1))
        break
      case 'n_remaining': {
        sorted.sort((a, b) => {
          const aN = a.recommendations.find((fr) => fr.type === 'N')?.kg_ha ?? 0
          const bN = b.recommendations.find((fr) => fr.type === 'N')?.kg_ha ?? 0
          return bN - aN
        })
        break
      }
      case 'area':
        sorted.sort((a, b) => b.area_ha - a.area_ha)
        break
    }
    return sorted
  }, [filteredData, sortKey])

  // Stats
  const stats = useMemo(() => {
    const counts = countZonesByPriority(
      data.map((r) => ({ priority: r.priority } as { priority: number }))
    )
    return {
      total: data.length,
      critical: counts.critical,
      high: counts.high,
      ok: counts.ok,
    }
  }, [data])

  return {
    data,
    moonInfo,
    loading,
    error,
    recalculating,
    recalcMsg,
    filterPriority,
    sortKey,
    setFilterPriority,
    setSortKey,
    filteredData,
    sortedData,
    stats,
    recalculate,
    emptyMessage,
    refresh: loadData,
  }
}
