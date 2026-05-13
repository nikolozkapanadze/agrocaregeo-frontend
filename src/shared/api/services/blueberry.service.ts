import api from '../client'

// ─────────────────────────────────────────────────────────────
// Blueberry Phenology Types
// ─────────────────────────────────────────────────────────────

export interface BlueberryStage {
  code: string
  name: string
  gdd_threshold: number
  completed: boolean
  is_current: boolean
}

export interface BlueberryCurrentStage {
  bbch_code: string
  growth_stage: string
  stage_num: number
  cum_gdd: number
  progress_pct: number
  next_stage: string | null
  next_gdd: number | null
}

export interface BlueberryChillingHours {
  chill_hours: number
  target_low: number
  target_high: number
  progress_pct: number
  satisfied: boolean
  period: string
}

export interface BlueberryTempAlert {
  type: string
  message: string
  date: string
  temp: number
}

export interface BlueberryPhenologyResponse {
  parcel_id: string
  calc_date: string
  season_start: string
  current_stage: BlueberryCurrentStage
  chilling_hours: BlueberryChillingHours
  forecast_next_stage: {
    next_stage: string
    next_bbch_code: string
    gdd_needed: number
    days_forecast: number
    estimated_date: string
  } | null
  stages: BlueberryStage[]
  temp_alerts: BlueberryTempAlert[]
}

// ─────────────────────────────────────────────────────────────
// Blueberry Disease Types
// ─────────────────────────────────────────────────────────────

export interface BlueberryDiseaseRisk {
  risk: number
  reason: string
  [key: string]: any
}

export interface BlueberryDiseasePressureResponse {
  parcel_id: string
  calc_date: string
  current_stage: {
    bbch_code: string
    stage_name: string
    cum_gdd: number
  }
  mummy_berry: BlueberryDiseaseRisk
  botrytis: BlueberryDiseaseRisk
  phytophthora: BlueberryDiseaseRisk
  spray_recommended: boolean
  critical_alert: boolean
  station_name: string | null
}

// ─────────────────────────────────────────────────────────────
// Spray Log Types
// ─────────────────────────────────────────────────────────────

export interface BlueberrySprayLogEntry {
  id: string
  spray_date: string
  disease_key: string | null
  product_name: string | null
  active_ingredient: string | null
  dose_per_ha: number | null
  volume_water_hl: number | null
  weather_temp: number | null
  weather_rh: number | null
  weather_wind: number | null
  cost_gel: number | null
  efficacy_rating: number | null
  notes: string | null
}

export interface BlueberrySprayLogResponse {
  parcel_id: string
  sprays: BlueberrySprayLogEntry[]
}

// ─────────────────────────────────────────────────────────────
// Harvest Log Types
// ─────────────────────────────────────────────────────────────

export interface BlueberryHarvestLogEntry {
  id: string
  harvest_date: string | null
  yield_kg_ha: number | null
  brix_value: number | null
  firmness_n: number | null
  quality_grade: string | null
  weather_conditions: string | null
  notes: string | null
}

export interface BlueberryHarvestLogResponse {
  parcel_id: string
  harvests: BlueberryHarvestLogEntry[]
}

// ─────────────────────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────────────────────

export async function getBlueberryPhenology(parcelId: string): Promise<BlueberryPhenologyResponse> {
  const response = await api.get(`/blueberry/phenology/${parcelId}`)
  return response.data?.data || response.data
}

export async function getBlueberryDiseasePressure(parcelId: string): Promise<BlueberryDiseasePressureResponse> {
  const response = await api.get(`/blueberry/disease-pressure/${parcelId}`)
  return response.data?.data || response.data
}

export async function getBlueberrySprayLog(parcelId: string, limit: number = 50): Promise<BlueberrySprayLogResponse> {
  const response = await api.get(`/blueberry/spray-log/${parcelId}?limit=${limit}`)
  return response.data?.data || response.data
}

export async function getBlueberryHarvestLog(parcelId: string, limit: number = 20): Promise<BlueberryHarvestLogResponse> {
  const response = await api.get(`/blueberry/harvest-log/${parcelId}?limit=${limit}`)
  return response.data?.data || response.data
}

export async function logBlueberrySpray(data: {
  parcel_id: string
  spray_date?: string
  disease_key?: string
  product_name?: string
  active_ingredient?: string
  dose_per_ha?: number
  volume_water_hl?: number
  weather_temp?: number
  weather_rh?: number
  weather_wind?: number
  cost_gel?: number
  efficacy_rating?: number
  notes?: string
}): Promise<{ status: string; parcel_id: string; spray_date: string }> {
  const response = await api.post('/blueberry/spray', data)
  return response.data?.data || response.data
}

// Legacy service object (for backward compatibility)
export const blueberryService = {
  getPhenology: getBlueberryPhenology,
  getDiseasePressure: getBlueberryDiseasePressure,
  getSprayLog: getBlueberrySprayLog,
  getHarvestLog: getBlueberryHarvestLog,
  logSpray: logBlueberrySpray,
}
