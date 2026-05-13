import React, { useRef, useState } from 'react'
import { MapContainer, GeoJSON } from 'react-leaflet'
import { BasemapTileLayer } from '@/shared/components/map/BasemapTileLayer'
import type { Layer, LeafletMouseEvent } from 'leaflet'
import L from 'leaflet'
import { AlertCircle, ClipboardList, X, Search, Pentagon, Check, Undo2, Download, Trash2, Layers, MapPin, Plus, Minus, Eye, EyeOff, Database, MoreHorizontal, ChevronDown } from 'lucide-react'
import { PolygonDrawTool } from './PolygonDrawTool'
import DrawParcelModal from './DrawParcelModal'
import { useSpatialLayers, type LayerType } from '../hooks/useSpatialLayers'
import SpatialLayersRenderer from './SpatialLayersRenderer'
import { SpatialLayerLegend } from './SpatialLayerLegend'
import { MapToolsPanel } from './MapToolsPanel'
import { useProfileStore } from '@/shared/stores'
import type {
  GeoJSONFeature,
  GeoJSONCollection,
  ParcelCardData,
  LayerMode,
  FormType
} from '../services/parcelMap.service'
import {
  diseaseIndexColor,
} from '../services/parcelMap.service'
import MapFormModal from './MapFormModal'
import { parcels as parcelsApi, spatialLayers as spatialLayersApi } from '@/shared/lib/api'
import { TerrainAspectArrows } from './TerrainAspectArrows'
import TerrainDetailModal from './TerrainDetailModal'
import { BASEMAPS, type BasemapKey } from '@/shared/lib/map/basemaps'
import CadastralLayers, { type CadastralLayerVisibility } from '@/features/cadastral/CadastralLayers'
import { useCadastralSearch } from '@/features/cadastral/useCadastralSearch'

// Fix leaflet default icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface ParcelMapViewProps {
  fullscreen?: boolean
  height?: string
  allowForms?: boolean
  
  // Data
  geojson: GeoJSONCollection | null
  subzonesGeojson: GeoJSONCollection | null
  diseaseGeojson: GeoJSONCollection | null
  loading: boolean
  error: string | null
  
  // State
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
  setSearchResult: (result: GeoJSONFeature | null) => void
  
  // Style helpers
  getStyle: (feature?: GeoJSONFeature) => L.PathOptions
  getSubzoneStyle: (feature?: GeoJSONFeature) => L.PathOptions
  layerButtons: { mode: LayerMode; label: string }[]

  // Draw callback
  onParcelCreated?: () => void
  dataVersion?: number
}

// Map helper components
import { useMap } from 'react-leaflet'

function FitBounds({ geojson }: { geojson: GeoJSONCollection | null }): null {
  const map = useMap()
  
  React.useEffect(() => {
    if (geojson && geojson.features && geojson.features.length > 0) {
      try {
        const layer = L.geoJSON(geojson as GeoJSON.GeoJsonObject)
        const bounds = layer.getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] })
        }
      } catch {
        // if bounds fail just stay at default
      }
    }
  }, [geojson, map])
  return null
}

function GfiPopup({ content, latlng }: { content: string | null; latlng: L.LatLng | null }): null {
  const map = useMap()
  const popupRef = React.useRef<L.Popup | null>(null)

  React.useEffect(() => {
    if (popupRef.current) {
      map.closePopup(popupRef.current)
      popupRef.current = null
    }
    if (!content || !latlng) return
    const popup = L.popup({ maxWidth: 280 })
      .setLatLng(latlng)
      .setContent(content)
      .openOn(map)
    popupRef.current = popup
  }, [content, latlng, map])

  return null
}

function FlyToFeature({ feature, clear }: { feature: GeoJSONFeature | null; clear: () => void }): null {
  const map = useMap()
  
  React.useEffect(() => {
    if (!feature) return
    try {
      const layer = L.geoJSON(feature as unknown as GeoJSON.GeoJsonObject)
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 16, duration: 0.8 })
      }
    } catch { /* ignore */ }
  }, [feature, map, clear])
  return null
}

function MapRefCapture({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }): null {
  const map = useMap()
  React.useEffect(() => { mapRef.current = map }, [map, mapRef])
  return null
}

// Popup content generators
function createMinimalPopupContent(props: Record<string, unknown>): string {
  return `
    <div style="font-family:inherit;min-width:140px">
      <div style="font-weight:600;font-size:14px;color:#e6edf3;margin-bottom:4px">
        ნაკვეთი: ${props.parcel_nr || 'N/A'}
      </div>
      ${props.area_ha ? `<div style="font-size:12px;color:#8b949e">ფართობი: ${(props.area_ha as number).toFixed(2)} ha</div>` : ''}
      ${props.crop_type ? `<div style="font-size:12px;color:#8b949e">კულტურა: ${props.crop_type}</div>` : ''}
    </div>
  `
}

