export const API_BASE = '/api/v1'
export const API_URL = ''

function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

export function clearToken(): void {
  localStorage.removeItem('token')
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    const detail = err.detail
    const msg = Array.isArray(detail)
      ? detail.map((e: { msg?: string; loc?: string[] }) => `${e.loc?.slice(-1)[0] ?? ''}: ${e.msg ?? e}`).join('; ')
      : detail || 'Request failed'
    throw new Error(msg)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// Types
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
  // Mineral status fields
  n_status?: string
  p_status?: string
  k_status?: string
  mg_status?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

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

export interface FertilizerLog {
  id: string
  parcel_id: string
  applied_date: string
  n_kg_ha: number
  p_kg_ha: number
  k_kg_ha: number
  mg_kg_ha: number
  n_kg_total: number | null
  p_kg_total: number | null
  k_kg_total: number | null
  mg_kg_total: number | null
  fertilizer_name: string
  method: string
  notes: string
  ndvi_before: number | null
  ndvi_after: number | null
  effect_days: number | null
  applied_by: string
}

export interface IrrigationLog {
  id: string
  parcel_id: string
  applied_date: string
  water_mm: number
  duration_min: number
  method: string
  cost_gel: number
  notes: string
  applied_by: string
}

export interface CostLog {
  id: string
  parcel_id: string
  cost_date: string
  category: string
  description: string
  amount_gel: number
  notes: string
}

export interface Notification {
  id: string
  severity: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, full_name: string, org_name: string) =>
    request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, org_name }),
    }),
  me: () => request<User>('/auth/me'),
}

export interface TenantUser {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

export const users = {
  list: () => request<TenantUser[]>('/users'),
  create: (data: { email: string; password: string; full_name: string; role: string }) =>
    request<TenantUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ full_name: string; role: string; is_active: boolean }>) =>
    request<TenantUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
}

