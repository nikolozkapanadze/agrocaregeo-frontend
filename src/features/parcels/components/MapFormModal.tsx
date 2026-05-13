/**
 * Modal for logging fertilizer / irrigation / cost directly from the map.
 * Triggered when user selects a form type in the parcel info card and taps "Fill form".
 */
import React, { useState } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import { fertilizer as fertApi } from '@/shared/lib/api'

type FormType = 'fertilizer' | 'irrigation' | 'cost'

interface Props {
  parcelId: string
  parcelCode: string
  formType: FormType
  onClose: () => void
}

// ── Fertilizer form ────────────────────────────────────────────────────────

interface FertState {
  applied_date: string
  fertilizer_name: string
  n_kg_ha: string
  p_kg_ha: string
  k_kg_ha: string
  mg_kg_ha: string
  method: string
  applied_by: string
  notes: string
}

const defaultFert: FertState = {
  applied_date: new Date().toISOString().slice(0, 10),
  fertilizer_name: '',
  n_kg_ha: '0',
  p_kg_ha: '0',
  k_kg_ha: '0',
  mg_kg_ha: '0',
  method: 'soil',
  applied_by: '',
  notes: '',
}

function FertForm({ parcelId, onSuccess }: { parcelId: string; onSuccess: () => void }): React.ReactElement {
  const [form, setForm] = useState<FertState>(defaultFert)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await fertApi.log({
        parcel_id: parcelId,
        applied_date: form.applied_date,
        fertilizer_name: form.fertilizer_name,
        n_kg_ha: parseFloat(form.n_kg_ha) || 0,
        p_kg_ha: parseFloat(form.p_kg_ha) || 0,
        k_kg_ha: parseFloat(form.k_kg_ha) || 0,
        mg_kg_ha: parseFloat(form.mg_kg_ha) || 0,
        method: form.method,
        applied_by: form.applied_by || undefined,
        notes: form.notes || undefined,
      })
      onSuccess()
    } catch (err: unknown) {
      setError(String(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">თარიღი</label>
          <input type="date" name="applied_date" value={form.applied_date} onChange={handle} required
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">სასუქის სახელი</label>
          <input type="text" name="fertilizer_name" value={form.fertilizer_name} onChange={handle} placeholder="სახელი"
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(['n_kg_ha', 'p_kg_ha', 'k_kg_ha', 'mg_kg_ha'] as const).map((field) => (
          <div key={field}>
            <label className="block text-xs text-[#8b949e] mb-1">{field.split('_')[0].toUpperCase()} კგ/ჰა</label>
            <input type="number" name={field} value={form[field]} onChange={handle} step="0.1" min="0"
              className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1.5 text-sm text-white" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">მეთოდი</label>
          <select name="method" value={form.method} onChange={handle}
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white">
            {['soil', 'foliar', 'drip', 'broadcast'].map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">შემსრულებელი</label>
          <input type="text" name="applied_by" value={form.applied_by} onChange={handle} placeholder="სახელი"
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#8b949e] mb-1">შენიშვნა</label>
        <textarea name="notes" value={form.notes} onChange={handle} rows={2}
          className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-semibold py-2 rounded text-sm transition">
        {loading ? 'ინახება...' : 'შენახვა'}
      </button>
    </form>
  )
}

// ── Irrigation form ────────────────────────────────────────────────────────

interface IrrigState {
  applied_date: string
  water_mm: string
  duration_min: string
  method: string
  cost_gel: string
  applied_by: string
  notes: string
}

const defaultIrrig: IrrigState = {
  applied_date: new Date().toISOString().slice(0, 10),
  water_mm: '',
  duration_min: '',
  method: 'drip',
  cost_gel: '0',
  applied_by: '',
  notes: '',
}

function IrrigForm({ parcelId, onSuccess }: { parcelId: string; onSuccess: () => void }): React.ReactElement {
  const [form, setForm] = useState<IrrigState>(defaultIrrig)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await fertApi.logIrrigation({
        parcel_id: parcelId,
        applied_date: form.applied_date,
        water_mm: parseFloat(form.water_mm) || 0,
        duration_min: parseFloat(form.duration_min) || 0,
        method: form.method,
        cost_gel: parseFloat(form.cost_gel) || 0,
        applied_by: form.applied_by || undefined,
        notes: form.notes || undefined,
      })
      onSuccess()
    } catch (err: unknown) {
      setError(String(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">თარიღი</label>
          <input type="date" name="applied_date" value={form.applied_date} onChange={handle} required
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">მეთოდი</label>
          <select name="method" value={form.method} onChange={handle}
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white">
            {['drip', 'sprinkler', 'channel', 'manual'].map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">წყალი (მმ)</label>
          <input type="number" name="water_mm" value={form.water_mm} onChange={handle} step="0.1" min="0" placeholder="30"
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1.5 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">ხანგრძლ. (წთ)</label>
          <input type="number" name="duration_min" value={form.duration_min} onChange={handle} step="1" min="0" placeholder="60"
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1.5 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">ღირებ. ₾</label>
          <input type="number" name="cost_gel" value={form.cost_gel} onChange={handle} step="0.01" min="0" placeholder="0"
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1.5 text-sm text-white" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">შემსრულებელი</label>
          <input type="text" name="applied_by" value={form.applied_by} onChange={handle} placeholder="სახელი"
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">შენიშვნა</label>
          <input type="text" name="notes" value={form.notes} onChange={handle}
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-semibold py-2 rounded text-sm transition">
        {loading ? 'ინახება...' : 'შენახვა'}
      </button>
    </form>
  )
}

// ── Cost form ──────────────────────────────────────────────────────────────

const COST_CATEGORIES = ['fertilizer', 'irrigation', 'machinery', 'pesticide', 'seed', 'labor', 'fuel', 'other']

interface CostState {
  cost_date: string
  category: string
  description: string
  amount_gel: string
  notes: string
}

const defaultCost: CostState = {
  cost_date: new Date().toISOString().slice(0, 10),
  category: 'other',
  description: '',
  amount_gel: '',
  notes: '',
}

function CostForm({ parcelId, onSuccess }: { parcelId: string; onSuccess: () => void }): React.ReactElement {
  const [form, setForm] = useState<CostState>(defaultCost)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await fertApi.logCost({
        parcel_id: parcelId,
        cost_date: form.cost_date,
        category: form.category,
        description: form.description,
        amount_gel: parseFloat(form.amount_gel) || 0,
        notes: form.notes || undefined,
      })
      onSuccess()
    } catch (err: unknown) {
      setError(String(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">თარიღი</label>
          <input type="date" name="cost_date" value={form.cost_date} onChange={handle} required
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-[#8b949e] mb-1">კატეგორია</label>
          <select name="category" value={form.category} onChange={handle}
            className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white">
            {COST_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#8b949e] mb-1">აღწერა</label>
        <input type="text" name="description" value={form.description} onChange={handle} placeholder="ხარჯის აღწერა" required
          className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
      </div>
      <div>
        <label className="block text-xs text-[#8b949e] mb-1">თანხა ₾</label>
        <input type="number" name="amount_gel" value={form.amount_gel} onChange={handle} step="0.01" min="0" placeholder="0.00" required
          className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
      </div>
      <div>
        <label className="block text-xs text-[#8b949e] mb-1">შენიშვნა</label>
        <textarea name="notes" value={form.notes} onChange={handle} rows={2}
          className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-1.5 text-sm text-white" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-semibold py-2 rounded text-sm transition">
        {loading ? 'ინახება...' : 'შენახვა'}
      </button>
    </form>
  )
}

// ── Main modal component ───────────────────────────────────────────────────

const FORM_LABELS: Record<FormType, string> = {
  fertilizer: 'სასუქი',
  irrigation: 'მორწყვა',
  cost: 'ხარჯი',
}

export default function MapFormModal({ parcelId, parcelCode, formType, onClose }: Props): React.ReactElement {
  const [saved, setSaved] = useState(false)

  const handleSuccess = (): void => {
    setSaved(true)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md bg-[#161b22] border border-[#21262d] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#21262d] px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-white">{FORM_LABELS[formType]}</h2>
            <p className="text-xs text-[#8b949e]">ნაკვეთი: <span className="text-[#58a6ff] font-semibold">{parcelCode}</span></p>
          </div>
          <button onClick={onClose} className="text-[#6e7681] hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {saved ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <p className="text-white font-semibold">ჩანაწერი შენახულია!</p>
              <button onClick={onClose}
                className="mt-2 bg-[#21262d] hover:bg-[#30363d] text-white px-6 py-2 rounded text-sm transition">
                დახურვა
              </button>
            </div>
          ) : (
            <>
              {formType === 'fertilizer' && <FertForm parcelId={parcelId} onSuccess={handleSuccess} />}
              {formType === 'irrigation' && <IrrigForm parcelId={parcelId} onSuccess={handleSuccess} />}
              {formType === 'cost' && <CostForm parcelId={parcelId} onSuccess={handleSuccess} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