function createParcelPopupContent(props: Record<string, unknown>): string {
  const zone = (props.mineral_zone as string) || 'unknown'
  const ndviVal = props.ndvi != null ? (props.ndvi as number).toFixed(3) : 'N/A'
  const ndreVal = props.ndre != null ? (props.ndre as number).toFixed(3) : 'N/A'
  const lastDate = props.last_analysis ? new Date(props.last_analysis as string).toLocaleDateString() : 'N/A'

  const zoneColors: Record<string, string> = {
    critical: '#d32f2f', high: '#f57c00', medium: '#fbc02d', ok: '#388e3c',
  }
  const zoneColor_ = zoneColors[zone] || '#58a6ff'
  const zoneLabel = zone.charAt(0).toUpperCase() + zone.slice(1)

  // Terrain section
  const elev = props.terrain_elev_mean as number | null
  const elevMin = props.terrain_elev_min as number | null
  const elevMax = props.terrain_elev_max as number | null
  const elevStd = props.terrain_elev_std as number | null
  const slope = props.terrain_slope_deg as number | null
  const slopeMax = props.terrain_slope_max as number | null
  const slopeDist = props.terrain_slope_distribution as Record<string, number> | null
  const aspect = props.terrain_aspect as string | null
  const solarMj = props.terrain_solar_mj as number | null
  const roughness = props.terrain_roughness as number | null
  const runoff = props.terrain_runoff_risk as string | null
  const drainage = props.terrain_drainage as string | null
  const hasTerrain = elev !== null || slope !== null

  // Build slope distribution mini-bars
  let slopeDistHtml = ''
  if (slopeDist && Object.keys(slopeDist).length > 0) {
    const colors: Record<string, string> = {
      flat: '#4fc3f7', gentle: '#8bc34a', moderate: '#fbc02d', steep: '#f57c00', very_steep: '#d32f2f'
    }
    const labels: Record<string, string> = {
      flat: 'თ', gentle: 'ნ', moderate: 'ს', steep: 'კ', very_steep: 'ვკ'
    }
    const bars = Object.entries(slopeDist)
      .filter(([_, v]) => (v as number) > 0)
      .map(([k, v]) => `<div style="display:flex;align-items:center;gap:2px;font-size:10px">
        <span style="color:#8b949e;width:14px">${labels[k] || k}</span>
        <div style="flex:1;height:6px;background:#21262d;border-radius:2px;overflow:hidden">
          <div style="width:${v}%;height:100%;background:${colors[k] || '#58a6ff'}"></div>
        </div>
        <span style="color:#8b949e;min-width:22px;text-align:right">${Math.round(v as number)}%</span>
      </div>`).join('')
    if (bars) {
      slopeDistHtml = `<div style="margin-top:3px">${bars}</div>`
    }
  }

  // Elevation range bar
  let elevBarHtml = ''
  if (elevMin !== null && elevMax !== null && elev !== null) {
    const range = elevMax - elevMin
    const meanPos = range > 0 ? ((elev - elevMin) / range) * 100 : 50
    elevBarHtml = `<div style="margin-top:3px">
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#8b949e">
        <span>${Math.round(elevMin)}м</span>
        <span>სიმაღლის დიაპაზონი ${range > 0 ? `±${Math.round(range / 2)}м` : ''}</span>
        <span>${Math.round(elevMax)}м</span>
      </div>
      <div style="height:6px;background:#21262d;border-radius:2px;overflow:hidden;position:relative;margin-top:2px">
        <div style="position:absolute;left:0;top:0;height:100%;width:100%;background:linear-gradient(90deg,#4fc3f7,#8bc34a,#fbc02d,#f57c00,#d32f2f);opacity:0.6"></div>
        <div style="position:absolute;left:${meanPos}%;top:-2px;width:2px;height:10px;background:#fff;border-radius:1px"></div>
      </div>
    </div>`
  }

  const terrainHtml = hasTerrain ? `
    <div style="margin:6px 0;padding:6px 0;border-top:1px solid #21262d;border-bottom:1px solid #21262d">
      <div style="font-size:11px;font-weight:600;color:#58a6ff;margin-bottom:4px">🗻 რელიეფი (DEM)</div>
      ${elevBarHtml}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:11px;color:#8b949e;margin-top:3px">
        ${elev != null ? `<span>სიმაღლე: <b style="color:#e6edf3">${Math.round(elev)}м</b>${elevStd != null ? ` ±${elevStd.toFixed(0)}м` : ''}</span>` : ''}
        ${slope != null ? `<span>დაქანება: <b style="color:#e6edf3">${slope.toFixed(1)}°</b>${slopeMax != null && slopeMax > slope ? ` (მაქს ${slopeMax.toFixed(1)}°)` : ''}</span>` : ''}
        ${aspect ? `<span>ექსპოზიცია: <b style="color:#e6edf3">${aspect}</b></span>` : ''}
        ${solarMj != null ? `<span>სხივი: <b style="color:#e6edf3">${solarMj.toFixed(1)} MJ/მ²</b></span>` : ''}
        ${drainage ? `<span>დრენაჟი: <b style="color:#e6edf3">${drainage.replace('_', ' ')}</b></span>` : ''}
        ${runoff ? `<span>რეცხვა: <b style="color:#e6edf3">${runoff.replace('_', ' ')}</b></span>` : ''}
        ${roughness != null ? `<span>რუხობა: <b style="color:#e6edf3">${roughness.toFixed(2)}</b></span>` : ''}
      </div>
      ${slopeDistHtml}
      <div style="margin-top:4px">
        <button onclick="window.dispatchEvent(new CustomEvent('openTerrainDetail',{detail:{parcelId:'${props.id}',parcelNr:'${props.parcel_nr || ''}'}}))" 
          style="font-size:10px;color:#58a6ff;background:none;border:1px solid #58a6ff44;border-radius:4px;padding:2px 8px;cursor:pointer;width:100%">
          🔍 დეტალური რელიეფი
        </button>
      </div>
    </div>
  ` : ''

  return `
    <div style="min-width:200px;font-family:inherit">
      <div style="font-weight:600;font-size:14px;margin-bottom:8px;color:#e6edf3">
        ნაკვეთი: ${props.parcel_nr || 'N/A'}
      </div>
      <div style="margin-bottom:6px">
        <span style="display:inline-flex;align-items:center;gap:4px;background:${zoneColor_}22;color:${zoneColor_};border:1px solid ${zoneColor_}44;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:600">
          <span style="width:6px;height:6px;border-radius:50%;background:${zoneColor_}"></span>
          ${zoneLabel}
        </span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;color:#8b949e;margin-bottom:6px">
        <span>NDVI: <b style="color:#e6edf3">${ndviVal}</b></span>
        <span>NDRE: <b style="color:#e6edf3">${ndreVal}</b></span>
        <span>N: <b style="color:#e6edf3">${props.n_dose_kg_ha != null ? `${props.n_dose_kg_ha} kg/ha` : '—'}</b></span>
        <span>P: <b style="color:#e6edf3">${props.p_dose_kg_ha != null ? `${props.p_dose_kg_ha} kg/ha` : '—'}</b></span>
        <span>K: <b style="color:#e6edf3">${props.k_dose_kg_ha != null ? `${props.k_dose_kg_ha} kg/ha` : '—'}</b></span>
        <span>Mg: <b style="color:#e6edf3">${props.mg_dose_kg_ha != null ? `${props.mg_dose_kg_ha} kg/ha` : '—'}</b></span>
      </div>
      ${terrainHtml}
      ${props.rec_priority_label ? `<div style="font-size:12px;color:#58a6ff;font-weight:600;margin-bottom:4px">${props.rec_priority === 1 ? '🔴' : props.rec_priority === 2 ? '🟡' : '🟢'} ${props.rec_priority_label as string}</div>` : ''}
      ${props.rec_action_text ? `<div style="font-size:11px;color:#8b949e;margin-bottom:4px">${props.rec_action_text as string}</div>` : ''}
      ${props.crop_type ? `<div style="font-size:11px;color:#6e7681">კულტურა: ${props.crop_type}</div>` : ''}
      ${props.area_ha ? `<div style="font-size:11px;color:#6e7681">ფართობი: ${(props.area_ha as number).toFixed(2)} ha</div>` : ''}
      ${props.stress_level ? `<div style="font-size:11px;color:#6e7681">სტრეს-დონე: ${props.stress_level}</div>` : ''}
      <div style="font-size:11px;color:#6e7681">ბოლო ანალიზი: ${lastDate}</div>
    </div>
  `
}

