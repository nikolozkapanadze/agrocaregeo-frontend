// User Types
export interface User {
  id: string
  email: string
  full_name: string
  role: string
  tenant_id: string
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: string
  tenant_id: string
  role: string
}

// Parcel Types
export interface Parcel {
  id: string
  tenant_id: string
  parcel_nr: string
  area_ha: number
  crop_type: string
  is_active: boolean
  created_at: string
  latest_zone?: string
  latest_ndvi?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

// Analysis Types
export interface MineralAnalysis {
  id: string
  parcel_id: string
  run_date: string
  n_status: string
  n_dose_kg_ha: number
  n_reason: string
  p_status: string
  p_dose_kg_ha: number
  p_reason: string
  k_status: string
  k_dose_kg_ha: number
  k_reason: string
  mg_status: string
  mg_dose_kg_ha: number
  mg_reason: string
  mineral_zone: string
  mineral_score: number
  action: string
  priority: string[]
  ndvi: number | null
  ndre: number | null
  has_satellite: boolean
}

export interface ZoneStats {
  critical: number
  high: number
  medium: number
  ok: number
  total: number
}

// Satellite Types
export interface SatelliteObs {
  id: string
  parcel_id: string
  obs_date: string
  ndvi: number | null
  ndwi: number | null
  ndre: number | null
  evi: number | null
  stress_level: string
  crop_status: string
  cloud_pct: number | null
}

// Weather Types
export interface WeatherDaily {
  wx_date: string
  t_max: number
  t_min: number
  t_avg: number
  precip_mm: number
  gdd: number
  heat_stress: boolean
  frost_risk: boolean
  drought_index: number
  disease_risk: number
  is_forecast: boolean
}

export interface TrendSummary {
  period_days: number
  total_parcels: number
  trends: Record<string, { count: number; avg_ndvi_change: number | null }>
  summary: {
    improving: number
    stable: number
    declining: number
    unknown: number
  }
}

// Notification Types
export interface Notification {
  id: string
  severity: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

// Recommendation Types
export interface FertilizerRec {
  type: string
  fertilizer: string
  fertilizer_name: string
  kg_ha: number
  kg_total: number
  price_gel: number
  reason: string
}

export interface VRAZone {
  zone_index: number
  zone_label: string
  ndvi_class: string
  ndvi_mean: number | null
  area_ha: number
  n_dose_kg_ha: number
  p_dose_kg_ha: number
  k_dose_kg_ha: number
  mg_dose_kg_ha: number
  vra_factor: number
  action: string
}

export interface Recommendation {
  parcel_id?: string
  parcel_nr: string
  area_ha: number
  zone: string
  ndvi: number | null
  ndre: number | null
  crop_status: string
  priority: number
  priority_label: string
  timing: string
  rain_3d: number
  tmax: number
  n_remaining: number
  last_n_applied: number
  recommendations: FertilizerRec[]
  action_text: string
  sat_date: string
  vra_zones?: VRAZone[]
  has_vra_zones?: boolean
}

// Disease Types
export interface DiseaseRisk {
  key: string
  name_ge: string
  emoji: string
  level: string
  level_ge: string
  score: number
  fungicide: string
  window: number
  action: string
  info: string
  conditions: string[]
  fore_warn: boolean
}

export interface DiseaseParcel {
  parcel_nr: string
  area_ha: number
  crop_type: string
  crop_status: string | null
  ndvi: number | null
  wx_t: number
  wx_rh: number
  wx_rain: number
  risks: DiseaseRisk[]
  max_level: string
}
