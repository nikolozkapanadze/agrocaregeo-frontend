import React, { useState, useEffect } from 'react'
import { User, CheckCircle2, AlertCircle } from 'lucide-react'
import { farmerProfile as profileApi, parcels as parcelsApi } from '@/shared/lib/api'
import type { FarmerProfile as Profile, FarmerProfileCreate, Parcel } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import { useProfileStore } from '@/shared/stores'

const DISEASE_OPTIONS = [
  { key: 'yellow_rust',    label: 'ყვითელი ჟანგი' },
  { key: 'brown_rust',     label: 'ყავისფერი ჟანგი' },
  { key: 'septoria',       label: 'სეპტორიოზი' },
  { key: 'fusarium',       label: 'ფუზარიოზი' },
  { key: 'powdery_mildew', label: 'ნამგვიანა' },
]

const IRRIGATION_TYPES = ['drip', 'sprinkler', 'channel', 'none']

const SOWING_METHODS = ['drill', 'broadcast', 'manual']
const PRODUCTION_GOALS = ['stable', 'max_yield', 'min_cost']
const COST_CATEGORIES = ['fertilizer', 'fuel', 'machinery', 'pesticide', 'other']
const PRIORITY_VALUES = [1, 2, 3, 4, 5]

interface FormState {
  wheat_variety: string
  variety_origin: string
  avg_yield_t_ha: string
  production_goal: string
  sowing_date: string
  seed_rate_kg_ha: string
  sowing_depth_cm: string
  sowing_method: string
  seed_treatment: boolean
  seed_treatment_prep: string
  has_irrigation: boolean
  irrigation_type: string
  total_cost_gel_ha: string
  main_cost_category: string
  wheat_price_gel_t: string
  disease_loss_pct: string
  priority_early_detect: string
  priority_fert_rec: string
  priority_yield_forecast: string
  historical_diseases: string[]
  notes: string
}

const defaultForm: FormState = {
  wheat_variety: '',
  variety_origin: '',
  avg_yield_t_ha: '',
  production_goal: '',
  sowing_date: '',
  seed_rate_kg_ha: '',
  sowing_depth_cm: '',
  sowing_method: '',
  seed_treatment: false,
  seed_treatment_prep: '',
  has_irrigation: false,
  irrigation_type: 'none',
  total_cost_gel_ha: '',
  main_cost_category: '',
  wheat_price_gel_t: '',
  disease_loss_pct: '',
  priority_early_detect: '',
  priority_fert_rec: '',
  priority_yield_forecast: '',
  historical_diseases: [],
  notes: '',
}

interface SubmitState {
  loading: boolean
  error: string | null
  success: string | null
}

function profileToForm(p: Profile): FormState {
  return {
    wheat_variety: p.wheat_variety || '',
    variety_origin: p.variety_origin || '',
    avg_yield_t_ha: p.avg_yield_t_ha != null ? String(p.avg_yield_t_ha) : '',
    production_goal: p.production_goal || '',
    sowing_date: p.sowing_date || '',
    seed_rate_kg_ha: p.seed_rate_kg_ha != null ? String(p.seed_rate_kg_ha) : '',
    sowing_depth_cm: p.sowing_depth_cm != null ? String(p.sowing_depth_cm) : '',
    sowing_method: p.sowing_method || '',
    seed_treatment: p.seed_treatment,
    seed_treatment_prep: p.seed_treatment_prep || '',
    has_irrigation: p.has_irrigation,
    irrigation_type: p.irrigation_type || 'none',
    total_cost_gel_ha: p.total_cost_gel_ha != null ? String(p.total_cost_gel_ha) : '',
    main_cost_category: p.main_cost_category || '',
    wheat_price_gel_t: p.wheat_price_gel_t != null ? String(p.wheat_price_gel_t) : '',
    disease_loss_pct: p.disease_loss_pct != null ? String(p.disease_loss_pct) : '',
    priority_early_detect: p.priority_early_detect != null ? String(p.priority_early_detect) : '',
    priority_fert_rec: p.priority_fert_rec != null ? String(p.priority_fert_rec) : '',
    priority_yield_forecast: p.priority_yield_forecast != null ? String(p.priority_yield_forecast) : '',
    historical_diseases: p.historical_diseases ? p.historical_diseases.split(',').filter(Boolean) : [],
    notes: p.notes || '',
  }
}

const inputCls = 'w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2 text-sm text-white'
const labelCls = 'block text-xs text-[#8b949e] mb-1'
const sectionCls = 'border-t border-[#21262d] pt-4'
const sectionTitleCls = 'text-xs font-semibold text-[#58a6ff] uppercase mb-3'

