import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShieldAlert, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Minus, ChevronDown, Pencil, Trash2, X, Save } from 'lucide-react'
import PreparationSelector from './components/PreparationSelector'
import { spray as sprayApi, parcels as parcelsApi } from '@/shared/lib/api'
import type { SprayLog as SprayEntry, Parcel } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import { useProfileStore } from '@/shared/stores'

const DISEASE_OPTIONS = [
  { key: 'yellow_rust',    label: 'ყვითელი ჟანგი (Puccinia striiformis)' },
  { key: 'brown_rust',     label: 'ყავისფერი ჟანგი (Puccinia triticina)' },
  { key: 'septoria',       label: 'სეპტორიოზი (Septoria tritici)' },
  { key: 'fusarium',       label: 'ფუზარიოზი (Fusarium graminearum)' },
  { key: 'powdery_mildew', label: 'ნამგვიანა (Blumeria graminis)' },
  { key: 'other',          label: 'სხვა' },
]

const METHOD_OPTIONS = ['tractor', 'aircraft', 'manual']

interface FormState {
  parcel_ids: string[]
  spray_date: string
  disease_key: string
  disease_name: string
  fungicide_name: string
  dose_l_ha: string
  dose_total_l: string
  cost_gel: string
  applied_by: string
  method: string
  notes: string
}

const defaultForm: FormState = {
  parcel_ids: [],
  spray_date: new Date().toISOString().slice(0, 10),
  disease_key: '',
  disease_name: '',
  fungicide_name: '',
  dose_l_ha: '',
  dose_total_l: '',
  cost_gel: '',
  applied_by: '',
  method: 'tractor',
  notes: '',
}

interface SubmitState {
  loading: boolean
  error: string | null
  success: string | null
}

