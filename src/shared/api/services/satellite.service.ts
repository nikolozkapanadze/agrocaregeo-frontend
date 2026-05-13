import { api } from '../client'
import type { SatelliteObs } from '../types'

export interface SyncStatus {
  latest_observation_date: string | null
  total_observations: number
  last_sync: string | null
}

// SAR (Sentinel-1 Radar) Types
export interface SARStatus {
  has_sar_data: boolean
  latest_observation_date: string | null
  latest_vv: number | null
  latest_vh: number | null
  latest_rvi: number | null
  moisture_level: string | null
  crop_structure: string | null
  last_sync: string | null
  last_sync_status: string | null
  note: string
}

export interface SARTimeseriesItem {
  date: string
  vv: number | null
  vh: number | null
  vh_vv_ratio: number | null
  rvi: number | null
  moisture_level: string | null
  crop_structure: string | null
  orbit_direction: string | null
}

export const satelliteService = {
  async fetchSatelliteData(): Promise<{ message: string; status: string; date_from: string; date_to: string }> {
    return api.post<{ message: string; status: string; date_from: string; date_to: string }>('/satellite/sync')
  },

  async getParcelObservations(parcelId: string): Promise<SatelliteObs[]> {
    return api.get<SatelliteObs[]>(`/satellite/${parcelId}`)
  },

  async getHistory(parcelId: string, daysBack = 90): Promise<unknown[]> {
    return api.get<unknown[]>(`/satellite/${parcelId}/history?days_back=${daysBack}`)
  },

  async getSyncStatus(): Promise<SyncStatus> {
    return api.get<SyncStatus>('/satellite/sync/status')
  },

  // SAR (Sentinel-1) methods
  async syncSAR(profileId?: string): Promise<{ message: string; status: string; note: string }> {
    const params = profileId ? `?profile_id=${profileId}` : ''
    return api.post<{ message: string; status: string; note: string }>(`/satellite/sar/sync${params}`)
  },

  async getSARSyncStatus(profileId?: string): Promise<SARStatus> {
    const params = profileId ? `?profile_id=${profileId}` : ''
    return api.get<SARStatus>(`/satellite/sar/sync/status${params}`)
  },

  async getSARTimeseries(parcelId: string, dateFrom: string, dateTo: string): Promise<SARTimeseriesItem[]> {
    return api.get<SARTimeseriesItem[]>(`/satellite/sar/${parcelId}/timeseries?date_from=${dateFrom}&date_to=${dateTo}`)
  },

  async getSARSummary(parcelId: string): Promise<{
    has_data: boolean
    latest_date?: string
    vv?: number
    vh?: number
    rvi?: number
    moisture_level?: string
    crop_structure?: string
    source?: string
    advantage?: string
  }> {
    return api.get(`/satellite/sar/${parcelId}/summary`)
  },
}

export default satelliteService
