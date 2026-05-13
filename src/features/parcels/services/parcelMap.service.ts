import { parcels as parcelsApi } from '@/shared/lib/api'

export type LayerMode = 'none' | 'zone' | 'ndvi' | 'ndre' | 'vra' | 'disease' | 'terrain' | 'slope' | 'runoff'
export type FormType = 'fertilizer' | 'irrigation' | 'cost'

export interface ParcelCardData {
  id: string
  parcel_nr: string | null
  area_ha: number | null
  mineral_zone: string | null
  ndvi: number | null
  ndre: number | null
  n_dose_kg_ha: number | null
  p_dose_kg_ha: number | null
}

export interface GeoJSONFeature {
  type: string
  properties: Record<string, unknown>
  geometry: object
}

export interface GeoJSONCollection {
  type: string
  features: GeoJSONFeature[]
}

export interface MapData {
  geojson: GeoJSONCollection | null
  subzonesGeojson: GeoJSONCollection | null
  diseaseGeojson: GeoJSONCollection | null
}

// Color helpers
export const zoneColor = (zone: string): string => {
  switch (zone?.toLowerCase()) {
    case 'critical': return '#d32f2f'
    case 'high': return '#f57c00'
    case 'medium': return '#fbc02d'
    case 'ok': return '#388e3c'
    default: return '#58a6ff'
  }
}

export const ndviColor = (ndvi: number | null): string => {
  if (ndvi === null || ndvi === undefined) return '#6e7681'
  if (ndvi < 0.2) return '#d32f2f'
  if (ndvi < 0.4) return '#f57c00'
  if (ndvi < 0.6) return '#fbc02d'
  return '#388e3c'
}

export const ndreColor = (ndre: number | null): string => {
  if (ndre === null || ndre === undefined) return '#6e7681'
  if (ndre < 0.08) return '#d32f2f'
  if (ndre < 0.14) return '#f57c00'
  if (ndre < 0.20) return '#fbc02d'
  return '#388e3c'
}

export const diseaseIndexColor = (index: number | null): string => {
  if (index === null || index === undefined) return '#6e7681'
  if (index >= 75) return '#d32f2f'
  if (index >= 55) return '#f57c00'
  if (index >= 35) return '#fbc02d'
  if (index >= 15) return '#8bc34a'
  return '#388e3c'
}

export const terrainElevationColor = (elev: number | null): string => {
  if (elev === null || elev === undefined) return '#9e9e9e'
  if (elev < 100) return '#1b5e20'   // very low
  if (elev < 200) return '#4fc3f7'   // low — cyan, visible on vegetation
  if (elev < 300) return '#1976d2'   // low-mid — blue, visible on vegetation
  if (elev < 600) return '#fbc02d'   // medium
  if (elev < 1000) return '#f57c00'  // high
  return '#d32f2f'                   // very high
}

export const terrainSlopeColor = (slope: number | null): string => {
  if (slope === null || slope === undefined) return '#9e9e9e'
  if (slope < 1) return '#4fc3f7'    // very flat — cyan
  if (slope < 2) return '#1976d2'    // flat — blue
  if (slope < 5) return '#8bc34a'    // gentle
  if (slope < 10) return '#fbc02d'   // moderate
  if (slope < 20) return '#f57c00'   // steep
  return '#d32f2f'                   // very steep
}

export const terrainRunoffColor = (risk: string | null): string => {
  switch (risk?.toLowerCase()) {
    case 'low': return '#388e3c'
    case 'moderate': return '#fbc02d'
    case 'high': return '#f57c00'
    case 'very_high': return '#d32f2f'
    default: return '#9e9e9e'
  }
}

export const vraColor = (ndviClass: string | null): string => {
  switch (ndviClass) {
    case 'high':        return '#1b5e20'  // dark green
    case 'medium_high': return '#388e3c'  // medium green
    case 'medium':      return '#a5d6a7'  // light green
    case 'medium_low':  return '#e65100'  // orange
    case 'low':         return '#b71c1c'  // dark red
    // legacy 3-zone support
    case 'medium_low_legacy': return '#fbc02d'
    default:            return '#58a6ff'
  }
}

export const vraFactorLabel = (vra: number | null): string => {
  if (vra == null) return '<span style="color:#fbc02d">სტანდარტი</span>'
  if (vra >= 1.3) return `<span style="color:#f85149">+${Math.round((vra - 1) * 100)}% სასუქი</span>`
  if (vra > 1.05) return `<span style="color:#ff8f00">+${Math.round((vra - 1) * 100)}% სასუქი</span>`
  if (vra < 0.8) return `<span style="color:#3fb950">-${Math.round((1 - vra) * 100)}% ნაკლები</span>`
  if (vra < 0.95) return `<span style="color:#7ee787">-${Math.round((1 - vra) * 100)}% ნაკლები</span>`
  return '<span style="color:#fbc02d">სტანდარტი</span>'
}

export const getLayerColor = (mode: LayerMode): string => {
  switch (mode) {
    case 'zone': return '#d32f2f'
    case 'ndvi': return '#388e3c'
    case 'ndre': return '#4ade80'
    case 'vra': return '#fbc02d'
    case 'disease': return '#f57c00'
    case 'terrain': return '#795548'
    case 'slope': return '#ff9800'
    case 'runoff': return '#2196f3'
    default: return '#58a6ff'
  }
}

// Search functionality
export function searchParcel(
  geojson: GeoJSONCollection | null,
  query: string
): GeoJSONFeature | null {
  if (!geojson || !query.trim()) return null
  const q = query.trim().toLowerCase()
  return geojson.features.find((f) => {
    const code = ((f.properties.parcel_nr as string) || '').toLowerCase()
    const nr = ((f.properties.parcel_nr as string) || '').toLowerCase()
    return code === q || nr === q || code.includes(q) || nr.includes(q)
  }) || null
}

// API functions
export async function fetchMapData(profileId?: string): Promise<MapData> {
  const [geojson, subzonesGeojson] = await Promise.all([
    parcelsApi.getGeoJSON(profileId),
    parcelsApi.getSubzonesGeoJSON(profileId),
  ])
  return {
    geojson: geojson as GeoJSONCollection,
    subzonesGeojson: subzonesGeojson as GeoJSONCollection,
    diseaseGeojson: null,
  }
}

export async function fetchDiseaseData(profileId?: string): Promise<GeoJSONCollection | null> {
  try {
    const data = await parcelsApi.getDiseaseGeoJSON(profileId)
    return data as GeoJSONCollection
  } catch (e) {
    console.error('Failed to load disease data:', e)
    return null
  }
}

// Extract parcel data from feature
export function extractParcelData(feature: GeoJSONFeature): ParcelCardData {
  const props = feature.properties
  return {
    id: props.id as string,
    parcel_nr: props.parcel_nr as string | null,
    area_ha: props.area_ha as number | null,
    mineral_zone: props.mineral_zone as string | null,
    ndvi: props.ndvi as number | null,
    ndre: props.ndre as number | null,
    n_dose_kg_ha: props.n_dose_kg_ha as number | null,
    p_dose_kg_ha: props.p_dose_kg_ha as number | null,
  }
}
