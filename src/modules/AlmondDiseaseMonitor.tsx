import React from 'react'
import { useApi } from '@/shared/hooks/useApi'
import { cropApi } from '@/shared/lib/api'
import {
  AlertTriangle, Sprout, Droplets,
  Satellite, BarChart3, Activity, Bug, Info,
} from 'lucide-react'

interface Props {
  parcelId: string
}

const DISEASE_INFO: Record<string, { name: string; ka: string; color: string; icon: React.ReactNode }> = {
  monilinia: { name: 'Monilinia', ka: 'ყვავილის სიდამპლე', color: '#ef4444', icon: <Sprout className="h-4 w-4" /> },
  shot_hole: { name: 'Shot Hole', ka: 'ჭრილოვანი ლაქები', color: '#f59e0b', icon: <Activity className="h-4 w-4" /> },
  taphrina: { name: 'Taphrina', ka: 'ფოთლის ხვეულობა', color: '#8b5cf6', icon: <LeafIcon /> },
  xanthomonas: { name: 'Xanthomonas', ka: 'ბაქტერიული ლაქები', color: '#06b6d4', icon: <Droplets className="h-4 w-4" /> },
  phytophthora: { name: 'Phytophthora', ka: 'ფესვის სიდამპლე', color: '#92400e', icon: <Droplets className="h-4 w-4" /> },
  navel_orangeworm: { name: 'Navel OW', ka: 'ნაველის ჭია', color: '#d97706', icon: <Bug className="h-4 w-4" /> },
  brown_mite: { name: 'Brown Mite', ka: 'ყავისფერი ტკიპა', color: '#6b7280', icon: <Bug className="h-4 w-4" /> },
}

function LeafIcon(): React.ReactElement {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.6C10.8 4.5 12.5 2.8 14.5 2" />
      <path d="M15 8a5 5 0 0 1 0 10" />
      <path d="M11 20H4" />
    </svg>
  )
}

