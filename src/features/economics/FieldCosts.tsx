import React, { useState, useRef, useEffect } from 'react'
import { DollarSign, AlertCircle, CheckCircle2, BarChart3, ChevronDown, Pencil, Trash2, X, Save } from 'lucide-react'
import { fertilizer as fertApi, parcels as parcelsApi } from '@/shared/lib/api'
import type { CostLog, Parcel } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import { useProfileStore } from '@/shared/stores'

const CATEGORY_OPTIONS = ['fertilizer', 'irrigation', 'labor', 'fuel', 'equipment', 'pesticide', 'seed', 'other']

const categoryColors: Record<string, string> = {
  fertilizer: '#fbc02d',
  irrigation: '#58a6ff',
  labor: '#a78bfa',
  fuel: '#f57c00',
  equipment: '#8b949e',
  pesticide: '#ef5350',
  seed: '#388e3c',
  other: '#6e7681',
}

interface FormState {
  parcel_ids: string[]
  cost_date: string
  category: string
  description: string
  amount_gel: string
  notes: string
}

const defaultForm: FormState = {
  parcel_ids: [],
  cost_date: new Date().toISOString().slice(0, 10),
  category: 'fertilizer',
  description: '',
  amount_gel: '',
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
        <span className={selected.length === 0 ? 'text-text-muted' : 'text-text-primary'}>
          {label}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-bg-border bg-bg-card shadow-lg">
          <div className="border-b border-bg-border p-2">
            <input
              type="text" className="input py-1 text-xs" placeholder="ძებნა..."
              value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
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
  log: CostLog
  onClose: () => void
  onSaved: () => void
}): React.ReactElement {
  const [fields, setFields] = useState({
    cost_date: log.cost_date,
    category: log.category ?? 'other',
    description: log.description ?? '',
    amount_gel: String(log.amount_gel ?? ''),
    notes: log.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      await fertApi.updateCost(log.id, {
        cost_date: fields.cost_date,
        category: fields.category,
        description: fields.description || undefined,
        amount_gel: parseFloat(fields.amount_gel) || 0,
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
              <input type="date" className="input" value={fields.cost_date} onChange={ch('cost_date')} />
            </div>
            <div>
              <label className="label">თანხა (GEL)</label>
              <input type="number" min="0" step="0.01" className="input" value={fields.amount_gel} onChange={ch('amount_gel')} />
            </div>
          </div>

          <div>
            <label className="label">კატეგორია</label>
            <select className="select" value={fields.category} onChange={ch('category')}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">აღწერა</label>
            <input type="text" className="input" value={fields.description} onChange={ch('description')} />
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

export default function FieldCosts(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [form, setForm] = useState<FormState>(defaultForm)
  const [histParcelId, setHistParcelId] = useState('')
  const [editingLog, setEditingLog] = useState<CostLog | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>({
    loading: false, error: null, success: null,
  })

  const { data: parcelList } = useApi<{ items: Parcel[] }>(
    () => parcelsApi.list(1, 200, undefined, profileId),
    [profileId]
  )

  const { data: history, loading: histLoading, error: histError, refetch: refetchHist } = useApi<
    CostLog[]
  >(
    () => histParcelId ? fertApi.costsHistory(histParcelId) : Promise.resolve([]),
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
          fertApi.logCost({
            parcel_id: pid,
            cost_date: form.cost_date,
            category: form.category,
            description: form.description,
            amount_gel: parseFloat(form.amount_gel) || 0,
            notes: form.notes,
          })
        )
      )
      const count = form.parcel_ids.length
      setSubmitState({
        loading: false,
        error: null,
        success: count === 1 ? 'ხარჯი წარმატებით შეინახა' : `ხარჯი ${count} ნაკვეთისთვის შეინახა`,
      })
      setForm((prev) => ({ ...defaultForm, parcel_ids: prev.parcel_ids, cost_date: prev.cost_date }))
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
      await fertApi.deleteCost(id)
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

  const categoryTotals: Record<string, number> = {}
  if (history) {
    for (const log of history) {
      const cat = log.category || 'other'
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + (log.amount_gel || 0)
    }
  }
  const grandTotal = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0)
  const selectedParcel = parcelList?.items.find((p) => p.id === histParcelId)
  const parcels = parcelList?.items ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">ხარჯები</h1>
        <p className="text-sm text-text-secondary">
          აკონტროლეთ ყველა საველე ხარჯი და გააანალიზეთ კატეგორიის მიხედვით
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">ხარჯის დაფიქსირება</h2>
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
                <label className="label" htmlFor="cost_date">თარიღი</label>
                <input
                  id="cost_date" name="cost_date" type="date" className="input"
                  value={form.cost_date} onChange={handleChange} required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="category">კატეგორია</label>
                <select id="category" name="category" className="select" value={form.category} onChange={handleChange}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="amount_gel">თანხა (GEL)</label>
                <input
                  id="amount_gel" name="amount_gel" type="number" min="0" step="0.01"
                  className="input" placeholder="0.00"
                  value={form.amount_gel} onChange={handleChange} required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="description">აღწერა</label>
              <input
                id="description" name="description" type="text" className="input"
                placeholder="მაგ. Urea-ს შეძენა, მოსავლის შეგროვების შრომა"
                value={form.description} onChange={handleChange}
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
                  <DollarSign className="h-4 w-4" />
                  {form.parcel_ids.length > 1
                    ? `ხარჯის დაფიქსირება (${form.parcel_ids.length} ნაკვეთი)`
                    : 'ხარჯის დაფიქსირება'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* History + Breakdown */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-text-primary">ხარჯების ისტორია</h2>
              </div>
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

            {histLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded" />)}
              </div>
            ) : histError ? (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {histError}
              </div>
            ) : !histParcelId ? (
              <p className="text-sm text-text-muted">აირჩიეთ ნაკვეთი ხარჯების სანახავად.</p>
            ) : !history || history.length === 0 ? (
              <p className="text-sm text-text-muted">ხარჯის ჩანაწერი არ მოიძებნა ამ ნაკვეთისთვის.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-bg-border">
                      <th className="table-header">თარიღი</th>
                      <th className="table-header">კატეგორია</th>
                      <th className="table-header">აღწერა</th>
                      <th className="table-header text-right">თანხა</th>
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
                          {formatDate(log.cost_date)}
                        </td>
                        <td className="table-cell">
                          <span
                            className="rounded px-1.5 py-0.5 text-xs font-medium"
                            style={{
                              background: `${categoryColors[log.category] ?? '#6e7681'}22`,
                              color: categoryColors[log.category] ?? '#6e7681',
                            }}
                          >
                            {log.category}
                          </span>
                        </td>
                        <td className="table-cell text-xs text-text-secondary max-w-28 truncate">
                          {log.description || '—'}
                        </td>
                        <td className="table-cell text-right font-medium text-text-primary">
                          {log.amount_gel?.toFixed(2)} GEL
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
                    <tr className="border-t-2 border-bg-border">
                      <td colSpan={3} className="table-cell text-right text-xs font-semibold text-text-secondary uppercase">
                        სულ
                      </td>
                      <td className="table-cell text-right font-bold text-accent">
                        {grandTotal.toFixed(2)} GEL
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Category breakdown */}
          {history && history.length > 0 && Object.keys(categoryTotals).length > 0 && (
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold text-text-primary">განაწილება კატეგორიის მიხედვით</h3>
              <div className="flex flex-col gap-2">
                {Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amount]) => {
                    const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0
                    const color = categoryColors[cat] ?? '#6e7681'
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium capitalize" style={{ color }}>{cat}</span>
                          <span className="text-xs text-text-secondary">
                            {amount.toFixed(2)} GEL ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-bg-border">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
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
