import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Radio, Eye, EyeOff } from 'lucide-react'
import { weatherStations } from '@/shared/lib/api'

const STATION_TYPES = [
  { key: 'generic_json', label: 'Generic JSON (HTTP POST)', mode: 'push' },
  { key: 'ecowitt', label: 'Ecowitt / Fine Offset', mode: 'pull' },
  { key: 'davis_weatherlink', label: 'Davis WeatherLink', mode: 'pull' },
  { key: 'wunderground', label: 'Weather Underground', mode: 'push' },
  { key: 'mqtt', label: 'MQTT (IoT)', mode: 'push' },
]

export default function WeatherStationAdd(): React.ReactElement {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [stationId, setStationId] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({
    name: '',
    station_type: 'generic_json',
    latitude: 41.7151,
    longitude: 44.8271,
    pull_interval_min: 15,
    provider_key: '',
    provider_secret: '',
    provider_endpoint: '',
    pull_url: '',
  })
  const [testResult, setTestResult] = useState<{status: string; readings_count?: number; reason?: string} | null>(null)

  const selectedType = STATION_TYPES.find(t => t.key === form.station_type)

  const createStation = async () => {
    setLoading(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      )
      const res = await weatherStations.create(payload as any)
      setStationId(res.id)
      setStep(3)
    } catch (e: any) {
      alert(e?.detail || 'შეცდომა სადგურის შექმნისას')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    if (!stationId) return
    setLoading(true)
    try {
      const res = await weatherStations.test(stationId)
      setTestResult(res)
    } catch (e: any) {
      setTestResult({ status: 'error', reason: e?.detail || 'შეცდომა' })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/stations')} className="rounded-lg p-2 hover:bg-bg-secondary">
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">სადგურის დამატება</h1>
          <p className="text-sm text-text-secondary">ნაბიჯი {step} / 4</p>
        </div>
      </div>

      {step === 1 && (
        <div className="card space-y-4 p-5">
          <h2 className="font-semibold text-text-primary">1. სადგურის ტიპი</h2>
          <div className="grid gap-2">
            {STATION_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setForm({ ...form, station_type: t.key })}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                  form.station_type === t.key
                    ? 'border-accent bg-accent/10'
                    : 'border-bg-tertiary hover:border-white/10'
                }`}
              >
                <Radio className={`h-4 w-4 ${form.station_type === t.key ? 'text-accent' : 'text-text-secondary'}`} />
                <div>
                  <span className="text-sm text-text-primary block">{t.label}</span>
                  <span className="text-xs text-text-secondary">{t.mode === 'pull' ? 'ჩვენ ვკითხულობთ სადგურს' : 'სადგური გვიგზავნის მონაცემებს'}</span>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            გაგრძელება
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-5 p-5">
          <h2 className="font-semibold text-text-primary">2. კავშირის პარამეტრები</h2>
          <p className="text-xs text-text-secondary">ტიპი: <strong className="text-text-primary">{selectedType?.label}</strong> ({selectedType?.mode === 'pull' ? 'ჩვენ ვკითხულობთ' : 'სადგური გვიგზავნის'})</p>

          {/* Basic info */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">სახელი *</label>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                placeholder="მაგ: ჩრდილოეთის სადგური"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-text-secondary">განედი *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.latitude}
                  onChange={(e) => updateField('latitude', parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-text-secondary">გრძედი *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.longitude}
                  onChange={(e) => updateField('longitude', parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-text-secondary">ინტერვალი (წთ)</label>
              <input
                type="number"
                value={form.pull_interval_min}
                onChange={(e) => updateField('pull_interval_min', parseInt(e.target.value))}
                className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* API credentials */}
          <div className="space-y-3 rounded-lg bg-bg-secondary/50 p-4 border border-bg-tertiary">
            <h3 className="text-sm font-medium text-text-primary">API კავშირის პარამეტრები</h3>

            <div>
              <label className="mb-1 block text-sm text-text-secondary">API Key / Device ID</label>
              <input
                value={form.provider_key}
                onChange={(e) => updateField('provider_key', e.target.value)}
                className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                placeholder="მაგ: ABC12345"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-text-secondary">API Secret / Password</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={form.provider_secret}
                  onChange={(e) => updateField('provider_secret', e.target.value)}
                  className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 pr-10 text-sm text-text-primary outline-none focus:border-accent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-text-secondary">Pull URL (საიდან ვკითხულობთ)</label>
              <input
                value={form.pull_url}
                onChange={(e) => updateField('pull_url', e.target.value)}
                className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                placeholder="მაგ: https://api.ecowitt.net/api/v3/device/real_time?..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-text-secondary">Provider Endpoint (ოფციონალური)</label>
              <input
                value={form.provider_endpoint}
                onChange={(e) => updateField('provider_endpoint', e.target.value)}
                className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                placeholder="მაგ: https://custom-api.example.com/..."
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="rounded-lg bg-bg-secondary px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary">
              უკან
            </button>
            <button
              onClick={createStation}
              disabled={!form.name || loading}
              className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
            >
              {loading ? 'იქმნება...' : 'შექმნა'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && stationId && (
        <div className="card space-y-4 p-5">
          <h2 className="font-semibold text-text-primary">3. კავშირის ტესტი</h2>
          <p className="text-sm text-text-secondary">
            სადგური შექმნილია. ახლა შეგიძლია შეამოწმო კავშირი.
          </p>
          {testResult && (
            <div className={`rounded-lg p-3 text-sm ${testResult.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {testResult.status === 'ok' ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  კავშირი OK — მიღებულია {testResult.readings_count} გაზომვა
                </div>
              ) : (
                <div>შეცდომა: {testResult.reason}</div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={testConnection} disabled={loading} className="rounded-lg bg-bg-secondary px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary disabled:opacity-50">
              {loading ? 'იტვირთება...' : 'კავშირის ტესტი'}
            </button>
            <button onClick={() => setStep(4)} className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent/90">
              გაგრძელება
            </button>
          </div>
        </div>
      )}

      {step === 4 && stationId && (
        <div className="card space-y-4 p-5">
          <h2 className="font-semibold text-text-primary">4. მზადაა!</h2>
          <p className="text-sm text-text-secondary">
            სადგური აქტიურია. შეგიძლია დაიწყო მონაცემების გაგზავნა ან მართო პარამეტრები.
          </p>
          <div className="flex gap-2">
            <button onClick={() => navigate('/stations')} className="rounded-lg bg-bg-secondary px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary">
              სიაში დაბრუნება
            </button>
            <button onClick={() => navigate(`/stations/${stationId}`)} className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent/90">
              სადგურის ნახვა
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
