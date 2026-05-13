import { api } from '../client'

// Types
export interface CropInfo {
  key: string
  display_name: string
  display_name_en: string
}

export interface CategoryInfo {
  key: string
  display_name: string
  display_name_en: string
  icon: string
  crops: CropInfo[]
  features: string[]
}

export interface CropProfile {
  id: string
  tenant_id: string
  user_id: string
  name: string
  is_default: boolean
  profile_type_id: number | null
  profile_type_slug: string | null   // e.g. "grain", "viticulture"
  crop_type_id: number | null
  crop_type_slug: string | null       // e.g. "wheat", "grapes"
  created_at: string
}

export interface CropProfileCreate {
  name: string
  profile_type_slug: string
  crop_type_slug: string
}

export interface CropProfileUpdate {
  name?: string
  crop_type_slug?: string
}

export const cropProfileService = {
  async getCategories(): Promise<CategoryInfo[]> {
    return api.get<CategoryInfo[]>('/crop-profiles/categories')
  },

  async list(): Promise<CropProfile[]> {
    return api.get<CropProfile[]>('/crop-profiles/')
  },

  async create(data: CropProfileCreate): Promise<CropProfile> {
    return api.post<CropProfile>('/crop-profiles/', data)
  },

  async update(id: string, data: CropProfileUpdate): Promise<CropProfile> {
    return api.put<CropProfile>(`/crop-profiles/${id}`, data)
  },

  async remove(id: string): Promise<void> {
    return api.delete(`/crop-profiles/${id}`)
  },

  async activate(id: string): Promise<CropProfile> {
    return api.post<CropProfile>(`/crop-profiles/${id}/activate`)
  },

  async getConfig(id: string): Promise<Record<string, unknown> | null> {
    return api.get(`/crop-profiles/${id}/config`)
  },

  async updateConfig(id: string, profileTypeSlug: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const catKey = profileTypeSlug === 'viticulture' ? 'vine' : profileTypeSlug
    const body: Record<string, unknown> = {}
    body[catKey] = data
    return api.put(`/crop-profiles/${id}/config`, body)
  },
}
