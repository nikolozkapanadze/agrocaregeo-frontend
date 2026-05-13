import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cropProfileService } from '../api/services/crop-profile.service'
import type { CropProfile, CategoryInfo } from '../api/services/crop-profile.service'

interface ProfileState {
  profiles: CropProfile[]
  activeProfile: CropProfile | null
  categories: CategoryInfo[]
  isLoading: boolean
  error: string | null

  fetchProfiles: () => Promise<void>
  fetchCategories: () => Promise<void>
  createProfile: (name: string, profile_type_slug: string, crop_type_slug: string) => Promise<CropProfile>
  switchProfile: (id: string) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  updateProfile: (id: string, data: { name?: string; crop_type_slug?: string }) => Promise<void>
  clearProfiles: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfile: null,
      categories: [],
      isLoading: false,
      error: null,

      fetchProfiles: async () => {
        set({ isLoading: true, error: null })
        try {
          const profiles = await cropProfileService.list()
          const active = profiles.find(p => p.is_default) || profiles[0] || null
          set({ profiles, activeProfile: active, isLoading: false })
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to load profiles', isLoading: false })
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await cropProfileService.getCategories()
          set({ categories })
        } catch {
          // Silently fail - categories are non-critical
        }
      },

      createProfile: async (name: string, profile_type_slug: string, crop_type_slug: string) => {
        const profile = await cropProfileService.create({ name, profile_type_slug, crop_type_slug })
        const profiles = [...get().profiles, profile]
        const active = profile.is_default ? profile : get().activeProfile
        set({ profiles, activeProfile: active })
        return profile
      },

      switchProfile: async (id: string) => {
        const profile = await cropProfileService.activate(id)
        const profiles = get().profiles.map(p =>
          p.id === id ? { ...p, is_default: true } : { ...p, is_default: false }
        )
        set({ profiles, activeProfile: profile })
      },

      deleteProfile: async (id: string) => {
        await cropProfileService.remove(id)
        const profiles = get().profiles.filter(p => p.id !== id)
        const active = get().activeProfile?.id === id
          ? profiles.find(p => p.is_default) || profiles[0] || null
          : get().activeProfile
        set({ profiles, activeProfile: active })
      },

      updateProfile: async (id: string, data: { name?: string; crop_type_slug?: string }) => {
        const updated = await cropProfileService.update(id, data)
        const profiles = get().profiles.map(p => p.id === id ? updated : p)
        const active = get().activeProfile?.id === id ? updated : get().activeProfile
        set({ profiles, activeProfile: active })
      },

      clearProfiles: () => {
        set({ profiles: [], activeProfile: null, categories: [] })
      },
    }),
    {
      name: 'profile-storage',
      partialize: (state) => ({
        activeProfile: state.activeProfile,
        profiles: state.profiles,
      }),
    }
  )
)

export type { CropProfile, CategoryInfo }
export default useProfileStore
