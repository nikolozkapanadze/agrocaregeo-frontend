import { create } from 'zustand'
import { parcelService, type CreateParcelData } from '../api/services/parcel.service'
import type { Parcel, PaginatedResponse, ZoneStats } from '../api/types'

interface ParcelFilters {
  page: number
  perPage: number
  zone?: string
}

interface ParcelState {
  // State
  parcels: Parcel[]
  selectedParcel: Parcel | null
  stats: ZoneStats | null
  filters: ParcelFilters
  total: number
  pages: number
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchParcels: (filters?: Partial<ParcelFilters>) => Promise<void>
  fetchStats: () => Promise<void>
  selectParcel: (parcel: Parcel | null) => void
  setFilters: (filters: Partial<ParcelFilters>) => void
  createParcel: (data: CreateParcelData) => Promise<void>
  updateParcel: (id: string, data: Partial<Parcel>) => Promise<void>
  deleteParcel: (id: string) => Promise<void>
  clearError: () => void
}

export const useParcelStore = create<ParcelState>((set, get) => ({
  // Initial state
  parcels: [],
  selectedParcel: null,
  stats: null,
  filters: {
    page: 1,
    perPage: 50,
  },
  total: 0,
  pages: 0,
  isLoading: false,
  error: null,

  // Fetch parcels with filters
  fetchParcels: async (filters = {}) => {
    const currentFilters = { ...get().filters, ...filters }
    set({ isLoading: true, error: null, filters: currentFilters })
    
    try {
      const response: PaginatedResponse<Parcel> = await parcelService.list(currentFilters)
      set({
        parcels: response.items,
        total: response.total,
        pages: response.pages,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch parcels',
      })
    }
  },

  // Fetch zone stats
  fetchStats: async () => {
    try {
      const { analysisService } = await import('../api/services/analysis.service')
      const stats = await analysisService.getStats()
      set({ stats })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  },

  // Select a parcel
  selectParcel: (parcel) => set({ selectedParcel: parcel }),

  // Update filters
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }))
    // Refetch with new filters
    get().fetchParcels()
  },

  // Create parcel
  createParcel: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await parcelService.create(data)
      await get().fetchParcels()
      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create parcel',
      })
      throw error
    }
  },

  // Update parcel
  updateParcel: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await parcelService.update(id, data)
      await get().fetchParcels()
      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update parcel',
      })
      throw error
    }
  },

  // Delete parcel
  deleteParcel: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await parcelService.delete(id)
      await get().fetchParcels()
      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete parcel',
      })
      throw error
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}))

export default useParcelStore
