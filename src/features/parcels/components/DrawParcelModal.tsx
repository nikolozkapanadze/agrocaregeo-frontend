import React, { useState } from 'react'
import type L from 'leaflet'
import { X, Check, MapPin } from 'lucide-react'
import { parcels as parcelsApi } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'
import type { CategoryInfo } from '@/shared/api/services/crop-profile.service'

function getCropDisplayName(categories: CategoryInfo[], slug: string | null | undefined): string {
  if (!slug) return '—'
  for (const cat of categories) {
    const crop = cat.crops.find(c => c.key === slug)
    if (crop) return crop.display_name
  }
  return slug
}

interface Props {
  points: L.LatLng[]
  onSaved: () => void
  onCancel: () => void
}

function computeAreaHa(points: L.LatLng[]): number {
  if (points.length < 3) return 0
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].lng * points[j].lat
    area -= points[j].lng * points[i].lat
  }
  area = Math.abs(area) / 2
  const avgLat = points.reduce((s, p) => s + p.lat, 0) / n
  const m2 = area * 111320 * 111320 * Math.cos((avgLat * Math.PI) / 180)
  return m2 / 10000
}

export default function DrawParcelModal({ points, onSaved, onCancel }: Props): React.ReactElement {
  const { activeProfile, categories } = useProfileStore()
  const [parcelNr, setParcelNr] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Derive crop_type automatically from the active profile
  const cropType = activeProfile?.crop_type_slug ?? ''

  const areaHa = computeAreaHa(points)

  const handleSave = async (): Promise<void> => {
    if (!parcelNr.trim()) {
      setError('ნაკვეთის ID სავალდებულოა')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const geometry = {
        type: 'Polygon',
        coordinates: [[
          ...points.map(p => [p.lng, p.lat]),
          [points[0].lng, points[0].lat],
        ]],
      }
      await parcelsApi.create({
        parcel_nr: parcelNr.trim(),
        crop_type: cropType,
        area_ha: Math.round(areaHa * 100) / 100,
        geometry,
        ...(activeProfile?.id ? { crop_profile_id: activeProfile.id as unknown as string } : {}),
      } as Parameters<typeof parcelsApi.create>[0])
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'შეცდომა შენახვისას')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-80 rounded-2xl border border-white/10 bg-bg-card shadow-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">ნაკვეთის შენახვა</h3>
          </div>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Area info */}
        <div className="mb-4 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2.5 flex items-center justify-between">
          <span className="text-xs text-text-muted">{points.length} წერტილი</span>
          <span className="text-sm font-semibold text-accent">{areaHa.toFixed(2)} ჰა</span>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">ნაკვეთის ID *</label>
            <input
              type="text"
              value={parcelNr}
              onChange={e => setParcelNr(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="მაგ. P-001"
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-white/10 text-text-primary text-sm placeholder:text-text-muted focus:border-accent/50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">კულტურის სახეობა</label>
            <div className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-white/10 text-sm text-text-muted flex items-center gap-2">
              <span className="text-text-primary font-medium">
                {getCropDisplayName(categories, activeProfile?.crop_type_slug)}
              </span>
              <span className="text-text-muted text-xs">(პროფილიდან)</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-white/10 text-text-secondary text-sm hover:bg-white/5 transition-colors"
          >
            გაუქმება
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent text-bg-primary text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                შენახვა
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
