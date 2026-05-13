/** Blueberry Dashboard — Live data from blueberry intelligence system */
import { useState, useEffect } from 'react'
import {
  Leaf, Bug, Calendar, TrendingUp, AlertTriangle, Beaker,
  Thermometer, Snowflake, Sun, Wind, ChevronDown, Loader2,
  Droplets, Satellite, BarChart3, Zap
} from 'lucide-react'
import { useCropData, useBlueberryData } from '@/shared/hooks/useCropData'
import { blueberryService } from '@/shared/api/services'

export default function BlueberryDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'phenology' | 'disease' | 'satellite' | 'fertilizer' | 'irrigation' | 'yield' | 'alerts' | 'spray'>('overview')
  const [selectedParcelId, setSelectedParcelId] = useState<string>('')
  const accentColor = '#3B82F6'

  const { parcels, loading: parcelsLoading } = useCropData('blueberry')
  const {
    phenology, diseasePressure, satellite, fertilizer,
    irrigation, yieldForecast, alerts, sprayLog,
    loading: dataLoading,
  } = useBlueberryData(selectedParcelId)

  useEffect(() => {
    if (parcels.length > 0 && !selectedParcelId) {
      setSelectedParcelId(parcels[0].id)
    }
  }, [parcels, selectedParcelId])

  const isLoading = parcelsLoading || (selectedParcelId && dataLoading)

  // Alert counts for badge
  const criticalCount = alerts?.counts?.critical || 0
  const highCount = alerts?.counts?.high || 0

  const tabs = [
    { key: 'overview', label: 'მიმოხილვა', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'phenology', label: 'ფენოლოგია', icon: <Calendar className="h-4 w-4" /> },
    { key: 'disease', label: 'დაავადებები', icon: <Bug className="h-4 w-4" /> },
    { key: 'satellite', label: 'სატელიტი', icon: <Satellite className="h-4 w-4" /> },
    { key: 'fertilizer', label: 'სასუქი', icon: <Beaker className="h-4 w-4" /> },
    { key: 'irrigation', label: 'მორწყვა', icon: <Droplets className="h-4 w-4" /> },
    { key: 'yield', label: 'მოსავალი', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'alerts', label: 'გაფრთხილებები', icon: <AlertTriangle className="h-4 w-4" />, badge: criticalCount + highCount },
    { key: 'spray', label: 'სპრეი', icon: <Zap className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Leaf className="h-7 w-7" style={{ color: accentColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">მოცვი</h1>
            <p className="text-text-muted">
              Blueberry Intelligence • {parcels.length} ნაკვეთი
            </p>
          </div>
        </div>

        {/* Parcel selector */}
        <div className="relative">
          <select
            value={selectedParcelId}
            onChange={(e) => setSelectedParcelId(e.target.value)}
            className="appearance-none bg-bg-card border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-text-primary focus:outline-none focus:border-accent min-w-[200px]"
          >
            <option value="">აირჩიეთ ნაკვეთი</option>
            {parcels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.parcel_nr || p.id.slice(0, 8)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Alert banner */}
      {alerts && alerts.counts && (alerts.counts.critical > 0 || alerts.counts.high > 0) && (
        <div className={`p-4 rounded-xl border ${alerts.counts.critical > 0 ? 'bg-danger/10 border-danger/30' : 'bg-warning/10 border-warning/30'}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${alerts.counts.critical > 0 ? 'text-danger' : 'text-warning'}`} />
            <div>
              <p className={`text-sm font-medium ${alerts.counts.critical > 0 ? 'text-danger' : 'text-warning'}`}>
                {alerts.counts.critical > 0
                  ? `${alerts.counts.critical} კრიტიკული გაფრთხილება`
                  : `${alerts.counts.high} მაღალი პრიორიტეტის გაფრთხილება`}
              </p>
              {alerts.next_actions && alerts.next_actions.length > 0 && (
                <p className="text-xs text-text-muted mt-0.5">{alerts.next_actions[0]}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.key
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-white/5'
              }
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${tab.badge > 2 ? 'bg-danger text-white' : 'bg-warning text-black'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
          <span className="ml-3 text-text-muted">მონაცემების ჩატვირთვა...</span>
        </div>
      )}

      {/* Content */}
      {!isLoading && selectedParcelId && (
        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <OverviewTab
              phenology={phenology}
              diseasePressure={diseasePressure}
              satellite={satellite}
              irrigation={irrigation}
              yieldForecast={yieldForecast}
              alerts={alerts}
              accentColor={accentColor}
            />
          )}
          {activeTab === 'phenology' && <PhenologyTab phenology={phenology} />}
          {activeTab === 'disease' && <DiseaseTab diseasePressure={diseasePressure} />}
          {activeTab === 'satellite' && <SatelliteTab satellite={satellite} />}
          {activeTab === 'fertilizer' && <FertilizerTab fertilizer={fertilizer} />}
          {activeTab === 'irrigation' && <IrrigationTab irrigation={irrigation} />}
          {activeTab === 'yield' && <YieldTab yieldForecast={yieldForecast} />}
          {activeTab === 'alerts' && <AlertsTab alerts={alerts} />}
          {activeTab === 'spray' && <SprayTab sprayLog={sprayLog} parcelId={selectedParcelId} />}
        </div>
      )}

      {!selectedParcelId && !parcelsLoading && (
        <div className="text-center py-12 text-text-muted">
          <Leaf className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>აირჩიეთ მოცვის ნაკვეთი მონაცემების საჩვენებლად</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

function OverviewTab({ phenology, diseasePressure, satellite, irrigation, yieldForecast, accentColor }: any) {
  const stage = phenology?.current_stage
  const tempAlerts = phenology?.temp_alerts || []
  const maxDiseaseRisk = Math.max(
    diseasePressure?.mummy_berry?.risk ?? 0,
    diseasePressure?.botrytis?.risk ?? 0,
    diseasePressure?.phytophthora?.risk ?? 0,
    diseasePressure?.anthracnose?.risk ?? 0,
  )
  const riskLabels = ['არა', 'დაბალი', 'საშუალო', 'მაღალი', 'კრიტიკული']
  const riskColors = ['#6b7280', '#10b981', '#f59e0b', '#ef4444', '#dc2626']
  const latestNdvi = satellite?.latest?.ndvi
  const ndviStatus = satellite?.interpretation?.ndvi?.label || '—'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="მიმდინარე ფაზა" value={stage?.growth_stage || '—'}
          subtitle={`BBCH ${stage?.bbch_code || '—'} • GDD ${stage?.cum_gdd ?? '—'}`}
          icon={<Calendar className="h-5 w-5" />} color={accentColor} />
        <StatCard title="დაავადებების რისკი" value={maxDiseaseRisk > 0 ? riskLabels[maxDiseaseRisk - 1] : 'დაბალი'}
          subtitle="მაქსიმალური რისკი" icon={<AlertTriangle className="h-5 w-5" />}
          color={maxDiseaseRisk > 0 ? riskColors[maxDiseaseRisk - 1] : '#10b981'} alert={maxDiseaseRisk >= 3} />
        <StatCard title="NDVI" value={latestNdvi != null ? latestNdvi.toFixed(2) : '—'}
          subtitle={ndviStatus} icon={<Satellite className="h-5 w-5" />}
          color={latestNdvi != null && latestNdvi > 0.6 ? '#10b981' : latestNdvi != null && latestNdvi > 0.3 ? '#f59e0b' : '#ef4444'} />
        <StatCard title="მორწყვა" value={irrigation?.decision?.decision === 'NO_ACTION' ? 'არაა საჭირო' : `${irrigation?.decision?.amount_mm ?? '—'} mm`}
          subtitle={irrigation?.decision?.reason?.slice(0, 40) || '—'} icon={<Droplets className="h-5 w-5" />}
          color={irrigation?.decision?.decision === 'URGENT' ? '#ef4444' : irrigation?.decision?.decision === 'IRRIGATE' ? '#3b82f6' : '#10b981'} />
      </div>

      {yieldForecast?.forecast && (
        <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">მოსავლის პროგნოზი</p>
              <p className="text-2xl font-bold text-text-primary">{yieldForecast.forecast.final_yield_kg_ha.toFixed(0)} kg/ha</p>
              <p className="text-xs text-text-muted">სანდოობა: {yieldForecast.forecast.confidence}</p>
            </div>
            <div className="p-2 rounded-xl bg-accent/20 text-accent">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {tempAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
            <Thermometer className="h-4 w-4" />ამინდის გაფრთხილებები
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tempAlerts.map((alert: any, i: number) => (
              <div key={i} className={`p-3 rounded-xl border ${alert.type === 'CRITICAL_FROST' ? 'bg-danger/10 border-danger/30' : alert.type === 'FROST_RISK' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-warning/10 border-warning/30'}`}>
                <div className="flex items-start gap-2">
                  {alert.type.includes('FROST') ? <Snowflake className="h-4 w-4 mt-0.5 text-danger" /> : <Sun className="h-4 w-4 mt-0.5 text-warning" />}
                  <div>
                    <p className="text-sm text-text-primary">{alert.message}</p>
                    <p className="text-xs text-text-muted mt-0.5">{alert.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PHENOLOGY TAB
// ═══════════════════════════════════════════════════════════════

function PhenologyTab({ phenology }: { phenology: any }) {
  const stages = phenology?.stages || []
  const current = phenology?.current_stage
  const forecast = phenology?.forecast_next_stage
  const chill = phenology?.chilling_hours

  return (
    <div className="space-y-4">
      {current && (
        <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">მიმდინარე სტადია</h3>
            <span className="text-sm text-accent font-medium">BBCH {current.bbch_code}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-text-muted">სტადია</p>
              <p className="text-lg font-semibold text-text-primary">{current.growth_stage}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-text-muted">GDD დაგროვილი</p>
              <p className="text-lg font-semibold text-text-primary">{current.cum_gdd} °C·day</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-text-muted">პროგრესი</p>
              <p className="text-lg font-semibold text-text-primary">{current.progress_pct}%</p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                <div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${current.progress_pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {forecast && (
        <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Wind className="h-5 w-5 text-accent" />პროგნოზი
          </h3>
          <p className="text-sm text-text-primary">
            შემდეგი სტადია: <span className="font-medium text-accent">{forecast.next_stage}</span>
          </p>
          <p className="text-xs text-text-muted mt-1">
            სავარაუდო თარიღი: {forecast.estimated_date} • დაახლ. {forecast.days_forecast} დღე
          </p>
        </div>
      )}

      {chill && (
        <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-blue-400" />გაცივების საათები
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">პროგრესი</span>
                <span className="text-sm font-medium text-text-primary">{chill.chill_hours} / {chill.target_low}h</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${chill.satisfied ? 'bg-success' : 'bg-accent'}`} style={{ width: `${Math.min(100, chill.progress_pct)}%` }} />
              </div>
            </div>
            <div className={`text-sm font-medium ${chill.satisfied ? 'text-success' : 'text-warning'}`}>
              {chill.satisfied ? '✓ საკმარისი' : 'მიმდინარეობს'}
            </div>
          </div>
        </div>
      )}

      <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-6">BBCH ფენოლოგია</h3>
        <div className="space-y-3">
          {stages.map((stage: any) => (
            <div key={stage.code} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${stage.is_current ? 'bg-accent text-white ring-2 ring-accent/30' : stage.completed ? 'bg-success/20 text-success' : 'bg-white/5 text-text-muted'}`}>
                {stage.code}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${stage.is_current ? 'text-accent' : 'text-text-primary'}`}>{stage.name}</p>
                <p className="text-xs text-text-muted">GDD: {stage.gdd_threshold}</p>
              </div>
              {stage.is_current && <span className="text-xs text-accent font-medium shrink-0">მიმდინარე</span>}
              {stage.completed && !stage.is_current && <span className="text-xs text-success shrink-0">✓ გავლილი</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DISEASE TAB
// ═══════════════════════════════════════════════════════════════

function DiseaseTab({ diseasePressure }: { diseasePressure: any }) {
  if (!diseasePressure) return <EmptyState icon={<Bug className="h-12 w-12" />} message="დაავადების მონაცემები არ არის" />

  const currentStage = diseasePressure.current_stage

  return (
    <div className="space-y-4">
      {currentStage && (
        <div className="bg-bg-card rounded-xl border border-white/5 p-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-accent" />
          <div>
            <p className="text-sm text-text-primary">მიმდინარე ფაზა: <span className="font-medium">{currentStage.stage_name}</span></p>
            <p className="text-xs text-text-muted">BBCH {currentStage.bbch_code} • GDD {currentStage.cum_gdd}</p>
          </div>
        </div>
      )}

      {diseasePressure.spray_recommended && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <div>
            <p className="text-sm font-medium text-danger">სპრეი რეკომენდებულია</p>
            <p className="text-xs text-text-muted">ერთი ან მეტი დაავადების რისკი საშუალო ან მაღალია</p>
          </div>
        </div>
      )}

      {diseasePressure.critical_alert && (
        <div className="bg-danger/20 border border-danger/50 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <div>
            <p className="text-sm font-medium text-danger">კრიტიკული გაფრთხილება — ნაცარი</p>
            <p className="text-xs text-text-muted">ფუნგიციდის დამატება სასწრაფოდ, 24 საათის განმავლობაში</p>
          </div>
        </div>
      )}

      <DiseaseCard name="ნაცარი (Botrytis cinerea)"
        risk={diseasePressure.botrytis?.risk ?? 0} riskScore={diseasePressure.botrytis?.risk_score}
        details={diseasePressure.botrytis}
        recommendation={diseasePressure.botrytis?.recommendation || 'მონიტორინგი'} />
      <DiseaseCard name="მამილა (Monilinia vaccinii-corymbosi)"
        risk={diseasePressure.mummy_berry?.risk ?? 0} riskScore={diseasePressure.mummy_berry?.risk_score}
        details={diseasePressure.mummy_berry}
        recommendation={diseasePressure.mummy_berry?.recommendation || 'მონიტორინგი'} />
      <DiseaseCard name="ფიტოფთორა (Phytophthora cinnamomi)"
        risk={diseasePressure.phytophthora?.risk ?? 0} riskScore={diseasePressure.phytophthora?.risk_score}
        details={diseasePressure.phytophthora}
        recommendation={diseasePressure.phytophthora?.recommendation || 'მონიტორინგი'} />
      <DiseaseCard name="ანთრაკნოზი (Colletotrichum acutatum)"
        risk={diseasePressure.anthracnose?.risk ?? 0} riskScore={diseasePressure.anthracnose?.risk_score}
        details={diseasePressure.anthracnose}
        recommendation={diseasePressure.anthracnose?.recommendation || 'მონიტორინგი'} />
    </div>
  )
}

function DiseaseCard({ name, risk, riskScore, details, recommendation }: any) {
  const riskLabels = ['არა', 'დაბალი', 'საშუალო', 'მაღალი', 'კრიტიკული']
  const riskColors = ['text-text-muted', 'text-success', 'text-warning', 'text-orange-500', 'text-danger']
  const riskBg = ['bg-white/5', 'bg-success/10', 'bg-warning/10', 'bg-orange-500/10', 'bg-danger/10']

  const triggers = details?.trigger_factors || []
  const fungicides = details?.fungicide_options || []
  const phi = details?.phi_days

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text-primary">{name}</h4>
          <p className="text-sm text-text-muted mt-1">{recommendation}</p>

          {/* Trigger factors */}
          {triggers.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-text-muted mb-1">ტრიგერები:</p>
              <div className="flex flex-wrap gap-2">
                {triggers.map((t: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-text-secondary">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Fungicide options */}
          {fungicides.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-text-muted mb-1">ფუნგიციდები:</p>
              <div className="space-y-1">
                {fungicides.map((f: string, i: number) => (
                  <p key={i} className="text-xs text-accent">• {f}</p>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${riskColors[risk]} ${riskBg[risk]}`}>
            {riskLabels[risk]}
          </div>
          {riskScore != null && (
            <p className="text-xs text-text-muted mt-1">{riskScore}/100</p>
          )}
          {phi != null && (
            <p className="text-xs text-text-muted mt-0.5">PHI {phi}დ</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SATELLITE TAB
// ═══════════════════════════════════════════════════════════════

function SatelliteTab({ satellite }: { satellite: any }) {
  if (!satellite || !satellite.latest) return <EmptyState icon={<Satellite className="h-12 w-12" />} message="სატელიტის მონაცემები არ არის" />

  const latest = satellite.latest
  const interp = satellite.interpretation
  const baseline = satellite.baseline
  const anomaly = satellite.anomaly
  const trend = satellite.trend || []

  return (
    <div className="space-y-4">
      {anomaly?.alert && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <div>
            <p className="text-sm font-medium text-danger">NDVI ანომალია</p>
            <p className="text-xs text-text-muted">{anomaly.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IndexCard label="NDVI" value={latest.ndvi} interpretation={interp?.ndvi} />
        <IndexCard label="NDWI" value={latest.ndwi} interpretation={interp?.ndwi} />
        <IndexCard label="NDRE" value={latest.ndre} interpretation={interp?.ndre} />
      </div>

      {satellite.stress_zones_pct != null && satellite.stress_zones_pct > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <p className="text-sm font-medium text-warning">
            სტრესის ზონა: ~{satellite.stress_zones_pct}% ნაკვეთის
          </p>
          <p className="text-xs text-text-muted mt-1">NDVI-ს მიხედვით შეფასებული სტრესის ფართობი</p>
        </div>
      )}

      {satellite.alerts && satellite.alerts.length > 0 && (
        <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">სატელიტის გაფრთხილებები</h3>
          <div className="space-y-2">
            {satellite.alerts.map((alert: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-text-primary">{alert}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {baseline?.historical_avg?.avg_ndvi && (
        <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">ბაზისური შედარება (3 წლის საშუალო)</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-text-muted">NDVI</p>
              <p className={`text-lg font-semibold ${satellite.baseline?.deviation?.ndvi > 0.05 ? 'text-success' : satellite.baseline?.deviation?.ndvi < -0.05 ? 'text-danger' : 'text-text-primary'}`}>
                {baseline.historical_avg.avg_ndvi}
              </p>
              <p className="text-xs text-text-muted">{satellite.baseline?.deviation?.ndvi > 0 ? '+' : ''}{satellite.baseline?.deviation?.ndvi ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">NDRE</p>
              <p className="text-lg font-semibold text-text-primary">{baseline.historical_avg.avg_ndre}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">NDWI</p>
              <p className="text-lg font-semibold text-text-primary">{baseline.historical_avg.avg_ndwi}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">ტრენდი (ბოლო 4 ჩანაწერი)</h3>
        <div className="space-y-2">
          {trend.map((t: any, i: number) => (
            <div key={i} className="flex items-center gap-4 text-sm">
              <span className="text-text-muted w-24 shrink-0">{t.date}</span>
              <span className="text-text-primary w-20">NDVI {t.ndvi?.toFixed(3) ?? '—'}</span>
              <span className="text-text-primary w-20">NDWI {t.ndwi?.toFixed(3) ?? '—'}</span>
              <span className="text-text-primary w-20">NDRE {t.ndre?.toFixed(3) ?? '—'}</span>
              <span className="text-text-muted text-xs">{t.cloud_pct != null ? `${t.cloud_pct}% ღრუბლი` : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function IndexCard({ label, value, interpretation }: any) {
  const color = interpretation?.color === 'danger' ? '#ef4444' : interpretation?.color === 'warning' ? '#f59e0b' : '#10b981'
  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">{value != null ? value.toFixed(3) : '—'}</p>
      <p className="text-sm mt-1" style={{ color }}>{interpretation?.label || '—'}</p>
      {interpretation?.action && <p className="text-xs text-accent mt-1">{interpretation.action}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FERTILIZER TAB
// ═══════════════════════════════════════════════════════════════

function FertilizerTab({ fertilizer }: { fertilizer: any }) {
  if (!fertilizer) return <EmptyState icon={<Beaker className="h-12 w-12" />} message="სასუქის მონაცემები არ არის" />

  const recs = fertilizer.recommendations || []
  const activeRecs = recs.filter((r: any) => r.apply)

  return (
    <div className="space-y-4">
      <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">pH მიზანი</p>
            <p className="text-2xl font-bold text-text-primary">{fertilizer.ph ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">NDRE</p>
            <p className="text-2xl font-bold text-text-primary">{fertilizer.ndre?.toFixed(3) ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">ფაზა</p>
            <p className="text-lg font-bold text-text-primary">{fertilizer.phenology_stage?.stage_name ?? '—'}</p>
          </div>
        </div>
      </div>

      {activeRecs.length === 0 && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
          <p className="text-sm text-success font-medium">✓ სასუქი ამჟამად არ არის საჭირო</p>
        </div>
      )}

      {activeRecs.map((rec: any, i: number) => (
        <div key={i} className="bg-bg-card rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-text-primary">
              {rec.nutrient === 'N' && 'აზოტი (N)'}
              {rec.nutrient === 'P' && 'ფოსფორი (P)'}
              {rec.nutrient === 'K' && 'კალიუმი (K)'}
              {rec.nutrient === 'S' && 'გოგირდი (S)'}
              {rec.nutrient === 'S (pH correction)' && 'pH კორექცია — გოგირდი'}
              {rec.nutrient === 'pH Correction' && 'pH კორექცია'}
              {rec.nutrient === 'Fe/Mn' && 'რკინა/მანგანუმი (Fe/Mn)'}
              {rec.nutrient === 'Boron (B)' && 'ბორი (B)'}
              {rec.nutrient === 'Post-harvest K + P' && 'მომკის შემდგომი K+P'}
            </h4>
            <span className={`text-xs px-2 py-1 rounded ${rec.urgency === 'high' ? 'bg-danger/20 text-danger' : rec.urgency === 'medium' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
              {rec.dose_kg_ha} kg/ha
            </span>
          </div>
          <p className="text-sm text-text-muted">{rec.reason}</p>
          {rec.product && <p className="text-sm text-accent mt-1">პროდუქტი: {rec.product}</p>}
          {rec.method && <p className="text-xs text-text-muted mt-1">🛠 {rec.method}</p>}
          {rec.warning && <p className="text-xs text-danger mt-1">⚠ {rec.warning}</p>}
          {rec.note && <p className="text-xs text-text-muted mt-1">📝 {rec.note}</p>}
          {rec.timing && <p className="text-xs text-text-muted mt-1">⏰ {rec.timing}</p>}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// IRRIGATION TAB
// ═══════════════════════════════════════════════════════════════

function IrrigationTab({ irrigation }: { irrigation: any }) {
  if (!irrigation) return <EmptyState icon={<Droplets className="h-12 w-12" />} message="მორწყვის მონაცემები არ არის" />

  const decision = irrigation.decision
  const color = decision?.decision === 'URGENT' ? 'text-danger' : decision?.decision === 'IRRIGATE' ? 'text-accent' : 'text-success'

  return (
    <div className="space-y-4">
      <div className={`bg-bg-card rounded-2xl border p-6 ${decision?.decision === 'URGENT' ? 'border-danger/30' : decision?.decision === 'IRRIGATE' ? 'border-accent/30' : 'border-white/5'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">გადაწყვეტილება</p>
            <p className={`text-2xl font-bold ${color}`}>
              {decision?.decision === 'NO_ACTION' ? 'არაა საჭირო' : decision?.decision === 'URGENT' ? 'სასწრაფო!' : 'მორწყვა'}
            </p>
            <p className="text-sm text-text-muted mt-1">{decision?.amount_mm ?? 0} mm</p>
          </div>
          <div className={`p-3 rounded-xl ${decision?.decision === 'URGENT' ? 'bg-danger/20 text-danger' : decision?.decision === 'IRRIGATE' ? 'bg-accent/20 text-accent' : 'bg-success/20 text-success'}`}>
            <Droplets className="h-8 w-8" />
          </div>
        </div>
        <p className="text-sm text-text-primary mt-3">{decision?.reason}</p>
        {decision?.critical_period && (
          <p className="text-xs text-warning mt-2">⚠ კრიტიკული პერიოდი — ყურადღება საჭიროა</p>
        )}
        {decision?.pre_harvest_note && (
          <p className="text-xs text-accent mt-2">🍇 {decision.pre_harvest_note}</p>
        )}
        {decision?.harvest_adjustment?.adjust && (
          <p className="text-xs text-accent mt-2">🍇 {decision.harvest_adjustment.reason}</p>
        )}
      </div>

      <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">შენავალი მონაცემები</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">ET0</p>
            <p className="text-lg font-semibold text-text-primary">{irrigation.inputs?.avg_et0 ?? '—'} mm</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">Kc</p>
            <p className="text-lg font-semibold text-text-primary">{irrigation.kc_used ?? '—'}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">ტენიანობა</p>
            <p className="text-lg font-semibold text-text-primary">{irrigation.inputs?.soil_moisture_pct != null ? `${irrigation.inputs.soil_moisture_pct}%` : '—'}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">წვიმის პროგნოზი 48სთ</p>
            <p className="text-lg font-semibold text-text-primary">{irrigation.inputs?.rain_forecast_48h ?? '—'} mm</p>
          </div>
        </div>
      </div>

      {irrigation.weather_rules && irrigation.weather_rules.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-warning mb-2">ამინდის წესები</h3>
          <ul className="space-y-1">
            {irrigation.weather_rules.map((rule: string, i: number) => (
              <li key={i} className="text-sm text-text-primary">• {rule}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// YIELD TAB
// ═══════════════════════════════════════════════════════════════

function YieldTab({ yieldForecast }: { yieldForecast: any }) {
  if (!yieldForecast?.forecast) return <EmptyState icon={<BarChart3 className="h-12 w-12" />} message="მოსავლის პროგნოზი არ არის" />

  const fc = yieldForecast.forecast

  return (
    <div className="space-y-4">
      <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">პროგნოზირებული მოსავალი</p>
            <p className="text-3xl font-bold text-accent">{fc.final_yield_kg_ha.toFixed(0)} <span className="text-lg text-text-muted">kg/ha</span></p>
            <p className="text-xs text-text-muted mt-1">
              ბაზა: {fc.base_yield_kg_ha.toFixed(0)} kg/ha • კორექცია: {fc.correction_multiplier}x
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${fc.confidence === 'high' ? 'bg-success/20 text-success' : fc.confidence === 'medium-high' ? 'bg-accent/20 text-accent' : 'bg-warning/20 text-warning'}`}>
            {fc.confidence}
          </div>
        </div>
        <p className="text-xs text-text-muted mt-3">{fc.confidence_reason}</p>
      </div>

      <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">შენავალი მონაცემები</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">კვირტი/ბუჩქი</p>
            <p className="text-lg font-semibold text-text-primary">{fc.inputs_used?.clusters_per_bush ?? '—'}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">ნაყოფი/კვირტი</p>
            <p className="text-lg font-semibold text-text-primary">{fc.inputs_used?.berries_per_cluster ?? '—'}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">ნაყოფიანება %</p>
            <p className="text-lg font-semibold text-text-primary">{fc.inputs_used?.fruit_set_pct ?? '—'}%</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">კენკრის წონა</p>
            <p className="text-lg font-semibold text-text-primary">{fc.inputs_used?.berry_weight_g ?? '—'} g</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">ბუჩქები/ჰა</p>
            <p className="text-lg font-semibold text-text-primary">{fc.inputs_used?.bush_density_ha ?? '—'}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <p className="text-xs text-text-muted">GDD</p>
            <p className="text-lg font-semibold text-text-primary">{fc.inputs_used?.cum_gdd ?? '—'}</p>
          </div>
        </div>
      </div>

      {fc.corrections && fc.corrections.length > 0 && (
        <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">კორექციის ფაქტორები</h3>
          <div className="space-y-2">
            {fc.corrections.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <p className="text-sm text-text-primary">{c.description}</p>
                <span className={`text-sm font-medium ${c.value < 1 ? 'text-danger' : 'text-success'}`}>×{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ALERTS TAB
// ═══════════════════════════════════════════════════════════════

function AlertsTab({ alerts }: { alerts: any }) {
  if (!alerts || !alerts.alerts) return <EmptyState icon={<AlertTriangle className="h-12 w-12" />} message="გაფრთხილებები არ არის" />

  const byPriority = {
    CRITICAL: alerts.alerts.filter((a: any) => a.priority === 'CRITICAL'),
    HIGH: alerts.alerts.filter((a: any) => a.priority === 'HIGH'),
    MEDIUM: alerts.alerts.filter((a: any) => a.priority === 'MEDIUM'),
    INFO: alerts.alerts.filter((a: any) => a.priority === 'INFO'),
  }

  const priorityConfig: any = {
    CRITICAL: { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', label: 'კრიტიკული' },
    HIGH: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'მაღალი' },
    MEDIUM: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', label: 'საშუალო' },
    INFO: { color: 'text-text-muted', bg: 'bg-white/5', border: 'border-white/5', label: 'ინფო' },
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'] as const).map(p => (
          <div key={p} className={`p-3 rounded-xl text-center ${priorityConfig[p].bg} ${priorityConfig[p].border} border`}>
            <p className={`text-lg font-bold ${priorityConfig[p].color}`}>{alerts.counts[p.toLowerCase()]}</p>
            <p className="text-xs text-text-muted">{priorityConfig[p].label}</p>
          </div>
        ))}
      </div>

      {(['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'] as const).map(priority => (
        byPriority[priority].length > 0 && (
          <div key={priority} className="space-y-2">
            <h3 className={`text-sm font-semibold ${priorityConfig[priority].color}`}>{priorityConfig[priority].label}</h3>
            {byPriority[priority].map((alert: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl border ${priorityConfig[priority].bg} ${priorityConfig[priority].border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                    <p className="text-sm text-text-muted mt-1">{alert.message}</p>
                    {alert.action && <p className="text-sm text-accent mt-2">→ {alert.action}</p>}
                  </div>
                  {alert.deadline_hours && (
                    <span className="text-xs text-text-muted whitespace-nowrap shrink-0">{alert.deadline_hours}სთ</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SPRAY TAB
// ═══════════════════════════════════════════════════════════════

function SprayTab({ sprayLog, parcelId }: { sprayLog: any; parcelId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [sprays, setSprays] = useState<any[]>([])

  useEffect(() => { if (sprayLog?.sprays) setSprays(sprayLog.sprays) }, [sprayLog])

  const handleAddSpray = async (formData: any) => {
    try {
      await blueberryService.logSpray({ ...formData, parcel_id: parcelId })
      const refreshed = await blueberryService.getSprayLog(parcelId)
      setSprays(refreshed.sprays || [])
      setShowForm(false)
    } catch (err) { console.error('Failed to log spray:', err) }
  }

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">სპრეის გრაფიკი</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">
          {showForm ? 'გაუქმება' : '+ ახალი სპრეი'}
        </button>
      </div>

      {showForm && <SprayForm onSubmit={handleAddSpray} onCancel={() => setShowForm(false)} />}

      <div className="space-y-3">
        {sprays.length === 0 && !showForm && <p className="text-text-muted text-center py-8">სპრეის ჩანაწერები არ არის</p>}
        {sprays.map((spray: any) => (
          <SprayLogItem key={spray.id}
            date={spray.spray_date ? new Date(spray.spray_date).toLocaleDateString('ka-GE') : '—'}
            product={spray.product_name || '—'} target={spray.disease_key || '—'}
            dose={spray.dose_per_ha} ingredient={spray.active_ingredient} />
        ))}
      </div>
    </div>
  )
}

function SprayLogItem({ date, product, target, dose, ingredient }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
      <div className="w-2 h-2 rounded-full bg-success" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{product}</p>
        <p className="text-xs text-text-muted">{target}{ingredient && ` • ${ingredient}`}{dose && ` • ${dose} L/ha`}</p>
      </div>
      <span className="text-sm text-text-secondary whitespace-nowrap">{date}</span>
      <span className="text-xs px-2 py-1 rounded bg-success/20 text-success">შესრულებული</span>
    </div>
  )
}

function SprayForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ product_name: '', active_ingredient: '', disease_key: '', dose_per_ha: '', volume_water_hl: '', notes: '' })

  return (
    <div className="mb-6 p-4 bg-white/5 rounded-xl space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input placeholder="პროდუქტის სახელი" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })}
          className="bg-bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
        <input placeholder="აქტიური ნივთიერება" value={form.active_ingredient} onChange={e => setForm({ ...form, active_ingredient: e.target.value })}
          className="bg-bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
        <select value={form.disease_key} onChange={e => setForm({ ...form, disease_key: e.target.value })}
          className="bg-bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
          <option value="">მიზანი (დაავადება)</option>
          <option value="mummy_berry">მამილა</option>
          <option value="botrytis">ნაცარი</option>
          <option value="phytophthora">ფიტოფთორა</option>
          <option value="anthracnose">ანთრაკნოზი</option>
        </select>
        <input placeholder="დოზა L/ha" type="number" value={form.dose_per_ha} onChange={e => setForm({ ...form, dose_per_ha: e.target.value })}
          className="bg-bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
        <input placeholder="წყლის მოცულობა hL/ha" type="number" value={form.volume_water_hl} onChange={e => setForm({ ...form, volume_water_hl: e.target.value })}
          className="bg-bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
        <input placeholder="შენიშვნები" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          className="bg-bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 bg-white/5 text-text-secondary rounded-lg text-sm hover:bg-white/10">გაუქმება</button>
        <button onClick={() => onSubmit({ ...form, dose_per_ha: form.dose_per_ha ? parseFloat(form.dose_per_ha) : undefined, volume_water_hl: form.volume_water_hl ? parseFloat(form.volume_water_hl) : undefined })}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">შენახვა</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StatCard({ title, value, subtitle, icon, color, alert }: any) {
  return (
    <div className={`bg-bg-card rounded-2xl border p-5 ${alert ? 'border-danger/30' : 'border-white/5'}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-text-muted truncate">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1 truncate">{value}</p>
          <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>
        </div>
        <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${color}20`, color }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="text-center py-12 text-text-muted">
      <div className="opacity-30 mb-4">{icon}</div>
      <p>{message}</p>
    </div>
  )
}
