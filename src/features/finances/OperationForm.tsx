import React, { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { CropOperation, Parcel, CostBreakdown } from '@/shared/lib/api'
import { operations } from '@/shared/lib/api'

interface Props {
  open: boolean
  operation: CropOperation | null
  parcels: Parcel[]
  onClose: () => void
  onSaved: () => void
}

const OP_TYPES = [
  { value: 'plowing', label: 'ხნულობა' },
  { value: 'planting', label: 'დარგვა' },
  { value: 'sowing', label: 'თესვა' },
  { value: 'fertilizing', label: 'სასუქი' },
  { value: 'pesticide_application', label: 'პესტიციდი' },
  { value: 'irrigation', label: 'მორწყვა' },
  { value: 'harvesting', label: 'მკა' },
  { value: 'cultivation', label: 'კულტივაცია' },
  { value: 'drone_spraying', label: 'დრონით შესხურება' },
  { value: 'soil_sampling', label: 'ნიადაგის ნიმუში' },
  { value: 'pruning', label: 'ჭრა-ჩეხა' },
  { value: 'other', label: 'სხვა' },
]

const COST_CATEGORIES = [
  { value: 'labor', label: 'მუშახელი' },
  { value: 'fuel', label: 'საწვავი' },
  { value: 'equipment_rental', label: 'ტექნიკის ქირა' },
  { value: 'material_product', label: 'მასალა/პროდუქტი' },
  { value: 'drone_rental', label: 'დრონის ქირა' },
  { value: 'machinery_depreciation', label: 'ტექნიკის ცვეთა' },
  { value: 'transport', label: 'ტრანსპორტი' },
  { value: 'electricity_water', label: 'ელექტრო/წყალი' },
  { value: 'certification', label: 'სერთიფიკაცია' },
  { value: 'other', label: 'სხვა' },
]

const emptyCostRow = (): CostBreakdown & { key: string } => ({
  key: crypto.randomUUID(),
  cost_category: 'labor',
  amount_gel: 0,
  quantity: null,
  unit: '',
  unit_price_gel: null,
  supplier: '',
  notes: '',
})

const defaultForm = {
  parcel_id: '',
  crop_type: '',
  operation_type: 'fertilizing',
  operation_date: new Date().toISOString().slice(0, 10),
  area_ha: undefined as number | undefined,
  status: 'completed' as string,
  notes: '',
  performed_by: '',
  weather_conditions: '',
}

export default function OperationForm({ open, operation, parcels, onClose, onSaved }: Props): React.ReactElement | null {
  const [form, setForm] = useState({ ...defaultForm })
  const [costs, setCosts] = useState<(CostBreakdown & { key: string })[]>([emptyCostRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (operation) {
      setForm({
        parcel_id: operation.parcel_id || '',
        crop_type: operation.crop_type || '',
        operation_type: operation.operation_type,
        operation_date: operation.operation_date,
        area_ha: operation.area_ha || undefined,
        status: operation.status,
        notes: operation.notes || '',
        performed_by: operation.performed_by || '',
        weather_conditions: operation.weather_conditions || '',
      })
      setCosts(
        operation.cost_breakdowns.length > 0
          ? operation.cost_breakdowns.map((c) => ({ ...c, key: c.id || crypto.randomUUID() }))
          : [emptyCostRow()]
      )
    } else {
      setForm({ ...defaultForm })
      setCosts([emptyCostRow()])
    }
  }, [open, operation])

  const updateForm = useCallback((field: string, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }))
  }, [])

  const updateCost = useCallback((key: string, field: string, value: unknown) => {
    setCosts((prev) => prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)))
  }, [])

  const addCostRow = useCallback(() => {
    setCosts((prev) => [...prev, emptyCostRow()])
  }, [])

  const removeCostRow = useCallback((key: string) => {
    setCosts((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.key !== key)))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        ...form,
        parcel_id: form.parcel_id || null,
        crop_type: form.crop_type || null,
        area_ha: form.area_ha || null,
        notes: form.notes || null,
        performed_by: form.performed_by || null,
        weather_conditions: form.weather_conditions || null,
        cost_breakdowns: costs
          .filter((c) => c.amount_gel > 0)
          .map((c) => ({
            cost_category: c.cost_category,
            amount_gel: c.amount_gel,
            quantity: c.quantity || null,
            unit: c.unit || null,
            unit_price_gel: c.unit_price_gel || null,
            supplier: c.supplier || null,
            notes: c.notes || null,
          })),
      }

      if (operation) {
        await operations.update(operation.id, payload)
      } else {
        await operations.create(payload)
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'შენახვა ვერ მოხერხდა')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-bg-border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-text-primary">
            {operation ? 'ოპერაციის რედაქტირება' : 'ახალი ოპერაცია'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3">ძირითადი ინფორმაცია</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">ოპერაციის ტიპი *</label>
                  <select
                    value={form.operation_type}
                    onChange={(e) => updateForm('operation_type', e.target.value)}
                    className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    required
                  >
                    {OP_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">თარიღი *</label>
                  <input
                    type="date"
                    value={form.operation_date}
                    onChange={(e) => updateForm('operation_date', e.target.value)}
                    className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">ნაკვეთი</label>
                  <select
                    value={form.parcel_id}
                    onChange={(e) => updateForm('parcel_id', e.target.value)}
                    className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">აირჩიეთ...</option>
                    {parcels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.parcel_nr || p.parcel_nr} ({p.crop_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">კულტურა</label>
                  <input
                    type="text"
                    value={form.crop_type}
                    onChange={(e) => updateForm('crop_type', e.target.value)}
                    placeholder="მაგ. ხორბალი, ვაზი..."
                    className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">ფართობი (ჰა)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.area_ha ?? ''}
                    onChange={(e) => updateForm('area_ha', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">სტატუსი</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateForm('status', e.target.value)}
                    className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="completed">შესრულებული</option>
                    <option value="planned">დაგეგმილი</option>
                    <option value="cancelled">გაუქმებული</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">შესრულებულია</label>
                  <input
                    type="text"
                    value={form.performed_by}
                    onChange={(e) => updateForm('performed_by', e.target.value)}
                    placeholder="მაგ. ივანე ბ..."
                    className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">ამინდი</label>
                  <input
                    type="text"
                    value={form.weather_conditions}
                    onChange={(e) => updateForm('weather_conditions', e.target.value)}
                    placeholder="მაგ. მზიანი, ღრუბლიანი..."
                    className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs text-text-muted mb-1.5">შენიშვნა</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateForm('notes', e.target.value)}
                    rows={2}
                    className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-secondary">ხარჯების დეტალიზაცია</h3>
                <button
                  type="button"
                  onClick={addCostRow}
                  className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  დამატება
                </button>
              </div>

              <div className="space-y-2">
                {costs.map((cost) => (
                  <div
                    key={cost.key}
                    className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end bg-white/[0.02] border border-white/5 rounded-lg p-3"
                  >
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-text-muted mb-1">კატეგორია</label>
                      <select
                        value={cost.cost_category}
                        onChange={(e) => updateCost(cost.key, 'cost_category', e.target.value)}
                        className="w-full bg-bg-base border border-bg-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                      >
                        {COST_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-text-muted mb-1">თანხა (₾) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cost.amount_gel || ''}
                        onChange={(e) => updateCost(cost.key, 'amount_gel', parseFloat(e.target.value) || 0)}
                        className="w-full bg-bg-base border border-bg-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                        required
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-text-muted mb-1">რაოდენობა</label>
                      <input
                        type="number"
                        step="0.01"
                        value={cost.quantity ?? ''}
                        onChange={(e) => updateCost(cost.key, 'quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full bg-bg-base border border-bg-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-text-muted mb-1">ერთეული</label>
                      <input
                        type="text"
                        value={cost.unit || ''}
                        onChange={(e) => updateCost(cost.key, 'unit', e.target.value)}
                        placeholder="კგ, ლ, ჰა..."
                        className="w-full bg-bg-base border border-bg-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-text-muted mb-1">მიმწოდებელი</label>
                      <input
                        type="text"
                        value={cost.supplier || ''}
                        onChange={(e) => updateCost(cost.key, 'supplier', e.target.value)}
                        placeholder="კომპანია..."
                        className="w-full bg-bg-base border border-bg-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="flex gap-1 sm:col-span-1">
                      <div className="flex-1">
                        <label className="block text-[10px] text-text-muted mb-1">ერთ. ფასი</label>
                        <input
                          type="number"
                          step="0.01"
                          value={cost.unit_price_gel ?? ''}
                          onChange={(e) => updateCost(cost.key, 'unit_price_gel', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full bg-bg-base border border-bg-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCostRow(cost.key)}
                        className="pb-1 text-text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                <span className="text-text-muted">ჯამი:</span>
                <span className="font-bold text-accent font-mono">
                  ₾{costs.reduce((s, c) => s + c.amount_gel, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            გაუქმება
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block" />
                ინახება...
              </span>
            ) : (
              operation ? 'შენახვა' : 'დამატება'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
