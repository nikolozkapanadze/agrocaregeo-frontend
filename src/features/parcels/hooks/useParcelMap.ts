import { useState, useEffect, useRef, useCallback } from 'react'
import type { PathOptions } from 'leaflet'
import L from 'leaflet'
import { useProfileStore } from '@/shared/stores'
import {
  fetchMapData,
  fetchDiseaseData,
  searchParcel,
  extractParcelData,
  zoneColor,
  ndviColor,
  ndreColor,
  diseaseIndexColor,
  vraColor,
  terrainElevationColor,
  terrainSlopeColor,
  terrainRunoffColor,
  type LayerMode,
  type FormType,
  type GeoJSONFeature,
  type GeoJSONCollection,
  type ParcelCardData,
} from '../services/parcelMap.service'

export interface UseParcelMapProps {
  focusCode?: string | null
  allowForms?: boolean
}

export interface UseParcelMapReturn {
  // Data
  geojson: GeoJSONCollection | null
  subzonesGeojson: GeoJSONCollection | null
  diseaseGeojson: GeoJSONCollection | null
  
  // State
  loading: boolean
  error: string | null
  layerMode: LayerMode
  selectedParcel: ParcelCardData | null
  formType: FormType
  showFormModal: boolean
  searchQuery: string
  searchResult: GeoJSONFeature | null
  searchError: boolean
  
  // Refs
  geoJsonRef: React.RefObject<L.GeoJSON | null>
  highlightLayerRef: React.RefObject<L.GeoJSON | null>
  
  // Actions
  setLayerMode: (mode: LayerMode) => void
  setSelectedParcel: (parcel: ParcelCardData | null) => void
  setFormType: (type: FormType) => void
  setShowFormModal: (show: boolean) => void
  setSearchQuery: (query: string) => void
  handleSearch: () => void
  clearSearch: () => void
  handleParcelSelect: (feature: GeoJSONFeature) => void
  
  // Style helpers
  getStyle: (feature?: GeoJSONFeature) => PathOptions
  getSubzoneStyle: (feature?: GeoJSONFeature) => PathOptions
  
  // Constants
  layerButtons: { mode: LayerMode; label: string }[]

  // Actions
  refreshData: () => void
  dataVersion: number
}

