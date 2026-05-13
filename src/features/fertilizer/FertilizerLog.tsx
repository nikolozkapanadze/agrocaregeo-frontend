import React, { useState, useRef, useEffect } from 'react'
import { Sprout, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Minus, ChevronDown, Pencil, Trash2, X, Save } from 'lucide-react'
import { fertilizer as fertApi, parcels as parcelsApi } from '@/shared/lib/api'
import type { FertilizerLog as FertLog, Parcel } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import { useProfileStore } from '@/shared/stores'

const METHOD_OPTIONS = ['soil', 'foliar', 'drip', 'broadcast', 'injection']

interface FormState {
  parcel_ids: string[]
  applied_date: string
  n_kg_ha: string
  p_kg_ha: string
  k_kg_ha: string
  mg_kg_ha: string
  n_kg_total: string
  p_kg_total: string
  k_kg_total: string
  mg_kg_total: string
  fertilizer_name: string
  method: string
  notes: string
  applied_by: string
}

const defaultForm: FormState = {
  parcel_ids: [],
  applied_date: new Date().toISOString().slice(0, 10),
  n_kg_ha: '0',
  p_kg_ha: '0',
  k_kg_ha: '0',
  mg_kg_ha: '0',
  n_kg_total: '',
  p_kg_total: '',
  k_kg_total: '',
  mg_kg_total: '',
  fertilizer_name: '',
  method: 'soil',
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

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

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
          {/* Search */}
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

          {/* Select all */}
          {filtered.length > 1 && (
            <label className="flex cursor-pointer items-center gap-2 border-b border-bg-border px-3 py-2 text-xs font-semibold text-accent hover:bg-bg-border/30">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="accent-accent"
              />
              {allSelected ? 'გაუქმება' : `ყველას არჩევა (${filtered.length})`}
            </label>
          )}

          {/* Parcel list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-text-muted">არ მოიძებნა</p>
            ) : (
              filtered.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs hover:bg-bg-border/30"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="accent-accent"
                  />
                  <span className="font-medium text-text-primary">
                    {p.parcel_nr || p.parcel_nr}
                  </span>
                  {p.crop_type && (
                    <span className="text-text-muted">· {p.crop_type}</span>
                  )}
                  {p.area_ha && (
                    <span className="ml-auto text-text-muted">{p.area_ha.toFixed(1)} ha</span>
                  )}
                </label>
              ))
            )}
          </div>

          {selected.length > 0 && (
            <div className="border-t border-bg-border px-3 py-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-text-muted hover:text-red-400"
              >
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
  area_ha,
  onClose,
  onSaved,
}: {
  log: FertLog
  area_ha: number | null
  onClose: () => void
  onSaved: () => void
}): React.ReactElement {
  const [fields, setFields] = useState({
    applied_date: log.applied_date,
    n_kg_ha:   String(log.n_kg_ha),
    p_kg_ha:   String(log.p_kg_ha),
    k_kg_ha:   String(log.k_kg_ha),
    mg_kg_ha:  String(log.mg_kg_ha),
    n_kg_total:  log.n_kg_total  != null ? String(log.n_kg_total)  : '',
    p_kg_total:  log.p_kg_total  != null ? String(log.p_kg_total)  : '',
    k_kg_total:  log.k_kg_total  != null ? String(log.k_kg_total)  : '',
    mg_kg_total: log.mg_kg_total != null ? String(log.mg_kg_total) : '',
    fertilizer_name: log.fertilizer_name ?? '',
    method: log.method ?? 'soil',
    notes: log.notes ?? '',
    applied_by: log.applied_by ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const syncHa = (mineral: 'n' | 'p' | 'k' | 'mg', value: string) => {
    const ha = parseFloat(value)
    const total = area_ha != null && !isNaN(ha) ? (ha * area_ha).toFixed(1) : ''
    setFields((p) => ({ ...p, [`${mineral}_kg_ha`]: value, [`${mineral}_kg_total`]: total }))
  }

  const syncTotal = (mineral: 'n' | 'p' | 'k' | 'mg', value: string) => {
    const total = parseFloat(value)
    const ha = area_ha != null && area_ha > 0 && !isNaN(total) ? (total / area_ha).toFixed(2) : ''
    setFields((p) => ({ ...p, [`${mineral}_kg_total`]: value, [`${mineral}_kg_ha`]: ha }))
  }

  const handleSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      await fertApi.update(log.id, {
        applied_date:    fields.applied_date,
        n_kg_ha:         parseFloat(fields.n_kg_ha)  || 0,
        p_kg_ha:         parseFloat(fields.p_kg_ha)  || 0,
        k_kg_ha:         parseFloat(fields.k_kg_ha)  || 0,
        mg_kg_ha:        parseFloat(fields.mg_kg_ha) || 0,
        n_kg_total:      fields.n_kg_total  ? parseFloat(fields.n_kg_total)  : undefined,
        p_kg_total:      fields.p_kg_total  ? parseFloat(fields.p_kg_total)  : undefined,
        k_kg_total:      fields.k_kg_total  ? parseFloat(fields.k_kg_total)  : undefined,
        mg_kg_total:     fields.mg_kg_total ? parseFloat(fields.mg_kg_total) : undefined,
        fertilizer_name: fields.fertilizer_name || undefined,
        method:          fields.method || undefined,
        notes:           fields.notes || undefined,
        applied_by:      fields.applied_by || undefined,
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
              <label className="label">სასუქის სახელი</label>
              <input type="text" className="input" value={fields.fertilizer_name} onChange={ch('fertilizer_name')} placeholder="Urea…" />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="label mb-0">დოზები</label>
              {area_ha != null && (
                <span className="text-[10px] text-text-muted">ნაკვეთი: {area_ha.toFixed(1)} ჰა</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['n', 'p', 'k', 'mg'] as const).map((m) => (
                <div key={m} className="flex flex-col gap-1">
                  <span className="text-center text-xs font-semibold uppercase text-text-muted">{m}</span>
                  <div className="relative">
                    <input
                      type="number" min="0" step="0.1"
                      className="input text-center pr-8"
                      value={fields[`${m}_kg_ha`]}
                      onChange={(e) => syncHa(m, e.target.value)}
                    />
                    <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-muted">kg/ha</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number" min="0" step="0.1"
                      className={`input text-center pr-8 ${area_ha == null ? 'opacity-40' : ''}`}
                      placeholder="სულ"
                      disabled={area_ha == null}
                      value={fields[`${m}_kg_total`]}
                      onChange={(e) => syncTotal(m, e.target.value)}
                    />
                    <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-muted">სულ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">მეთოდი</label>
              <select className="select" value={fields.method} onChange={ch('method')}>
                {METHOD_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
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

export default function FertilizerLog(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [form, setForm] = useState<FormState>(defaultForm)
  const [histParcelId, setHistParcelId] = useState('')
  const [editingLog, setEditingLog] = useState<FertLog | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>({
    loading: false, error: null, success: null,
  })

  const { data: parcelList } = useApi<{ items: Parcel[] }>(
    () => parcelsApi.list(1, 200, undefined, profileId),
    [profileId]
  )

  const { data: history, loading: histLoading, error: histError, refetch: refetchHist } = useApi<
    FertLog[]
  >(
    () =>
      histParcelId
        ? fertApi.history(histParcelId)
        : Promise.resolve([]),
    [histParcelId]
  )

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const getArea = (): number | null => {
    if (form.parcel_ids.length !== 1) return null
    return parcelList?.items.find((p) => p.id === form.parcel_ids[0])?.area_ha ?? null
  }

  const handleMineralHa = (mineral: 'n' | 'p' | 'k' | 'mg', value: string): void => {
    const area = getArea()
    const ha = parseFloat(value)
    const total = area != null && !isNaN(ha) ? (ha * area).toFixed(1) : ''
    setForm((prev) => ({ ...prev, [`${mineral}_kg_ha`]: value, [`${mineral}_kg_total`]: total }))
  }

  const handleMineralTotal = (mineral: 'n' | 'p' | 'k' | 'mg', value: string): void => {
    const area = getArea()
    const total = parseFloat(value)
    const ha = area != null && area > 0 && !isNaN(total) ? (total / area).toFixed(2) : ''
    setForm((prev) => ({ ...prev, [`${mineral}_kg_total`]: value, [`${mineral}_kg_ha`]: ha }))
  }

  // Recalculate totals whenever parcel selection changes
  useEffect(() => {
    const area = form.parcel_ids.length === 1
      ? (parcelList?.items.find((p) => p.id === form.parcel_ids[0])?.area_ha ?? null)
      : null
    if (area == null) {
      setForm((prev) => ({ ...prev, n_kg_total: '', p_kg_total: '', k_kg_total: '', mg_kg_total: '' }))
      return
    }
    setForm((prev) => ({
      ...prev,
      n_kg_total:  prev.n_kg_ha  ? (parseFloat(prev.n_kg_ha)  * area).toFixed(1) : '',
      p_kg_total:  prev.p_kg_ha  ? (parseFloat(prev.p_kg_ha)  * area).toFixed(1) : '',
      k_kg_total:  prev.k_kg_ha  ? (parseFloat(prev.k_kg_ha)  * area).toFixed(1) : '',
      mg_kg_total: prev.mg_kg_ha ? (parseFloat(prev.mg_kg_ha) * area).toFixed(1) : '',
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.parcel_ids, parcelList])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (form.parcel_ids.length === 0) return
    setSubmitState({ loading: true, error: null, success: null })
    try {
      const nHa  = parseFloat(form.n_kg_ha)  || 0
      const pHa  = parseFloat(form.p_kg_ha)  || 0
      const kHa  = parseFloat(form.k_kg_ha)  || 0
      const mgHa = parseFloat(form.mg_kg_ha) || 0

      await Promise.all(
        form.parcel_ids.map((pid) => {
          const area = parcels.find((p) => p.id === pid)?.area_ha ?? null
          return fertApi.log({
            parcel_id: pid,
            applied_date: form.applied_date,
            n_kg_ha:  nHa,
            p_kg_ha:  pHa,
            k_kg_ha:  kHa,
            mg_kg_ha: mgHa,
            n_kg_total:  area != null ? parseFloat((nHa  * area).toFixed(1)) : undefined,
            p_kg_total:  area != null ? parseFloat((pHa  * area).toFixed(1)) : undefined,
            k_kg_total:  area != null ? parseFloat((kHa  * area).toFixed(1)) : undefined,
            mg_kg_total: area != null ? parseFloat((mgHa * area).toFixed(1)) : undefined,
            fertilizer_name: form.fertilizer_name,
            method: form.method,
            notes: form.notes,
            applied_by: form.applied_by,
          })
        })
      )
      const count = form.parcel_ids.length
      setSubmitState({
        loading: false,
        error: null,
        success: count === 1
          ? 'სასუქის ჩანაწერი წარმატებით შეინახა'
          : `სასუქის ჩანაწერი ${count} ნაკვეთისთვის შეინახა`,
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

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    } catch { return iso }
  }

  const effectIndicator = (log: FertLog): React.ReactElement => {
    if (log.ndvi_before == null || log.ndvi_after == null) {
      return <span className="text-xs text-text-muted">განხილვაში</span>
    }
    const delta = log.ndvi_after - log.ndvi_before
    if (delta > 0.02) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-400">
          <TrendingUp className="h-3.5 w-3.5" />
          +{delta.toFixed(3)}
        </span>
      )
    } else if (delta < -0.02) {
      return (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <TrendingDown className="h-3.5 w-3.5" />
          {delta.toFixed(3)}
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 text-xs text-text-muted">
        <Minus className="h-3.5 w-3.5" />
        {delta.toFixed(3)}
      </span>
    )
  }

  const handleDelete = async (id: string) => {
    try {
      await fertApi.delete(id)
      setDeletingId(null)
      refetchHist()
    } catch {
      // silently ignore — user stays in confirm state
    }
  }

  const selectedParcel = parcelList?.items.find((p) => p.id === histParcelId)
  const parcels = parcelList?.items ?? []

  // Area of the single selected parcel (null when 0 or 2+ parcels selected)
  const singleArea: number | null =
    form.parcel_ids.length === 1
      ? (parcels.find((p) => p.id === form.parcel_ids[0])?.area_ha ?? null)
      : null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">სასუქის ჩანაწერი</h1>
        <p className="text-sm text-text-secondary">
          დაარეგისტრირეთ სასუქის გამოყენება და თვალყური ადევნეთ NDVI-ზე ზემოქმედებას
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Sprout className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">შეტანის დაფიქსირება</h2>
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
                <label className="label" htmlFor="applied_date">გამოყენების თარიღი</label>
                <input
                  id="applied_date"
                  name="applied_date"
                  type="date"
                  className="input"
                  value={form.applied_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="label mb-0">სასუქის დოზები</label>
                {singleArea != null && (
                  <span className="text-[10px] text-text-muted">ნაკვეთი: {singleArea.toFixed(1)} ჰა</span>
                )}
                {form.parcel_ids.length > 1 && (
                  <span className="text-[10px] text-text-muted">სულ — განსხვავდება ნაკვეთზე</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['n', 'p', 'k', 'mg'] as const).map((mineral) => (
                  <div key={mineral} className="flex flex-col gap-1">
                    <span className="text-center text-xs font-semibold uppercase text-text-muted">{mineral}</span>
                    <div className="relative">
                      <input
                        type="number" min="0" step="0.1"
                        className="input text-center pr-8"
                        placeholder="0"
                        value={form[`${mineral}_kg_ha` as keyof FormState]}
                        onChange={(e) => handleMineralHa(mineral, e.target.value)}
                      />
                      <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-muted">kg/ha</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number" min="0" step="0.1"
                        className={`input text-center pr-8 ${singleArea == null ? 'opacity-40' : ''}`}
                        placeholder={form.parcel_ids.length > 1 ? 'varies' : 'სულ'}
                        disabled={singleArea == null}
                        value={form[`${mineral}_kg_total` as keyof FormState]}
                        onChange={(e) => handleMineralTotal(mineral, e.target.value)}
                      />
                      <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-muted">სულ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="fertilizer_name">სასუქის სახელი</label>
              <input
                id="fertilizer_name"
                name="fertilizer_name"
                type="text"
                className="input"
                placeholder="e.g. Urea, NPK 16-16-16"
                value={form.fertilizer_name}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="method">გამოყენების მეთოდი</label>
                <select
                  id="method"
                  name="method"
                  className="select"
                  value={form.method}
                  onChange={handleChange}
                >
                  {METHOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="applied_by">ვინ გამოიყენა</label>
                <input
                  id="applied_by"
                  name="applied_by"
                  type="text"
                  className="input"
                  placeholder="ოპერატორის სახელი"
                  value={form.applied_by}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="notes">შენიშვნა</label>
              <textarea
                id="notes"
                name="notes"
                className="input resize-none"
                rows={2}
                placeholder="დამატებითი შენიშვნები..."
                value={form.notes}
                onChange={handleChange}
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
                  <Sprout className="h-4 w-4" />
                  {form.parcel_ids.length > 1
                    ? `შეტანის დაფიქსირება (${form.parcel_ids.length} ნაკვეთი)`
                    : 'შეტანის დაფიქსირება'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">განაცხადის ისტორია</h2>
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
            <p className="text-sm text-text-muted">სასუქის ჩანაწერი არ მოიძებნა ამ ნაკვეთისთვის.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bg-border">
                    <th className="table-header">თარიღი</th>
                    <th className="table-header">პროდუქტი</th>
                    <th className="table-header">N</th>
                    <th className="table-header">P</th>
                    <th className="table-header">K</th>
                    <th className="table-header">Mg</th>
                    <th className="table-header">მეთოდი</th>
                    <th className="table-header">NDVI ეფექტი</th>
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
                      <td className="table-cell text-xs">
                        {log.fertilizer_name || '—'}
                      </td>
                      <td className="table-cell text-center text-xs">
                        {log.n_kg_ha > 0 ? <><span className="text-yellow-400">{log.n_kg_ha}</span>{log.n_kg_total != null && <div className="text-[10px] text-text-muted">{log.n_kg_total} კგ</div>}</> : '—'}
                      </td>
                      <td className="table-cell text-center text-xs">
                        {log.p_kg_ha > 0 ? <><span className="text-orange-400">{log.p_kg_ha}</span>{log.p_kg_total != null && <div className="text-[10px] text-text-muted">{log.p_kg_total} კგ</div>}</> : '—'}
                      </td>
                      <td className="table-cell text-center text-xs">
                        {log.k_kg_ha > 0 ? <><span className="text-blue-400">{log.k_kg_ha}</span>{log.k_kg_total != null && <div className="text-[10px] text-text-muted">{log.k_kg_total} კგ</div>}</> : '—'}
                      </td>
                      <td className="table-cell text-center text-xs">
                        {log.mg_kg_ha > 0 ? <><span className="text-green-400">{log.mg_kg_ha}</span>{log.mg_kg_total != null && <div className="text-[10px] text-text-muted">{log.mg_kg_total} კგ</div>}</> : '—'}
                      </td>
                      <td className="table-cell text-xs text-text-secondary capitalize">
                        {log.method}
                      </td>
                      <td className="table-cell">
                        {effectIndicator(log)}
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
          area_ha={parcels.find((p) => p.id === editingLog.parcel_id)?.area_ha ?? null}
          onClose={() => setEditingLog(null)}
          onSaved={refetchHist}
        />
      )}
    </div>
  )
}
