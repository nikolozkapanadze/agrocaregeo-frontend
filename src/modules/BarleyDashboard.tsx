/** Barley Dashboard - Barley specific view */
import { useState } from 'react'
import { 
  Leaf, Droplets, Bug, Calendar, 
  TrendingUp, AlertTriangle
} from 'lucide-react'

export default function BarleyDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'phenology' | 'disease' | 'spray'>('overview')
  const accentColor = '#D4D4D8'

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
            <h1 className="text-2xl font-bold text-text-primary">ჭვავი</h1>
            <p className="text-text-muted">Barley Management • 180 ჰა</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <ActionButton icon={<Bug className="h-4 w-4" />} label="Scald/Net Blotch" />
          <ActionButton icon={<Droplets className="h-4 w-4" />} label="სარწყავი" />
          <ActionButton icon={<Calendar className="h-4 w-4" />} label="სპრეი" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {[
          { key: 'overview', label: 'მიმოხილვა' },
          { key: 'phenology', label: 'ფენოლოგია' },
          { key: 'disease', label: 'დაავადებები' },
          { key: 'spray', label: 'სპრეი' },
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
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'phenology' && <PhenologyTab />}
        {activeTab === 'disease' && <DiseaseTab />}
        {activeTab === 'spray' && <SprayTab />}
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

function OverviewTab(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Scald რისკი"
        value="საშუალო"
        subtitle="Rhynchosporium secalis"
        icon={<AlertTriangle className="h-5 w-5" />}
        color="#f59e0b"
      />
      <StatCard
        title="Net Blotch რისკი"
        value="დაბალი"
        subtitle="Pyrenophora teres"
        icon={<AlertTriangle className="h-5 w-5" />}
        color="#10b981"
      />
      <StatCard
        title="GDD"
        value="395"
        subtitle="cum °C·day"
        icon={<TrendingUp className="h-5 w-5" />}
        color="#3b82f6"
      />
      <StatCard
        title="სპრეი"
        value="2"
        subtitle="დაგეგმილი"
        icon={<Calendar className="h-5 w-5" />}
        color="#10b981"
      />
    </div>
  )
}

function PhenologyTab(): React.ReactElement {
  const stages = [
    { code: '00', name: 'ჩათესვა', gdd: 0, completed: true },
    { code: '09', name: 'კვირტის გასვლა', gdd: 150, completed: true },
    { code: '11', name: 'პირველი ფოთოლი', gdd: 200, completed: true },
    { code: '21', name: 'ერთი მარცვალი', gdd: 280, completed: true, current: true },
    { code: '30', name: 'გვერდითი ყლორტები', gdd: 400, completed: false },
    { code: '37', name: 'ბოლო ფოთოლი', gdd: 550, completed: false },
    { code: '45', name: 'ბუტკოს აწევა', gdd: 700, completed: false },
    { code: '59', name: 'ყვავილობა', gdd: 900, completed: false },
    { code: '71', name: 'რბილობის ზრდა', gdd: 1100, completed: false },
    { code: '92', name: 'მოსავალი', gdd: 1400, completed: false },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">BBCH ფენოლოგია</h3>
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

function DiseaseTab(): React.ReactElement {
  return (
    <div className="space-y-4">
      <DiseaseCard 
        name="Scald (Rhynchosporium secalis)"
        risk={2}
        conditions="წვიმიანი ამინდი, ტემპერატურა 10-20°C"
        recommendation="ფუნგიციდი რეკომენდირებულია"
      />
      <DiseaseCard 
        name="Net Blotch (Pyrenophora teres)"
        risk={1}
        conditions="მაღალი ტენიანობა, ჭარბი წვიმა"
        recommendation="მონიტორინგი გრძელდება"
      />
      <DiseaseCard 
        name="ჭვავის ჟანგი (Puccinia hordei)"
        risk={0}
        conditions="მშრალი ამინდი - რისკი დაბალია"
        recommendation="პროფილაქტიკა საჭირო არ არის"
      />
    </div>
  )
}

function DiseaseCard({ 
  name, 
  risk, 
  conditions, 
  recommendation 
}: { 
  name: string
  risk: number
  conditions: string
  recommendation: string
}): React.ReactElement {
  const riskLabels = ['დაბალი', 'საშუალო', 'მაღალი', 'კრიტიკული']
  const riskColors = ['text-success', 'text-warning', 'text-orange-500', 'text-danger']
  
  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-text-primary">{name}</h4>
          <p className="text-sm text-text-muted mt-1">{conditions}</p>
          <p className="text-sm text-accent mt-2">{recommendation}</p>
        </div>
        <div className={`
          px-3 py-1 rounded-lg text-sm font-medium
          ${riskColors[risk]} bg-white/5
        `}>
          {riskLabels[risk]}
        </div>
      </div>
    </div>
  )
}

function SprayTab(): React.ReactElement {
  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">სპრეის გრაფიკი</h3>
        <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">
          + ახალი სპრეი
        </button>
      </div>
      
      <div className="space-y-3">
        <SprayLogItem 
          date="4 აპრილი, 2026"
          product="ბუტროლიტი"
          target="Scald"
          status="planned"
        />
        <SprayLogItem 
          date="28 მარტი, 2026"
          product="პროპიკონაზოლი"
          target="Net Blotch"
          status="completed"
        />
        <SprayLogItem 
          date="15 მარტი, 2026"
          product="ფოლიკური"
          target="პროფილაქტიკა"
          status="completed"
        />
      </div>
    </div>
  )
}

function SprayLogItem({ 
  date, 
  product, 
  target, 
  status 
}: { 
  date: string
  product: string
  target: string
  status: 'planned' | 'completed'
}): React.ReactElement {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
      <div className={`
        w-2 h-2 rounded-full
        ${status === 'completed' ? 'bg-success' : 'bg-accent'}
      `} />
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{product}</p>
        <p className="text-xs text-text-muted">{target}</p>
      </div>
      <span className="text-sm text-text-secondary">{date}</span>
      <span className={`
        text-xs px-2 py-1 rounded
        ${status === 'completed' 
          ? 'bg-success/20 text-success' 
          : 'bg-accent/20 text-accent'
        }
      `}>
        {status === 'completed' ? 'შესრულებული' : 'დაგეგმილი'}
      </span>
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