export function useParcelMap({ focusCode, allowForms: _allowForms = false }: UseParcelMapProps): UseParcelMapReturn {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id

  // Data state
  const [geojson, setGeojson] = useState<GeoJSONCollection | null>(null)
  const [subzonesGeojson, setSubzonesGeojson] = useState<GeoJSONCollection | null>(null)
  const [diseaseGeojson, setDiseaseGeojson] = useState<GeoJSONCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [layerMode, setLayerMode] = useState<LayerMode>('none')
  const [selectedParcel, setSelectedParcel] = useState<ParcelCardData | null>(null)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [formType, setFormType] = useState<FormType>('fertilizer')
  const [showFormModal, setShowFormModal] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<GeoJSONFeature | null>(null)
  const [searchError, setSearchError] = useState(false)

  // Refs
  const geoJsonRef = useRef<L.GeoJSON | null>(null)
  const highlightLayerRef = useRef<L.GeoJSON | null>(null)

  // Monotonically-increasing counter — each disease fetch stores the counter value
  // at call time; when the response arrives, it's discarded if counter has moved on.
  const diseaseFetchGen = useRef(0)

  // Increments on each successful data fetch — used as GeoJSON layer key
  const [dataVersion, setDataVersion] = useState(0)

  const refreshData = useCallback(() => {
    setLoading(true)
    // Clear selection when switching profiles
    setSelectedParcel(null)
    setSelectedFeatureId(null)
    setSearchResult(null)
    // Invalidate any in-flight disease fetch so stale data can't overwrite
    diseaseFetchGen.current += 1
    setDiseaseGeojson(null)
    fetchMapData(profileId)
      .then(({ geojson, subzonesGeojson }) => {
        setGeojson(geojson)
        setSubzonesGeojson(subzonesGeojson)
        setDataVersion(v => v + 1)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [profileId])

  // Re-fetch whenever the active profile changes
  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Load disease data when layer mode is active (or profile changed, resetting diseaseGeojson to null)
  useEffect(() => {
    if (layerMode === 'disease' && !diseaseGeojson) {
      const gen = ++diseaseFetchGen.current
      fetchDiseaseData(profileId).then((data) => {
        // Discard if a newer fetch was triggered (profile changed mid-flight)
        if (gen === diseaseFetchGen.current) {
          setDiseaseGeojson(data)
        }
      })
    }
  }, [layerMode, diseaseGeojson, profileId])

  // Auto-focus parcel when focusCode changes
  useEffect(() => {
    if (!focusCode || !geojson) return
    const found = searchParcel(geojson, focusCode)
    if (found) {
      setSearchResult(found)
      setSelectedParcel(extractParcelData(found))
    }
  }, [focusCode, geojson])

  // Search handler
  const handleSearch = useCallback(() => {
    const found = searchParcel(geojson, searchQuery)
    if (found) {
      setSearchResult(found)
      setSearchError(false)
      setSelectedParcel(extractParcelData(found))
      setShowFormModal(false)
    } else {
      setSearchResult(null)
      setSearchError(true)
      setTimeout(() => setSearchError(false), 2000)
    }
  }, [geojson, searchQuery])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResult(null)
    setSearchError(false)
    setSelectedParcel(null)
    setSelectedFeatureId(null)
  }, [])

  // Handle parcel selection from map
  const handleParcelSelect = useCallback((feature: GeoJSONFeature) => {
    const fid = (feature.properties?.id ?? feature.properties?.parcel_nr) as string | null
    setSelectedParcel(extractParcelData(feature))
    setSelectedFeatureId(prev => prev === fid ? null : fid)
    setShowFormModal(false)
  }, [])

  // Style helpers
  const getStyle = useCallback((feature?: GeoJSONFeature): PathOptions => {
    const props = feature?.properties ?? {}
    if (layerMode === 'none') {
      const fid = (props.id ?? props.parcel_nr) as string | null
      const isSelected = fid != null && fid === selectedFeatureId
      return {
        fillColor: '#58a6ff',
        fillOpacity: isSelected ? 0.25 : 0,
        color: '#ffffff',
        weight: isSelected ? 4 : 2.5,
        opacity: 1,
        dashArray: isSelected ? '6 3' : undefined,
        className: isSelected ? 'parcel-path-selected' : 'parcel-path-default',
      }
    }

    let color = '#58a6ff'

    if (layerMode === 'zone') {
      color = zoneColor(props.mineral_zone as string)
    } else if (layerMode === 'ndvi') {
      color = ndviColor(props.ndvi as number | null)
    } else if (layerMode === 'ndre') {
      color = ndreColor(props.ndre as number | null)
    } else if (layerMode === 'disease') {
      color = diseaseIndexColor(props.disease_index as number | null)
    } else if (layerMode === 'terrain') {
      color = terrainElevationColor(props.terrain_elev_mean as number | null)
    } else if (layerMode === 'slope') {
      color = terrainSlopeColor(props.terrain_slope_deg as number | null)
    } else if (layerMode === 'runoff') {
      color = terrainRunoffColor(props.terrain_runoff_risk as string | null)
    }

    const isCritical = props.mineral_zone === 'critical'
    const fid = (props.id ?? props.parcel_nr) as string | null
    const isSelected = fid != null && fid === selectedFeatureId

    if (isSelected) {
      return {
        fillColor: color,
        fillOpacity: 0.85,
        color: '#ffffff',
        weight: 4,
        opacity: 1,
        dashArray: '6 3',
        className: 'parcel-path-selected',
      }
    }

    // High-contrast white border + strong fill opacity for visibility on satellite basemap
    return {
      fillColor: color,
      fillOpacity: 0.8,
      color: '#ffffff',
      weight: 3,
      opacity: 1,
      className: isCritical ? 'critical-parcel-path parcel-path-default' : 'parcel-path-default',
    }
  }, [layerMode, selectedFeatureId])

  // Re-style when layer mode or selection changes
  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle((feature) => getStyle(feature as unknown as GeoJSONFeature))
    }
  }, [layerMode, selectedFeatureId, getStyle])

  const getSubzoneStyle = useCallback((feature?: GeoJSONFeature): PathOptions => {
    const ndviClass = feature?.properties?.ndvi_class as string | null
    const color = vraColor(ndviClass)
    return { fillColor: color, fillOpacity: 0.72, color: '#ffffff', weight: 0.5, opacity: 0.4 }
  }, [])

  const layerButtons = [
    { mode: 'none' as LayerMode, label: 'მხოლოდ საზღვარი' },
    { mode: 'zone' as LayerMode, label: 'მინერალური ზონა' },
    { mode: 'ndvi' as LayerMode, label: 'NDVI' },
    { mode: 'ndre' as LayerMode, label: 'NDRE' },
    { mode: 'vra' as LayerMode, label: 'VRA ქვეზონები' },
    { mode: 'disease' as LayerMode, label: 'დაავადების ინდექსი' },
    { mode: 'terrain' as LayerMode, label: 'სიმაღლე (DEM)' },
    { mode: 'slope' as LayerMode, label: 'დაქანება' },
    { mode: 'runoff' as LayerMode, label: 'ჩამორეცხვა' },
  ]

  return {
    geojson,
    subzonesGeojson,
    diseaseGeojson,
    loading,
    error,
    layerMode,
    selectedParcel,
    formType,
    showFormModal,
    searchQuery,
    searchResult,
    searchError,
    geoJsonRef,
    highlightLayerRef,
    setLayerMode,
    setSelectedParcel,
    setFormType,
    setShowFormModal,
    setSearchQuery,
    handleSearch,
    clearSearch,
    handleParcelSelect,
    getStyle,
    getSubzoneStyle,
    layerButtons,
    refreshData,
    dataVersion,
  }
}
