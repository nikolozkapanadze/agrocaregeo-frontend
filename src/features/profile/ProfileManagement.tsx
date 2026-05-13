import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/shared/stores'
import { Trash2, Edit3, Plus, Check, X } from 'lucide-react'
import type { CropProfile } from '@/shared/api/services/crop-profile.service'

export default function ProfileManagement(): React.ReactElement {
  const navigate = useNavigate()
  const {
    profiles, activeProfile, categories,
    fetchProfiles, fetchCategories,
    switchProfile, deleteProfile, updateProfile, isLoading,
  } = useProfileStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
    fetchCategories()
  }, [fetchProfiles, fetchCategories])

  const getCategoryName = (slug: string | null): string =>
    categories.find(c => c.key === slug)?.display_name ?? slug ?? '—'

  const getCategoryIcon = (slug: string | null): string =>
    categories.find(c => c.key === slug)?.icon ?? '📋'

  const getCropDisplayName = (profile: CropProfile): string => {
    if (!profile.crop_type_slug) return '—'
    const cat = categories.find(c => c.key === profile.profile_type_slug)
    const crop = cat?.crops.find(cr => cr.key === profile.crop_type_slug)
    return crop?.display_name ?? profile.crop_type_slug
  }

  const handleEdit = (profile: CropProfile) => {
    setEditingId(profile.id)
    setEditName(profile.name)
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await updateProfile(id, { name: editName })
      setEditingId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'შეცდომა')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile(id)
      setDeleteConfirm(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'შეცდომა წაშლისას')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">პროფილების მართვა</h1>
          <p className="text-sm text-text-secondary mt-1">შექმენით და მართეთ კულტურების პროფილები</p>
        </div>
        <button
          onClick={() => navigate('/profile-setup')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-primary text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          ახალი პროფილი
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{error}</div>
      )}

      {isLoading && profiles.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 bg-bg-card rounded-2xl border border-white/10">
          <p className="text-text-secondary mb-4">პროფილები არ მოიძებნა</p>
          <button
            onClick={() => navigate('/profile-setup')}
            className="text-accent hover:text-accent-hover text-sm font-medium"
          >
            შექმენით პირველი პროფილი →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className={`rounded-2xl border p-5 transition-all ${
                profile.id === activeProfile?.id
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-white/10 bg-bg-card'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0 mt-0.5">
                  {getCategoryIcon(profile.profile_type_slug)}
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === profile.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-bg-secondary border border-white/10 text-text-primary text-sm focus:border-accent/50 focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(profile.id)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-text-muted hover:bg-white/5">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-base font-semibold text-text-primary mb-1">{profile.name}</h3>
                  )}

                  <p className="text-xs text-text-muted mb-2">
                    {getCategoryName(profile.profile_type_slug)}
                  </p>

                  <span className="inline-block px-2 py-0.5 rounded-md bg-white/5 text-text-secondary text-xs border border-white/5">
                    {getCropDisplayName(profile)}
                  </span>

                  {profile.id === activeProfile?.id && (
                    <span className="inline-flex items-center gap-1 mt-2 ml-2 text-xs text-accent font-medium">
                      <Check className="h-3 w-3" />
                      აქტიური
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {profile.id !== activeProfile?.id && (
                    <button
                      onClick={() => switchProfile(profile.id)}
                      className="px-3 py-1.5 rounded-lg text-xs text-accent border border-accent/30 hover:bg-accent/10 transition-colors"
                    >
                      გააქტიურება
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(profile)}
                    className="p-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-primary transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  {deleteConfirm === profile.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(profile.id)} className="px-2 py-1 rounded-lg text-xs text-red-400 bg-red-400/10 hover:bg-red-400/20">
                        დიახ
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 rounded-lg text-xs text-text-muted hover:bg-white/5">
                        არა
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(profile.id)}
                      className="p-2 rounded-lg text-text-muted hover:bg-red-400/10 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