// Parcels
export const parcels = {
  list: (page = 1, perPage = 50, zone?: string, profileId?: string) =>
    request<PaginatedResponse<Parcel>>(
      `/parcels?page=${page}&per_page=${perPage}${zone ? `&zone=${zone}` : ''}${profileId ? `&profile_id=${profileId}` : ''}`
    ),
  listByCrop: (cropType: string, page = 1, perPage = 50, zone?: string) =>
    request<PaginatedResponse<Parcel>>(
      `/parcels?crop_type=${cropType}&page=${page}&per_page=${perPage}${zone ? `&zone=${zone}` : ''}`
    ),
  get: (id: string) => request<Parcel>(`/parcels/${id}`),
  create: (data: Partial<Parcel> & { geometry: object }) =>
    request<Parcel>('/parcels', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Parcel>) =>
    request<Parcel>(`/parcels/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/parcels/${id}`, { method: 'DELETE' }),
  getGeoJSON: (profileId?: string) =>
    request<object>(`/parcels/geojson${profileId ? `?profile_id=${profileId}` : ''}`),
  getSubzonesGeoJSON: (profileId?: string) =>
    request<object>(`/parcels/subzones/geojson${profileId ? `?profile_id=${profileId}` : ''}`),
  getDiseaseGeoJSON: (profileId?: string) => request<object>(`/disease/map${profileId ? `?profile_id=${profileId}` : ''}`),
  getVRAEnhanced: (parcelId: string) => request<object>(`/vra/enhanced/${parcelId}`),
  getVRASummary: (parcelId: string) => request<object>(`/vra/summary/${parcelId}`),
  exportVRA: (parcelId: string, rateNutrient: string = 'N') => {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${API_BASE}/vra/export/${parcelId}?rate_nutrient=${rateNutrient}`, { headers })
  },
  importGeoJSON: (fc: object, profileId?: string) =>
    request<{ imported: number; skipped: number; errors: string[] }>(`/parcels/import${profileId ? `?profile_id=${profileId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(fc),
    }),
}

// Analysis
export const analysis = {
  run: () => request<{ message: string }>('/analysis/run', { method: 'POST' }),
  recalculate: () => request<{ message: string }>('/analysis/recalculate', { method: 'POST' }),
  latest: (page = 1, perPage = 50, profileId?: string) =>
    request<PaginatedResponse<MineralAnalysis>>(
      `/analysis/latest?page=${page}&per_page=${perPage}${profileId ? `&profile_id=${profileId}` : ''}`
    ),
  parcelHistory: (parcelId: string) =>
    request<MineralAnalysis[]>(`/analysis/${parcelId}/history`),
  stats: (profileId?: string) =>
    request<ZoneStats>(`/analysis/stats${profileId ? `?profile_id=${profileId}` : ''}`),
  trend: (daysBack = 30) => request<object[]>(`/analysis/trend?days_back=${daysBack}`),
}

// Weather
export const weather = {
  fetch: () => request<{ message: string }>('/weather/fetch', { method: 'POST' }),
  parcel: (parcelId: string) => request<WeatherDaily[]>(`/weather/${parcelId}`),
}

// Weather Forecast (multi-parcel overview)
export const weatherForecast = {
  all: (days = 10) => request<WxRow[]>(`/weather?days=${days}`),
  parcel: (parcelId: string, daysBack = 30) => request<WeatherParcelRow[]>(`/weather/${parcelId}?days_back=${daysBack}`),
}

export interface WxRow {
  parcel_id: string
  parcel_nr: string
  wx_date: string
  t_max: number | null
  t_min: number | null
  t_avg: number | null
  precip_mm: number | null
  solar: number | null
  rh_pct: number | null
  cloud_cover_pct: number | null
  wind_ms: number | null
  heat_stress: boolean
  frost_risk: boolean
  disease_risk: number | null
  gdd: number | null
}

export interface WeatherParcelRow {
  parcel_id: string
  wx_date: string
  is_forecast: boolean
  t_max: number | null
  t_min: number | null
  t_avg: number | null
  precip_mm: number | null
  solar: number | null
  rh_pct: number | null
  cloud_cover_pct: number | null
  wind_ms: number | null
  gdd: number | null
  eto_mm: number | null
  heat_stress: boolean
  frost_risk: boolean
  drought_index: number | null
  disease_risk: number | null
}


export interface WeatherStation {
  id: string
  tenant_id: string
  name: string
  station_type: string
  provider_key: string | null
  provider_secret: boolean
  provider_endpoint: string | null
  pull_url: string | null
  pull_interval_min: number
  push_token: string | null
  latitude: number
  longitude: number
  elevation_m: number | null
  is_active: boolean
  last_seen_at: string | null
  created_at: string | null
  parcel_count?: number
  latest_reading?: {
    observed_at: string | null
    temp_c: number | null
    humidity_pct: number | null
  }
}

export interface StationReading {
  id: string
  observed_at: string | null
  temp_c: number | null
  humidity_pct: number | null
  pressure_hpa: number | null
  precip_mm: number | null
  wind_speed_ms: number | null
  wind_gust_ms: number | null
  wind_dir_deg: number | null
  solar_rad_wm2: number | null
  soil_temp_5cm_c: number | null
  soil_moisture_5cm: number | null
  leaf_wetness: number | null
  vpd_kpa: number | null
  eto_mm: number | null
  qc_flags: string[] | null
  is_valid: boolean
}

export interface StationDailySummary {
  summary_date: string
  temp_min_c: number | null
  temp_max_c: number | null
  temp_avg_c: number | null
  gdd: number | null
  precip_total_mm: number | null
  wind_avg_ms: number | null
  wind_max_ms: number | null
  dominant_wind_dir: number | null
  solar_total_mjm2: number | null
  sunshine_hours: number | null
  humidity_avg_pct: number | null
  vpd_avg_kpa: number | null
  soil_temp_avg_c: number | null
  soil_moisture_avg: number | null
  eto_mm: number | null
  heat_stress_hours: number | null
  frost_risk: boolean | null
  high_humidity_hours: number | null
  leaf_wetness_hours: number | null
  observation_count: number | null
  coverage_pct: number | null
}

export interface StationSummaryResponse {
  station: WeatherStation
  latest: {
    observed_at: string | null
    temp_c: number | null
    humidity_pct: number | null
    pressure_hpa: number | null
    precip_mm: number | null
    wind_speed_ms: number | null
    wind_gust_ms: number | null
    wind_dir_deg: number | null
    solar_rad_wm2: number | null
    soil_temp_5cm_c: number | null
    soil_moisture_5cm: number | null
    leaf_wetness: number | null
    vpd_kpa: number | null
  }
  today_summary: StationDailySummary
}

export interface StationCreatePayload {
  name: string
  station_type?: string
  provider_key?: string
  provider_secret?: string
  provider_endpoint?: string
  pull_url?: string
  pull_interval_min?: number
  latitude: number
  longitude: number
  elevation_m?: number
  is_active?: boolean
}
export interface SatelliteHistoryRow {
  obs_date: string
  ndvi: number | null
  ndre: number | null
  ndwi: number | null
  evi: number | null
  cloud_pct: number | null
  stress_level: string | null
  crop_status: string | null
}

// Satellite
export const satellite = {
  fetch: () => request<{ message: string; status: string; date_from: string; date_to: string }>('/satellite/sync', { method: 'POST' }),
  parcel: (parcelId: string) => request<SatelliteObs[]>(`/satellite/${parcelId}`),
  history: (parcelId: string, daysBack = 90) => request<SatelliteHistoryRow[]>(`/satellite/${parcelId}/history?days_back=${daysBack}`),
  syncStatus: () => request<{ latest_observation_date: string | null, total_observations: number, last_sync: string | null }>('/satellite/sync/status'),
}

// Fertilizer & irrigation
export const fertilizer = {
  log: (data: Partial<FertilizerLog>) =>
    request<FertilizerLog>('/fertilizer/log', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<FertilizerLog>) =>
    request<FertilizerLog>(`/fertilizer/log/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/fertilizer/log/${id}`, { method: 'DELETE' }),
  history: (parcelId: string) => request<FertilizerLog[]>(`/fertilizer/history/${parcelId}`),
  logIrrigation: (data: Partial<IrrigationLog>) =>
    request<IrrigationLog>('/irrigation/log', { method: 'POST', body: JSON.stringify(data) }),
  updateIrrigation: (id: string, data: Partial<IrrigationLog>) =>
    request<IrrigationLog>(`/irrigation/log/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteIrrigation: (id: string) =>
    request<void>(`/irrigation/log/${id}`, { method: 'DELETE' }),
  irrigationHistory: (parcelId: string) =>
    request<IrrigationLog[]>(`/irrigation/history/${parcelId}`),
  logCost: (data: Partial<CostLog>) =>
    request<CostLog>('/costs/log', { method: 'POST', body: JSON.stringify(data) }),
  updateCost: (id: string, data: Partial<CostLog>) =>
    request<CostLog>(`/costs/log/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCost: (id: string) =>
    request<void>(`/costs/log/${id}`, { method: 'DELETE' }),
  costsHistory: (parcelId: string) => request<CostLog[]>(`/costs/history/${parcelId}`),
}

// Notifications
export const notifications = {
  list: (page = 1) =>
    request<PaginatedResponse<Notification>>(`/notifications?page=${page}`),
  markRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
  unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
}

// Telegram
export interface TelegramDevice {
  id: string
  chat_id: string
  bot_username: string | null
  connected_at: string
}

export interface TelegramStatus {
  connected: boolean
  bot_configured: boolean
  chats: TelegramDevice[]
}

export interface TelegramLink {
  token: string
  link: string
  expires_in: number
}

export interface TelegramBot {
  id: string
  bot_username: string | null
  label: string | null
  is_active: boolean
  token_hint: string
  created_at: string
}

export const telegramApi = {
  status: () => request<TelegramStatus>('/telegram/status'),
  generateLink: (botId?: string) => request<TelegramLink & { bot_username: string }>('/telegram/generate-link', {
    method: 'POST',
    body: JSON.stringify({ bot_id: botId ?? null }),
  }),
  disconnectDevice: (id: string) => request<{ status: string }>(`/telegram/disconnect/${id}`, { method: 'DELETE' }),
  disconnectAll: () => request<{ status: string }>('/telegram/disconnect', { method: 'DELETE' }),
  // Multi-bot endpoints
  listBots: () => request<TelegramBot[]>('/telegram/bots'),
  addBot: (token: string, label?: string) => request<TelegramBot>('/telegram/bots', {
    method: 'POST',
    body: JSON.stringify({ token, label: label || null }),
  }),
  toggleBot: (id: string, is_active: boolean) => request<{ status: string; is_active: boolean }>(`/telegram/bots/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  }),
  deleteBot: (id: string) => request<{ status: string }>(`/telegram/bots/${id}`, { method: 'DELETE' }),
  sendTest: () => request<{ status: string; sent: number; devices: number }>('/telegram/test', { method: 'POST' }),
  // Legacy (backward compat)
  getBotConfig: () => request<{ configured: boolean; token_hint: string | null; bot_username: string | null }>('/telegram/bot-config'),
  clearBotConfig: () => request<{ status: string }>('/telegram/bot-config', { method: 'DELETE' }),
}

// Recommendations
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
  crop_type?: string
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
  crop_module?: string
  action_text: string
  sat_date: string
  run_date?: string
  soil_notes?: string[]
  soil_sample_date?: string
  p_dose_kg_ha?: number
  k_dose_kg_ha?: number
  mg_dose_kg_ha?: number
  p_status?: string
  k_status?: string
  mg_status?: string
  n_status?: string
  n_reason?: string
  p_reason?: string
  k_reason?: string
  mg_reason?: string
  vra_zones?: VRAZone[]
  has_vra_zones?: boolean
  confidence?: string
  data_quality?: {
    satellite_age_days?: number
    soil_age_days?: number
    weather_coverage_pct?: number
    has_forecast?: boolean
  }
}

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

