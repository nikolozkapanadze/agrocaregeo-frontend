import { useState, useCallback } from 'react'
import { spatialLayers as api, type SpatialLayersMeta } from '@/shared/lib/api'

export type LayerType = 'polygon' | 'line' | 'point'

export interface ActiveSpatialLayer {
  type: LayerType
  name: string
  classifyKey: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geojson: any | null
  loading: boolean
}

export function useSpatialLayers(profileId?: string) {
  const [meta, setMeta] = useState<SpatialLayersMeta | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [activeLayers, setActiveLayers] = useState<ActiveSpatialLayer[]>([])

  const fetchMeta = useCallback(async () => {
    setMetaLoading(true)
    try {
      const data = await api.list(profileId)
      setMeta(data)
    } catch {
      // silent — no spatial data is a valid state
    } finally {
      setMetaLoading(false)
    }
  }, [profileId])

  const isActive = useCallback(
    (type: LayerType, name: string) =>
      activeLayers.some(l => l.type === type && l.name === name),
    [activeLayers]
  )

  const toggleLayer = useCallback(
    async (type: LayerType, name: string) => {
      const active = activeLayers.some(l => l.type === type && l.name === name)

      if (active) {
        setActiveLayers(prev => prev.filter(l => !(l.type === type && l.name === name)))
        return
      }

      // Add with loading state immediately for feedback
      setActiveLayers(prev => [
        ...prev,
        { type, name, classifyKey: null, geojson: null, loading: true },
      ])

      try {
        const data = await api.geojson(type, name, profileId)
        setActiveLayers(prev =>
          prev.map(l =>
            l.type === type && l.name === name
              ? { ...l, geojson: data, loading: false }
              : l
          )
        )
      } catch {
        setActiveLayers(prev => prev.filter(l => !(l.type === type && l.name === name)))
      }
    },
    [activeLayers, profileId]
  )

  const setClassifyKey = useCallback(
    (type: LayerType, name: string, key: string | null) => {
      setActiveLayers(prev =>
        prev.map(l =>
          l.type === type && l.name === name ? { ...l, classifyKey: key } : l
        )
      )
    },
    []
  )

  const deleteLayer = useCallback(
    async (type: LayerType, name: string) => {
      // Remove from active layers immediately (optimistic)
      setActiveLayers(prev => prev.filter(l => !(l.type === type && l.name === name)))

      try {
        await api.delete(type, name, profileId)
        // Refresh meta so the deleted layer disappears from the list
        await fetchMeta()
      } catch {
        // If delete fails, meta will still show it; user can retry
      }
    },
    [profileId, fetchMeta]
  )

  const totalCount =
    (meta?.polygon.length ?? 0) + (meta?.line.length ?? 0) + (meta?.point.length ?? 0)

  return {
    meta,
    metaLoading,
    fetchMeta,
    activeLayers,
    isActive,
    toggleLayer,
    setClassifyKey,
    deleteLayer,
    totalCount,
  }
}
