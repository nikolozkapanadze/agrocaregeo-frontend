import { api } from '../client'
import type { ZoneStats, MineralAnalysis, PaginatedResponse } from '../types'

export const analysisService = {
  async runAnalysis(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/analysis/run')
  },

  async recalculate(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/analysis/recalculate')
  },

  async getLatest(page = 1, perPage = 50): Promise<PaginatedResponse<MineralAnalysis>> {
    return api.get<PaginatedResponse<MineralAnalysis>>(
      `/analysis/latest?page=${page}&per_page=${perPage}`
    )
  },

  async getParcelHistory(parcelId: string): Promise<MineralAnalysis[]> {
    return api.get<MineralAnalysis[]>(`/analysis/${parcelId}/history`)
  },

  async getStats(): Promise<ZoneStats> {
    return api.get<ZoneStats>('/analysis/stats')
  },

  async getTrend(daysBack = 30): Promise<unknown[]> {
    return api.get<unknown[]>(`/analysis/trend?days_back=${daysBack}`)
  },
}

export default analysisService