export const recommendations = {
  list: (profileId?: string) => request<Recommendation[]>(`/recommendations${profileId ? `?profile_id=${profileId}` : ''}`),
}

export const disease = {
  report: (profileId?: string) => request<DiseaseParcel[]>(`/disease${profileId ? `?profile_id=${profileId}` : ''}`),
}

// Soil Analysis
export interface SoilAnalysis {
  id: string
  tenant_id: string
  parcel_id: string
  sample_date: string
  lab_name?: string
  ph?: number
  lime_req?: number
  cec?: number
  om_pct?: number
  p_mgkg?: number
  k_mgkg?: number
  ca_mgkg?: number
  mg_mgkg?: number
  s_mgkg?: number
  b_mgkg?: number
  cu_mgkg?: number
  fe_mgkg?: number
  mn_mgkg?: number
  mo_mgkg?: number
  zn_mgkg?: number
  na_mgkg?: number
  sand_pct?: number
  silt_pct?: number
  clay_pct?: number
  texture_class?: string
  notes?: string
  created_at: string
}

export interface SoilAnalysisCreate {
  parcel_id: string
  sample_date: string
  lab_name?: string
  ph?: number
  lime_req?: number
  cec?: number
  om_pct?: number
  p_mgkg?: number
  k_mgkg?: number
  ca_mgkg?: number
  mg_mgkg?: number
  s_mgkg?: number
  b_mgkg?: number
  cu_mgkg?: number
  fe_mgkg?: number
  mn_mgkg?: number
  mo_mgkg?: number
  zn_mgkg?: number
  na_mgkg?: number
  sand_pct?: number
  silt_pct?: number
  clay_pct?: number
  texture_class?: string
  notes?: string
}

