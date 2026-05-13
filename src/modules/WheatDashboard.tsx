/** Wheat Dashboard - Wheat specific view */
import { useState, useEffect } from 'react'
import {
  Leaf, Droplets, Calendar,
  TrendingUp, Map, FlaskConical
} from 'lucide-react'
import { useCropData } from '@/shared/hooks/useCropData'
import { cropApi } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import type { CropDashboardStats } from '@/shared/lib/api'

export default function WheatDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'zadoks' | 'mineral' | 'subzones'>('overview')
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)
  const accentColor = '#EAB308'

  const { parcels, stats, loading } = useCropData('wheat')

  // Auto-select first parcel
  useEffect(() => {
    if (parcels.length > 0 && !selectedParcelId) {
      setSelectedParcelId(parcels[0].id)
    }
  }, [parcels, selectedParcelId])

  const totalAreaLabel = loading
    ? '...'
    : stats
    ? `${stats.total_area_ha.toFixed(1)} ჰა`
    : '...'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Leaf className="h-7 w-7" style={{ color: accentColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">ხორბალი</h1>
            <p className="text-text-muted">Wheat Management • {totalAreaLabel}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <ActionButton icon={<FlaskConical className="h-4 w-4" />} label="მინერალური ანალიზი" />
          <ActionButton icon={<Droplets className="h-4 w-4" />} label="სარწყავი" />
          <ActionButton icon={<Map className="h-4 w-4" />} label="ქვეზონები" />
        </div>
      </div>

      {/* Parcel selector (only shown when more than one parcel) */}
      {parcels.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted">ნაკვეთი:</label>
          <select
            className="select"
            value={selectedParcelId || ''}
            onChange={e => setSelectedParcelId(e.target.value)}
          >
            {parcels.map(p => (
              <option key={p.id} value={p.id}>
                ნაკვეთი #{p.parcel_nr} ({p.area_ha?.toFixed(1)} ჰა)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {[
          { key: 'overview', label: 'მიმოხილვა' },
          { key: 'zadoks', label: 'Zadoks Scale' },
          { key: 'mineral', label: 'მინერალები' },
          { key: 'subzones', label: 'ქვეზონები' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === tab.key
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-white/5'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} parcelCount={parcels.length} />
        )}
        {activeTab === 'zadoks' && <ZadoksTab />}
        {activeTab === 'mineral' && (
          <MineralTab parcelId={selectedParcelId} />
        )}
        {activeTab === 'subzones' && <SubzonesTab />}
      </div>
    </div>
  )
}

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }): React.ReactElement {
  return (
    <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-text-secondary transition-colors">
      {icon}
      <span>{label}</span>
    </button>
  )
}

function OverviewTab({
  stats: _stats,
  parcelCount,
}: {
  stats: CropDashboardStats | null
  parcelCount: number
}): React.ReactElement {
  const accentColor = '#EAB308'
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Zadoks ფაზა"
        value="31"
        subtitle="ყვავილის ღერო აყვავილებს"
        icon={<Leaf className="h-5 w-5" />}
        color={accentColor}
      />
      <StatCard
        title="ქვეზონები"
        value={String(parcelCount)}
        subtitle="განსხვავებული მართვა"
        icon={<Map className="h-5 w-5" />}
        color="#3b82f6"
      />
      <StatCard
        title="GDD"
        value="420"
        subtitle="cum °C·day"
        icon={<TrendingUp className="h-5 w-5" />}
        color="#3b82f6"
      />
      <StatCard
        title="სარწყავი"
        value="1"
        subtitle="დაგეგმილი"
        icon={<Calendar className="h-5 w-5" />}
        color="#10b981"
      />
    </div>
  )
}