function NDVIClassBadge({ ndviClass }: { ndviClass: string }): React.ReactElement {
  const classColors: Record<string, string> = {
    low: '#ef4444', medium_low: '#f97316', medium: '#86efac',
    medium_high: '#22c55e', high: '#15803d',
  }
  const c = classColors[ndviClass] || '#4ade80'
  return (
    <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}35` }}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {ndviClass}
    </span>
  )
}

function createDiseasePopupContent(props: Record<string, unknown>): string {
  return `
    <div style="min-width:200px;font-family:inherit">
      <div style="font-weight:600;font-size:14px;margin-bottom:8px;color:#e6edf3">
        ${props.parcel_nr || 'N/A'}
      </div>
      <div style="margin-bottom:6px">
        ${props.risk_level === 'pending'
          ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#6e768122;color:#8b949e;border:1px solid #6e768144;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:600">
               <span style="width:6px;height:6px;border-radius:50%;background:#6e7681"></span>
               ანალიზი მიმდინარეობს
             </span>`
          : `<span style="display:inline-flex;align-items:center;gap:4px;background:${props.color}22;color:${props.color};border:1px solid ${props.color}44;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:600">
               <span style="width:6px;height:6px;border-radius:50%;background:${props.color}"></span>
               ${props.risk_level === 'none' ? 'No Risk' : props.risk_level} (${props.disease_index}/100)
             </span>`}
      </div>
      ${props.risk_level !== 'pending' && props.primary_threat ? `<div style="font-size:12px;color:#8b949e;margin-bottom:4px">Primary threat: <b style="color:#e6edf3">${props.primary_threat}</b></div>` : ''}
      ${props.risk_level !== 'pending' && props.diseases && Array.isArray(props.diseases) && props.diseases.length > 0 ? `<div style="font-size:11px;color:#6e7681">Diseases: ${props.diseases.join(', ')}</div>` : ''}
      <div style="font-size:11px;color:#6e7681">Area: ${props.area_ha && typeof props.area_ha === 'number' ? props.area_ha.toFixed(2) + ' ha' : '—'}</div>
    </div>
  `
}

export default function ParcelMapView({
  fullscreen = false,
  height = '300px',
  allowForms = false,
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
  setSearchResult,
  getStyle,
  getSubzoneStyle,
  layerButtons,
  onParcelCreated,
  dataVersion = 0,
}: ParcelMapViewProps): React.ReactElement {
  const mapHeight = fullscreen ? '100%' : height

  // --- Layer panel collapse state ---
  const [layerPanelOpen, setLayerPanelOpen] = useState(true)
  const [basemapPanelOpen, setBasemapPanelOpen] = useState(false)

  // --- Cadastral overlay state ---
  const [cadastralOpen, setCadastralOpen] = useState(false)
  const [cadastralVisible, setCadastralVisible] = useState<CadastralLayerVisibility>({
    parcel: true,
    block: false,
    building: false,
  })
  const [gfiPopupContent, setGfiPopupContent] = useState<string | null>(null)
  const [gfiPopupLatLng, setGfiPopupLatLng] = useState<L.LatLng | null>(null)
  const cadastralSearch = useCadastralSearch()

  // --- Spatial layers state ---
  const [spatialOpen, setSpatialOpen] = useState(false)
  const [expandedLayerKey, setExpandedLayerKey] = useState<string | null>(null)
  const [spatialDeleting, setSpatialDeleting] = useState<string | null>(null)
  const [deleteCaptcha, setDeleteCaptcha] = useState<{
    expandKey: string
    num1: number
    num2: number
    answer: string
  } | null>(null)
  const [exportPanelKey, setExportPanelKey] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<string>('geojson')
  const [spatialExporting, setSpatialExporting] = useState<string | null>(null)
  const { activeProfile } = useProfileStore()
  const spatial = useSpatialLayers(activeProfile?.id)

  // --- Polygon draw state ---
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [drawnPoints, setDrawnPoints] = useState<L.LatLng[]>([])
  const [showDrawModal, setShowDrawModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [selectedSubzone, setSelectedSubzone] = useState<GeoJSONFeature | null>(null)
  const [terrainDetailParcel, setTerrainDetailParcel] = useState<{ id: string; nr: string } | null>(null)
  const [baseLayer, setBaseLayer] = useState<BasemapKey>('google')
  const isDrawingRef = useRef(false)
  const mapRef = useRef<L.Map | null>(null)

  // Keep ref in sync so onEachFeature closure always sees latest value
  React.useEffect(() => {
    isDrawingRef.current = isDrawingMode
  }, [isDrawingMode])

  // Listen for terrain detail modal open events from popup HTML buttons
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.parcelId) {
        setTerrainDetailParcel({ id: detail.parcelId, nr: detail.parcelNr || '' })
      }
    }
    window.addEventListener('openTerrainDetail', handler)
    return () => window.removeEventListener('openTerrainDetail', handler)
  }, [])

  const startDrawing = (): void => {
    setIsDrawingMode(true)
    setDrawnPoints([])
    setSelectedParcel(null)
    setSelectedSubzone(null)
  }

  const cancelDrawing = (): void => {
    setIsDrawingMode(false)
    setDrawnPoints([])
  }

  const completeDrawing = (): void => {
    if (drawnPoints.length < 3) return
    setIsDrawingMode(false)
    setShowDrawModal(true)
  }

  const undoLastPoint = (): void => {
    setDrawnPoints(prev => prev.slice(0, -1))
  }

  const handleDrawSaved = (): void => {
    setShowDrawModal(false)
    setDrawnPoints([])
    onParcelCreated?.()
  }

  const handleDrawCancelled = (): void => {
    setShowDrawModal(false)
    setDrawnPoints([])
  }

  const handleExport = async (parcelId: string): Promise<void> => {
    if (!parcelId) return
    setExporting(true)
    try {
      const res = await parcelsApi.exportVRA(parcelId, 'N')
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Export failed' }))
        throw new Error(err.detail || 'Export failed')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vra_${parcelId}_N.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  // ── Spatial layer export ────────────────────────────────────────────────────
  const handleSpatialExport = async (layerType: LayerType, layerName: string): Promise<void> => {
    setSpatialExporting(`${layerType}::${layerName}`)
    try {
      const res = await spatialLayersApi.export(layerType, layerName, exportFormat, activeProfile?.id)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Export failed' }))
        throw new Error(err.detail || 'Export failed')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${layerName}_${exportFormat}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'ექსპორტი ვერ მოხერხდა')
    } finally {
      setSpatialExporting(null)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!selectedParcel?.id) return
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    setDeleting(true)
    try {
      await parcelsApi.delete(selectedParcel.id as string)
      setSelectedParcel(null)
      setDeleteConfirm(false)
      onParcelCreated?.() // reuse refresh callback
    } catch (e) {
      alert(e instanceof Error ? e.message : 'წაშლა ვერ მოხერხდა')
    } finally {
      setDeleting(false)
    }
  }

  const bindParcelLabel = (feature: GeoJSONFeature, layer: Layer): void => {
    const nr = (feature.properties?.parcel_nr as string | undefined) || ''
    if (!nr) return
    ;(layer as L.Path).bindTooltip(
      `<span>${nr}</span>`,
      { permanent: true, direction: 'center', className: 'parcel-nr-label', opacity: 1 }
    )
  }

  const onEachFeature = (feature: GeoJSONFeature, layer: Layer): void => {
    const props = feature.properties

    bindParcelLabel(feature, layer)

    if (allowForms) {
      layer.on('click', () => {
        if (isDrawingRef.current) return
        setSelectedSubzone(null)
        setDeleteConfirm(false)
        handleParcelSelect(feature)
      })
    } else {
      const popupContent = layerMode === 'none'
        ? createMinimalPopupContent(props)
        : createParcelPopupContent(props)
      layer.bindPopup(popupContent, { maxWidth: 260 })
      layer.on('click', () => {
        if (isDrawingRef.current) return
        setSelectedSubzone(null)
        setDeleteConfirm(false)
        handleParcelSelect(feature)
      })
    }

    layer.on('mouseover', (e: LeafletMouseEvent) => {
      const target = e.target as L.Path
      target.setStyle({ fillOpacity: 0.85, weight: 3 })
    })
    layer.on('mouseout', (e: LeafletMouseEvent) => {
      const target = e.target as L.Path
      // Re-apply the correct computed style (handles selected state correctly)
      target.setStyle(getStyle(feature))
    })
  }

  const onEachSubzone = (feature: GeoJSONFeature, layer: Layer): void => {
    layer.on('click', () => {
      if (isDrawingRef.current) return
      setSelectedParcel(null)
      setSelectedSubzone(feature)
    })
    layer.on('mouseover', (e: LeafletMouseEvent) => {
      (e.target as L.Path).setStyle({ fillOpacity: 0.9 })
    })
    layer.on('mouseout', (e: LeafletMouseEvent) => {
      (e.target as L.Path).setStyle({ fillOpacity: 0.72 })
    })
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg isolate" style={{ height: mapHeight }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b0d0c]">
          <div className="text-center">
            <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-green-400 mx-auto" />
            <span className="text-sm text-white/50 tracking-wide">რუკა იტვირთება...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b0d0c]">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-sm text-white/60">რუკის მონაცემების ჩატვირთვა ვერ მოხერხდა</p>
            <p className="text-xs text-white/30">{error}</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[42.0, 43.5]}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapRefCapture mapRef={mapRef} />
        {['google', 'terrain', 'osm'].map((key) => {
          const bm = BASEMAPS[key as BasemapKey]
          return baseLayer === bm.key && bm.url ? (
            <BasemapTileLayer key={bm.key} basemap={bm} />
          ) : null
        })}

        {geojson && geojson.features && geojson.features.length > 0 && layerMode !== 'vra' && layerMode !== 'disease' && (
          <>
            <FitBounds geojson={geojson} />
            <GeoJSON
              key={`${layerMode}-${dataVersion}`}
              data={geojson as GeoJSON.GeoJsonObject}
              style={(feature) => getStyle(feature as unknown as GeoJSONFeature)}
              onEachFeature={(feature, layer) =>
                onEachFeature(feature as unknown as GeoJSONFeature, layer)
              }
              ref={geoJsonRef as React.RefObject<L.GeoJSON>}
            />
          </>
        )}

        {layerMode === 'disease' && diseaseGeojson && diseaseGeojson.features && diseaseGeojson.features.length > 0 && (
          <>
            <GeoJSON
              key="disease-layer"
              data={diseaseGeojson as GeoJSON.GeoJsonObject}
              style={(feature) => {
                const props = (feature as unknown as GeoJSONFeature).properties
                // Use backend-supplied color so 'pending' parcels render grey, not green
                const fill = (props?.color as string) || diseaseIndexColor(props?.disease_index as number | null)
                return { fillColor: fill, fillOpacity: 0.7, color: '#ffffff', weight: 2.5, opacity: 1 }
              }}
              onEachFeature={(feature, layer) => {
                const f = feature as unknown as GeoJSONFeature
                bindParcelLabel(f, layer)
                layer.bindPopup(createDiseasePopupContent(f.properties), { maxWidth: 260 })
              }}
            />
          </>
        )}

        {/* Fallback: show base parcels when disease data is empty */}
        {layerMode === 'disease' && (!diseaseGeojson || !diseaseGeojson.features || diseaseGeojson.features.length === 0) && geojson && geojson.features && geojson.features.length > 0 && (
          <>
            <FitBounds geojson={geojson} />
            <GeoJSON
              key="disease-fallback"
              data={geojson as GeoJSON.GeoJsonObject}
              style={() => ({
                fillColor: 'transparent',
                fillOpacity: 0,
                color: '#ffffff',
                weight: 2.5,
                opacity: 1,
              })}
              onEachFeature={(feature, layer) =>
                onEachFeature(feature as unknown as GeoJSONFeature, layer)
              }
            />
            <div className="leaflet-top leaflet-right" style={{ marginTop: 60 }}>
              <div className="leaflet-control" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                დაავადების მონაცემები არ არის. ნაკვეთების საზღვრები ნაჩვენებია.
              </div>
            </div>
          </>
        )}

        {layerMode === 'vra' && geojson && geojson.features && geojson.features.length > 0 && (
          <>
            <FitBounds geojson={geojson} />
            <GeoJSON
              key="vra-base"
              data={geojson as GeoJSON.GeoJsonObject}
              style={() => ({
                fillColor: 'transparent',
                fillOpacity: 0,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                interactive: false,
              })}
              onEachFeature={(feature, layer) =>
                bindParcelLabel(feature as unknown as GeoJSONFeature, layer)
              }
            />
          </>
        )}

        {layerMode === 'vra' && subzonesGeojson && subzonesGeojson.features && subzonesGeojson.features.length > 0 && (
          <GeoJSON
            key="vra-zones"
            data={subzonesGeojson as GeoJSON.GeoJsonObject}
            style={(feature) => getSubzoneStyle(feature as unknown as GeoJSONFeature)}
            onEachFeature={(feature, layer) =>
              onEachSubzone(feature as unknown as GeoJSONFeature, layer)
            }
          />
        )}

        {layerMode === 'vra' && geojson && geojson.features && geojson.features.length > 0 && (
          <GeoJSON
            key="vra-outlines"
            data={geojson as GeoJSON.GeoJsonObject}
            style={() => ({
              fillColor: 'transparent',
              fillOpacity: 0,
              color: '#e6edf3',
              weight: 2.5,
              opacity: 1,
              interactive: false,
            })}
          />
        )}

        {layerMode === 'vra' && !loading && subzonesGeojson && subzonesGeojson.features && subzonesGeojson.features.length === 0 && (
          <div className="leaflet-top leaflet-right" style={{ marginTop: 60 }}>
            <div className="leaflet-control" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              VRA ქვეზონები ჯერ არ შექმნილა. გაუშვით ანალიზი.
            </div>
          </div>
        )}

        {/* Polygon draw tool — always mounted so cursor/click effects work */}
        <PolygonDrawTool
          isActive={isDrawingMode}
          points={drawnPoints}
          onAddPoint={(latlng) => setDrawnPoints(prev => [...prev, latlng])}
        />

        {searchResult && (
          <>
            <FlyToFeature feature={searchResult} clear={() => setSearchResult(null)} />
            <GeoJSON
              key={`search-${(searchResult.properties.id as string)}`}
              data={searchResult as unknown as GeoJSON.GeoJsonObject}
              style={() => ({
                fillColor: '#58a6ff',
                fillOpacity: 0.35,
                color: '#58a6ff',
                weight: 4,
                opacity: 1,
                dashArray: '6 4',
              })}
              ref={highlightLayerRef as React.RefObject<L.GeoJSON>}
            />
          </>
        )}

        {/* Aspect arrows — show when terrain or slope layer is active */}
        {(layerMode === 'terrain' || layerMode === 'slope') && (
          <TerrainAspectArrows
            geojson={geojson}
            visible={(layerMode === 'terrain' || layerMode === 'slope')}
          />
        )}

        {/* NAPR cadastral WMS layers + click-to-identify */}
        {cadastralOpen && (
          <CadastralLayers
            visible={cadastralVisible}
            searchResult={cadastralSearch.result}
            searchResponse={cadastralSearch.searchResponse}
            onFeatureInfo={(html, latlng) => {
              setGfiPopupContent(html)
              setGfiPopupLatLng(latlng)
            }}
            cadastralLayerActive={cadastralOpen}
          />
        )}
        <GfiPopup content={gfiPopupContent} latlng={gfiPopupLatLng} />

        {/* Spatial layers renderer */}
        <SpatialLayersRenderer layers={spatial.activeLayers} />

        {/* Map tools: coordinates, share, measure area/length */}
        <MapToolsPanel />

        {!loading && geojson && geojson.features && geojson.features.length === 0 && (
          <div className="leaflet-top leaflet-right" style={{ marginTop: 60 }}>
            <div className="leaflet-control" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              ნაკვეთი არ მოიძებნა. GeoJSON-ის იმპორტი დასაწყებად.
            </div>
          </div>
        )}
      </MapContainer>

      {/* Terrain detail modal */}
      {terrainDetailParcel && (
        <TerrainDetailModal
          parcelId={terrainDetailParcel.id}
          parcelNr={terrainDetailParcel.nr}
          onClose={() => setTerrainDetailParcel(null)}
        />
      )}

      {/* Search input */}
      <div className="absolute left-1/2 -translate-x-1/2 top-3 z-[1000]">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch() }}
          className="flex items-center"
        >
          <div className={`flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-xl border shadow-2xl px-3 py-1.5 transition-colors ${
            searchError ? 'border-red-500/50' : 'border-white/[0.08] focus-within:border-green-400/40'
          }`}>
            <Search className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value) }}
              placeholder="ნაკვეთის ID..."
              className="w-32 bg-transparent text-xs text-white placeholder-white/30 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </form>
        {searchError && (
          <div className="mt-1.5 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-xl px-3 py-1.5 text-xs text-red-400 text-center">
            ვერ მოიძებნა
          </div>
        )}
      </div>

      {/* Custom zoom control — glassmorphic vertical pill, bottom-right above AI button */}
      <div className="absolute right-4 bottom-24 z-[1000] flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-black/50 backdrop-blur-xl shadow-2xl">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="group relative flex items-center justify-center w-9 h-9 text-white/50 hover:text-white hover:bg-white/10 transition-colors border-b border-white/[0.06]"
          aria-label="გადიდება"
        >
          <Plus className="w-4 h-4" />
          <span className="pointer-events-none absolute right-11 whitespace-nowrap rounded-lg border border-white/[0.08] bg-black/60 backdrop-blur-xl px-2.5 py-1.5 text-xs text-white/80 opacity-0 shadow-2xl transition-opacity group-hover:opacity-100">
            გადიდება
          </span>
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="group relative flex items-center justify-center w-9 h-9 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="დაპატარავება"
        >
          <Minus className="w-4 h-4" />
          <span className="pointer-events-none absolute right-11 whitespace-nowrap rounded-lg border border-white/[0.08] bg-black/60 backdrop-blur-xl px-2.5 py-1.5 text-xs text-white/80 opacity-0 shadow-2xl transition-opacity group-hover:opacity-100">
            დაპატარავება
          </span>
        </button>
      </div>

      {/* Layer selector — collapsible glassmorphic right panel */}
      <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2" style={{ width: 172 }}>
        {/* Layer mode — collapsible */}
        <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black/60 backdrop-blur-xl shadow-2xl">
          <button
            onClick={() => setLayerPanelOpen(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-semibold text-white/70 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span>ფენა</span>
              {!layerPanelOpen && (
                <span className={`text-[10px] font-medium ${layerMode === 'none' ? 'text-white/25' : 'text-green-400/80'}`}>
                  {layerMode === 'none' ? 'გამორთ.' : layerButtons.find(b => b.mode === layerMode)?.label}
                </span>
              )}
            </span>
            <span className={`text-white/30 transition-transform duration-200 ${layerPanelOpen ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>
          {layerPanelOpen && (
            <div className="border-t border-white/[0.06]">
              {layerButtons.filter(btn => btn.mode !== 'none').map((btn) => {
                const isOn = layerMode === btn.mode
                return (
                <button
                  key={btn.mode}
                  onClick={() => setLayerMode(isOn ? 'none' : btn.mode)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-all border-b border-white/[0.03] last:border-0 flex items-center justify-between gap-2 ${
                    isOn
                      ? 'bg-green-500/15 text-green-400'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{btn.label}</span>
                  {isOn
                    ? <Eye className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    : <EyeOff className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                  }
                </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Basemap — collapsible */}
        <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black/60 backdrop-blur-xl shadow-xl">
          <button
            onClick={() => setBasemapPanelOpen(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-semibold text-white/70 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <span>ბაზისრუკა</span>
              {!basemapPanelOpen && (
                <span className="text-[10px] text-white/40 font-medium">
                  {baseLayer === 'google' ? '🛰️' : baseLayer === 'terrain' ? '🗻' : '🗺️'}
                </span>
              )}
            </span>
            <span className={`text-white/30 transition-transform duration-200 ${basemapPanelOpen ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>
          {basemapPanelOpen && (
            <div className="border-t border-white/[0.06]">
              {([
                { key: 'google' as BasemapKey, label: '🛰️ სატელიტი' },
                { key: 'terrain' as BasemapKey, label: '🗻 ტოპო' },
                { key: 'osm' as BasemapKey, label: '🗺️ რუკა' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setBaseLayer(key)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-medium transition-all border-b border-white/[0.03] last:border-0 flex items-center gap-2 ${
                    baseLayer === key
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    baseLayer === key ? 'bg-white/60' : 'bg-white/15'
                  }`} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Left-side top controls — single flex column so draw controls push cadastral down dynamically */}
      <div className="absolute left-4 top-4 z-[1000] flex flex-col items-start gap-2">

      {/* Draw plot button */}
      {!isDrawingMode && !showDrawModal && (
        <button
          onClick={startDrawing}
          className="flex items-center gap-2 rounded-xl border border-green-400/25 bg-black/50 backdrop-blur-xl px-3.5 py-2 text-sm font-medium text-green-400 shadow-2xl hover:bg-green-400/10 hover:border-green-400/40 transition-all"
        >
          <Pentagon className="h-4 w-4" />
          ნაკვეთის დახაზვა
        </button>
      )}

      {/* Drawing mode controls */}
      {isDrawingMode && (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl border border-green-400/20 bg-black/60 backdrop-blur-xl px-3.5 py-3 shadow-2xl">
            <p className="text-xs font-semibold text-green-400 mb-1.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              დახაზვის რეჟიმი
            </p>
            <p className="text-xs text-white/40">
              {drawnPoints.length === 0
                ? 'დააწკაპეთ პირველი წერტილი'
                : drawnPoints.length < 3
                ? `${drawnPoints.length} წერტილი — გააგრძელეთ`
                : `${drawnPoints.length} წერტილი — მზადაა`}
            </p>
          </div>
          <div className="flex gap-1.5">
            {drawnPoints.length > 0 && (
              <button
                onClick={undoLastPoint}
                title="ბოლო წერტილის გაუქმება"
                className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/[0.08] bg-black/50 backdrop-blur-xl text-white/40 hover:text-white hover:bg-white/10 shadow-xl transition-all"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={completeDrawing}
              disabled={drawnPoints.length < 3}
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl border border-green-400/30 bg-green-400/10 backdrop-blur-xl text-xs font-semibold text-green-400 shadow-xl hover:bg-green-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              დახაზვის დასრულება
            </button>
            <button
              onClick={cancelDrawing}
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/[0.08] bg-black/50 backdrop-blur-xl text-white/40 hover:text-red-400 hover:border-red-400/30 shadow-xl transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Cadastral toggle + panel */}
      <div className="flex flex-col items-start gap-2">
        <button
          onClick={() => setCadastralOpen(v => !v)}
          title="კადასტრი"
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all ${
            cadastralOpen
              ? 'border-orange-400/40 bg-orange-500/10 text-orange-400'
              : 'border-white/[0.08] bg-black/50 text-white/60 hover:text-orange-400 hover:border-orange-400/30'
          }`}
        >
          <MapPin className="h-4 w-4" />
          კადასტრი
        </button>

        {cadastralOpen && (
          <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl shadow-2xl p-3.5 flex flex-col gap-3 min-w-[240px]">
            {/* Layer toggles */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5 flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> ფენები
              </p>
              {(
                [
                  { key: 'parcel' as const, label: 'ნაკვეთები (NAPR)' },
                  { key: 'block' as const, label: 'სარეგისტრაციო კვარტლები' },
                  { key: 'building' as const, label: 'შენობები' },
                ] as const
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cadastralVisible[key]}
                    onChange={(e) =>
                      setCadastralVisible(prev => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded accent-orange-500"
                  />
                  <span className="text-xs text-white/60">{label}</span>
                </label>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06]" />

            {/* Cadastral code search */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                <Search className="h-3 w-3" /> კადასტრული ძებნა
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); cadastralSearch.search() }}
                className="flex items-center"
              >
                <div className={`flex items-center flex-1 gap-1 rounded-lg bg-white/[0.05] border px-2.5 py-1.5 transition-colors ${
                  cadastralSearch.notFound ? 'border-red-500/40' : 'border-white/[0.08] focus-within:border-orange-400/40'
                }`}>
                  <input
                    type="text"
                    value={cadastralSearch.query}
                    onChange={(e) => cadastralSearch.setQuery(e.target.value)}
                    placeholder="საკადასტრო კოდი..."
                    className="flex-1 min-w-0 bg-transparent text-xs text-white placeholder-white/30 outline-none"
                  />
                  {(cadastralSearch.query || cadastralSearch.result) && (
                    <button type="button" onClick={cadastralSearch.clear} className="text-white/30 hover:text-white/60">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={cadastralSearch.searching}
                  className="ml-1.5 flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-400/20 text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                >
                  {cadastralSearch.searching
                    ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin block" />
                    : <Search className="h-3 w-3" />}
                </button>
              </form>
              {cadastralSearch.notFound && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 text-[11px] text-red-400">
                  ნაკვეთი ვერ მოიძებნა
                </div>
              )}
              {cadastralSearch.searchResponse && cadastralSearch.searchResponse.level !== 'none' && cadastralSearch.searchResponse.level !== 'parcel' && cadastralSearch.searchResponse.message && (
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1.5 text-[11px] text-yellow-400">
                  {cadastralSearch.searchResponse.message}
                </div>
              )}
              {cadastralSearch.error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 text-[11px] text-red-400">
                  შეცდომა: {cadastralSearch.error}
                </div>
              )}
              {cadastralSearch.result && (
                <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 text-[11px] text-orange-400 font-medium">
                  ✓ ნაკვეთი ნაპოვნია: {cadastralSearch.result.code}
                </div>
              )}
            </div>
          </div>
        )}
      </div>{/* end cadastral inner */}

      {/* ── სივრცული მონაცემები panel ─────────────────────────────────── */}
      <div className="flex flex-col items-start gap-2">
        <button
          onClick={() => {
            setSpatialOpen(v => {
              if (!v && !spatial.meta) spatial.fetchMeta()
              return !v
            })
          }}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all ${
            spatialOpen || spatial.activeLayers.length > 0
              ? 'border-purple-400/40 bg-purple-500/10 text-purple-400'
              : 'border-white/[0.08] bg-black/50 text-white/60 hover:text-purple-400 hover:border-purple-400/30'
          }`}
        >
          <Database className="h-4 w-4" />
          სივრცული მონაცემები
          {spatial.activeLayers.length > 0 && (
            <span className="ml-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded px-1">
              {spatial.activeLayers.length}
            </span>
          )}
        </button>

        {spatialOpen && (
          <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl shadow-2xl p-3.5 flex flex-col gap-2.5" style={{ minWidth: 240, maxWidth: 280 }}>
            {spatial.metaLoading && (
              <p className="text-xs text-white/40 text-center py-2">იტვირთება...</p>
            )}

            {!spatial.metaLoading && spatial.totalCount === 0 && (
              <p className="text-xs text-white/30 text-center py-2">
                სივრცული მონაცემები არ მოიძებნა.
                <br />
                <span className="text-[10px]">ატვირთეთ ხაზები, წერტილები ან პოლიგონები.</span>
              </p>
            )}

            {!spatial.metaLoading && spatial.meta && (
              <>
                {(
                  [
                    { key: 'polygon' as LayerType, label: 'პოლიგონ-ფენები', color: 'blue' },
                    { key: 'line'    as LayerType, label: 'ხაზ-ფენები',     color: 'green' },
                    { key: 'point'   as LayerType, label: 'წერტილ-ფენები',  color: 'yellow' },
                  ] as const
                ).map(({ key, label, color }) => {
                  const items = spatial.meta![key]
                  if (items.length === 0) return null
                  const colorCls =
                    color === 'blue'   ? 'text-blue-400'
                    : color === 'green'  ? 'text-green-400'
                    : 'text-yellow-400'
                  return (
                    <div key={key}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${colorCls}`}>
                        {label}
                      </p>
                      <div className="flex flex-col gap-1">
                        {items.map(layer => {
                          const on = spatial.isActive(key, layer.name)
                          const expandKey = `${key}::${layer.name}`
                          const expanded = expandedLayerKey === expandKey
                          const activeLayer = spatial.activeLayers.find(
                            l => l.type === key && l.name === layer.name
                          )

                          return (
                            <div key={layer.name} className="rounded-lg border border-white/[0.06] overflow-hidden">
                              {/* Layer row */}
                              <div className="flex items-center gap-2 px-2.5 py-1.5">
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => spatial.toggleLayer(key, layer.name)}
                                  className="h-3.5 w-3.5 rounded accent-purple-500 flex-shrink-0 cursor-pointer"
                                />
                                <span
                                  className={`text-xs flex-1 min-w-0 truncate cursor-pointer select-none ${on ? 'text-white/90' : 'text-white/50'}`}
                                  onClick={() => spatial.toggleLayer(key, layer.name)}
                                >
                                  {layer.name}
                                </span>
                                <span className="text-[10px] text-white/25 flex-shrink-0">{layer.count}</span>
                                {/* Three-dots: expand property keys */}
                                {layer.property_keys.length > 0 && (
                                  <button
                                    title="კლასიფიკაციის ვარიანტები"
                                    onClick={() => setExpandedLayerKey(expanded ? null : expandKey)}
                                    className={`flex-shrink-0 rounded p-0.5 transition-colors ${expanded ? 'text-purple-400 bg-purple-500/15' : 'text-white/25 hover:text-white/60'}`}
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {/* Loading spinner */}
                                {activeLayer?.loading && (
                                  <span className="h-3 w-3 border border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                )}
                                {/* Delete button */}
                                <button
                                  title='ფენის წაშლა'
                                  onClick={() => {
                                    const num1 = Math.floor(Math.random() * 9) + 1
                                    const num2 = Math.floor(Math.random() * 9) + 1
                                    setDeleteCaptcha({ expandKey, num1, num2, answer: '' })
                                  }}
                                  disabled={spatialDeleting === expandKey}
                                  className={`flex-shrink-0 rounded p-0.5 transition-colors text-white/20 hover:text-red-400 hover:bg-red-500/10 ${spatialDeleting === expandKey ? 'opacity-50' : ''}`}
                                >
                                  {spatialDeleting === expandKey ? (
                                    <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin block" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                {/* Export button */}
                                <button
                                  title='ფენის ექსპორტი'
                                  onClick={() => {
                                    setExportPanelKey(exportPanelKey === expandKey ? null : expandKey)
                                    setExportFormat('geojson')
                                  }}
                                  disabled={spatialExporting === expandKey}
                                  className={`flex-shrink-0 rounded p-0.5 transition-colors text-white/20 hover:text-blue-400 hover:bg-blue-500/10 ${spatialExporting === expandKey ? 'opacity-50' : ''}`}
                                >
                                  {spatialExporting === expandKey ? (
                                    <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin block" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>

                              {/* Captcha delete confirmation */}
                              {deleteCaptcha?.expandKey === expandKey && (
                                <div className="border-t border-white/[0.06] px-2.5 py-2 bg-red-500/[0.03]">
                                  <p className="text-[10px] text-red-300 mb-1.5">დაადასტურეთ წაშლა:</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/70 font-mono">
                                      {deleteCaptcha.num1} + {deleteCaptcha.num2} = ?
                                    </span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={deleteCaptcha.answer}
                                      onChange={(e) => setDeleteCaptcha({ ...deleteCaptcha, answer: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const expected = deleteCaptcha.num1 + deleteCaptcha.num2
                                          if (parseInt(deleteCaptcha.answer) === expected) {
                                            setSpatialDeleting(expandKey)
                                            setDeleteCaptcha(null)
                                            spatial.deleteLayer(key, layer.name).finally(() => {
                                              setSpatialDeleting(prev => prev === expandKey ? null : prev)
                                            })
                                          }
                                        }
                                      }}
                                      className="w-12 bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5 text-xs text-white outline-none text-center"
                                      placeholder="?"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        const expected = deleteCaptcha.num1 + deleteCaptcha.num2
                                        if (parseInt(deleteCaptcha.answer) === expected) {
                                          setSpatialDeleting(expandKey)
                                          setDeleteCaptcha(null)
                                          spatial.deleteLayer(key, layer.name).finally(() => {
                                            setSpatialDeleting(prev => prev === expandKey ? null : prev)
                                          })
                                        } else {
                                          setDeleteCaptcha({ ...deleteCaptcha, answer: '' })
                                        }
                                      }}
                                      className="text-[10px] bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 rounded px-2 py-0.5 transition-colors"
                                    >
                                      წაშლა
                                    </button>
                                    <button
                                      onClick={() => setDeleteCaptcha(null)}
                                      className="text-[10px] text-white/40 hover:text-white/70 px-1 py-0.5 transition-colors"
                                    >
                                      გაუქმება
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Export format panel */}
                              {exportPanelKey === expandKey && (
                                <div className='mt-2 p-2 rounded bg-blue-500/10 border border-blue-400/20'>
                                  <div className='text-xs text-blue-300 mb-2'>აირჩიეთ ფორმატი:</div>
                                  <div className='flex flex-wrap gap-1 mb-2'>
                                    {(['geojson', 'shapefile', 'kml', 'dxf', 'gpx'] as const).map(fmt => (
                                      <button
                                        key={fmt}
                                        onClick={() => setExportFormat(fmt)}
                                        className={`px-2 py-0.5 text-[10px] rounded uppercase transition-colors border ${
                                          exportFormat === fmt
                                            ? 'bg-blue-500/30 border-blue-400/50 text-blue-200'
                                            : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
                                        }`}
                                      >
                                        {fmt === 'shapefile' ? 'Shapefile' : fmt.toUpperCase()}
                                      </button>
                                    ))}
                                  </div>
                                  <div className='flex gap-1 justify-end'>
                                    <button
                                      onClick={() => setExportPanelKey(null)}
                                      className='px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70 transition-colors'
                                    >
                                      გაუქმება
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleSpatialExport(key as LayerType, layer.name)
                                        setExportPanelKey(null)
                                      }}
                                      disabled={spatialExporting !== null}
                                      className='px-2 py-1 text-xs rounded bg-blue-500/70 hover:bg-blue-500 text-white transition-colors disabled:opacity-50'
                                    >
                                      ექსპორტი
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Property key selector (expanded) */}
                              {expanded && on && layer.property_keys.length > 0 && (
                                <div className="border-t border-white/[0.06] px-2.5 py-2 bg-white/[0.03]">
                                  <p className="text-[10px] text-white/35 mb-1.5 flex items-center gap-1">
                                    <ChevronDown className="h-3 w-3" /> კლასიფიკაცია:
                                  </p>
                                  <div className="flex flex-col gap-1">
                                    {/* "None" option */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={expandKey}
                                        checked={activeLayer?.classifyKey === null}
                                        onChange={() => spatial.setClassifyKey(key, layer.name, null)}
                                        className="h-3 w-3 accent-purple-500"
                                      />
                                      <span className="text-[11px] text-white/40">— ერთფერი</span>
                                    </label>
                                    {layer.property_keys.map(pk => (
                                      <label key={pk} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={expandKey}
                                          checked={activeLayer?.classifyKey === pk}
                                          onChange={() => spatial.setClassifyKey(key, layer.name, pk)}
                                          className="h-3 w-3 accent-purple-500"
                                        />
                                        <span className={`text-[11px] truncate ${activeLayer?.classifyKey === pk ? 'text-purple-300 font-medium' : 'text-white/60'}`}>
                                          {pk}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Hint when layer not yet active */}
                              {expanded && !on && (
                                <div className="border-t border-white/[0.06] px-2.5 py-1.5 bg-white/[0.03]">
                                  <p className="text-[10px] text-white/30">ჩართეთ ფენა კლასიფიკაციისთვის</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>{/* end spatial layers */}

        {/* Spatial layer classification legend */}
        <SpatialLayerLegend layers={spatial.activeLayers} />

      </div>{/* end left-side top controls wrapper */}

      {/* Legend */}
      {layerMode !== 'none' && <div className="absolute bottom-6 left-4 z-[1000] rounded-xl border border-white/[0.08] bg-black/55 backdrop-blur-xl px-4 py-3 shadow-2xl">
        <p className="mb-2 text-xs font-bold text-white/80 uppercase tracking-widest">
          {layerMode === 'zone' ? 'მინერალური ზონა' : layerMode === 'vra' ? 'VRA NDVI კლასი' : layerMode.toUpperCase()}
        </p>
        {layerMode === 'zone' && (
          <div className="flex flex-col gap-1.5">
            {[
              { color: '#d32f2f', label: 'კრიტიკული' },
              { color: '#f57c00', label: 'მაღალი' },
              { color: '#fbc02d', label: 'საშუალო' },
              { color: '#388e3c', label: 'OK' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded shadow-sm" style={{ background: item.color }} />
                <span className="text-xs text-white/55 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {layerMode === 'vra' && (
          <div className="flex flex-col gap-1.5">
            {[
              { color: '#1b5e20', label: 'ძლიერი ვეგ. (×0.70)' },
              { color: '#388e3c', label: 'კარგი ვეგ. (×0.85)' },
              { color: '#a5d6a7', label: 'საშუალო (×1.00)' },
              { color: '#e65100', label: 'სუსტი (×1.20)' },
              { color: '#b71c1c', label: 'ძალიან სუსტი (×1.40)' },
              { color: '#58a6ff', label: 'მონაცემი არ არის' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded shadow-sm" style={{ background: item.color }} />
                <span className="text-xs text-white/55 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {(layerMode === 'ndvi' || layerMode === 'ndre') && (
          <div className="flex flex-col gap-1.5">
            {[
              { color: '#d32f2f', label: layerMode === 'ndvi' ? '< 0.2' : '< 0.08' },
              { color: '#f57c00', label: layerMode === 'ndvi' ? '0.2–0.4' : '0.08–0.14' },
              { color: '#fbc02d', label: layerMode === 'ndvi' ? '0.4–0.6' : '0.14–0.20' },
              { color: '#388e3c', label: layerMode === 'ndvi' ? '> 0.6' : '> 0.20' },
              { color: '#6e7681', label: 'მონაცემი არ არის' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded shadow-sm" style={{ background: item.color }} />
                <span className="text-xs text-white/55 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {layerMode === 'disease' && (
          <div className="flex flex-col gap-1.5">
            {[
              { color: '#d32f2f', label: 'მაღალი რისკი (75-100)' },
              { color: '#f57c00', label: 'საშუალო-მაღალი (55-75)' },
              { color: '#fbc02d', label: 'საშუალო (35-55)' },
              { color: '#8bc34a', label: 'დაბალი (15-35)' },
              { color: '#388e3c', label: 'არ არის (0-15)' },
              { color: '#6e7681', label: 'მონაცემი არ არის' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded shadow-sm" style={{ background: item.color }} />
                <span className="text-xs text-white/55 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {layerMode === 'terrain' && (
          <div className="flex flex-col gap-1.5">
            {[
              { color: '#1b5e20', label: '< 100 м (დაბალი)' },
              { color: '#4fc3f7', label: '100–200 м' },
              { color: '#1976d2', label: '200–300 მ' },
              { color: '#fbc02d', label: '300–600 მ' },
              { color: '#f57c00', label: '600–1000 მ' },
              { color: '#d32f2f', label: '> 1000 მ (მაღალი)' },
              { color: '#9e9e9e', label: 'მონაცემი არ არის' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded shadow-sm" style={{ background: item.color }} />
                <span className="text-xs text-white/55 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {layerMode === 'slope' && (
          <div className="flex flex-col gap-1.5">
            {[
              { color: '#4fc3f7', label: '< 1° (ბრტყელი)' },
              { color: '#1976d2', label: '1–2° (დაბალი)' },
              { color: '#8bc34a', label: '2–5° (საშუალო)' },
              { color: '#fbc02d', label: '5–10° (მოდერატული)' },
              { color: '#f57c00', label: '10–20° (მაღალი)' },
              { color: '#d32f2f', label: '> 20° (ძალიან მაღალი)' },
              { color: '#9e9e9e', label: 'მონაცემი არ არის' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded shadow-sm" style={{ background: item.color }} />
                <span className="text-xs text-white/55 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        )}
        {layerMode === 'runoff' && (
          <div className="flex flex-col gap-1.5">
            {[
              { color: '#388e3c', label: 'დაბალი რისკი' },
              { color: '#fbc02d', label: 'საშუალო რისკი' },
              { color: '#f57c00', label: 'მაღალი რისკი' },
              { color: '#d32f2f', label: 'ძალიან მაღალი რისკი' },
              { color: '#9e9e9e', label: 'მონაცემი არ არის' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded shadow-sm" style={{ background: item.color }} />
                <span className="text-xs text-white/55 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>}

      {layerMode === 'vra' && subzonesGeojson && subzonesGeojson.features && subzonesGeojson.features.length > 0 && (() => {
        const f = subzonesGeojson.features
        const zoneCounts = {
          high:        f.filter(x => x.properties.ndvi_class === 'high').length,
          medium_high: f.filter(x => x.properties.ndvi_class === 'medium_high').length,
          medium:      f.filter(x => x.properties.ndvi_class === 'medium').length,
          medium_low:  f.filter(x => x.properties.ndvi_class === 'medium_low').length,
          low:         f.filter(x => x.properties.ndvi_class === 'low').length,
        }
        const zoneItems = [
          { key: 'high',        color: '#1b5e20', label: 'ძლ.' },
          { key: 'medium_high', color: '#388e3c', label: 'კარგ.' },
          { key: 'medium',      color: '#a5d6a7', label: 'საშ.' },
          { key: 'medium_low',  color: '#e65100', label: 'სუს.' },
          { key: 'low',         color: '#b71c1c', label: 'ძ.სუს.' },
        ] as const
        return (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] rounded-xl border border-white/[0.08] bg-black/55 backdrop-blur-xl px-4 py-3 shadow-2xl">
            <p className="text-xs font-bold text-white/70 mb-2">VRA ქვეზონები: {f.length}</p>
            <div className="flex items-center gap-3 text-xs">
              {zoneItems.map(({ key, color, label }) => zoneCounts[key] > 0 && (
                <span key={key} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                  <span className="text-white/40">{label}: <span className="font-medium text-white/70">{zoneCounts[key]}</span></span>
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Parcel info card */}
      {selectedParcel !== null && !showFormModal && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-80 rounded-2xl border border-white/[0.08] bg-black/65 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-white tracking-wide">
                  {selectedParcel.parcel_nr || selectedParcel.parcel_nr || 'ნაკვეთი'}
                </div>
                {selectedParcel.area_ha != null && (
                  <div className="text-xs text-white/35 mt-0.5">{selectedParcel.area_ha.toFixed(2)} ჰა</div>
                )}
              </div>
              <button
                onClick={() => { setSelectedParcel(null); setSelectedSubzone(null); setDeleteConfirm(false); }}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedParcel.mineral_zone && (() => {
              const zoneColors: Record<string, string> = {
                critical: '#ef4444', high: '#f97316', medium: '#eab308', ok: '#22c55e',
              }
              const z = selectedParcel.mineral_zone
              const c = zoneColors[z] || '#4ade80'
              return (
                <div className="mt-2">
                  <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}35` }}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    {z.charAt(0).toUpperCase() + z.slice(1)}
                  </span>
                </div>
              )
            })()}
          </div>

          {/* Metrics */}
          <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              { label: 'NDVI', value: selectedParcel.ndvi != null ? selectedParcel.ndvi.toFixed(3) : '—' },
              { label: 'NDRE', value: selectedParcel.ndre != null ? selectedParcel.ndre.toFixed(3) : '—' },
              { label: 'N', value: selectedParcel.n_dose_kg_ha != null ? `${selectedParcel.n_dose_kg_ha} კგ/ჰა` : '—' },
              { label: 'P', value: selectedParcel.p_dose_kg_ha != null ? `${selectedParcel.p_dose_kg_ha} კგ/ჰა` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-white/35 font-mono">{label}</span>
                <span className="text-xs font-semibold text-white/80">{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => selectedParcel?.id && handleExport(selectedParcel.id)}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/25 disabled:opacity-40 text-green-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                title="DJI Agro / SmartFarm იმპორტი"
              >
                {exporting ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                DJI ექსპორტი
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-40 ${
                  deleteConfirm
                    ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                    : 'bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/10'
                }`}
                title="ნაკვეთის წაშლა"
              >
                {deleting ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {deleteConfirm ? 'დარწმუნებული?' : 'წაშლა'}
              </button>
            </div>

            {/* Form log row */}
            {allowForms && (
              <div className="flex gap-2">
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as FormType)}
                  className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-white/70 outline-none cursor-pointer"
                >
                  <option value="fertilizer">სასუქი</option>
                  <option value="irrigation">მორწყვა</option>
                  <option value="cost">ხარჯი</option>
                </select>
                <button
                  onClick={() => setShowFormModal(true)}
                  className="flex items-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  ფორმა
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subzone info card */}
      {selectedSubzone !== null && !showFormModal && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-80 rounded-2xl border border-white/[0.08] bg-black/65 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-white tracking-wide">
                  {String(selectedSubzone.properties.zone_label || `ზონა ${selectedSubzone.properties.zone_index ?? ''}`)}
                </div>
                <div className="text-xs text-white/35 mt-0.5">
                  {String(selectedSubzone.properties.parcel_nr || selectedSubzone.properties.parcel_nr || 'ნაკვეთი')}
                  {selectedSubzone.properties.area_ha != null ? ` · ${(selectedSubzone.properties.area_ha as number).toFixed(2)} ჰა` : ''}
                </div>
              </div>
              <button
                onClick={() => setSelectedSubzone(null)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {!!selectedSubzone.properties.ndvi_class && (
              <div className="mt-2">
                <NDVIClassBadge ndviClass={selectedSubzone.properties.ndvi_class as string} />
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              { label: 'NDVI', value: selectedSubzone.properties.ndvi_mean != null ? (selectedSubzone.properties.ndvi_mean as number).toFixed(3) : '—' },
              { label: 'NDRE', value: selectedSubzone.properties.ndre_mean != null ? (selectedSubzone.properties.ndre_mean as number).toFixed(3) : '—' },
              { label: 'N', value: `${selectedSubzone.properties.n_dose_kg_ha != null ? String(selectedSubzone.properties.n_dose_kg_ha) : '—'} კგ/ჰა` },
              { label: 'P', value: `${selectedSubzone.properties.p_dose_kg_ha != null ? String(selectedSubzone.properties.p_dose_kg_ha) : '—'} კგ/ჰა` },
              { label: 'K', value: `${selectedSubzone.properties.k_dose_kg_ha != null ? String(selectedSubzone.properties.k_dose_kg_ha) : '—'} კგ/ჰა` },
              { label: 'Mg', value: `${selectedSubzone.properties.mg_dose_kg_ha != null ? String(selectedSubzone.properties.mg_dose_kg_ha) : '—'} კგ/ჰა` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-white/35 font-mono">{label}</span>
                <span className="text-xs font-semibold text-white/80">{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 pb-4">
            <button
              onClick={() => selectedSubzone?.properties?.parcel_id && handleExport(selectedSubzone.properties.parcel_id as string)}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/25 disabled:opacity-40 text-green-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
              title="DJI Agro / SmartFarm იმპორტი"
            >
              {exporting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              DJI ექსპორტი
            </button>
          </div>
        </div>
      )}

      {/* Form modal */}
      {allowForms && showFormModal && selectedParcel !== null && (
        <MapFormModal
          parcelId={selectedParcel.id as string}
          parcelCode={(selectedParcel.parcel_nr as string) || (selectedParcel.parcel_nr as string) || ''}
          formType={formType}
          onClose={() => {
            setShowFormModal(false)
            setSelectedParcel(null)
          }}
        />
      )}

      {/* Draw parcel save modal */}
      {showDrawModal && drawnPoints.length >= 3 && (
        <DrawParcelModal
          points={drawnPoints}
          onSaved={handleDrawSaved}
          onCancel={handleDrawCancelled}
        />
      )}
    </div>
  )
}
