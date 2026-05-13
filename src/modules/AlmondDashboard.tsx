import React, { useState, useEffect, useMemo } from 'react'
import {
  Leaf, Droplets, Bug, Calendar, TrendingUp,
  Thermometer, Sprout, Shield, Wind, Beaker,
  ChevronRight, Plus, Snowflake, Package,
  CheckCircle2, Info,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, BarChart, Bar, Line, ComposedChart,
  ReferenceLine,
} from 'recharts'
import { cropApi, weatherForecast, type CropParcel } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import { useProfileStore } from '@/shared/stores'
import AlmondDiseaseMonitor from './AlmondDiseaseMonitor'

/* ──────────────────────────────────────────── */
/*  Types                                       */
/* ──────────────────────────────────────────── */

interface PhenologyEntry {
  calc_date: string
  stage_code: string
  stage_name: string
  cum_gdd: number
}

interface FrostEntry {
  date: string
  t_min: number
  t_critical: number
  damage_probability_pct: number
  frost_protection_needed: boolean
}

interface NavelOWEntry {
  date: string
  degree_days_cum: number
  egg_laying_risk: number
  spray_recommended: boolean
}

interface SprayEntry {
  spray_date: string
  disease_key: string
  product_name: string
  active_ingredient: string
  dose_per_ha: number
  cost_gel: number
}

/* ──────────────────────────────────────────── */
/*  Almond GDD / Phenology Config               */
/* ──────────────────────────────────────────── */

const ALMOND_STAGES = [
  { code: '00', name: 'ზამთრის სიცივე', gdd: 0, month: 'დეკ-თებ', task: 'ჭრა-ჩეხა, ჰიგიენა' },
  { code: '01', name: 'ყლორტის შებერა', gdd: 80, month: 'თებ-მარ', task: 'ზეთისხილის ზეთი, სასუქი' },
  { code: '03', name: 'წითელი ყლორტი', gdd: 150, month: 'მარ', task: 'ფუნგიციდი (ქურთუკის სიდამპლე)' },
  { code: '53', name: 'ვარდისფერი ყლორტი', gdd: 200, month: 'მარ-აპრ', task: 'ყინვის მონიტორინგი, მავნებლები' },
  { code: '55', name: 'სრული ყვავილობა', gdd: 250, month: 'აპრ', task: 'მტყვნის დაცვა, მოსვენება' },
  { code: '65', name: 'ფურცლის ცვენა', gdd: 350, month: 'აპრ-მაი', task: 'სასუქი N-P-K, მორწყვა' },
  { code: '69', name: 'ნაყოფის დაყენება', gdd: 400, month: 'მაი', task: 'ზეთისხილის ზეთი, ტკიპა' },
  { code: '71', name: 'ქურთუკის ფაზა', gdd: 500, month: 'მაი-ივნ', task: 'ცინკი, ბორი' },
  { code: '75', name: 'ჭურვის გამკვრივება', gdd: 800, month: 'ივნ-ივლ', task: 'კალციუმი, მავნებლები' },
  { code: '81', name: 'გარსის გახლეჩა იწყება', gdd: 1200, month: 'აგვ-სექ', task: 'Navel OW მონიტორინგი' },
  { code: '85', name: 'გარსის გახლეჩა მაღალი', gdd: 1400, month: 'სექ', task: 'მზაა მოსავლისთვის' },
  { code: '89', name: 'მოსავლის მზაობა', gdd: 1600, month: 'სექ-ოქტ', task: 'შენალი, შენახვა' },
]

const MONTHS_KA = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']

/* ──────────────────────────────────────────── */
/*  Seasonal Calendar Data                      */
/* ──────────────────────────────────────────── */