export default function FarmerProfile(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [selectedParcelId, setSelectedParcelId] = useState('')
  const [form, setForm] = useState<FormState>(defaultForm)
  const [submitState, setSubmitState] = useState<SubmitState>({
    loading: false, error: null, success: null,
  })

  const { data: parcelList } = useApi<{ items: Parcel[] }>(
    () => parcelsApi.list(1, 200, undefined, profileId),
    [profileId]
  )

  const { data: profile, loading: profileLoading } = useApi<Profile | null>(
    () => selectedParcelId ? profileApi.get(selectedParcelId) : Promise.resolve(null),
    [selectedParcelId]
  )

  useEffect(() => {
    setSelectedParcelId('')
    setForm(defaultForm)
  }, [profileId])

  useEffect(() => {
    if (profile) {
      setForm(profileToForm(profile))
    } else if (selectedParcelId) {
      setForm(defaultForm)
    }
  }, [profile, selectedParcelId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const toggleDisease = (key: string): void => {
    setForm((prev) => ({
      ...prev,
      historical_diseases: prev.historical_diseases.includes(key)
        ? prev.historical_diseases.filter((d) => d !== key)
        : [...prev.historical_diseases, key],
    }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedParcelId) return
    setSubmitState({ loading: true, error: null, success: null })
    try {
      const payload: FarmerProfileCreate = {
        wheat_variety: form.wheat_variety || undefined,
        variety_origin: form.variety_origin || undefined,
        avg_yield_t_ha: form.avg_yield_t_ha ? parseFloat(form.avg_yield_t_ha) : undefined,
        production_goal: form.production_goal || undefined,
        sowing_date: form.sowing_date || undefined,
        seed_rate_kg_ha: form.seed_rate_kg_ha ? parseFloat(form.seed_rate_kg_ha) : undefined,
        sowing_depth_cm: form.sowing_depth_cm ? parseFloat(form.sowing_depth_cm) : undefined,
        sowing_method: form.sowing_method || undefined,
        seed_treatment: form.seed_treatment,
        seed_treatment_prep: form.seed_treatment_prep || undefined,
        has_irrigation: form.has_irrigation,
        irrigation_type: form.irrigation_type || undefined,
        total_cost_gel_ha: form.total_cost_gel_ha ? parseFloat(form.total_cost_gel_ha) : undefined,
        main_cost_category: form.main_cost_category || undefined,
        wheat_price_gel_t: form.wheat_price_gel_t ? parseFloat(form.wheat_price_gel_t) : undefined,
        disease_loss_pct: form.disease_loss_pct ? parseFloat(form.disease_loss_pct) : undefined,
        priority_early_detect: form.priority_early_detect ? parseInt(form.priority_early_detect) : undefined,
        priority_fert_rec: form.priority_fert_rec ? parseInt(form.priority_fert_rec) : undefined,
        priority_yield_forecast: form.priority_yield_forecast ? parseInt(form.priority_yield_forecast) : undefined,
        historical_diseases: form.historical_diseases.join(',') || undefined,
        notes: form.notes || undefined,
      }
      await profileApi.upsert(selectedParcelId, payload)
      setSubmitState({ loading: false, error: null, success: 'პროფილი შენახულია' })
    } catch (err: unknown) {
      setSubmitState({ loading: false, error: String(err), success: null })
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <User className="w-6 h-6 text-blue-400" />
        მეურნის პროფილი
      </h1>

      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 max-w-2xl">
        {/* Parcel selector */}
        <div className="mb-4">
          <label className={labelCls}>ნაკვეთი</label>
          <select
            value={selectedParcelId}
            onChange={(e) => setSelectedParcelId(e.target.value)}
            className={inputCls}
          >
            <option value="">— აირჩიეთ —</option>
            {parcelList?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.parcel_nr || p.parcel_nr}
              </option>
            ))}
          </select>
        </div>

        {!selectedParcelId && (
          <p className="text-[#6e7681] text-sm">აირჩიეთ ნაკვეთი</p>
        )}

        {profileLoading && selectedParcelId && (
          <p className="text-[#8b949e] text-sm">იტვირთება...</p>
        )}

        {selectedParcelId && !profileLoading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitState.error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />{submitState.error}
              </div>
            )}
            {submitState.success && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />{submitState.success}
              </div>
            )}

            {/* Section: ჯიში და მოსავლიანობა */}
            <div>
              <div className={sectionTitleCls}>ჯიში და მოსავლიანობა</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>ჯიში</label>
                  <input
                    type="text"
                    name="wheat_variety"
                    value={form.wheat_variety}
                    onChange={handleChange}
                    placeholder="ხორბლის ჯიში"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>ჯიშის წარმოშობა</label>
                  <select
                    name="variety_origin"
                    value={form.variety_origin}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">— აირჩიეთ —</option>
                    <option value="local">ადგილობრივი</option>
                    <option value="imported">იმპორტირებული</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>საშ. მოსავალი ტ/ჰა</label>
                  <input
                    type="number"
                    name="avg_yield_t_ha"
                    value={form.avg_yield_t_ha}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    placeholder="4.5"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>წარმოების მიზანი</label>
                  <select
                    name="production_goal"
                    value={form.production_goal}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">— აირჩიეთ —</option>
                    {PRODUCTION_GOALS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: თესვა */}
            <div className={sectionCls}>
              <div className={sectionTitleCls}>თესვა</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>თესვის თარიღი</label>
                  <input
                    type="date"
                    name="sowing_date"
                    value={form.sowing_date}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>თესვის მეთოდი</label>
                  <select
                    name="sowing_method"
                    value={form.sowing_method}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">— აირჩიეთ —</option>
                    {SOWING_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>თესვის ნორმა კგ/ჰა</label>
                  <input
                    type="number"
                    name="seed_rate_kg_ha"
                    value={form.seed_rate_kg_ha}
                    onChange={handleChange}
                    step="1"
                    min="0"
                    placeholder="180"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>ჩათესვის სიღრმე სმ</label>
                  <input
                    type="number"
                    name="sowing_depth_cm"
                    value={form.sowing_depth_cm}
                    onChange={handleChange}
                    step="0.5"
                    min="0"
                    placeholder="5"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Seed treatment */}
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="seed_treatment"
                    checked={form.seed_treatment}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  თესლის დამუშავება
                </label>
                {form.seed_treatment && (
                  <input
                    type="text"
                    name="seed_treatment_prep"
                    value={form.seed_treatment_prep}
                    onChange={handleChange}
                    placeholder="პრეპარატის სახელი"
                    className={`${inputCls} ml-6`}
                  />
                )}
              </div>
            </div>

            {/* Section: მორწყვა */}
            <div className={sectionCls}>
              <div className={sectionTitleCls}>მორწყვა</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="has_irrigation"
                    checked={form.has_irrigation}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  მორწყვა გათვალისწინებულია
                </label>
                {form.has_irrigation && (
                  <select
                    name="irrigation_type"
                    value={form.irrigation_type}
                    onChange={handleChange}
                    className={`${inputCls} ml-6`}
                  >
                    {IRRIGATION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Section: ეკონომიკა */}
            <div className={sectionCls}>
              <div className={sectionTitleCls}>ეკონომიკა</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>დანახარჯი ₾/ჰა</label>
                  <input
                    type="number"
                    name="total_cost_gel_ha"
                    value={form.total_cost_gel_ha}
                    onChange={handleChange}
                    step="10"
                    min="0"
                    placeholder="800"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>მთ. დანახარჯის კატეგ.</label>
                  <select
                    name="main_cost_category"
                    value={form.main_cost_category}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">— აირჩიეთ —</option>
                    {COST_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>ხორბლის ფასი ₾/ტ</label>
                  <input
                    type="number"
                    name="wheat_price_gel_t"
                    value={form.wheat_price_gel_t}
                    onChange={handleChange}
                    step="10"
                    min="0"
                    placeholder="600"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>დაავადებებიდან ზარალი %</label>
                  <input
                    type="number"
                    name="disease_loss_pct"
                    value={form.disease_loss_pct}
                    onChange={handleChange}
                    step="1"
                    min="0"
                    max="100"
                    placeholder="10"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Section: პრიორიტეტები */}
            <div className={sectionCls}>
              <div className={sectionTitleCls}>პრიორიტეტები 1–5</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>ადრეული გამოვლენა</label>
                  <select
                    name="priority_early_detect"
                    value={form.priority_early_detect}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {PRIORITY_VALUES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>სასუქის რეკ.</label>
                  <select
                    name="priority_fert_rec"
                    value={form.priority_fert_rec}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {PRIORITY_VALUES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>მოსავლის პროგნოზი</label>
                  <select
                    name="priority_yield_forecast"
                    value={form.priority_yield_forecast}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {PRIORITY_VALUES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: ისტ. დაავადებები */}
            <div className={sectionCls}>
              <label className="block text-xs text-[#8b949e] mb-2">ისტ. დაავადებები</label>
              <div className="flex flex-wrap gap-2">
                {DISEASE_OPTIONS.map((d) => (
                  <button
                    type="button"
                    key={d.key}
                    onClick={() => toggleDisease(d.key)}
                    className={`px-3 py-1 rounded text-xs border transition ${
                      form.historical_diseases.includes(d.key)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-[#0d1117] border-[#21262d] text-[#8b949e] hover:border-[#58a6ff]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section: შენიშვნა */}
            <div className={sectionCls}>
              <label className={labelCls}>შენიშვნა</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={submitState.loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-semibold py-2 px-4 rounded text-sm transition"
            >
              {submitState.loading ? 'ინახება...' : 'შენახვა'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
