import React, { useEffect, useState } from 'react'
import { X, Mountain, TrendingUp, Sun, Waves } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { request } from '@/shared/lib/api'

interface Props {
  parcelId: string
  parcelNr: string | null
  onClose: () => void
}

interface TerrainDetail {
  parcel_id: string
  analysis_date: string
  elevation: { min_m: number; max_m: number; mean_m: number; median_m: number; std_m: number }
  slope: { mean_deg: number; max_deg: number; mean_pct: number; class: string }
  aspect: { mean_deg: number; cardinal: string; description: string }
  solar_radiation: { w_m2: number; mj_m2_day: number; class: string }
  seasonal_solar: Record<string, { w_m2: number; mj_m2_day: number }>
  distributions: {
    slope: Record<string, number>
    aspect: Record<string, number>
    elevation_histogram: { bins: number[]; counts: number[] }
  }
  terrain_roughness: number
  total_cells: number
}

const SLOPE_COLORS: Record<string, string> = {
  flat: '#4fc3f7', gentle: '#8bc34a', moderate: '#fbc02d', steep: '#f57c00', very_steep: '#d32f2f',
}

const ASPECT_COLORS: Record<string, string> = {
  N: '#64b5f6', NE: '#81c784', E: '#aed581', SE: '#fff176',
  S: '#ffb74d', SW: '#ff8a65', W: '#ba68c8', NW: '#90caf9', flat: '#bdbdbd',
}

const ASPECT_LABELS_KA: Record<string, string> = {
  N: 'ჩ', NE: 'ჩაღ', E: 'აღ', SE: 'საღ', S: 'ს', SW: 'სდ', W: 'დ', NW: 'ჩდ', flat: 'რკ',
}

export default function TerrainDetailModal({ parcelId, parcelNr, onClose }: Props): React.ReactElement {
  const [data, setData] = useState<TerrainDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    request<TerrainDetail>(`/terrain/${parcelId}/detail`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [parcelId])

  if (loading) {
    return (
      <div className="absolute inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="rounded-2xl border border-white/10 bg-bg-card shadow-2xl p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent mx-auto" />
          <p className="text-text-secondary text-sm mt-3">რელიეფის მონაცემები იტვირთება...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    const isNotFound = !error || error.includes('404') || error.includes('not found') || error.includes('არ მოიძებნა')
    return (
      <div className="absolute inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-96 rounded-2xl border border-white/10 bg-bg-card shadow-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">რელიეფის დეტალები</h3>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
          </div>
          {isNotFound ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-yellow-400">
                <Mountain className="h-5 w-5" />
                <p className="text-sm font-medium">რელიეფის ანალიზი მიმდინარეობს...</p>
              </div>
              <p className="text-xs text-text-secondary">
                ნაკვეთის რელიეფის მონაცემები ჯერ არ არის მზად. ანალიზი ავტომატურად ეშვება ნაკვეთის დამატების შემდეგ და რამდენიმე წუთში დასრულდება. გთხოვთ, სცადოთ მოგვიანებით.
              </p>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent animate-pulse rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      </div>
    )
  }

  const elev = data.elevation
  const slope = data.slope
  const aspect = data.aspect
  const solar = data.solar_radiation

  // Prepare chart data
  const slopeChartData = Object.entries(data.distributions.slope || {})
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => ({
      name: k,
      label: k === 'flat' ? 'თარაზული' : k === 'gentle' ? 'ნაზი' : k === 'moderate' ? 'საშუალო' : k === 'steep' ? 'კლდოვანი' : 'ვკლდოვანი',
      value: Math.round(v),
      color: SLOPE_COLORS[k] || '#58a6ff',
    }))

  const aspectChartData = Object.entries(data.distributions.aspect || {})
    .filter(([k, v]) => k !== 'flat' && v > 0)
    .map(([k, v]) => ({
      name: ASPECT_LABELS_KA[k] || k,
      value: Math.round(v),
      color: ASPECT_COLORS[k] || '#58a6ff',
    }))

  const elevHist = data.distributions.elevation_histogram
  const elevChartData = elevHist?.counts?.map((c: number, i: number) => ({
    name: `${Math.round(elevHist.bins[i])}-${Math.round(elevHist.bins[i + 1])}м`,
    value: c,
  })) || []

  const seasonalData = Object.entries(data.seasonal_solar || {}).map(([season, vals]) => ({
    season: season === 'spring' ? 'გაზაფხული' : season === 'summer' ? 'ზაფხული' : season === 'autumn' ? 'შემოდგომა' : 'ზამთარი',
    mj: vals.mj_m2_day,
  }))

  return (
    <div className="absolute inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-bg-card z-10 flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-accent" />
            <div>
              <h3 className="text-base font-semibold text-text-primary">რელიეფის დეტალები</h3>
              <p className="text-xs text-text-muted">ნაკვეთი: {parcelNr || parcelId.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Key stats grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <TrendingUp className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-text-primary">{elev.mean_m.toFixed(0)}<span className="text-xs text-text-muted">м</span></p>
              <p className="text-[10px] text-text-muted">სიმაღლე</p>
              <p className="text-[10px] text-text-secondary">{elev.min_m.toFixed(0)}–{elev.max_m.toFixed(0)}м</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <TrendingUp className="h-4 w-4 text-sensor mx-auto mb-1" />
              <p className="text-lg font-bold text-text-primary">{slope.mean_deg.toFixed(1)}<span className="text-xs text-text-muted">°</span></p>
              <p className="text-[10px] text-text-muted">დაქანება</p>
              <p className="text-[10px] text-text-secondary">მაქს {slope.max_deg.toFixed(1)}°</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Sun className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-text-primary">{solar.mj_m2_day.toFixed(1)}</p>
              <p className="text-[10px] text-text-muted">MJ/მ²/დღ</p>
              <p className="text-[10px] text-text-secondary">{solar.class}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Waves className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-text-primary">{data.terrain_roughness.toFixed(2)}</p>
              <p className="text-[10px] text-text-muted">რუხობა</p>
              <p className="text-[10px] text-text-secondary">{data.total_cells} უჯრა</p>
            </div>
          </div>

          {/* Elevation histogram */}
          {elevChartData.length > 0 && (
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Mountain className="h-4 w-4 text-accent" />
                სიმაღლის განაწილება
              </h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={elevChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#8b949e' }}
                    />
                    <Bar dataKey="value" fill="#58a6ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Slope distribution */}
          {slopeChartData.length > 0 && (
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sensor" />
                დაქანების განაწილება
              </h4>
              <div className="flex items-center gap-6">
                <div className="h-40 w-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={slopeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {slopeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {slopeChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
                      <span className="text-xs text-text-secondary flex-1">{item.label}</span>
                      <span className="text-xs font-mono text-text-primary">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Aspect distribution */}
          {aspectChartData.length > 0 && (
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-400" />
                ექსპოზიციის განაწილება
              </h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aspectChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {aspectChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Seasonal solar */}
          {seasonalData.length > 0 && (
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-400" />
                სეზონური სხივმოსილი (MJ/მ²/დღ)
              </h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="season" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="mj" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                გათვალისწინებულია ფერდობის კუთხე და ექსპოზიცია. სამხრეთისკენ მიმართული ფერდები იღებენ მეტ სხივმოსილს.
              </p>
            </div>
          )}

          {/* Aspect description */}
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-text-primary mb-2">ექსპოზიციის აღწერა</h4>
            <p className="text-xs text-text-secondary">{aspect.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