const SEASONAL_TASKS: Record<number, { title: string; tasks: string[]; priority: 'high' | 'medium' | 'low' }[]> = {
  0: [ // January
    { title: 'ზამთრის ჭრა-ჩეხა', tasks: ['გაუსაფრთხოების ჭრა', 'მკვდარი ხეების მოცილება', 'კანოპის გახსნა'], priority: 'high' },
    { title: 'სანიტარიული ღონისძიებები', tasks: ['მშრალი ფოთლის მოცილება', 'ფუტკრის სკების განთავსება'], priority: 'medium' },
  ],
  1: [ // February
    { title: 'გვიანი ჭრა-ჩეხა', tasks: ['ვარჯის ფორმირება', 'ინფიცირებული ტოტების მოცილება'], priority: 'high' },
    { title: 'სასუქის მოსამზადებელი', tasks: ['ნიადაგის ანალიზი', 'ორგანული სასუქის გაფხვიერება'], priority: 'medium' },
  ],
  2: [ // March
    { title: 'ყლორტის ფაზის დაცვა', tasks: ['ფუნგიციდი — ქურთუკის სიდამპლე (Botrytis)', 'ზეთისხილის ზეთი — ტკიპებისთვის'], priority: 'high' },
    { title: 'სასუქი', tasks: ['N 30-40 კგ/ჰა', 'P₂O₅ 40-50 კგ/ჰა', 'K₂O 30-40 კგ/ჰა'], priority: 'high' },
  ],
  3: [ // April
    { title: 'ყვავილობის დაცვა', tasks: ['ყინვის მონიტორინგი', 'ფუტკრის მეურნეობის შემოწმება', 'ფუნგიციდი საჭიროებისამებრ'], priority: 'high' },
    { title: 'Navel OW ხაფანგები', tasks: ['ფერომონის ხაფანგების განთავსება', 'ყოველკვირეული შემოწმება'], priority: 'medium' },
  ],
  4: [ // May
    { title: 'ნაყოფის დაყენების შემდეგ', tasks: ['სასუქი — N 20-30 კგ/ჰა', 'ზეთისხილის ზეთი (ტკიპა)', 'პირველი სპრეი Navel OW-სთვის'], priority: 'high' },
    { title: 'მორწყვა', tasks: ['ETc-ის მიხედვით მორწყვის დაწყება', 'წვეთოვანი სისტემის შემოწმება'], priority: 'high' },
  ],
  5: [ // June
    { title: 'ჭურვის ზრდა', tasks: ['კალციუმის სპრეი', 'ბორის სპრეი', 'პირანგის მონიტორინგი'], priority: 'medium' },
    { title: 'ჭრა-ჩეხა', tasks: ['წყლის ანკერების მოცილება'], priority: 'low' },
  ],
  6: [ // July
    { title: 'ზაფხულის მოვლა', tasks: ['მორწყვის გაზრდა Kc=0.95', 'მწერების მონიტორინგი', 'ქსილემის მიკოზი'], priority: 'medium' },
  ],
  7: [ // August
    { title: 'გარსის გახლეჩა', tasks: ['Navel OW მეორე თაობა — სპრეი', 'ჰარვესტის მომზადება', 'გამოშრობის შეწყვეტა'], priority: 'high' },
  ],
  8: [ // September
    { title: 'მოსავალი', tasks: ['შენალი დროულად', 'გამოშრობა 6-8%', 'შენახვის მომზადება'], priority: 'high' },
    { title: 'პოსტ-ჰარვესტი', tasks: ['ორგანული სასუქი', 'წყლის შენაყვარება'], priority: 'medium' },
  ],
  9: [ // October
    { title: 'ზამთრის მომზადება', tasks: ['ბოლო მორწყვა', 'ფოთლის დაცემის ანალიზი'], priority: 'medium' },
  ],
  10: [ // November
    { title: 'ზამთრის სიცივე', tasks: ['ფოთლის მოცილება', 'სანიტარიული ჭრა-ჩეხა'], priority: 'medium' },
  ],
  11: [ // December
    { title: 'გეგმავრება', tasks: ['წლის შედეგების ანალიზი', 'შემდეგი წლის ბიუჯეტი', 'პესტიციდების შეკვეთა'], priority: 'low' },
  ],
}

/* ──────────────────────────────────────────── */
/*  Fertilization Recommendations               */
/* ──────────────────────────────────────────── */