export const soil = {
  list: (): Promise<SoilAnalysis[]> => request('/soil'),
  listByParcel: (parcelId: string): Promise<SoilAnalysis[]> => request(`/soil/${parcelId}`),
  create: (data: SoilAnalysisCreate): Promise<SoilAnalysis> =>
    request('/soil', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => request(`/soil/${id}`, { method: 'DELETE' }),
}

// Spray Log
export interface SprayLog {
  id: string
  parcel_id: string
  spray_date: string
  disease_key: string | null
  disease_name: string | null
  fungicide_name: string | null
  dose_l_ha: number | null
  dose_total_l: number | null
  cost_gel: number | null
  applied_by: string | null
  method: string | null
  notes: string | null
  ndvi_before: number | null
  ndvi_after: number | null
  ndvi_delta: number | null
  effect_assessed: boolean
  created_at: string
}

export interface SprayLogCreate {
  parcel_id: string
  spray_date: string
  disease_key?: string
  disease_name?: string
  fungicide_name?: string
  dose_l_ha?: number
  dose_total_l?: number
  cost_gel?: number
  applied_by?: string
  method?: string
  notes?: string
  ndvi_before?: number
}

export const spray = {
  log: (data: SprayLogCreate): Promise<SprayLog> =>
    request('/spray/log', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<SprayLog>): Promise<SprayLog> =>
    request(`/spray/log/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  history: (parcelId: string): Promise<SprayLog[]> => request(`/spray/history/${parcelId}`),
  delete: (id: string): Promise<void> => request(`/spray/log/${id}`, { method: 'DELETE' }),
}

// Farmer Profile
export interface FarmerProfile {
  id: string
  parcel_id: string
  wheat_variety: string | null
  avg_yield_t_ha: number | null
  sowing_date: string | null
  seed_treatment: boolean
  seed_treatment_prep: string | null
  has_irrigation: boolean
  irrigation_type: string | null
  historical_diseases: string | null
  notes: string | null
  variety_origin: string | null
  seed_rate_kg_ha: number | null
  sowing_depth_cm: number | null
  sowing_method: string | null
  production_goal: string | null
  total_cost_gel_ha: number | null
  main_cost_category: string | null
  wheat_price_gel_t: number | null
  disease_loss_pct: number | null
  priority_early_detect: number | null
  priority_fert_rec: number | null
  priority_yield_forecast: number | null
  updated_at: string
}

export interface FarmerProfileCreate {
  wheat_variety?: string
  avg_yield_t_ha?: number
  sowing_date?: string
  seed_treatment?: boolean
  seed_treatment_prep?: string
  has_irrigation?: boolean
  irrigation_type?: string
  historical_diseases?: string
  notes?: string
  variety_origin?: string
  seed_rate_kg_ha?: number
  sowing_depth_cm?: number
  sowing_method?: string
  production_goal?: string
  total_cost_gel_ha?: number
  main_cost_category?: string
  wheat_price_gel_t?: number
  disease_loss_pct?: number
  priority_early_detect?: number
  priority_fert_rec?: number
  priority_yield_forecast?: number
}

export const farmerProfile = {
  get: (parcelId: string): Promise<FarmerProfile | null> => request(`/profile/${parcelId}`),
  upsert: (parcelId: string, data: FarmerProfileCreate): Promise<FarmerProfile> =>
    request(`/profile/${parcelId}`, { method: 'POST', body: JSON.stringify(data) }),
}

// ── Agronomic Intelligence ────────────────────────────────────────────────

export interface YieldForecastRow {
  parcel_nr: string
  area_ha: number
  sat_date: string | null
  yield_t_ha: number
  yield_total_t: number
  revenue_gel: number | null
  confidence: 'high' | 'medium' | 'low'
  confidence_ge: string
  factors: {
    potential_t_ha: number
    f_ndvi: number
    f_water: number
    f_disease: number
    f_gdd: number
  }
  explanation: string
}

export interface EconomicsRow {
  parcel_nr: string
  area_ha: number
  n_applied_this_season_kg_ha: number
  fert_cost_season_gel: number
  n_mineralizable_kg_ha: number
  soil_n_note: string
  wheat_price_gel_t: number
  n_remaining_kg_ha: number
  n_from_soil_kg_ha: number
  n_response_factor: number
  yield_gain_t_ha: number
  yield_gain_revenue_gel: number
  fertilizer_cost_gel: number
  mvp: number | null
  roi_advice: string
  break_even_t_ha: number | null
  net_margin_gel_ha: number | null
  net_margin_gel_total: number | null
}

export interface SprayWindowDay {
  wx_date: string
  is_forecast: boolean
  score: number
  level: 'optimal' | 'acceptable' | 'marginal' | 'no_spray'
  advice: string
  inversion_risk: boolean
  conditions: {
    wind_ms: number
    t_avg: number
    rh_pct: number
    vpd_kpa: number
    precip_mm: number
  }
  notes: string[]
  parcel_count: number
}

export interface IrrigationRow {
  parcel_nr: string
  area_ha: number
  crop_status: string
  has_irrigation: boolean
  texture_class: string
  advice: string
  depletion_mm: number
  taw_mm: number
  raw_mm: number
  kc: number
  root_depth_m: number
  irrigation_need: boolean
  recommended_mm: number
  etc_total_mm: number
  precip_eff_mm: number
  daily_balance: Array<{
    date: string
    eto_mm: number
    etc_mm: number
    kc: number
    precip_mm: number
    precip_eff_mm: number
    deficit_mm: number
    cum_deficit_mm: number
  }>
}

export interface HarvestTimingRow {
  parcel_nr: string
  area_ha: number
  crop_status: string
  ndvi: number | null
  heading_reached: boolean
  heading_est_date: string | null
  gdd_post_heading: number
  gdd_remaining: number
  harvest_expected: string | null
  harvest_optimistic: string | null
  harvest_conservative: string | null
  lunar_optimal_dates: string[]
  lunar_optimal_count: number
  best_harvest_day: {
    date: string
    score: number
    weather_score: number
    lunar_score: number
    quality: string
    issues: string[]
    moon_phase: string
    moon_age: number
    is_lunar_optimal: boolean
  } | null
  good_harvest_days: number
  harvest_window: Array<{
    date: string
    score: number
    weather_score: number
    lunar_score: number
    quality: string
    issues: string[]
    moon_phase: string
    moon_age: number
    is_lunar_optimal: boolean
  }>
  advice: string
  lunar_recommendation: {
    best_days: string[]
    explanation: string
  } | null
}

export const agronomic = {
  yieldForecast: (profileId?: string) => request<YieldForecastRow[]>(`/yield-forecast${profileId ? `?profile_id=${profileId}` : ''}`),
  economics: (profileId?: string) => request<EconomicsRow[]>(`/economics${profileId ? `?profile_id=${profileId}` : ''}`),
  sprayWindows: (profileId?: string) => request<SprayWindowDay[]>(`/spray-windows${profileId ? `?profile_id=${profileId}` : ''}`),
  irrigation: (profileId?: string) => request<IrrigationRow[]>(`/irrigation${profileId ? `?profile_id=${profileId}` : ''}`),
  harvestTiming: (profileId?: string) => request<HarvestTimingRow[]>(`/harvest-timing${profileId ? `?profile_id=${profileId}` : ''}`),
}

// Weather Trends
export interface WeatherTrend {
  period_days: number
  calc_date: string
  trend_label: 'improving' | 'stable' | 'declining' | 'unknown'
  ndvi_change: number | null
  avg_tmax: number | null
  avg_tmin: number | null
  total_precip: number | null
  cum_gdd: number | null
  heat_days: number | null
  dry_days: number | null
  yield_risk: string | null
  irrigation_need: number | null
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

export const weatherTrends = {
  summary: (periodDays = 7) => 
    request<TrendSummary>(`/weather/trends/summary?period_days=${periodDays}`),
  parcel: (parcelId: string) => 
    request<WeatherTrend[]>(`/weather/${parcelId}/trends`),
}

// =============================================================================
// CROP MODULES API
// =============================================================================

export interface CropConfig {
  key: string
  name: string
  color: string
  icon: string
  is_perennial: boolean
  features: string[]
}

export interface CropParcel {
  id: string
  parcel_nr: string
  area_ha: number
  crop_type: string
  latest_ndvi?: number
  latest_zone?: string
}

export interface CropDashboardStats {
  parcel_count: number
  total_area_ha: number
  avg_ndvi: number | null
  alerts_count: number
  phenology_stage?: string
  gdd_accumulated?: number
  disease_risk?: 'low' | 'medium' | 'high'
}

export interface BBCHStage {
  code: string
  name: string
  gdd_threshold: number
  completed: boolean
  current: boolean
}

export interface PhenologyData {
  current_stage: BBCHStage
  stages: BBCHStage[]
  gdd_accumulated: number
  gdd_forecast_7d: number
  next_stage_forecast_date: string | null
}

export interface DiseasePressure {
  disease_key: string
  disease_name: string
  risk_level: 0 | 1 | 2 | 3
  risk_label: string
  conditions: string
  recommendation: string
  window_hours: number
}

export interface SprayScheduleItem {
  id?: string
  date: string
  product: string
  target: string
  status: 'planned' | 'completed'
  notes?: string
}

// Weather Stations
export const weatherStations = {
  list: () => request<WeatherStation[]>('/stations'),
  create: (payload: StationCreatePayload) => request<WeatherStation>('/stations', { method: 'POST', body: JSON.stringify(payload) }),
  get: (id: string) => request<WeatherStation>(`/stations/${id}`),
  update: (id: string, payload: Partial<StationCreatePayload>) => request<WeatherStation>(`/stations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) => request<{ status: string }>(`/stations/${id}`, { method: 'DELETE' }),
  readings: (id: string, limit = 100, offset = 0) => request<StationReading[]>(`/stations/${id}/readings?limit=${limit}&offset=${offset}`),
  summary: (id: string) => request<StationSummaryResponse>(`/stations/${id}/summary`),
  daily: (id: string, dateFrom: string, dateTo: string) => request<StationDailySummary[]>(`/stations/${id}/daily?date_from=${dateFrom}&date_to=${dateTo}`),
  test: (id: string) => request<{ status: string; readings_count?: number; reason?: string }>(`/stations/${id}/test`, { method: 'POST' }),
  syncNow: (id: string) => request<{ status: string; saved?: number }>(`/stations/${id}/sync-now`, { method: 'POST' }),
  push: (token: string, payload: Record<string, unknown>) => request<{ status: string; saved?: number; reason?: string }>(`/stations/push/${token}`, { method: 'POST', body: JSON.stringify(payload) }),
  parcelSource: (parcelId: string) => request<{ parcel_id: string; source: string; station_id?: string; station_name?: string; last_seen_at?: string }>(`/stations/parcels/${parcelId}/weather-source`),
}

// Crop Registry
export const cropRegistry = {
  list: () => request<CropConfig[]>('/crops/registry'),
  myCrops: () => request<string[]>('/crops/my-crops'),
}

// Crop-specific APIs
export const cropApi = {
  // Generic crop endpoints
  parcels: (cropType: string) => request<CropParcel[]>(`/crops/${cropType}/parcels`),
  dashboardStats: (cropType: string) => request<CropDashboardStats>(`/crops/${cropType}/dashboard-stats`),
  features: (cropType: string) => request<string[]>(`/crops/${cropType}/features`),
  
  // Vine-specific
  vinePhenology: (parcelId: string) => request<PhenologyData>(`/crops/vine/${parcelId}/phenology`),
  vineDiseasePressure: (parcelId: string) => request<DiseasePressure[]>(`/crops/vine/${parcelId}/disease-pressure`),
  
  // Hazelnut-specific
  hazelnutEFBRisk: (parcelId: string) => request<any>(`/crops/hazelnut/${parcelId}/efb-risk`),
  
  // Wheat-specific
  wheatMineralAnalysis: (parcelId: string) => request<any>(`/crops/wheat/${parcelId}/mineral-analysis`),
  
  // Corn-specific
  cornHeatUnits: (parcelId: string) => request<any>(`/crops/corn/${parcelId}/heat-units`),
  
  // Sunflower-specific
  sunflowerSclerotiniaRisk: (parcelId: string) => request<any>(`/crops/sunflower/${parcelId}/sclerotinia-risk`),

  // Almond-specific
  almondPhenology: (parcelId: string) => request<any>(`/crops/almond/${parcelId}/phenology`),
  almondFrostRisk: (parcelId: string) => request<any>(`/crops/almond/${parcelId}/frost-risk`),
  almondNavelOW: (parcelId: string) => request<any>(`/crops/almond/${parcelId}/navel-ow`),
  almondSprayLog: (parcelId: string, limit: number = 50) => request<any>(`/crops/almond/spray-log/${parcelId}?limit=${limit}`),
  almondHarvestLog: (parcelId: string, limit: number = 20) => request<any>(`/crops/almond/harvest-log/${parcelId}?limit=${limit}`),
  almondLogSpray: (data: any) => request<any>('/crops/almond/spray', { method: 'POST', body: JSON.stringify(data) }),
  almondDiseasePressure: (parcelId: string) => request<any>(`/crops/almond/${parcelId}/disease-pressure`),
  almondDiseaseReport: (parcelId: string, limit: number = 30) => request<any>(`/crops/almond/${parcelId}/disease-report?limit=${limit}`),

  // Blueberry-specific (module routes at /api/v1/blueberry/...)
  blueberryPhenology: (parcelId: string) => request<any>(`/blueberry/phenology/${parcelId}`),
  blueberryDiseasePressure: (parcelId: string) => request<any>(`/blueberry/disease-pressure/${parcelId}`),
  blueberrySatellite: (parcelId: string) => request<any>(`/blueberry/satellite/${parcelId}`),
  blueberryFertilizer: (parcelId: string, soil_p_ppm?: number, soil_k_ppm?: number) => {
    const params = new URLSearchParams()
    if (soil_p_ppm) params.append('soil_p_ppm', String(soil_p_ppm))
    if (soil_k_ppm) params.append('soil_k_ppm', String(soil_k_ppm))
    const qs = params.toString()
    return request<any>(`/blueberry/fertilizer/${parcelId}${qs ? '?' + qs : ''}`)
  },
  blueberryIrrigation: (parcelId: string) => request<any>(`/blueberry/irrigation/${parcelId}`),
  blueberryYieldForecast: (parcelId: string, clusters?: number, fruitSet?: number, berries?: number) => {
    const params = new URLSearchParams()
    if (clusters) params.append('clusters_per_bush', String(clusters))
    if (fruitSet) params.append('fruit_set_pct', String(fruitSet))
    if (berries) params.append('berries_per_cluster', String(berries))
    const qs = params.toString()
    return request<any>(`/blueberry/yield-forecast/${parcelId}${qs ? '?' + qs : ''}`)
  },
  blueberryAlerts: (parcelId: string) => request<any>(`/blueberry/alerts/${parcelId}`),
  blueberrySprayLog: (parcelId: string, limit: number = 50) => request<any>(`/blueberry/spray-log/${parcelId}?limit=${limit}`),
  blueberryHarvestLog: (parcelId: string, limit: number = 20) => request<any>(`/blueberry/harvest-log/${parcelId}?limit=${limit}`),
  blueberryLogSpray: (data: any) => request<any>('/blueberry/spray', { method: 'POST', body: JSON.stringify(data) }),
}


// AI Agent APIs
export interface AIAgentAnalysis {
  summary: string
  crop_analysis: Array<{
    crop: string
    status: string
    issues: string[]
    actions: string[]
  }>
  questions: Array<{
    question: string
    reason: string
  }>
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    title: string
    detail: string
    timing: string
  }>
  confidence: number
  fallback?: boolean
  _meta?: {
    parcel_count: number
    crop_types: string[]
    analyzed_at: string
    llm_used: boolean
  }
}

