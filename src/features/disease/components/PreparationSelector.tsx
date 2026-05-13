/**
 * Simple Preparation Form Component
 * 
 * Simple interface: select type, enter name, save.
 * No auto-detection, no complex logic.
 */
import React, { useState, useEffect } from 'react'
import { Plus, Save, X, Beaker, Leaf, Bug, Droplets } from 'lucide-react'
import { request } from '@/shared/lib/api'

interface Preparation {
  id: number
  name: string
  manufacturer: string | null
  type: string
}

interface PreparationSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
}

// Type options with icons
const TYPE_OPTIONS = [
  { value: 'fungicide', label: 'ფუნგიციდი', icon: Beaker, color: '#ef4444' },
  { value: 'fertilizer', label: 'სასუქი', icon: Leaf, color: '#22c55e' },
  { value: 'pesticide', label: 'პესტიციდი', icon: Bug, color: '#f59e0b' },
  { value: 'herbicide', label: 'ჰერბიციდი', icon: Droplets, color: '#3b82f6' },
  { value: 'other', label: 'სხვა', icon: Beaker, color: '#6b7280' },
]

export default function PreparationSelector({
  value,
  onChange,
  label = 'პრეპარატი / სასუქი',
  placeholder = 'აირჩიეთ ან შეიყვანეთ...',
  className = '',
}: PreparationSelectorProps): React.ReactElement {
  // State
  const [preparations, setPreparations] = useState<Preparation[]>([])
  
  // Form state for adding new
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('fertilizer')
  const [newManufacturer, setNewManufacturer] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Load preparations on mount
  useEffect(() => {
    loadPreparations()
  }, [])

  const loadPreparations = async () => {
    try {
      const data = await request<Preparation[]>('/preparations/dropdown')
      setPreparations(data)
    } catch (err) {
      console.error('Failed to load preparations:', err)
    }
  }

  const handleSave = async () => {
    if (!newName.trim()) {
      setMessage('შეიყვანეთ დასახელება')
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      await request('/preparations', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          type: newType,
          manufacturer: newManufacturer.trim() || undefined,
        }),
      })

      // Success
      setMessage('✓ დაემატა წარმატებით!')
      onChange(newName.trim())
      setNewName('')
      setNewManufacturer('')
      setShowAddForm(false)
      loadPreparations() // Refresh list
      
      // Clear message after 2 seconds
      setTimeout(() => setMessage(null), 2000)
    } catch (err: any) {
      setMessage(err.message || 'შეცდომა დამატებისას')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setNewName('')
    setNewManufacturer('')
    setMessage(null)
  }

  // Get icon for type
  const getTypeIcon = (type: string) => {
    const option = TYPE_OPTIONS.find(o => o.value === type)
    const Icon = option?.icon || Beaker
    return <Icon className="h-4 w-4" style={{ color: option?.color }} />
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-text-secondary">
        {label}
      </label>

      {!showAddForm ? (
        // Selection Mode
        <>
          <div className="flex gap-2">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="select flex-1"
            >
              <option value="">{placeholder}</option>
              {TYPE_OPTIONS.map(typeOpt => {
                const typePreps = preparations.filter(p => p.type === typeOpt.value)
                if (typePreps.length === 0) return null
                return (
                  <optgroup key={typeOpt.value} label={typeOpt.label}>
                    {typePreps.map(prep => (
                      <option key={prep.id} value={prep.name}>
                        {prep.name} {prep.manufacturer ? `(${prep.manufacturer})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
            
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn-secondary flex items-center gap-2 px-3"
              title="ახალი პრეპარატის დამატება"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">ახალი</span>
            </button>
          </div>

          {/* Show selected type */}
          {value && (
            <div className="flex items-center gap-2 text-sm">
              {getTypeIcon(preparations.find(p => p.name === value)?.type || 'other')}
              <span className="text-text-secondary">
                {(() => {
                  const prep = preparations.find(p => p.name === value)
                  const typeLabel = TYPE_OPTIONS.find(o => o.value === prep?.type)?.label
                  return typeLabel || ''
                })()}
              </span>
            </div>
          )}
        </>
      ) : (
        // Add New Mode
        <div className="card p-4 border border-accent/30 bg-accent/5">
          <h4 className="text-sm font-medium text-accent mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            ახალი პრეპარატის დამატება
          </h4>
          
          {/* Type Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewType(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    newType === opt.value
                      ? 'bg-accent text-base-primary'
                      : 'bg-bg-card hover:bg-white/5 text-text-secondary'
                  }`}
                >
                  <Icon className="h-4 w-4" style={{ color: newType === opt.value ? 'currentColor' : opt.color }} />
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Name Input */}
          <div className="mb-3">
            <label className="text-xs text-text-muted mb-1 block">დასახელება *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="მაგ: Grow Plant Green Energy"
              className="input w-full"
              autoFocus
            />
          </div>

          {/* Manufacturer Input */}
          <div className="mb-4">
            <label className="text-xs text-text-muted mb-1 block">მწარმოებელი (არასავალდებულო)</label>
            <input
              type="text"
              value={newManufacturer}
              onChange={(e) => setNewManufacturer(e.target.value)}
              placeholder="მაგ: VAKICHIM"
              className="input w-full"
            />
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-3 px-3 py-2 rounded-lg text-sm ${
              message.includes('✓') 
                ? 'bg-success/10 text-success border border-success/30' 
                : 'bg-danger/10 text-danger border border-danger/30'
            }`}>
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !newName.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'ინახება...' : 'შენახვა'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              გაუქმება
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
