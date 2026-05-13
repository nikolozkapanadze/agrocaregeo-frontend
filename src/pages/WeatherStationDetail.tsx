import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Trash2, Save, Eye, EyeOff, Pencil } from 'lucide-react'
import { weatherStations } from '@/shared/lib/api'

interface StationDetail {
  station: {
    id: string
    name: string
    station_type: string
    latitude: number
    longitude: number
    is_active: boolean
    last_seen_at: string | null
    pull_interval_min: number
    push_token: string
    provider_key: string | null
    provider_secret: boolean
    provider_endpoint: string | null
    pull_url: string | null
  }
  latest: {
    observed_at: string | null
    temp_c: number | null
    humidity_pct: number | null
    pressure_hpa: number | null
    precip_mm: number | null
    wind_speed_ms: number | null
    wind_gust_ms: number | null
    wind_dir_deg: number | null
    solar_rad_wm2: number | null
    soil_temp_5cm_c: number | null
    soil_moisture_5cm: number | null
    leaf_wetness: number | null
    vpd_kpa: number | null
  }
  today_summary: {
    summary_date: string | null
    temp_min_c: number | null
    temp_max_c: number | null
    temp_avg_c: number | null
    precip_total_mm: number | null
    wind_avg_ms: number | null
    humidity_avg_pct: number | null
    eto_mm: number | null
    heat_stress_hours: number | null
    frost_risk: boolean | null
    high_humidity_hours: number | null
    leaf_wetness_hours: number | null
    coverage_pct: number | null
  }
}

