import { useState, useEffect } from 'react'
import { soil, parcels as parcelsApi, Parcel, SoilAnalysis, SoilAnalysisCreate } from '@/shared/lib/api'
import { useProfileStore } from '@/shared/stores'

function phColor(ph?: number): string {
  if (!ph) return '#8b949e'
  if (ph < 5.5) return '#d32f2f'
  if (ph < 6.0) return '#f57c00'
  if (ph <= 7.5) return '#388e3c'
  return '#f57c00'
}

function phLabel(ph?: number): string {
  if (!ph) return '—'
  if (ph < 5.5) return 'ძალიან მჟავე'
  if (ph < 6.0) return 'მჟავე'
  if (ph <= 7.0) return 'ნეიტრალური'
  if (ph <= 7.5) return 'სუსტად ტუტე'
  return 'ტუტე'
}

function fmt(val?: number, dec = 1): string {
  return val != null ? val.toFixed(dec) : '—'
}

type TabKey = 'macro' | 'micro' | 'physical'

const emptyForm: SoilAnalysisCreate = {
  parcel_id: '',
  sample_date: new Date().toISOString().slice(0, 10),
  lab_name: '',
  ph: undefined,
  lime_req: undefined,
  cec: undefined,
  om_pct: undefined,
  p_mgkg: undefined,
  k_mgkg: undefined,
  ca_mgkg: undefined,
  mg_mgkg: undefined,
  s_mgkg: undefined,
  b_mgkg: undefined,
  cu_mgkg: undefined,
  fe_mgkg: undefined,
  mn_mgkg: undefined,
  mo_mgkg: undefined,
  zn_mgkg: undefined,
  na_mgkg: undefined,
  sand_pct: undefined,
  silt_pct: undefined,
  clay_pct: undefined,
  texture_class: '',
  notes: '',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fieldVal(form: SoilAnalysisCreate, key: string): string {
  const v = (form as any)[key]
  return v != null ? String(v) : ''
}

const NUM_FIELDS = new Set([
  'ph', 'lime_req', 'cec', 'om_pct', 'p_mgkg', 'k_mgkg', 'ca_mgkg', 'mg_mgkg',
  's_mgkg', 'b_mgkg', 'cu_mgkg', 'fe_mgkg', 'mn_mgkg', 'mo_mgkg', 'zn_mgkg',
  'na_mgkg', 'sand_pct', 'silt_pct', 'clay_pct',
])

export default function SoilAnalysisPage() {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [analyses, setAnalyses] = useState<SoilAnalysis[]>([])
  const [parcelList, setParcelList] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('macro')
  const [form, setForm] = useState<SoilAnalysisCreate>(emptyForm)

  useEffect(() => {
    setLoading(true)
    Promise.all([soil.list(), parcelsApi.list(1, 200, undefined, profileId)])
      .then(([s, p]) => {
        setAnalyses(s)
        setParcelList(p.items)
      })
      .catch(() => setError('მონაცემების ჩატვირთვა ვერ მოხერხდა'))
      .finally(() => setLoading(false))
  }, [profileId])

  function setField(key: keyof SoilAnalysisCreate, val: string) {
    if (NUM_FIELDS.has(key)) {
      setForm(f => ({ ...f, [key]: val === '' ? undefined : parseFloat(val) }))
    } else {
      setForm(f => ({ ...f, [key]: val }))
    }
  }

  function closeForm() {
    setShowForm(false)
    setError(null)
    setForm(emptyForm)
    setActiveTab('macro')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.parcel_id) {
      setError('ნაკვეთი სავალდებულოა')
      return
    }
    setSaving(true)
    setError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...form }
      Object.keys(payload).forEach((k: string) => {
        if (payload[k] === '' || payload[k] === undefined) delete payload[k]
      })
      const created = await soil.create(payload)
      setAnalyses(prev => [created, ...prev.filter(a => a.parcel_id !== created.parcel_id)])
      closeForm()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'შეცდომა შენახვისას'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ჩანაწერი წაიშლება. გაგრძელება?')) return
    try {
      await soil.delete(id)
      setAnalyses(prev => prev.filter(a => a.id !== id))
    } catch {
      setError('წაშლა ვერ მოხერხდა')
    }
  }

  const validPhAnalyses = analyses.filter(a => a.ph != null)
  const avgPh = validPhAnalyses.length
    ? validPhAnalyses.reduce((s, a) => s + (a.ph as number), 0) / validPhAnalyses.length
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8b949e]">იტვირთება...</div>
      </div>
    )
  }

  const inputCls =
    'w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:border-[#58a6ff]'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">ნიადაგის ანალიზი</h1>
          <p className="text-[#8b949e] mt-1">
            BSE ლაბორატორიული მონაცემები — pH, NPK, მიკროელემენტები
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-[#58a6ff] text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
        >
          + ახალი ანალიზი
        </button>
      </div>

      {error && !showForm && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[#8b949e] text-sm">სულ ანალიზი</div>
          <div className="text-3xl font-bold text-[#e6edf3] mt-1">
            {analyses.length}{' '}
            <span className="text-sm font-normal text-[#8b949e]">ჩანაწერი</span>
          </div>
        </div>
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[#8b949e] text-sm">ნაკვეთები</div>
          <div className="text-3xl font-bold text-[#e6edf3] mt-1">
            {new Set(analyses.map(a => a.parcel_id)).size}{' '}
            <span className="text-sm font-normal text-[#8b949e]">ნაკვეთი</span>
          </div>
        </div>
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[#8b949e] text-sm">საშუალო pH</div>
          <div
            className="text-3xl font-bold mt-1"
            style={{ color: avgPh != null ? phColor(avgPh) : '#8b949e' }}
          >
            {avgPh != null ? avgPh.toFixed(1) : '—'}
          </div>
        </div>
      </div>

      {/* Data table */}
      {analyses.length === 0 ? (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">🧪</div>
          <div className="text-[#8b949e]">
            ანალიზი არ არის. დაამატეთ პირველი ლაბ. შედეგი.
          </div>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[#21262d]">
                {['ნაკვეთი', 'თარიღი', 'ლაბ.', 'pH', 'OM%', 'P (mg/kg)', 'K (mg/kg)', 'Mg (mg/kg)', 'ტექსტ.', ''].map(
                  h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[#8b949e] font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {analyses.map(a => {
                const parcel = parcelList.find(p => p.id === a.parcel_id)
                return (
                  <tr
                    key={a.id}
                    className="border-b border-[#21262d] hover:bg-[#21262d]/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-[#e6edf3] font-medium">
                      {parcel?.parcel_nr || a.parcel_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-[#8b949e] whitespace-nowrap">{a.sample_date}</td>
                    <td className="px-4 py-3 text-[#8b949e]">{a.lab_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: phColor(a.ph) }}>
                        {fmt(a.ph, 1)}
                      </span>
                      {a.ph != null && (
                        <span className="text-xs text-[#8b949e] ml-1">({phLabel(a.ph)})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#e6edf3]">{fmt(a.om_pct, 1)}</td>
                    <td className="px-4 py-3 text-[#e6edf3]">{fmt(a.p_mgkg, 0)}</td>
                    <td className="px-4 py-3 text-[#e6edf3]">{fmt(a.k_mgkg, 0)}</td>
                    <td className="px-4 py-3 text-[#e6edf3]">{fmt(a.mg_mgkg, 0)}</td>
                    <td className="px-4 py-3 text-[#8b949e] text-xs">{a.texture_class || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                      >
                        წაშლა
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#21262d]">
              <h2 className="text-xl font-bold text-[#e6edf3]">ახალი ნიადაგის ანალიზი</h2>
              <button
                onClick={closeForm}
                aria-label="დახურვა"
                className="text-[#8b949e] hover:text-[#e6edf3] text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-[#8b949e] mb-1">ნაკვეთი *</label>
                  <select
                    value={form.parcel_id}
                    onChange={e => setField('parcel_id', e.target.value)}
                    required
                    className={inputCls}
                  >
                    <option value="">— აირჩიეთ —</option>
                    {parcelList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.parcel_nr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8b949e] mb-1">სინჯის თარიღი</label>
                  <input
                    type="date"
                    value={form.sample_date}
                    onChange={e => setField('sample_date', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8b949e] mb-1">ლაბორატორია</label>
                  <input
                    type="text"
                    value={form.lab_name || ''}
                    onChange={e => setField('lab_name', e.target.value)}
                    placeholder="BSE"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-[#21262d]">
                {(['macro', 'micro', 'physical'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === t
                        ? 'border-[#58a6ff] text-[#58a6ff]'
                        : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'
                    }`}
                  >
                    {t === 'macro' ? 'ძირითადი' : t === 'micro' ? 'მიკროელემენტები' : 'ფიზიკური'}
                  </button>
                ))}
              </div>

              {activeTab === 'macro' && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'ph', label: 'pH', placeholder: '6.5' },
                    { key: 'lime_req', label: 'კირის საჭ. (t/ha)', placeholder: '0' },
                    { key: 'cec', label: 'CEC', placeholder: '15.0' },
                    { key: 'om_pct', label: 'OM%', placeholder: '2.5' },
                    { key: 'p_mgkg', label: 'P (mg/kg)', placeholder: '25' },
                    { key: 'k_mgkg', label: 'K (mg/kg)', placeholder: '180' },
                    { key: 'ca_mgkg', label: 'Ca (mg/kg)', placeholder: '1500' },
                    { key: 'mg_mgkg', label: 'Mg (mg/kg)', placeholder: '120' },
                    { key: 's_mgkg', label: 'S (mg/kg)', placeholder: '15' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm text-[#8b949e] mb-1">{f.label}</label>
                      <input
                        type="number"
                        step="any"
                        placeholder={f.placeholder}
                        value={fieldVal(form, f.key)}
                        onChange={e => setField(f.key as keyof SoilAnalysisCreate, e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'micro' && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'b_mgkg', label: 'B (mg/kg)', placeholder: '0.5' },
                    { key: 'cu_mgkg', label: 'Cu (mg/kg)', placeholder: '1.2' },
                    { key: 'fe_mgkg', label: 'Fe (mg/kg)', placeholder: '25' },
                    { key: 'mn_mgkg', label: 'Mn (mg/kg)', placeholder: '8.0' },
                    { key: 'mo_mgkg', label: 'Mo (mg/kg)', placeholder: '0.1' },
                    { key: 'zn_mgkg', label: 'Zn (mg/kg)', placeholder: '1.5' },
                    { key: 'na_mgkg', label: 'Na (mg/kg)', placeholder: '50' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm text-[#8b949e] mb-1">{f.label}</label>
                      <input
                        type="number"
                        step="any"
                        placeholder={f.placeholder}
                        value={fieldVal(form, f.key)}
                        onChange={e => setField(f.key as keyof SoilAnalysisCreate, e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'physical' && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'sand_pct', label: 'ქვიშა (%)', placeholder: '40' },
                    { key: 'silt_pct', label: 'თიხნარი (%)', placeholder: '35' },
                    { key: 'clay_pct', label: 'თიხა (%)', placeholder: '25' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm text-[#8b949e] mb-1">{f.label}</label>
                      <input
                        type="number"
                        step="any"
                        placeholder={f.placeholder}
                        value={fieldVal(form, f.key)}
                        onChange={e => setField(f.key as keyof SoilAnalysisCreate, e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm text-[#8b949e] mb-1">ტექსტურა</label>
                    <select
                      value={form.texture_class || ''}
                      onChange={e => setField('texture_class', e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— აირჩიეთ —</option>
                      {[
                        'sandy loam',
                        'loam',
                        'clay loam',
                        'silty loam',
                        'clay',
                        'sandy clay loam',
                      ].map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-[#8b949e] mb-1">შენიშვნა</label>
                    <textarea
                      value={form.notes || ''}
                      onChange={e => setField('notes', e.target.value)}
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>
              )}

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-[#58a6ff] text-white rounded-lg font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'ინახება...' : 'შენახვა'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2 border border-[#21262d] text-[#8b949e] rounded-lg hover:text-[#e6edf3] hover:border-[#8b949e] transition-colors"
                >
                  გაუქმება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
