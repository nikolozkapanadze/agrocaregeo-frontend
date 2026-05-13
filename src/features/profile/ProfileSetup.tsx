import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/shared/stores'
import { ChevronRight, Check, Plus } from 'lucide-react'
import type { CategoryInfo, CropInfo } from '@/shared/api/services/crop-profile.service'

export default function ProfileSetup(): React.ReactElement {
  const navigate = useNavigate()
  const { categories, fetchCategories, createProfile, fetchProfiles } = useProfileStore()
  const [step, setStep] = useState<'category' | 'crop' | 'done'>('category')
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null)
  const [selectedCrop, setSelectedCrop] = useState<CropInfo | null>(null)
  const [profileName, setProfileName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCategorySelect = (cat: CategoryInfo) => {
    setSelectedCategory(cat)
    setSelectedCrop(null)
    setProfileName(cat.display_name)
    setStep('crop')
  }

  const handleCropSelect = (crop: CropInfo) => {
    setSelectedCrop(crop)
    // Auto-set name from crop if still on category default
    if (!profileName || profileName === selectedCategory?.display_name) {
      setProfileName(crop.display_name)
    }
  }

  const handleCreate = async () => {
    if (!selectedCategory || !selectedCrop) return
    setIsSubmitting(true)
    setError(null)
    try {
      await createProfile(
        profileName || selectedCrop.display_name,
        selectedCategory.key,
        selectedCrop.key,
      )
      await fetchProfiles()
      setStep('done')
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'შეცდომა პროფილის შექმნისას')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">პროფილის შექმნა</h1>
          <p className="text-text-secondary">
            აირჩიეთ კულტურის კატეგორია თქვენი მეურნეობისთვის
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 w-12 rounded-full ${step === 'category' ? 'bg-accent' : 'bg-accent/30'}`} />
          <div className={`h-2 w-12 rounded-full ${step === 'crop' ? 'bg-accent' : step === 'done' ? 'bg-accent/30' : 'bg-white/10'}`} />
          <div className={`h-2 w-12 rounded-full ${step === 'done' ? 'bg-green-500' : 'bg-white/10'}`} />
        </div>

        {/* Step 1: Category */}
        {step === 'category' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => handleCategorySelect(cat)}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-bg-card hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 text-left"
              >
                <span className="text-3xl">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {cat.display_name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {cat.crops.map(c => c.display_name).join(', ')}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Crop selection (single) */}
        {step === 'crop' && selectedCategory && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setStep('category')}
                className="text-text-muted hover:text-text-primary text-sm"
              >
                ← უკან
              </button>
              <span className="text-2xl">{selectedCategory.icon}</span>
              <h2 className="text-lg font-semibold text-text-primary">
                {selectedCategory.display_name}
              </h2>
            </div>

            {/* Profile name */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">პროფილის სახელი</label>
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-card border border-white/10 text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none"
                placeholder={selectedCategory.display_name}
              />
            </div>

            {/* Crop radio select */}
            <div>
              <label className="block text-sm text-text-secondary mb-3">აირჩიეთ კულტურა</label>
              {selectedCategory.crops.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCategory.crops.map((crop: CropInfo) => (
                    <button
                      key={crop.key}
                      onClick={() => handleCropSelect(crop)}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                        selectedCrop?.key === crop.key
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-white/10 bg-bg-card text-text-secondary hover:border-white/20'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedCrop?.key === crop.key
                          ? 'bg-accent text-bg-primary'
                          : 'border border-white/20'
                      }`}>
                        {selectedCrop?.key === crop.key && <Check className="h-3 w-3" />}
                      </div>
                      <span className="font-medium">{crop.display_name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm p-4 bg-bg-card rounded-xl border border-white/10">
                  კულტურები მალე დაემატება
                </p>
              )}
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{error}</div>
            )}

            <button
              onClick={handleCreate}
              disabled={!selectedCrop || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-accent text-bg-primary font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  პროფილის შექმნა
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20 mb-4">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">პროფილი შეიქმნა!</h2>
            <p className="text-text-secondary">გადამისამართება Dashboard-ზე...</p>
          </div>
        )}
      </div>
    </div>
  )
}