function ParcelMultiSelect({
  parcels,
  selected,
  onChange,
}: {
  parcels: Parcel[]
  selected: string[]
  onChange: (ids: string[]) => void
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = parcels.filter((p) => {
    const q = search.toLowerCase()
    return (
      (p.parcel_nr || '').toLowerCase().includes(q) ||
      (p.parcel_nr || '').toLowerCase().includes(q) ||
      (p.crop_type || '').toLowerCase().includes(q)
    )
  })

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.includes(p.id))

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])

  const toggleAll = () => {
    if (allSelected) {
      onChange(selected.filter((id) => !filtered.some((p) => p.id === id)))
    } else {
      const newIds = filtered.map((p) => p.id).filter((id) => !selected.includes(id))
      onChange([...selected, ...newIds])
    }
  }

  const label =
    selected.length === 0
      ? '— აირჩიეთ ნაკვეთ(ებ)ი —'
      : selected.length === 1
        ? (parcels.find((p) => p.id === selected[0])?.parcel_nr ?? selected[0])
        : `${selected.length} ნაკვეთი არჩეულია`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="select flex w-full items-center justify-between text-left"
      >
        <span className={selected.length === 0 ? 'text-text-muted' : 'text-text-primary'}>{label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-bg-border bg-bg-card shadow-lg">
          <div className="border-b border-bg-border p-2">
            <input type="text" className="input py-1 text-xs" placeholder="ძებნა..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          {filtered.length > 1 && (
            <label className="flex cursor-pointer items-center gap-2 border-b border-bg-border px-3 py-2 text-xs font-semibold text-accent hover:bg-bg-border/30">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-accent" />
              {allSelected ? 'გაუქმება' : `ყველას არჩევა (${filtered.length})`}
            </label>
          )}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-text-muted">არ მოიძებნა</p>
            ) : (
              filtered.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs hover:bg-bg-border/30">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-accent" />
                  <span className="font-medium text-text-primary">{p.parcel_nr || p.parcel_nr}</span>
                  {p.crop_type && <span className="text-text-muted">· {p.crop_type}</span>}
                  {p.area_ha && <span className="ml-auto text-text-muted">{p.area_ha.toFixed(1)} ha</span>}
                </label>
              ))
            )}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-bg-border px-3 py-2">
              <button type="button" onClick={() => onChange([])} className="text-xs text-text-muted hover:text-red-400">
                გასუფთავება ({selected.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditModal({
  entry,
  onClose,
  onSaved,
}: {
  entry: SprayEntry
  onClose: () => void
  onSaved: () => void
}): React.ReactElement {
  const [fields, setFields] = useState({
    spray_date: entry.spray_date,
    disease_key: entry.disease_key ?? '',
    disease_name: entry.disease_name ?? '',
    fungicide_name: entry.fungicide_name ?? '',
    dose_l_ha: String(entry.dose_l_ha ?? ''),
    dose_total_l: String(entry.dose_total_l ?? ''),
    cost_gel: String(entry.cost_gel ?? ''),
    method: entry.method ?? 'tractor',
    applied_by: entry.applied_by ?? '',
    notes: entry.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      await sprayApi.update(entry.id, {
        spray_date: fields.spray_date,
        disease_key: fields.disease_key || undefined,
        disease_name: fields.disease_name || undefined,
        fungicide_name: fields.fungicide_name || undefined,
        dose_l_ha: fields.dose_l_ha ? parseFloat(fields.dose_l_ha) : undefined,
        dose_total_l: fields.dose_total_l ? parseFloat(fields.dose_total_l) : undefined,
        cost_gel: fields.cost_gel ? parseFloat(fields.cost_gel) : undefined,
        method: fields.method || undefined,
        applied_by: fields.applied_by || undefined,
        notes: fields.notes || undefined,
      })
      onSaved()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'შენახვა ვერ მოხერხდა')
      setSaving(false)
    }
  }

  const ch = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFields((p) => ({ ...p, [key]: e.target.value }))

  const handleDiseaseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value
    const opt = DISEASE_OPTIONS.find((d) => d.key === key)
    setFields((p) => ({ ...p, disease_key: key, disease_name: opt ? opt.label : '' }))
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-bg-border bg-bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-bg-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">ჩანაწერის რედაქტირება</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          {err && (
            <div className="flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {err}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">თარიღი</label>
              <input type="date" className="input" value={fields.spray_date} onChange={ch('spray_date')} />
            </div>
            <div>
              <label className="label">მეთოდი</label>
              <select className="select" value={fields.method} onChange={ch('method')}>
                {METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">დაავადება</label>
            <select className="select" value={fields.disease_key} onChange={handleDiseaseSelect}>
              <option value="">— აირჩიეთ —</option>
              {DISEASE_OPTIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>

          <div>
            <PreparationSelector
              value={fields.fungicide_name}
              onChange={(name) => setFields((p) => ({ ...p, fungicide_name: name }))}
              label="ფუნგიციდი / პრეპარატი"
              placeholder="აირჩიეთ ან დაამატეთ ფუნგიციდი ან სასუქი..."
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">დოზა ლ/ჰა</label>
              <input type="number" min="0" step="0.01" className="input" value={fields.dose_l_ha} onChange={ch('dose_l_ha')} />
            </div>
            <div>
              <label className="label">ჯამი ლ</label>
              <input type="number" min="0" step="0.1" className="input" value={fields.dose_total_l} onChange={ch('dose_total_l')} />
            </div>
            <div>
              <label className="label">ღირებულება ₾</label>
              <input type="number" min="0" step="0.01" className="input" value={fields.cost_gel} onChange={ch('cost_gel')} />
            </div>
          </div>

          <div>
            <label className="label">შემსრულებელი</label>
            <input type="text" className="input" value={fields.applied_by} onChange={ch('applied_by')} />
          </div>

          <div>
            <label className="label">შენიშვნა</label>
            <textarea className="input resize-none" rows={2} value={fields.notes} onChange={ch('notes')} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-bg-border px-4 py-3">
          <button onClick={onClose} className="rounded-md border border-bg-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-border/30">გაუქმება</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
            {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-3.5 w-3.5" />}
            შენახვა
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SprayLog(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<FormState>(defaultForm)
  const [histParcelId, setHistParcelId] = useState('')
  const [editingEntry, setEditingEntry] = useState<SprayEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>({ loading: false, error: null, success: null })
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSubmitTimeout = () => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
      submitTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => clearSubmitTimeout()
  }, [])

  const { data: parcelList } = useApi<{ items: Parcel[] }>(() => parcelsApi.list(1, 200, undefined, profileId), [profileId])

  // Prefill from URL params: ?code=<uniq_code>&fungicide=<name>&dose=<number>
  useEffect(() => {
    const code = searchParams.get('code')
    const fungicide = searchParams.get('fungicide')
    const dose = searchParams.get('dose')
    if (!code && !fungicide && !dose) return

    const updates: Partial<FormState> = {}
    if (fungicide) updates.fungicide_name = fungicide
    if (dose) updates.dose_l_ha = dose

    if (code && parcelList?.items) {
      const match = parcelList.items.find((p) => p.parcel_nr === code || p.parcel_nr === code)
      if (match) {
        updates.parcel_ids = [match.id]
        setHistParcelId(match.id)
      }
    }

    if (Object.keys(updates).length > 0) {
      setForm((prev) => ({ ...prev, ...updates }))
    }
  }, [searchParams, parcelList])

  const { data: history, loading: histLoading, error: histError, refetch: refetchHist } = useApi<SprayEntry[]>(
    () => histParcelId ? sprayApi.history(histParcelId) : Promise.resolve([]),
    [histParcelId]
  )

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleDiseaseSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const key = e.target.value
    const opt = DISEASE_OPTIONS.find((d) => d.key === key)
    setForm((prev) => ({ ...prev, disease_key: key, disease_name: opt ? opt.label : '' }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (form.parcel_ids.length === 0) return
    setSubmitState({ loading: true, error: null, success: null })
    try {
      await Promise.all(
        form.parcel_ids.map((pid) =>
          sprayApi.log({
            parcel_id: pid,
            spray_date: form.spray_date,
            disease_key: form.disease_key || undefined,
            disease_name: form.disease_name || undefined,
            fungicide_name: form.fungicide_name || undefined,
            dose_l_ha: form.dose_l_ha ? parseFloat(form.dose_l_ha) : undefined,
            dose_total_l: form.dose_total_l ? parseFloat(form.dose_total_l) : undefined,
            cost_gel: form.cost_gel ? parseFloat(form.cost_gel) : undefined,
            applied_by: form.applied_by || undefined,
            method: form.method || undefined,
            notes: form.notes || undefined,
          })
        )
      )
      const count = form.parcel_ids.length
      setSubmitState({
        loading: false, error: null,
        success: count === 1 ? 'ჩანაწერი შენახულია' : `ჩანაწერი ${count} ნაკვეთისთვის შეინახა`,
      })
      setForm((prev) => ({ ...defaultForm, parcel_ids: prev.parcel_ids }))
      if (histParcelId && form.parcel_ids.includes(histParcelId)) refetchHist()
      clearSubmitTimeout()
      submitTimeoutRef.current = setTimeout(() => setSubmitState({ loading: false, error: null, success: null }), 4000)
    } catch (err) {
      clearSubmitTimeout()
      setSubmitState({ loading: false, error: String(err), success: null })
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await sprayApi.delete(id)
      setDeletingId(null)
      refetchHist()
    } catch { /* stay in confirm state */ }
  }

  const ndviIcon = (delta: number | null): React.ReactElement => {
    if (delta == null) return <Minus className="h-3.5 w-3.5 text-text-muted" />
    if (delta > 0.02) return <TrendingUp className="h-3.5 w-3.5 text-green-400" />
    if (delta < -0.02) return <TrendingDown className="h-3.5 w-3.5 text-red-400" />
    return <Minus className="h-3.5 w-3.5 text-yellow-400" />
  }

  const parcels = parcelList?.items ?? []
  const selectedParcel = parcels.find((p) => p.id === histParcelId)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-accent" />
          სპრეი / ფუნგიციდი
        </h1>
        <p className="text-sm text-text-secondary">დაარეგისტრირეთ ფუნგიციდის გამოყენება და თვალყური ადევნეთ NDVI-ზე ზემოქმედებას</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">ჩაწერა</h2>

          {submitState.error && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />{submitState.error}
            </div>
          )}
          {submitState.success && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-green-900/50 bg-green-950/30 px-3 py-2 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />{submitState.success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">ნაკვეთი</label>
                <ParcelMultiSelect
                  parcels={parcels}
                  selected={form.parcel_ids}
                  onChange={(ids) => setForm((prev) => ({ ...prev, parcel_ids: ids }))}
                />
              </div>
              <div>
                <label className="label">სპრეის თარიღი</label>
                <input type="date" name="spray_date" value={form.spray_date} onChange={handleChange} required className="input" />
              </div>
            </div>

            <div>
              <label className="label">დაავადება</label>
              <select value={form.disease_key} onChange={handleDiseaseSelect} className="select">
                <option value="">— აირჩიეთ —</option>
                {DISEASE_OPTIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </div>

            <div>
              <PreparationSelector
                value={form.fungicide_name}
                onChange={(name) => setForm({ ...form, fungicide_name: name })}
                label="ფუნგიციდი / პრეპარატი"
                placeholder="აირჩიეთ ან დაამატეთ ფუნგიციდი ან სასუქი..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">დოზა ლ/ჰა</label>
                <input type="number" name="dose_l_ha" value={form.dose_l_ha} onChange={handleChange} step="0.01" min="0" placeholder="0.5" className="input" />
              </div>
              <div>
                <label className="label">ჯამი ლ</label>
                <input type="number" name="dose_total_l" value={form.dose_total_l} onChange={handleChange} step="0.1" min="0" placeholder="სულ" className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">ღირებულება ₾</label>
                <input type="number" name="cost_gel" value={form.cost_gel} onChange={handleChange} step="0.01" min="0" placeholder="0" className="input" />
              </div>
              <div>
                <label className="label">მეთოდი</label>
                <select name="method" value={form.method} onChange={handleChange} className="select">
                  {METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">შემსრულებელი</label>
              <input type="text" name="applied_by" value={form.applied_by} onChange={handleChange} placeholder="სახელი" className="input" />
            </div>

            <div>
              <label className="label">შენიშვნა</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="input resize-none" />
            </div>

            <button
              type="submit"
              disabled={submitState.loading || form.parcel_ids.length === 0}
              className="btn-primary flex items-center justify-center gap-2 mt-1"
            >
              {submitState.loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />ინახება...</>
              ) : (
                <><ShieldAlert className="h-4 w-4" />
                  {form.parcel_ids.length > 1 ? `შენახვა (${form.parcel_ids.length} ნაკვეთი)` : 'შენახვა'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">ისტორია</h2>
            {selectedParcel && (
              <span className="text-xs text-text-muted">
                {selectedParcel.parcel_nr || selectedParcel.parcel_nr}
                {selectedParcel.area_ha ? ` · ${selectedParcel.area_ha.toFixed(1)} ha` : ''}
              </span>
            )}
          </div>

          {/* History parcel picker */}
          <div className="mb-3">
            <select className="select text-xs" value={histParcelId} onChange={(e) => setHistParcelId(e.target.value)}>
              <option value="">— ნაკვეთის ისტორია —</option>
              {parcels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parcel_nr || p.parcel_nr}{p.area_ha ? ` (${p.area_ha.toFixed(1)} ha)` : ''}
                </option>
              ))}
            </select>
          </div>

          {histLoading ? (
            <div className="flex flex-col gap-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
          ) : histError ? (
            <div className="flex items-center gap-2 text-sm text-red-400"><AlertCircle className="h-4 w-4" />{histError}</div>
          ) : !histParcelId ? (
            <p className="text-sm text-text-muted">აირჩიეთ ნაკვეთი ისტორიის სანახავად.</p>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-text-muted">ჩანაწერი არ მოიძებნა ამ ნაკვეთისთვის.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bg-border">
                    <th className="table-header">თარიღი</th>
                    <th className="table-header">ფუნგიციდი</th>
                    <th className="table-header">დოზა</th>
                    <th className="table-header">ღირებულება</th>
                    <th className="table-header">ΔNDVI</th>
                    <th className="table-header"></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, idx) => (
                    <tr key={entry.id} className={`border-b border-bg-border/50 ${idx % 2 === 1 ? 'bg-bg-primary/30' : ''}`}>
                      <td className="table-cell text-xs whitespace-nowrap text-text-muted">{entry.spray_date}</td>
                      <td className="table-cell text-xs">
                        <div className="font-medium text-accent">{entry.fungicide_name || '—'}</div>
                        {entry.disease_name && <div className="text-text-muted text-[10px]">{entry.disease_name}</div>}
                      </td>
                      <td className="table-cell text-xs text-text-secondary">
                        {entry.dose_l_ha != null ? `${entry.dose_l_ha} ლ/ჰა` : '—'}
                      </td>
                      <td className="table-cell text-xs text-text-secondary">
                        {entry.cost_gel != null ? `₾${entry.cost_gel}` : '—'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {ndviIcon(entry.ndvi_delta)}
                          {entry.ndvi_delta != null && (
                            <span className={`text-xs ${entry.ndvi_delta > 0.02 ? 'text-green-400' : entry.ndvi_delta < -0.02 ? 'text-red-400' : 'text-yellow-400'}`}>
                              {entry.ndvi_delta > 0 ? '+' : ''}{entry.ndvi_delta.toFixed(3)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="rounded p-1 text-text-muted hover:bg-bg-border/50 hover:text-accent"
                            title="რედაქტირება"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {deletingId === entry.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(entry.id)} className="rounded p-1 text-red-400 hover:bg-red-950/30" title="დადასტურება">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setDeletingId(null)} className="rounded p-1 text-text-muted hover:bg-bg-border/50" title="გაუქმება">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeletingId(entry.id)} className="rounded p-1 text-text-muted hover:bg-bg-border/50 hover:text-red-400" title="წაშლა">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingEntry && (
        <EditModal entry={editingEntry} onClose={() => setEditingEntry(null)} onSaved={refetchHist} />
      )}
    </div>
  )
}