export default function WeatherStationDetail(): React.ReactElement {
  const { stationId } = useParams<{ stationId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<StationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, any>>({})

  const fetchDetail = () => {
    if (!stationId) return
    setLoading(true)
    weatherStations.summary(stationId)
      .then((res: any) => {
        setData(res)
        setEditForm({
          name: res.station.name,
          latitude: res.station.latitude,
          longitude: res.station.longitude,
          pull_interval_min: res.station.pull_interval_min,
          provider_key: res.station.provider_key || '',
          provider_endpoint: res.station.provider_endpoint || '',
          pull_url: res.station.pull_url || '',
          provider_secret: '',
        })
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDetail()
    const interval = setInterval(fetchDetail, 60000)
    return () => clearInterval(interval)
  }, [stationId])

  const handleSync = async () => {
    if (!stationId) return
    setSyncing(true)
    try {
      await weatherStations.syncNow(stationId)
      fetchDetail()
    } finally {
      setSyncing(false)
    }
  }

  const handleSave = async () => {
    if (!stationId) return
    setSaving(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(editForm).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      )
      if (!payload.provider_secret) delete payload.provider_secret
      await weatherStations.update(stationId, payload)
      setEditing(false)
      fetchDetail()
    } catch (e: any) {
      alert(e?.detail || 'შეცდომა შენახვისას')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!stationId || !confirm('დარწმუნებული ხარ რომ გინდა სადგურის გამორთვა?')) return
    await weatherStations.delete(stationId)
    navigate('/stations')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-text-secondary">სადგური ვერ მოიძებნა</p>
        <button onClick={() => navigate('/stations')} className="mt-4 text-accent hover:underline">
          სიაში დაბრუნება
        </button>
      </div>
    )
  }

  const s = data.station
  const l = data.latest
  const t = data.today_summary
  const isPull = s.pull_url || s.station_type === 'ecowitt' || s.station_type === 'davis_weatherlink'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/stations')} className="rounded-lg p-2 hover:bg-bg-secondary">
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{s.name}</h1>
            <p className="text-sm text-text-secondary">{s.station_type} · {s.is_active ? 'აქტიური' : 'გამორთული'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            სინქრონიზაცია
          </button>
          <button
            onClick={handleDeactivate}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            გამორთვა
          </button>
        </div>
      </div>

      {/* Live panel */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">ახალი მონაცემები</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <Metric label="ტემპერატურა" value={l.temp_c} unit="°C" />
          <Metric label="ტენიანობა" value={l.humidity_pct} unit="%" />
          <Metric label="წნევა" value={l.pressure_hpa} unit="hPa" />
          <Metric label="წვიმა" value={l.precip_mm} unit="mm" />
          <Metric label="ქარი" value={l.wind_speed_ms} unit="m/s" />
          <Metric label="ქარი (ძლიერი)" value={l.wind_gust_ms} unit="m/s" />
          <Metric label="მზის რად." value={l.solar_rad_wm2} unit="W/m²" />
          <Metric label="VPD" value={l.vpd_kpa} unit="kPa" />
          <Metric label="ნიადაგის ტემპ." value={l.soil_temp_5cm_c} unit="°C" />
          <Metric label="ნიადაგის ტენ." value={l.soil_moisture_5cm} unit="m³/m³" />
          <Metric label="ფოთლის ტენ." value={l.leaf_wetness} unit="" />
        </div>
        {l.observed_at && (
          <p className="mt-3 text-xs text-text-secondary">ბოლო გაზომვა: {new Date(l.observed_at).toLocaleString('ka-GE')}</p>
        )}
      </div>

      {/* Daily summary */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">დღის შეჯამება ({t.summary_date || '—'})</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <Metric label="მინ. ტემპ." value={t.temp_min_c} unit="°C" />
          <Metric label="მაქს. ტემპ." value={t.temp_max_c} unit="°C" />
          <Metric label="საშ. ტემპ." value={t.temp_avg_c} unit="°C" />
          <Metric label="წვიმა სულ" value={t.precip_total_mm} unit="mm" />
          <Metric label="ქარი საშ." value={t.wind_avg_ms} unit="m/s" />
          <Metric label="ტენიანობა" value={t.humidity_avg_pct} unit="%" />
          <Metric label="ETO" value={t.eto_mm} unit="mm" />
          <Metric label="სითბური სტრესი" value={t.heat_stress_hours} unit="სთ" />
          <Metric label="მაღალი ტენიანობა" value={t.high_humidity_hours} unit="სთ" />
          <Metric label="ფოთლის ტენიანობა" value={t.leaf_wetness_hours} unit="სთ" />
          <Metric label="საფარი" value={t.coverage_pct} unit="%" />
          <div className="rounded-lg bg-bg-secondary p-3">
            <p className="text-xs text-text-secondary">ყინვის რისკი</p>
            <p className={`text-lg font-semibold ${t.frost_risk ? 'text-red-400' : 'text-emerald-400'}`}>
              {t.frost_risk ? 'კი' : 'არა'}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration panel */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">კონფიგურაცია</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg bg-bg-secondary px-3 py-1.5 text-xs text-text-primary hover:bg-bg-tertiary">
              <Pencil className="h-3 w-3" />
              რედაქტირება
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="rounded-lg bg-bg-secondary px-3 py-1.5 text-xs text-text-primary hover:bg-bg-tertiary">
                გაუქმება
              </button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50">
                <Save className="h-3 w-3" />
                {saving ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">სახელი</span>
              <span className="text-text-primary">{s.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">ტიპი</span>
              <span className="text-text-primary">{s.station_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">კოორდინატები</span>
              <span className="text-text-primary">{s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">ინტერვალი</span>
              <span className="text-text-primary">{s.pull_interval_min} წთ</span>
            </div>
            {isPull && (
              <>
                <div className="flex justify-between">
                  <span className="text-text-secondary">API Key</span>
                  <span className="text-text-primary">{s.provider_key || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Pull URL</span>
                  <span className="text-text-primary">{s.pull_url || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Endpoint</span>
                  <span className="text-text-primary">{s.provider_endpoint || '—'}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-text-secondary">Push URL</span>
              <code className="rounded bg-bg-secondary px-2 py-0.5 text-xs text-text-primary">
                /api/v1/stations/push/{s.push_token}
              </code>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">სახელი</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">განედი</label>
                <input
                  type="number" step="0.0001"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">გრძედი</label>
                <input
                  type="number" step="0.0001"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">ინტერვალი (წთ)</label>
              <input
                type="number"
                value={editForm.pull_interval_min}
                onChange={(e) => setEditForm({ ...editForm, pull_interval_min: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>
            {isPull && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">API Key / Device ID</label>
                  <input
                    value={editForm.provider_key}
                    onChange={(e) => setEditForm({ ...editForm, provider_key: e.target.value })}
                    className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">API Secret (დატოვე ცარიელი თუ არ იცვლება)</label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={editForm.provider_secret}
                      onChange={(e) => setEditForm({ ...editForm, provider_secret: e.target.value })}
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
                  <label className="mb-1 block text-xs text-text-secondary">Pull URL</label>
                  <input
                    value={editForm.pull_url}
                    onChange={(e) => setEditForm({ ...editForm, pull_url: e.target.value })}
                    className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">Provider Endpoint</label>
                  <input
                    value={editForm.provider_endpoint}
                    onChange={(e) => setEditForm({ ...editForm, provider_endpoint: e.target.value })}
                    className="w-full rounded-lg border border-bg-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  return (
    <div className="rounded-lg bg-bg-secondary p-3">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-lg font-semibold text-text-primary">
        {value != null ? `${value}${unit ? ' ' + unit : ''}` : '—'}
      </p>
    </div>
  )
}
