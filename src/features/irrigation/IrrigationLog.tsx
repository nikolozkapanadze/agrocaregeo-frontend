import React, { useState, useRef, useEffect } from 'react'
import { Droplets, AlertCircle, CheckCircle2, ChevronDown, Pencil, Trash2, X, Save } from 'lucide-react'
import { fertilizer as fertApi, parcels as parcelsApi } from '@/shared/lib/api'
import type { IrrigationLog as IrrigLog, Parcel } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import { useProfileStore } from '@/shared/stores'

const METHOD_OPTIONS = ['drip', 'sprinkler', 'furrow', 'flood', 'center_pivot', 'subsurface']

interface FormState {
  parcel_ids: string[]
  applied_date: string
  water_mm: string
  duration_min: string
  method: string
  cost_gel: string
  notes: string
  applied_by: string
}

const defaultForm: FormState = {
  parcel_ids: [],
  applied_date: new Date().toISOString().slice(0, 10),
  water_mm: '',
  duration_min: '',
  method: 'drip',
  cost_gel: '',
  notes: '',
  applied_by: '',
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
        <span className={selected.length === 0 ? 'text-text-muted' : 'text-text-primary'}>
          {label}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-bg-border bg-bg-card shadow-lg">
          <div className="border-b border-bg-border p-2">
            <input
              type="text"
              className="input py-1 text-xs"
              placeholder="ძებნა..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
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
  log,
  onClose,
  onSaved,
}: {
  log: IrrigLog
  onClose: () => void
  onSaved: () => void
}): React.ReactElement {
  const [fields, setFields] = useState({
    applied_date: log.applied_date,
    water_mm: String(log.water_mm ?? ''),
    duration_min: String(log.duration_min ?? ''),
    method: log.method ?? 'drip',
    cost_gel: String(log.cost_gel ?? ''),
    notes: log.notes ?? '',
    applied_by: log.applied_by ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      await fertApi.updateIrrigation(log.id, {
        applied_date: fields.applied_date,
        water_mm: parseFloat(fields.water_mm) || 0,
        duration_min: parseInt(fields.duration_min) || undefined,
        method: fields.method || undefined,
        cost_gel: parseFloat(fields.cost_gel) || 0,
        notes: fields.notes || undefined,
        applied_by: fields.applied_by || undefined,
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-bg-border bg-bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-bg-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">ჩანაწერის რედაქტირება</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
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
              <input type="date" className="input" value={fields.applied_date} onChange={ch('applied_date')} />
            </div>
            <div>
              <label className="label">წყალი (mm)</label>
              <input type="number" min="0" step="0.1" className="input" value={fields.water_mm} onChange={ch('water_mm')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ხანგრძლივობა (წთ)</label>
              <input type="number" min="0" className="input" value={fields.duration_min} onChange={ch('duration_min')} />
            </div>
            <div>
              <label className="label">ღირებულება (GEL)</label>
              <input type="number" min="0" step="0.01" className="input" value={fields.cost_gel} onChange={ch('cost_gel')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">მეთოდი</label>
              <select className="select" value={fields.method} onChange={ch('method')}>
                {METHOD_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">ვინ გამოიყენა</label>
              <input type="text" className="input" value={fields.applied_by} onChange={ch('applied_by')} />
            </div>
          </div>

          <div>
            <label className="label">შენიშვნა</label>
            <textarea className="input resize-none" rows={2} value={fields.notes} onChange={ch('notes')} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-bg-border px-4 py-3">
          <button onClick={onClose} className="rounded-md border border-bg-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-border/30">
            გაუქმება
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-3.5 w-3.5" />}
            შენახვა
          </button>
        </div>
      </div>
    </div>
  )
}

export default function IrrigationLog(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [form, setForm] = useState<FormState>(defaultForm)
  const [histParcelId, setHistParcelId] = useState('')
  const [editingLog, setEditingLog] = useState<IrrigLog | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>({
    loading: false, error: null, success: null,
  })

  const { data: parcelList } = useApi<{ items: Parcel[] }>(
    () => parcelsApi.list(1, 200, undefined, profileId),
    [profileId]
  )

  const { data: history, loading: histLoading, error: histError, refetch: refetchHist } = useApi<
    IrrigLog[]
  >(
    () => histParcelId ? fertApi.irrigationHistory(histParcelId) : Promise.resolve([]),
    [histParcelId]
  )

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (form.parcel_ids.length === 0) return
    setSubmitState({ loading: true, error: null, success: null })
    try {
      await Promise.all(
        form.parcel_ids.map((pid) =>
          fertApi.logIrrigation({
            parcel_id: pid,
            applied_date: form.applied_date,
            water_mm: parseFloat(form.water_mm) || 0,
            duration_min: parseInt(form.duration_min) || 0,
            method: form.method,
            cost_gel: parseFloat(form.cost_gel) || 0,
            notes: form.notes,
            applied_by: form.applied_by,
          })
        )
      )
      const count = form.parcel_ids.length
      setSubmitState({
        loading: false,
        error: null,
        success: count === 1
          ? 'მორწყვის ჩანაწერი წარმატებით შეინახა'
          : `მორწყვის ჩანაწერი ${count} ნაკვეთისთვის შეინახა`,
      })
      setForm((prev) => ({ ...defaultForm, parcel_ids: prev.parcel_ids, applied_date: prev.applied_date }))
      if (histParcelId && form.parcel_ids.includes(histParcelId)) refetchHist()
      setTimeout(() => setSubmitState({ loading: false, error: null, success: null }), 4000)
    } catch (err) {
      setSubmitState({
        loading: false,
        error: err instanceof Error ? err.message : 'შენახვა ვერ მოხერხდა',
        success: null,
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fertApi.deleteIrrigation(id)
      setDeletingId(null)
      refetchHist()
    } catch {
      // stay in confirm state on error
    }
  }

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    } catch { return iso }
  }

  const totalWater = history?.reduce((sum, l) => sum + (l.water_mm || 0), 0) ?? 0
  const totalCost = history?.reduce((sum, l) => sum + (l.cost_gel || 0), 0) ?? 0
  const selectedParcel = parcelList?.items.find((p) => p.id === histParcelId)
  const parcels = parcelList?.items ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">მორწყვის ჩანაწერი</h1>
        <p className="text-sm text-text-secondary">
          დაარეგისტრირეთ მორწყვის მოვლენები და თვალყური ადევნეთ წყლის მოხმარებას
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">მორწყვის დაფიქსირება</h2>
          </div>

          {submitState.success && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-green-900/50 bg-green-950/30 px-3 py-2 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {submitState.success}
            </div>
          )}
          {submitState.error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitState.error}
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
                <label className="label" htmlFor="applied_date">თარიღი</label>
                <input
                  id="applied_date" name="applied_date" type="date" className="input"
                  value={form.applied_date} onChange={handleChange} required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="water_mm">გამოყენებული წყალი (mm)</label>
                <input
                  id="water_mm" name="water_mm" type="number" min="0" step="0.1"
                  className="input" placeholder="e.g. 25.0"
                  value={form.water_mm} onChange={handleChange} required
                />
              </div>
              <div>
                <label className="label" htmlFor="duration_min">ხანგრძლივობა (წთ)</label>
                <input
                  id="duration_min" name="duration_min" type="number" min="0"
                  className="input" placeholder="e.g. 120"
                  value={form.duration_min} onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="method">მორწყვის მეთოდი</label>
                <select id="method" name="method" className="select" value={form.method} onChange={handleChange}>
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="cost_gel">ღირებულება (GEL)</label>
                <input
                  id="cost_gel" name="cost_gel" type="number" min="0" step="0.01"
                  className="input" placeholder="e.g. 45.00"
                  value={form.cost_gel} onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="applied_by">ვინ გამოიყენა</label>
              <input
                id="applied_by" name="applied_by" type="text" className="input"
                placeholder="ოპერატორის სახელი"
                value={form.applied_by} onChange={handleChange}
              />
            </div>

            <div>
              <label className="label" htmlFor="notes">შენიშვნა</label>
              <textarea
                id="notes" name="notes" className="input resize-none" rows={2}
                placeholder="დამატებითი შენიშვნები..."
                value={form.notes} onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={submitState.loading || form.parcel_ids.length === 0}
              className="btn-primary flex items-center justify-center gap-2 mt-1"
            >
              {submitState.loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ინახება...
                </>
              ) : (
                <>
                  <Droplets className="h-4 w-4" />
                  {form.parcel_ids.length > 1
                    ? `მორწყვის დაფიქსირება (${form.parcel_ids.length} ნაკვეთი)`
                    : 'მორწყვის დაფიქსირება'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">მორწყვის ისტორია</h2>
            {selectedParcel && (
              <span className="text-xs text-text-muted">
                {selectedParcel.parcel_nr || selectedParcel.parcel_nr}
                {selectedParcel.area_ha ? ` · ${selectedParcel.area_ha.toFixed(1)} ha` : ''}
              </span>
            )}
          </div>

          {/* History parcel picker */}
          <div className="mb-3">
            <select
              className="select text-xs"
              value={histParcelId}
              onChange={(e) => setHistParcelId(e.target.value)}
            >
              <option value="">— ნაკვეთის ისტორია —</option>
              {parcels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parcel_nr || p.parcel_nr}{p.area_ha ? ` (${p.area_ha.toFixed(1)} ha)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Summary cards */}
          {history && history.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-bg-border bg-bg-primary px-3 py-2">
                <p className="text-xs text-text-muted">სულ წყალი</p>
                <p className="text-lg font-bold text-accent">{totalWater.toFixed(1)} mm</p>
              </div>
              <div className="rounded-md border border-bg-border bg-bg-primary px-3 py-2">
                <p className="text-xs text-text-muted">სულ ხარჯი</p>
                <p className="text-lg font-bold text-text-primary">{totalCost.toFixed(2)} GEL</p>
              </div>
            </div>
          )}

          {histLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded" />)}
            </div>
          ) : histError ? (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              {histError}
            </div>
          ) : !histParcelId ? (
            <p className="text-sm text-text-muted">აირჩიეთ ნაკვეთი ისტორიის სანახავად.</p>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-text-muted">მორწყვის ჩანაწერი არ მოიძებნა ამ ნაკვეთისთვის.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bg-border">
                    <th className="table-header">თარიღი</th>
                    <th className="table-header">წყალი (mm)</th>
                    <th className="table-header">ხანგრძლივობა</th>
                    <th className="table-header">მეთოდი</th>
                    <th className="table-header">ხარჯი (GEL)</th>
                    <th className="table-header"></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((log, idx) => (
                    <tr
                      key={log.id}
                      className={`border-b border-bg-border/50 ${idx % 2 === 1 ? 'bg-bg-primary/30' : ''}`}
                    >
                      <td className="table-cell text-xs whitespace-nowrap text-text-muted">
                        {formatDate(log.applied_date)}
                      </td>
                      <td className="table-cell text-center">
                        <span className="font-semibold text-accent">{log.water_mm}</span>
                      </td>
                      <td className="table-cell text-center text-xs text-text-secondary">
                        {log.duration_min ? `${log.duration_min} წთ` : '—'}
                      </td>
                      <td className="table-cell text-xs text-text-secondary capitalize">
                        {log.method?.replace('_', ' ')}
                      </td>
                      <td className="table-cell text-right text-xs">
                        {log.cost_gel ? <span className="text-text-primary">{log.cost_gel.toFixed(2)}</span> : '—'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingLog(log)}
                            className="rounded p-1 text-text-muted hover:bg-bg-border/50 hover:text-accent"
                            title="რედაქტირება"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {deletingId === log.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(log.id)}
                                className="rounded p-1 text-red-400 hover:bg-red-950/30"
                                title="დადასტურება"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="rounded p-1 text-text-muted hover:bg-bg-border/50"
                                title="გაუქმება"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(log.id)}
                              className="rounded p-1 text-text-muted hover:bg-bg-border/50 hover:text-red-400"
                              title="წაშლა"
                            >
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

      {editingLog && (
        <EditModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSaved={refetchHist}
        />
      )}
    </div>
  )
}