const FERTILIZER_RECS = [
  {
    stage: 'ზამთარი (დეკ-თებ)',
    n: '0', p: 'P₂O₅ 50-60 კგ/ჰა', k: 'K₂O 40-50 კგ/ჰა',
    micro: 'ცინკი, ბორი', notes: 'ორგანული სასუქის გაფხვიერება',
  },
  {
    stage: 'ყლორტის ფაზა (მარ)',
    n: 'N 30-40 კგ/ჰა', p: '—', k: '—',
    micro: 'ცინკის ხელით სპრეი', notes: 'ფოსფორის გააქტივება თუ ნიადაგი მდიდარია',
  },
  {
    stage: 'ყვავილობა (აპრ)',
    n: 'N 20-30 კგ/ჰა', p: '—', k: '—',
    micro: 'ბორი (ბუდეების მოსაზიდად)', notes: 'თავი შეიკავეთ მაღალი N-სგან — კვირტის დაცემა',
  },
  {
    stage: 'ნაყოფის დაყენება (მაი)',
    n: 'N 30-40 კგ/ჰა', p: '—', k: 'K₂O 20-30 კგ/ჰა',
    micro: 'კალციუმი, მაგნეზიუმი', notes: 'ნაყოფის შენახვისთვის კალციუმი კრიტიკულია',
  },
  {
    stage: 'ჭურვის ზრდა (ივნ-ივლ)',
    n: 'N 20 კგ/ჰა', p: '—', k: 'K₂O 30-40 კგ/ჰა',
    micro: 'კალციუმის სპრეი', notes: 'K მაღალი — ჭურვის ხარისხი',
  },
  {
    stage: 'გარსის გახლეჩა (აგვ-სექ)',
    n: '0', p: '—', k: 'K₂O 20 კგ/ჰა',
    micro: '—', notes: 'N-ის შეწყვეტა — გვიანი ზრდის თავიდან ასაცილებლად',
  },
]

/* ──────────────────────────────────────────── */
/*  Main Dashboard                              */
/* ──────────────────────────────────────────── */

type TabKey = 'overview' | 'phenology' | 'pests' | 'frost' | 'calendar' | 'fertilizer'

export default function AlmondDashboard(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [selectedParcelId, setSelectedParcelId] = useState<string>('')

  // Fetch almond parcels
  const { data: parcelsData } = useApi<CropParcel[]>(() => cropApi.parcels('almond'), [activeProfile?.id])
  const parcels = parcelsData || []

  useEffect(() => {
    if (parcels.length > 0 && !selectedParcelId) {
      setSelectedParcelId(parcels[0].id)
    }
  }, [parcels, selectedParcelId])

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader parcels={parcels} selectedParcelId={selectedParcelId} onSelect={setSelectedParcelId} />

      {/* Tabs */}
      <TabNav active={activeTab} onChange={setActiveTab} />

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && <OverviewTab parcelId={selectedParcelId} />}
        {activeTab === 'phenology' && <PhenologyTab parcelId={selectedParcelId} />}
        {activeTab === 'pests' && <AlmondDiseaseMonitor parcelId={selectedParcelId} />}
        {activeTab === 'frost' && <FrostTab parcelId={selectedParcelId} />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'fertilizer' && <FertilizerTab />}
      </div>
    </div>
  )
}

/* ── Header ── */
function DashboardHeader({ parcels, selectedParcelId, onSelect }: {
  parcels: CropParcel[]
  selectedParcelId: string
  onSelect: (id: string) => void
}): React.ReactElement {
  const totalArea = parcels.reduce((s, p) => s + (p.area_ha || 0), 0)

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-700/20">
          <Leaf className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">ნუში</h1>
          <p className="text-text-muted text-sm">
            {parcels.length} ნაკვეთი • {totalArea.toFixed(1)} ჰა
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {parcels.length > 0 && (
          <select
            value={selectedParcelId}
            onChange={(e) => onSelect(e.target.value)}
            className="select text-sm bg-white/5"
          >
            <option value="">ყველა ნაკვეთი</option>
            {parcels.map((p) => (
              <option key={p.id} value={p.id}>{p.parcel_nr || p.id.slice(0, 8)}</option>
            ))}
          </select>
        )}
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff' }}>
          <Plus className="h-4 w-4" />
          ოპერაცია
        </button>
      </div>
    </div>
  )
}