export default function AlmondDiseaseMonitor({ parcelId }: Props): React.ReactElement {
  const { data: report, loading } = useApi<any>(
    () => parcelId ? cropApi.almondDiseasePressure(parcelId) : Promise.resolve(null),
    [parcelId]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
      </div>
    )
  }

  if (!report || report.message?.includes('error')) {
    return (
      <div className="card p-8 text-center">
        <Info className="h-8 w-8 text-text-muted mx-auto mb-2" />
        <p className="text-text-muted">დაავადების მონიტორინგი დროებით მიუწვდომელია</p>
        <p className="text-text-muted text-xs mt-1">{report?.message || 'მონაცემები არ არის'}</p>
      </div>
    )
  }

  const diseases = report.diseases || []
  const spectral = report.spectral_analysis || {}
  const soil = report.soil_data || {}
  const overallRisk = report.overall_risk || 0
  const overallScore = report.overall_risk_score || 0

  const riskColors = ['bg-emerald-500/20 text-emerald-400', 'bg-yellow-500/20 text-yellow-400', 'bg-orange-500/20 text-orange-400', 'bg-red-500/20 text-red-400', 'bg-purple-500/20 text-purple-400']
  const riskLabels = ['არა', 'დაბალი', 'საშუალო', 'მაღალი', 'კრიტიკული']

  return (
    <div className="space-y-4">
      {/* Overall Risk Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">ჯამური რისკი</h3>
            <p className="text-xs text-text-muted mt-0.5">
              ყველაზე მაღალი: <span className="text-text-primary">{DISEASE_INFO[report.highest_disease]?.ka || report.highest_disease}</span>
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-bold ${riskColors[overallRisk] || riskColors[0]}`}>
            {riskLabels[overallRisk] || 'არა'} ({overallScore.toFixed(0)})
          </div>
        </div>
        {report.spray_recommended && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400">სპრეი რეკომენდებულია — დაუყოვნებლივ მოქმედება საჭიროა</span>
          </div>
        )}
      </div>

      {/* Disease Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {diseases.map((d: any) => {
          const info = DISEASE_INFO[d.disease_key] || { name: d.disease_key, ka: d.disease_key, color: '#6b7280', icon: <Bug className="h-4 w-4" /> }
          return (
            <DiseaseCard key={d.disease_key} disease={d} info={info} />
          )
        })}
      </div>

      {/* Spectral Analysis */}
      {spectral.status === 'ok' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Satellite className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">სპექტრალური ინდექსები (სატელიტი/დრონი)</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'NDVI', value: spectral.indices?.ndvi, desc: 'მცენარის ჯანმრთელობა', good: (v: number) => v >= 0.5 },
              { label: 'NDRE', value: spectral.indices?.ndre, desc: 'ქლოროფილის სტრესი', good: (v: number) => v >= 0.3 },
              { label: 'NDWI', value: spectral.indices?.ndwi, desc: 'წყლის სტრესი', good: (v: number) => v >= 0.0 },
              { label: 'SAVI', value: spectral.indices?.savi, desc: 'გაუსწორებული NDVI', good: (v: number) => v >= 0.4 },
            ].map((idx) => (
              <div key={idx.label} className={`p-3 rounded-lg text-center ${idx.value != null && idx.good(idx.value) ? 'bg-emerald-500/10' : 'bg-white/[0.02]'}`}>
                <p className="text-xs text-text-muted">{idx.label}</p>
                <p className={`text-lg font-bold font-mono ${idx.value != null && idx.good(idx.value) ? 'text-emerald-400' : 'text-text-primary'}`}>
                  {idx.value != null ? idx.value.toFixed(3) : '—'}
                </p>
                <p className="text-[10px] text-text-muted">{idx.desc}</p>
              </div>
            ))}
          </div>

          {/* Anomaly */}
          {spectral.indices?.ndvi_anomaly != null && (
            <div className={`p-3 rounded-lg mb-3 ${spectral.indices.ndvi_anomaly < -0.15 ? 'bg-red-500/10 border border-red-500/20' : spectral.indices.ndvi_anomaly < -0.08 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-emerald-500/10'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">NDVI ანომალია</span>
                <span className={`font-mono font-bold ${spectral.indices.ndvi_anomaly < -0.15 ? 'text-red-400' : spectral.indices.ndvi_anomaly < -0.08 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {spectral.indices.ndvi_anomaly > 0 ? '+' : ''}{spectral.indices.ndvi_anomaly.toFixed(3)}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {spectral.indices.ndvi_anomaly < -0.15 ? 'კრიტიკული სტრესი — სასწრაფო რეაგირება საჭიროა'
                  : spectral.indices.ndvi_anomaly < -0.08 ? 'ადრეული სტრესის სიგნალი — მონიტორინგი გააქტიურდეს'
                  : 'ნორმის ფარგლებში'}
              </p>
            </div>
          )}

          {/* Alerts */}
          {spectral.alerts && spectral.alerts.length > 0 && (
            <div className="space-y-2">
              {spectral.alerts.map((alert: any, i: number) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-red-500/10 text-red-400'
                    : alert.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-white/5 text-text-secondary'
                }`}>
                  {alert.severity === 'critical' ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    : alert.severity === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    : <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
                  <span className="text-xs">{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Soil Risk Factors */}
      {Object.keys(soil).length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">ნიადაგის ფაქტორები</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'pH', value: soil.ph, unit: '', good: (v: number) => v >= 6.0 && v <= 7.5 },
              { label: 'EC', value: soil.ec_ds_m, unit: ' dS/m', good: (v: number) => v <= 4.0 },
              { label: 'თიხა', value: soil.clay_pct, unit: '%', good: (v: number) => v < 40 },
              { label: 'ტენიანობა', value: soil.moisture_pct, unit: '%', good: (v: number) => v >= 40 && v <= 70 },
            ].map((s) => (
              <div key={s.label} className={`p-3 rounded-lg text-center ${s.value != null && s.good(s.value) ? 'bg-emerald-500/10' : s.value != null ? 'bg-yellow-500/10' : 'bg-white/[0.02]'}`}>
                <p className="text-xs text-text-muted">{s.label}</p>
                <p className={`text-lg font-bold font-mono ${s.value != null && s.good(s.value) ? 'text-emerald-400' : s.value != null ? 'text-yellow-400' : 'text-text-primary'}`}>
                  {s.value != null ? `${s.value.toFixed(1)}${s.unit}` : '—'}
                </p>
              </div>
            ))}
          </div>
          {soil.ph != null && (soil.ph < 6.0 || soil.ph > 7.5) && (
            <p className="text-xs text-text-muted mt-3">
              <AlertTriangle className="h-3 w-3 inline mr-1 text-yellow-400" />
              pH {soil.ph.toFixed(1)} {soil.ph < 6.0 ? '— დაბალი pH ზრდის Phytophthora-ს რისკს' : '— მაღალი pH იწვევს მიკროელემენტების დეფიციტს'}
            </p>
          )}
          {soil.ec_ds_m != null && soil.ec_ds_m > 4.0 && (
            <p className="text-xs text-text-muted mt-1">
              <AlertTriangle className="h-3 w-3 inline mr-1 text-red-400" />
              EC {soil.ec_ds_m.toFixed(1)} dS/m — მლაშობის სტრესი, მეორადი ინფექციების რისკი
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function DiseaseCard({ disease, info }: { disease: any; info: any }): React.ReactElement {
  const riskColors = ['bg-emerald-500/20 text-emerald-400', 'bg-yellow-500/20 text-yellow-400', 'bg-orange-500/20 text-orange-400', 'bg-red-500/20 text-red-400', 'bg-purple-500/20 text-purple-400']
  const riskLabels = ['არა', 'დაბალი', 'საშუალო', 'მაღალი', 'კრიტიკული']
  const level = disease.risk || 0

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: `${info.color}20`, color: info.color }}>
            {info.icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">{info.ka}</h4>
            <p className="text-[10px] text-text-muted">{info.name}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColors[level] || riskColors[0]}`}>
          {riskLabels[level]} ({disease.risk_score?.toFixed(0) || 0})
        </span>
      </div>

      {/* Triggers */}
      {disease.trigger_factors && disease.trigger_factors.length > 0 && disease.trigger_factors[0] !== 'Conditions below threshold' && (
        <div className="space-y-1 mb-3">
          {disease.trigger_factors.slice(0, 3).map((t: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-text-secondary">{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scientific details */}
      {disease.details && Object.keys(disease.details).length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {Object.entries(disease.details).slice(0, 3).map(([k, v]) => (
            <div key={k} className="bg-white/[0.02] rounded-lg p-1.5 text-center">
              <p className="text-[9px] text-text-muted uppercase">{k.replace(/_/g, ' ')}</p>
              <p className="text-xs font-mono text-text-primary">{typeof v === 'number' ? v.toFixed(1) : String(v)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      <p className="text-xs text-accent mb-2">{disease.recommendation}</p>

      {/* Treatments */}
      {disease.treatment_options && disease.treatment_options.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {disease.treatment_options.map((t: string, i: number) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-text-muted border border-white/5">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
