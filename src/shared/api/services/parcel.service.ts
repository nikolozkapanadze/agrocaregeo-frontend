import { api } from '../client'
import type { Parcel, PaginatedResponse } from '../types'

export interface ParcelFilters {
  page?: number
  perPage?: number
  zone?: string
}

export interface CreateParcelData {
  parcel_nr: string
  area_ha: number
  crop_type?: string
  geometry: object
}

export const parcelService = {
  async list(filters: ParcelFilters = {}): Promise<PaginatedResponse<Parcel>> {
    const { page = 1, perPage = 50, zone } = filters
    const query = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (zone) query.append('zone', zone)
    return api.get<PaginatedResponse<Parcel>>(`/parcels?${query}`)
  },

  async getById(id: string): Promise<Parcel> {
    return api.get<Parcel>(`/parcels/${id}`)
  },

  async create(data: CreateParcelData): Promise<Parcel> {
    return api.post<Parcel>('/parcels', data)
  },

  async update(id: string, data: Partial<Parcel>): Promise<Parcel> {
    return api.patch<Parcel>(`/parcels/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    return api.delete<void>(`/parcels/${id}`)
  },

  async getGeoJSON(): Promise<GeoJSON.GeoJSON> {
    return api.get<GeoJSON.GeoJSON>('/parcels/geojson')
  },

  async getSubzonesGeoJSON(): Promise<GeoJSON.GeoJSON> {
    return api.get<GeoJSON.GeoJSON>('/parcels/subzones/geojson')
  },

  async getDiseaseGeoJSON(): Promise<GeoJSON.GeoJSON> {
    return api.get<GeoJSON.GeoJSON>('/disease/map')
  },

  async importGeoJSON(featureCollection: object): Promise<{ imported: number }> {
    return api.post<{ imported: number }>('/parcels/import', featureCollection)
  },

  async getVRAEnhanced(parcelId: string): Promise<unknown> {
    return api.get(`/vra/enhanced/${parcelId}`)
  },

  async getVRASummary(parcelId: string): Promise<unknown> {
    return api.get(`/vra/summary/${parcelId}`)
  },
}

export default parcelService
