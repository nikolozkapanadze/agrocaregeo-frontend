import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/shared/stores'
import { ChevronDown, Check, Plus } from 'lucide-react'
import type { CropProfile } from '@/shared/api/services/crop-profile.service'

export default function ProfileSwitcher(): React.ReactElement | null {
  const navigate = useNavigate()
  const { profiles, activeProfile, categories, fetchProfiles, fetchCategories, switchProfile, isLoading } = useProfileStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProfiles()
    fetchCategories()
  }, [fetchProfiles, fetchCategories])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (profiles.length === 0 && !isLoading) return null

  const getCategoryIcon = (slug: string | null) =>
    categories.find(c => c.key === slug)?.icon ?? '📋'

  const getCropDisplayName = (profile: CropProfile): string => {
    if (!profile.crop_type_slug) return profile.profile_type_slug ?? '—'
    const cat = categories.find(c => c.key === profile.profile_type_slug)
    return cat?.crops.find(cr => cr.key === profile.crop_type_slug)?.display_name
      ?? profile.crop_type_slug
  }

  const handleSwitch = async (id: string) => {
    if (id === activeProfile?.id) { setOpen(false); return }
    await switchProfile(id)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-accent/30 transition-all text-sm"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="პროფილის არჩევა"
      >
        {activeProfile && (
          <>
            <span className="text-base" aria-hidden="true">{getCategoryIcon(activeProfile.profile_type_slug)}</span>
            <span className="hidden sm:inline text-text-primary font-medium max-w-[120px] truncate">
              {activeProfile.name}
            </span>
          </>
        )}
        <ChevronDown className={`h-3 w-3 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div 
          className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-bg-card/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
          role="listbox"
          aria-label="პროფილების სია"
        >
          <div className="border-b border-white/5 px-4 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">პროფილები</p>
          </div>

          <div className="py-1.5 max-h-64 overflow-y-auto">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => handleSwitch(p.id)}
                role="option"
                aria-selected={p.id === activeProfile?.id}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  p.id === activeProfile?.id
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <span className="text-lg" aria-hidden="true">{getCategoryIcon(p.profile_type_slug)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-text-muted">{getCropDisplayName(p)}</p>
                </div>
                {p.id === activeProfile?.id && <Check className="h-4 w-4 text-accent flex-shrink-0" aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 p-1.5">
            <button
              onClick={() => { setOpen(false); navigate('/profile-setup') }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-accent transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              პროფილის დამატება
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