export const aiAgentApi = {
  status: () => request<{ configured: boolean; model: string | null; message: string }>('/ai-agent/status'),
  analyze: (cropType?: string, parcelId?: string, question?: string) =>
    request<AIAgentAnalysis>('/ai-agent/analyze', {
      method: 'POST',
      body: JSON.stringify({ crop_type: cropType, parcel_id: parcelId, question }),
    }),
  chat: (messages: Array<{ role: string; content: string }>, cropType?: string, parcelId?: string) =>
    request<AIAgentAnalysis>('/ai-agent/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, crop_type: cropType, parcel_id: parcelId }),
    }),
}

// ── Crop Operations / Financial Management ──────────────────────────

export interface CostBreakdown {
  id?: string
  operation_id?: string
  cost_category: string
  amount_gel: number
  quantity: number | null
  unit: string | null
  unit_price_gel: number | null
  notes: string | null
  supplier: string | null
  created_at?: string
}

export interface CropOperation {
  id: string
  tenant_id: string
  parcel_id: string | null
  crop_type: string | null
  operation_type: string
  operation_date: string
  area_ha: number | null
  status: string
  notes: string | null
  weather_conditions: string | null
  performed_by: string | null
  created_at: string
  updated_at: string
  total_cost_gel: number
  cost_breakdowns: CostBreakdown[]
}

