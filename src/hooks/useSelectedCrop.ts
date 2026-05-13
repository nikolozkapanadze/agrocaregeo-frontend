/** Hook to get and manage selected crop
 * 
 * This hook reads the selected crop from localStorage (set by LandingPage)
 * and provides helper functions for API calls
 */
import { useState, useEffect, useCallback } from 'react'

export type CropType = 
  | 'vine' | 'hazelnut' | 'olive' | 'walnut' 
  | 'blueberry' | 'almond' | 'tea' | 'citrus'
  | 'wheat' | 'corn' | 'sunflower' | 'barley' 
  | 'soybean' | 'rapeseed'

const STORAGE_KEY = 'agrocare_selected_crop'

// Georgian names for display
export const CROP_NAMES: Record<CropType, string> = {
  vine: 'ვენახი',
  hazelnut: 'თხილი',
  olive: 'ზეთისხილი',
  walnut: 'კაკალი',
  blueberry: 'მოცვი',
  almond: 'ნუში',
  tea: 'ჩაი',
  citrus: 'ციტრუსი',
  wheat: 'ხორბალი',
  corn: 'სიმინდი',
  sunflower: 'მზესუმზირა',
  barley: 'ჭვავი',
  soybean: 'სოიო',
  rapeseed: 'კამელი',
}

// English names
export const CROP_NAMES_EN: Record<CropType, string> = {
  vine: 'Vineyard',
  hazelnut: 'Hazelnut',
  olive: 'Olive',
  walnut: 'Walnut',
  blueberry: 'Blueberry',
  almond: 'Almond',
  tea: 'Tea',
  citrus: 'Citrus',
  wheat: 'Wheat',
  corn: 'Corn',
  sunflower: 'Sunflower',
  barley: 'Barley',
  soybean: 'Soybean',
  rapeseed: 'Rapeseed',
}

// Crop colors for UI
export const CROP_COLORS: Record<CropType, string> = {
  vine: '#8B5CF6',
  hazelnut: '#A16207',
  olive: '#65A30D',
  walnut: '#78350F',
  blueberry: '#3B82F6',
  almond: '#92400E',
  tea: '#15803D',
  citrus: '#EAB308',
  wheat: '#EAB308',
  corn: '#FDE047',
  sunflower: '#F59E0B',
  barley: '#D4D4D8',
  soybean: '#65A30D',
  rapeseed: '#FACC15',
}

// Simple hook interface as requested
export function useSelectedCrop(): { 
  crop: string | null
  setCrop: (crop: string) => void 
} {
  const [crop, setCropState] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setCropState(stored)
    }
  }, [])

  const setCrop = useCallback((newCrop: string) => {
    localStorage.setItem(STORAGE_KEY, newCrop)
    setCropState(newCrop)
  }, [])

  return { crop, setCrop }
}

// Extended hook with more features
export function useSelectedCropExtended() {
  const [selectedCrop, setSelectedCrop] = useState<CropType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const crop = localStorage.getItem(STORAGE_KEY) as CropType | null
    if (crop && CROP_NAMES[crop]) {
      setSelectedCrop(crop)
    }
    setIsLoading(false)
  }, [])

  const saveCrop = useCallback((crop: CropType) => {
    localStorage.setItem(STORAGE_KEY, crop)
    setSelectedCrop(crop)
  }, [])

  const clearCrop = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSelectedCrop(null)
  }, [])

  // Helper to add crop filter to API params
  const getCropParams = useCallback(() => {
    return selectedCrop ? { crop_type: selectedCrop } : {}
  }, [selectedCrop])

  // Helper to filter array by crop
  const filterByCrop = useCallback(<T extends { crop_type?: string }>(items: T[]): T[] => {
    if (!selectedCrop) return items
    return items.filter(item => item.crop_type === selectedCrop)
  }, [selectedCrop])

  return {
    selectedCrop,
    isLoading,
    cropName: selectedCrop ? CROP_NAMES[selectedCrop] : null,
    cropNameEn: selectedCrop ? CROP_NAMES_EN[selectedCrop] : null,
    cropColor: selectedCrop ? CROP_COLORS[selectedCrop] : null,
    saveCrop,
    clearCrop,
    getCropParams,
    filterByCrop,
  }
}

export default useSelectedCrop
