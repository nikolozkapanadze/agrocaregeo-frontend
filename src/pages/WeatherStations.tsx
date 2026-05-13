import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cloud, Plus, Radio, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { weatherStations } from '@/shared/lib/api'

interface Station {
  id: string
  name: string
  station_type: string
  latitude: number
  longitude: number
  is_active: boolean
  last_seen_at: string | null
  latest_reading?: {
    observed_at: string | null
    temp_c: number | null
    humidity_pct: number | null
  }
  parcel_count: number
}

export default function WeatherStations(): React.ReactElement {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    weatherStations.list()
      .then((res: any) => setStations(res || []))
      .catch(() => setStations([]))
      .finally(() => setLoading(false))
  }, [])

  function statusBadge(station: Station) {
    if (!station.is_active) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400"><AlertTriangle className="h-3 w-3" /> გამორთული</span>
    }
    const last = station.last_seen_at ? new Date(station.last_seen_at) : null
    const now = new Date()
    const minsSince = last ? (now.getTime() - last.getTime()) / 60000 : Infinity
    const interval = 30 // default expectation
    if (minsSince < interval * 2) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" /> ონლაინ</span>
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400"><AlertTriangle className="h-3 w-3" /> არა აქტიური</span>
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">ამინდის სადგურები</h1>
          <p className="text-sm text-text-secondary">ლოკალური მიკრო-ამინდის სადგურების მართვა</p>
        </div>
        <Link
          to="/stations/add"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          დამატება
        </Link>
      </div>

      {stations.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-16">
          <Radio className="h-12 w-12 text-text-tertiary" />
          <p className="text-text-secondary">სადგურები არ არის დამატებული</p>
          <Link to="/stations/add" className="text-accent hover:underline text-sm">ახალი სადგურის დამატება</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stations.map((s) => (
            <Link
              key={s.id}
              to={`/stations/${s.id}`}
              className="card group flex flex-col gap-4 p-5 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">{s.name}</h3>
                    <p className="text-xs text-text-secondary">{s.station_type}</p>
                  </div>
                </div>
                {statusBadge(s)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-bg-secondary p-3">
                  <p className="text-xs text-text-secondary">ტემპერატურა</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {s.latest_reading?.temp_c != null ? `${s.latest_reading.temp_c}°C` : '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-bg-secondary p-3">
                  <p className="text-xs text-text-secondary">ტენიანობა</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {s.latest_reading?.humidity_pct != null ? `${s.latest_reading.humidity_pct}%` : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>{s.parcel_count} ნაკვეთი</span>
                <span>Lat {s.latitude.toFixed(4)}, Lon {s.longitude.toFixed(4)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
