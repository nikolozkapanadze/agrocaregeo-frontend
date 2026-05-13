import api from '../client'

// Simple BBCH Phenology Types (for new API)
export interface VinePhenology {
  bbch_code: string
  growth_stage: string
  cum_gdd: number
  calc_date: string
}

// Simple Disease Pressure Type (for new API)
export interface VineDiseasePressure {
  downy_mildew: number
  powdery_mildew: number
  botrytis: number
  spray_recommended: boolean
}

// Legacy BBCH Phenology Types
export interface BBCHStage {
  code: string
  name: string
  gdd_threshold: number
  description: string
  completed: boolean
  current: boolean
}

export interface VinePhenologyResponse {
  parcel_id: string
  season_year: number
  current_stage: {
    code: string
    name: string
    description: string
    gdd_threshold: number
  }
  cum_gdd: number
  stages: BBCHStage[]
  forecast_next_stage_days: number | null
  next_stage: {
    code: string
    name: string
    gdd_threshold: number
  } | null
  progress_pct: number
}

// Legacy Disease Types
export interface DiseaseRisk {
  disease_key: string
  disease_name: string
  scientific_name: string
  risk_level: 0 | 1 | 2 | 3
  risk_label: string
  risk_color: string
  conditions: string
  recommendation: string
  window_hours: number
}

export interface VineDiseaseResponse {
  parcel_id: string
  date: string
  risks: DiseaseRisk[]
  max_risk_level: number
  spray_recommended: boolean
}

// Spray Log Types
export interface SprayLogEntry {
  id?: string
  parcel_id: string
  spray_date: string
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
  created_at?: string
}

export interface SprayLogResponse {
  status: string
  id: string
}

// New simplified API functions
export async function getVinePhenology(parcelId: string): Promise<VinePhenology> {
  const response = await api.get(`/crops/vine/phenology/${parcelId}`)
  // Transform backend response to match VinePhenology interface
  const data = response.data?.data || response.data
  return {
    bbch_code: data.bbch_code || data.current_stage?.code || '',
    growth_stage: data.growth_stage || data.current_stage?.name || '',
    cum_gdd: data.cum_gdd || 0,
    calc_date: data.calc_date || data.date || new Date().toISOString(),
  }
}

export async function getVineDiseasePressure(parcelId: string): Promise<VineDiseasePressure> {
  const response = await api.get(`/crops/vine/disease-pressure/${parcelId}`)
  // Transform backend response to match VineDiseasePressure interface
  const data = response.data?.data || response.data
  
  // If response has risks array, extract values from it
  if (data.risks && Array.isArray(data.risks)) {
    const downy = data.risks.find((r: DiseaseRisk) => r.disease_key === 'downy_mildew')
    const powdery = data.risks.find((r: DiseaseRisk) => r.disease_key === 'powdery_mildew')
    const botrytis = data.risks.find((r: DiseaseRisk) => r.disease_key === 'botrytis')
    
    return {
      downy_mildew: downy?.risk_level ?? 0,
      powdery_mildew: powdery?.risk_level ?? 0,
      botrytis: botrytis?.risk_level ?? 0,
      spray_recommended: data.spray_recommended ?? false,
    }
  }
  
  // If response already has simple structure
  return {
    downy_mildew: data.downy_mildew ?? 0,
    powdery_mildew: data.powdery_mildew ?? 0,
    botrytis: data.botrytis ?? 0,
    spray_recommended: data.spray_recommended ?? false,
  }
}

// Legacy service object (for backward compatibility)
export const vineService = {
  // Get BBCH phenology for a parcel
  getPhenology: async (parcelId: string, seasonYear?: number): Promise<VinePhenologyResponse> => {
    const params = seasonYear ? `?season_year=${seasonYear}` : ''
    const response = await api.get(`/crops/vine/phenology/${parcelId}${params}`)
    return response.data?.data || response.data
  },

  // Get disease pressure for a parcel
  getDiseasePressure: async (parcelId: string, bbchStage?: string): Promise<VineDiseaseResponse> => {
    const params = bbchStage ? `?bbch_stage=${bbchStage}` : ''
    const response = await api.get(`/crops/vine/disease-pressure/${parcelId}${params}`)
    return response.data?.data || response.data
  },

  // Get spray log for a parcel
  getSprayLog: async (parcelId: string, limit: number = 10): Promise<SprayLogEntry[]> => {
    const response = await api.get(`/crops/vine/spray-log/${parcelId}?limit=${limit}`)
    return response.data?.data || response.data
  },

  // Log a spray application
  logSpray: async (data: SprayLogEntry): Promise<SprayLogResponse> => {
    const response = await api.post('/crops/vine/spray', data)
    return response.data?.data || response.data
  },
}