function ZadoksTab(): React.ReactElement {
  const stages = [
    { code: '00', name: 'თესლის ჩათესვა', gdd: 0, completed: true },
    { code: '09', name: 'კვირტის გასვლა', gdd: 150, completed: true },
    { code: '11', name: 'პირველი ფოთოლი', gdd: 200, completed: true },
    { code: '21', name: 'გვერდითი ყლორტები', gdd: 300, completed: true },
    { code: '31', name: 'ყვავილის ღერო', gdd: 450, completed: true, current: true },
    { code: '51', name: 'ყვავილის კვირტი', gdd: 600, completed: false },
    { code: '61', name: 'ყვავილობა', gdd: 750, completed: false },
    { code: '71', name: 'რბილობის ზრდა', gdd: 1000, completed: false },
    { code: '85', name: 'მწიფება', gdd: 1400, completed: false },
    { code: '92', name: 'მოსავალი', gdd: 1600, completed: false },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Zadoks Growth Scale</h3>
      <div className="relative">
        {stages.map((stage) => (
          <div key={stage.code} className="flex items-center gap-4 mb-4">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
              ${stage.completed
                ? stage.current
                  ? 'bg-accent text-white'
                  : 'bg-success/20 text-success'
                : 'bg-white/5 text-text-muted'
              }
            `}>
              {stage.code}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${stage.current ? 'text-accent' : 'text-text-primary'}`}>
                {stage.name}
              </p>
              <p className="text-xs text-text-muted">GDD: {stage.gdd}</p>
            </div>
            {stage.current && (
              <span className="text-xs text-accent font-medium">მიმდინარე</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<number, string> = {
  1: 'კრიტიკული',
  2: 'დაბალი',
  3: 'საშუალო',
  4: 'ოპტიმალური',
  5: 'მაღალი',
}

function statusColor(status: number): string {
  if (status === 1) return 'bg-danger/20 text-danger'
  if (status === 2) return 'bg-warning/20 text-warning'
  if (status === 3) return 'bg-yellow-500/20 text-yellow-400'
  if (status >= 4) return 'bg-success/20 text-success'
  return 'bg-white/10 text-text-secondary'
}

function MineralTab({ parcelId }: { parcelId: string | null }): React.ReactElement {
  const { data, loading } = useApi<any>(
    () => (parcelId ? cropApi.wheatMineralAnalysis(parcelId) : Promise.resolve(null)),
    [parcelId],
    { enabled: parcelId !== null }
  )

  // Determine the most recent record from the API response
  const record: any | null = (() => {
    if (!data) return null
    if (Array.isArray(data) && data.length > 0) return data[0]
    if (data && typeof data === 'object' && !Array.isArray(data)) return data
    return null
  })()

  const hasRealData =
    record !== null &&
    (record.n_status !== undefined ||
      record.p_status !== undefined ||
      record.k_status !== undefined ||
      record.mg_status !== undefined)

  const mockMinerals = [
    { name: 'აზოტი (N)', value: '145 kg/ha', status: 'ოპტიმალური', color: 'bg-success' },
    { name: 'ფოსფორი (P)', value: '28 kg/ha', status: 'საკმარისი', color: 'bg-success' },
    { name: 'კალიუმი (K)', value: '185 kg/ha', status: 'ოპტიმალური', color: 'bg-success' },
    { name: 'გოგირდი (S)', value: '12 kg/ha', status: 'დაბალი', color: 'bg-warning' },
    { name: 'თუთია (Zn)', value: '0.8 ppm', status: 'საკმარისი', color: 'bg-success' },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">მინერალური ანალიზი</h3>
        <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">
          + ახალი ანალიზი
        </button>
      </div>

      {loading && (
        <p className="text-sm text-text-muted">იტვირთება...</p>
      )}

      {!loading && hasRealData && (
        <div className="space-y-3">
          {[
            { label: 'აზოტი (N)', statusNum: Number(record.n_status) },
            { label: 'ფოსფორი (P)', statusNum: Number(record.p_status) },
            { label: 'კალიუმი (K)', statusNum: Number(record.k_status) },
            { label: 'მაგნიუმი (Mg)', statusNum: Number(record.mg_status) },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${statusColor(item.statusNum)}`}>
                {STATUS_LABELS[item.statusNum] ?? '-'}
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && !hasRealData && (
        <div className="space-y-3">
          {mockMinerals.map((mineral) => (
            <div key={mineral.name} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{mineral.name}</p>
                <p className="text-xs text-text-muted">{mineral.value}</p>
              </div>
              <span className={`
                text-xs px-2 py-1 rounded
                ${mineral.color === 'bg-success'
                  ? 'bg-success/20 text-success'
                  : 'bg-warning/20 text-warning'
                }
              `}>
                {mineral.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SubzonesTab(): React.ReactElement {
  const subzones = [
    { name: 'ზონა A', area: '25 ჰა', yield: '6.2 ტ/ჰა', productivity: 'მაღალი' },
    { name: 'ზონა B', area: '20 ჰა', yield: '5.8 ტ/ჰა', productivity: 'საშუალო' },
    { name: 'ზონა C', area: '30 ჰა', yield: '7.1 ტ/ჰა', productivity: 'მაღალი' },
    { name: 'ზონა D', area: '15 ჰა', yield: '5.2 ტ/ჰა', productivity: 'საშუალო' },
    { name: 'ზონა E', area: '22 ჰა', yield: '6.5 ტ/ჰა', productivity: 'მაღალი' },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">მართვის ქვეზონები</h3>
        <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">
          + ახალი ზონა
        </button>
      </div>

      <div className="space-y-3">
        {subzones.map((zone) => (
          <div key={zone.name} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Map className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{zone.name}</p>
              <p className="text-xs text-text-muted">{zone.area}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">{zone.yield}</p>
              <span className={`
                text-xs px-2 py-1 rounded
                ${zone.productivity === 'მაღალი'
                  ? 'bg-success/20 text-success'
                  : 'bg-white/10 text-text-secondary'
                }
              `}>
                {zone.productivity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  alert
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: string
  alert?: boolean
}): React.ReactElement {
  return (
    <div className={`bg-bg-card rounded-2xl border p-5 ${alert ? 'border-danger/30' : 'border-white/5'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        </div>
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