/* ── Tab Nav ── */
function TabNav({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }): React.ReactElement {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'მიმოხილვა', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'phenology', label: 'ფენოლოგია', icon: <Sprout className="h-4 w-4" /> },
    { key: 'pests', label: 'მავნებლები', icon: <Bug className="h-4 w-4" /> },
    { key: 'frost', label: 'ყინვა', icon: <Snowflake className="h-4 w-4" /> },
    { key: 'calendar', label: 'კალენდარი', icon: <Calendar className="h-4 w-4" /> },
    { key: 'fertilizer', label: 'სასუქი', icon: <Beaker className="h-4 w-4" /> },
  ]

  return (
    <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            active === t.key
              ? 'bg-amber-600/20 text-amber-400 shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────── */
/*  Overview Tab                                */
/* ──────────────────────────────────────────── */

function OverviewTab({ parcelId }: { parcelId: string }): React.ReactElement {
  const { data: phenology } = useApi<PhenologyEntry[]>(() => parcelId ? cropApi.almondPhenology(parcelId) : Promise.resolve([]), [parcelId])
  const { data: frost } = useApi<FrostEntry[]>(() => parcelId ? cropApi.almondFrostRisk(parcelId) : Promise.resolve([]), [parcelId])
  const { data: nowData } = useApi<NavelOWEntry[]>(() => parcelId ? cropApi.almondNavelOW(parcelId) : Promise.resolve([]), [parcelId])
  const { data: sprayLog } = useApi<SprayEntry[]>(() => parcelId ? cropApi.almondSprayLog(parcelId, 5) : Promise.resolve([]), [parcelId])

  const latestPheno = phenology && phenology.length > 0 ? phenology[0] : null
  const currentStage = latestPheno ? ALMOND_STAGES.find((s) => s.code === latestPheno.stage_code) : null
  const nextStage = currentStage ? ALMOND_STAGES[ALMOND_STAGES.indexOf(currentStage) + 1] : null

  const latestFrost = frost && frost.length > 0 ? frost[0] : null
  const highFrostRisk = frost ? frost.filter((f: FrostEntry) => f.frost_protection_needed).length : 0

  const latestNOW = nowData && nowData.length > 0 ? nowData[0] : null
  const nowRiskLabel = ['არა', 'დაბალი', 'საშუალო', 'მაღალი']

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="მიმდინარე ფაზა"
          value={currentStage ? currentStage.name : '—'}
          subtitle={latestPheno ? `GDD: ${Math.round(latestPheno.cum_gdd)}` : 'მონაცემები არ არის'}
          icon={<Sprout className="h-5 w-5" />}
          color="#d97706"
        />
        <StatCard
          title="ყინვის რისკი"
          value={highFrostRisk > 0 ? `${highFrostRisk} დღე` : 'არა'}
          subtitle={latestFrost ? `მინ: ${latestFrost.t_min}°C` : '—'}
          icon={<Snowflake className="h-5 w-5" />}
          color={highFrostRisk > 0 ? '#ef4444' : '#10b981'}
          alert={highFrostRisk > 0}
        />
        <StatCard
          title="Navel OW რისკი"
          value={latestNOW ? nowRiskLabel[latestNOW.egg_laying_risk] || '—' : '—'}
          subtitle={latestNOW ? `DD: ${Math.round(latestNOW.degree_days_cum)}` : '—'}
          icon={<Bug className="h-5 w-5" />}
          color={latestNOW && latestNOW.egg_laying_risk >= 2 ? '#ef4444' : '#10b981'}
        />
        <StatCard
          title="სპრეი"
          value={`${sprayLog?.length || 0}`}
          subtitle="ბოლო 5 ჩანაწერი"
          icon={<Shield className="h-5 w-5" />}
          color="#3b82f6"
        />
      </div>

      {/* Next stage + GDD progress */}
      {currentStage && nextStage && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">GDD პროგრესი</h3>
            <span className="text-xs text-text-muted">{currentStage.name} → {nextStage.name}</span>
          </div>
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, Math.max(0, ((latestPheno?.cum_gdd || 0) - currentStage.gdd) / (nextStage.gdd - currentStage.gdd) * 100))}%`,
                background: 'linear-gradient(90deg, #d97706, #f59e0b)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-text-muted">
            <span>{currentStage.gdd} GDD</span>
            <span className="text-amber-400 font-mono">{Math.round(latestPheno?.cum_gdd || 0)} GDD</span>
            <span>{nextStage.gdd} GDD</span>
          </div>
        </div>
      )}

      {/* Recent sprays */}
      {sprayLog && sprayLog.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">ბოლო სპრეები</h3>
          <div className="space-y-2">
            {sprayLog.map((s: SprayEntry, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                <div>
                  <p className="text-sm text-text-primary">{s.product_name || s.disease_key}</p>
                  <p className="text-xs text-text-muted">{s.active_ingredient || '—'} • {s.dose_per_ha ? `${s.dose_per_ha} ლ/ჰა` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">{new Date(s.spray_date).toLocaleDateString('ka-GE')}</p>
                  {s.cost_gel && <p className="text-xs text-accent font-mono">₾{s.cost_gel}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────── */
/*  Phenology Tab                               */
/* ──────────────────────────────────────────── */

function PhenologyTab({ parcelId }: { parcelId: string }): React.ReactElement {
  const { data: phenology } = useApi<PhenologyEntry[]>(() => parcelId ? cropApi.almondPhenology(parcelId) : Promise.resolve([]), [parcelId])
  const entries: PhenologyEntry[] = phenology || []

  const chartData = useMemo(() => {
    return [...entries].reverse().map((e) => ({
      date: e.calc_date.slice(5),
      gdd: e.cum_gdd || 0,
    }))
  }, [entries])

  const latest = entries[0]
  const currentGDD = latest?.cum_gdd || 0

  return (
    <div className="space-y-4">
      {/* GDD Chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">GDD დაგროვება</h3>
        {chartData.length > 1 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="gdd" stroke="#d97706" fill="url(#gddGrad)" strokeWidth={2} />
                <ReferenceLine y={1600} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Harvest', fill: '#10b981', fontSize: 10, position: 'right' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="GDD მონაცემები არ არის. ფენოლოგიის დათვლა ყოველდღიურად ხდება." />
        )}
      </div>

      {/* Stage Timeline */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">BBCH ფენოლოგიური ეტაპები</h3>
        <div className="space-y-1">
          {ALMOND_STAGES.map((stage) => {
            const isCompleted = currentGDD >= stage.gdd
            const isCurrent = latest && stage.code === latest.stage_code
            const isNext = !isCompleted && !isCurrent && currentGDD < stage.gdd &&
              ALMOND_STAGES[ALMOND_STAGES.indexOf(stage) - 1]?.gdd <= currentGDD

            return (
              <div key={stage.code} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${isCurrent ? 'bg-amber-600/10' : 'hover:bg-white/[0.02]'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCompleted ? (isCurrent ? 'bg-amber-600 text-white' : 'bg-emerald-500/20 text-emerald-400')
                    : isNext ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                    : 'bg-white/5 text-text-muted'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stage.code}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isCurrent ? 'text-amber-400' : 'text-text-primary'}`}>{stage.name}</span>
                    {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-400">მიმდინარე</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                    <span>GDD {stage.gdd}</span>
                    <span>•</span>
                    <span>{stage.month}</span>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-text-muted">{stage.task}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────── */
/*  Pests Tab                                   */
/* ──────────────────────────────────────────── */

/* ──────────────────────────────────────────── */
/*  Frost Tab                                   */
/* ──────────────────────────────────────────── */

function FrostTab({ parcelId }: { parcelId: string }): React.ReactElement {
  const { data: frostData } = useApi<FrostEntry[]>(() => parcelId ? cropApi.almondFrostRisk(parcelId) : Promise.resolve([]), [parcelId])
  const entries: FrostEntry[] = frostData || []

  const { data: forecast } = useApi(() => parcelId ? weatherForecast.parcel(parcelId, 7) : Promise.resolve([]), [parcelId])

  const chartData = useMemo(() => [...entries].reverse().map((e) => ({
    date: e.date.slice(5),
    tmin: e.t_min,
    tcrit: e.t_critical || -2,
    damage: e.damage_probability_pct || 0,
  })), [entries])

  const forecastDays = (forecast || []).filter((d: any) => d.is_forecast).slice(0, 7)

  return (
    <div className="space-y-4">
      {/* Frost Chart */}
      {chartData.length > 1 ? (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">ყინვის ტემპერატურა და რისკი</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis yAxisId="temp" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} />
                <ReferenceLine yAxisId="temp" y={0} stroke="#64748b" strokeDasharray="4 4" />
                <ReferenceLine yAxisId="temp" y={-2} stroke="#ef4444" strokeDasharray="4 4" label={{ value: ' krit.', fill: '#ef4444', fontSize: 9 }} />
                <Bar yAxisId="pct" dataKey="damage" fill="rgba(239,68,68,0.3)" radius={[4, 4, 0, 0]} barSize={24} name="დაზიანების %" />
                <Line yAxisId="temp" type="monotone" dataKey="tmin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="მინ. ტემპ" />
                <Line yAxisId="temp" type="monotone" dataKey="tcrit" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" dot={false} name="კრიტ. ტემპ" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <EmptyState message="ყინვის ისტორიული მონაცემები არ არის." />
        </div>
      )}

      {/* Frost forecast */}
      {forecastDays.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">7-დღიანი პროგნოზი — ყინვის რისკი</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {forecastDays.map((day: any, i: number) => {
              const minTemp = day.t_min ?? 0
              const frostRisk = minTemp <= 0 ? (minTemp <= -2 ? 'მაღალი' : 'საშუალო') : 'არა'
              const riskColor = minTemp <= -2 ? 'bg-red-500/20 text-red-400 border-red-500/30' : minTemp <= 0 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-white/5 text-text-secondary border-white/5'

              return (
                <div key={i} className={`p-3 rounded-xl border text-center ${riskColor}`}>
                  <p className="text-[10px] text-text-muted uppercase">{new Date(day.wx_date).toLocaleDateString('ka-GE', { weekday: 'short' })}</p>
                  <p className="text-lg font-bold font-mono my-1">{Math.round(minTemp)}°</p>
                  <p className="text-[10px]">{frostRisk}</p>
                  {day.frost_risk && <p className="text-[10px] text-red-400 mt-0.5">ყინვა!</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Protection guide */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">ყინვისგან დაცვის მეთოდები</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: <Wind className="h-4 w-4" />, title: 'ჰაერის დამტვრევა', desc: 'ვენტილატორები ცხელი ჰაერის ქვემოდან აზევებისთვის. ეფექტურია -2°C-მდე.' },
            { icon: <Droplets className="h-4 w-4" />, title: 'ზემოდან მორწყვა (სprinkler)', desc: 'ყინვის კრისტალების ფორმირება ბუდეებზე თერმული დაცვით. კრიტიკულია წყლის რაოდენობა.' },
            { icon: <Thermometer className="h-4 w-4" />, title: 'გათბობის სისტემები', desc: 'პროპანის გამათბობლები, სანთლები, ან ღრმი წყლის ჭაბურღილები.' },
            { icon: <Package className="h-4 w-4" />, title: 'დაფარვა / ქსოვილი', desc: 'მხოლოდ ახალგაზრდა ბაღებისთვის. Frost blanket-ები 2-4°C-ით ამაღლებენ ტემპერატურას.' },
          ].map((m) => (
            <div key={m.title} className="flex gap-3 p-3 bg-white/[0.02] rounded-lg">
              <div className="text-amber-500 mt-0.5">{m.icon}</div>
              <div>
                <p className="text-sm font-medium text-text-primary">{m.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────── */
/*  Calendar Tab                                */
/* ──────────────────────────────────────────── */

function CalendarTab(): React.ReactElement {
  const currentMonth = new Date().getMonth()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const tasks = SEASONAL_TASKS[selectedMonth] || []

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {MONTHS_KA.map((m, i) => (
          <button
            key={i}
            onClick={() => setSelectedMonth(i)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              selectedMonth === i
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/20'
                : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Tasks for selected month */}
      <div className="space-y-3">
        {tasks.length === 0 && (
          <EmptyState message="ამ თვისთვის დაგეგმილი სამუშაოები არ არის" />
        )}
        {tasks.map((task, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-text-primary">{task.title}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  task.priority === 'high' ? 'bg-red-500/20 text-red-400'
                    : task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-white/10 text-text-muted'
                }`}>
                  {task.priority === 'high' ? 'მაღალი' : task.priority === 'medium' ? 'საშუალო' : 'დაბალი'}
                </span>
              </div>
            </div>
            <ul className="space-y-1.5">
              {task.tasks.map((t, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                  <ChevronRight className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────── */
/*  Fertilizer Tab                              */
/* ──────────────────────────────────────────── */

function FertilizerTab(): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Fertilizer schedule */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">სეზონური სასუქის გეგმა</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-text-muted text-xs">
                <th className="text-left py-2 px-3">ფენოლოგიური ეტაპი</th>
                <th className="text-right py-2 px-3">აზოტი (N)</th>
                <th className="text-right py-2 px-3">ფოსფორი (P₂O₅)</th>
                <th className="text-right py-2 px-3">კალიუმი (K₂O)</th>
                <th className="text-left py-2 px-3">მიკროელემენტები</th>
                <th className="text-left py-2 px-3">შენიშვნა</th>
              </tr>
            </thead>
            <tbody>
              {FERTILIZER_RECS.map((rec, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 text-text-primary font-medium">{rec.stage}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-accent">{rec.n}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-400">{rec.p}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{rec.k}</td>
                  <td className="py-2.5 px-3 text-text-secondary">{rec.micro}</td>
                  <td className="py-2.5 px-3 text-text-muted text-xs">{rec.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Irrigation Kc */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">მორწყვის კოეფიციენტები (Kc)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { stage: 'სიცივე', kc: 0.20 },
              { stage: 'ყლორტი', kc: 0.30 },
              { stage: 'ყვავილი', kc: 0.60 },
              { stage: 'ნაყოფი', kc: 0.75 },
              { stage: 'ქურთუკი', kc: 0.90 },
              { stage: 'ჭურვი', kc: 0.95 },
              { stage: 'გახლეჩა', kc: 0.85 },
              { stage: 'ჰარვესტი', kc: 0.40 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="stage" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis domain={[0, 1]} stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
              <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} />
              <Bar dataKey="kc" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-text-muted mt-3">
          <Info className="h-3 w-3 inline mr-1" />
          Kc × ET₀ = ETc (კულტურის ევაპოტრანსპირაცია). მორწყვის ინტერვალი: ნიადაგის ტენიანობის 60-70%-მდე.
        </p>
      </div>

      {/* Leaf analysis reference */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">ფოთლის ანალიზის ნორმები (ივლისი)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { el: 'N', name: 'აზოტი', min: '2.2', max: '2.5', unit: '%' },
            { el: 'P', name: 'ფოსფორი', min: '0.14', max: '0.17', unit: '%' },
            { el: 'K', name: 'კალიუმი', min: '1.4', max: '2.0', unit: '%' },
            { el: 'Ca', name: 'კალციუმი', min: '2.0', max: '3.0', unit: '%' },
            { el: 'Mg', name: 'მაგნეზიუმი', min: '0.3', max: '0.6', unit: '%' },
            { el: 'Zn', name: 'ცინკი', min: '15', max: '30', unit: 'ppm' },
            { el: 'B', name: 'ბორი', min: '60', max: '80', unit: 'ppm' },
            { el: 'Fe', name: 'რკინა', min: '100', max: '250', unit: 'ppm' },
          ].map((n) => (
            <div key={n.el} className="p-3 bg-white/[0.02] rounded-lg text-center">
              <p className="text-lg font-bold text-accent font-mono">{n.el}</p>
              <p className="text-xs text-text-muted">{n.name}</p>
              <p className="text-xs text-text-secondary mt-1">{n.min}-{n.max} {n.unit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────── */
/*  Reusable Components                         */
/* ──────────────────────────────────────────── */

function StatCard({ title, value, subtitle, icon, color, alert }: {
  title: string; value: string; subtitle: string; icon: React.ReactNode; color: string; alert?: boolean
}): React.ReactElement {
  return (
    <div className={`rounded-2xl p-5 ${alert ? 'border border-red-500/20' : ''}`}
      style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)', border: alert ? undefined : '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold text-text-primary mt-1 font-mono">{value}</p>
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        </div>
        <div className="p-2 rounded-xl" style={{ background: `${color}18`, color }}>{icon}</div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-muted">
      <Info className="h-8 w-8 mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