export interface OperationSummary {
  total_cost_gel: number
  total_operations: number
  total_area_ha: number | null
  avg_cost_per_ha: number | null
  top_category: string | null
  top_category_pct: number | null
  by_category: Array<{ cost_category: string; total_gel: number; percentage: number }>
  by_crop: Array<{ crop_type: string; total_gel: number; operation_count: number; area_ha: number | null; cost_per_ha: number | null }>
  by_month: Array<{ month: string; total_gel: number; operation_count: number }>
  by_parcel: Array<{ parcel_id: string; parcel_nr: string | null; total_gel: number; area_ha: number | null; cost_per_ha: number | null }>
}

export interface OperationFilters {
  crop_type?: string
  operation_type?: string
  status?: string
  parcel_id?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export const operations = {
  list: (filters: OperationFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.crop_type) params.append('crop_type', filters.crop_type)
    if (filters.operation_type) params.append('operation_type', filters.operation_type)
    if (filters.status) params.append('status', filters.status)
    if (filters.parcel_id) params.append('parcel_id', filters.parcel_id)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    params.append('page', String(filters.page ?? 1))
    params.append('per_page', String(filters.per_page ?? 50))
    return request<PaginatedResponse<CropOperation>>(`/operations?${params.toString()}`)
  },
  get: (id: string) => request<CropOperation>(`/operations/${id}`),
  create: (data: Partial<CropOperation>) =>
    request<CropOperation>('/operations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CropOperation>) =>
    request<CropOperation>(`/operations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/operations/${id}`, { method: 'DELETE' }),
  summary: (filters: Omit<OperationFilters, 'page' | 'per_page'> = {}) => {
    const params = new URLSearchParams()
    if (filters.crop_type) params.append('crop_type', filters.crop_type)
    if (filters.operation_type) params.append('operation_type', filters.operation_type)
    if (filters.status) params.append('status', filters.status)
    if (filters.parcel_id) params.append('parcel_id', filters.parcel_id)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    return request<OperationSummary>(`/operations/summary?${params.toString()}`)
  },
  exportExcel: (filters: Omit<OperationFilters, 'page' | 'per_page'> = {}) => {
    const params = new URLSearchParams()
    if (filters.crop_type) params.append('crop_type', filters.crop_type)
    if (filters.operation_type) params.append('operation_type', filters.operation_type)
    if (filters.status) params.append('status', filters.status)
    if (filters.parcel_id) params.append('parcel_id', filters.parcel_id)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    return `${API_BASE}/operations/export?${params.toString()}`
  },
}

// ── Spatial layers ─────────────────────────────────────────────────────────

export interface SpatialLayerMeta {
  name: string
  count: number
  property_keys: string[]
}

export interface SpatialLayersMeta {
  polygon: SpatialLayerMeta[]
  line: SpatialLayerMeta[]
  point: SpatialLayerMeta[]
}

export const spatialLayers = {
  list: (profileId?: string) =>
    request<SpatialLayersMeta>(
      `/spatial-layers${profileId ? `?profile_id=${profileId}` : ''}`
    ),
  geojson: (layerType: string, layerName: string, profileId?: string) => {
    const qs = new URLSearchParams({ layer_type: layerType, layer_name: layerName })
    if (profileId) qs.set('profile_id', profileId)
    return request<{ type: string; features: unknown[] }>(`/spatial-layers/geojson?${qs}`)
  },
  delete: (layerType: string, layerName: string, profileId?: string) => {
    const qs = new URLSearchParams({ layer_type: layerType, layer_name: layerName })
    if (profileId) qs.set('profile_id', profileId)
    return request<{ success: boolean; deleted: number }>(`/spatial-layers?${qs}`, { method: 'DELETE' })
  },
  export: (layerType: string, layerName: string, format: string, profileId?: string) => {
    const qs = new URLSearchParams({ layer_type: layerType, layer_name: layerName, format })
    if (profileId) qs.set('profile_id', profileId)
    return fetch(`${API_BASE}/spatial-layers/export?${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
  },
}
