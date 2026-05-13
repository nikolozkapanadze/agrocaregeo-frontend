/** Soybean Dashboard - Soybean specific view */
import { useState } from 'react'
import { 
  Leaf, Droplets, Bug, Calendar, 
  TrendingUp, AlertTriangle
} from 'lucide-react'

export default function SoybeanDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'rstages' | 'disease' | 'spray'>('overview')
  const accentColor = '#65A30D'

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
            <h1 className="text-2xl font-bold text-text-primary">სოიო</h1>
            <p className="text-text-muted">Soybean Management • 100 ჰა</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <ActionButton icon={<Bug className="h-4 w-4" />} label="Frogeye" />
          <ActionButton icon={<Droplets className="h-4 w-4" />} label="სარწყავი" />
          <ActionButton icon={<Calendar className="h-4 w-4" />} label="R-Stages" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {[
          { key: 'overview', label: 'მიმოხილვა' },
          { key: 'rstages', label: 'R-Stages' },
          { key: 'disease', label: 'Frogeye' },
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
        {activeTab === 'rstages' && <RStagesTab />}
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
  const accentColor = '#65A30D'
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="R-Stage"
        value="V4"
        subtitle="4 ტრიფოლიუმი ფოთოლი"
        icon={<Leaf className="h-5 w-5" />}
        color={accentColor}
      />
      <StatCard
        title="Frogeye რისკი"
        value="დაბალი"
        subtitle="Cercospora sojina"
        icon={<AlertTriangle className="h-5 w-5" />}
        color="#10b981"
      />
      <StatCard
        title="GDD"
        value="350"
        subtitle="cum °C·day"
        icon={<TrendingUp className="h-5 w-5" />}
        color="#3b82f6"
      />
      <StatCard
        title="სპრეი"
        value="1"
        subtitle="დაგეგმილი"
        icon={<Calendar className="h-5 w-5" />}
        color="#10b981"
      />
    </div>
  )
}

function RStagesTab(): React.ReactElement {
  const stages = [
    { code: 'VE', name: 'Emergence', gdd: 50, completed: true },
    { code: 'VC', name: 'Cotyledon', gdd: 100, completed: true },
    { code: 'V1', name: 'First trifoliate', gdd: 150, completed: true },
    { code: 'V2', name: 'Second trifoliate', gdd: 200, completed: true },
    { code: 'V4', name: 'Fourth trifoliate', gdd: 300, completed: true, current: true },
    { code: 'V6', name: 'Sixth trifoliate', gdd: 450, completed: false },
    { code: 'R1', name: 'Beginning bloom', gdd: 700, completed: false },
    { code: 'R3', name: 'Beginning pod', gdd: 950, completed: false },
    { code: 'R5', name: 'Beginning seed', gdd: 1200, completed: false },
    { code: 'R7', name: 'Beginning maturity', gdd: 1600, completed: false },
    { code: 'R8', name: 'Full maturity', gdd: 1900, completed: false },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Soybean R-Stages</h3>
      <div className="relative">
        {stages.map((stage) => (
          <div key={stage.code} className="flex items-center gap-4 mb-4">
            <div className={`
              w-12 h-10 rounded-full flex items-center justify-center text-sm font-bold
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
        name="Frogeye Leaf Spot (Cercospora sojina)"
        risk={1}
        conditions="თბილი, ტენიანი ამინდი, ტემპ 24-28°C"
        recommendation="მონიტორინგი გრძელდება"
      />
      <DiseaseCard 
        name="White Mold (Sclerotinia sclerotiorum)"
        risk={0}
        conditions="ცივი, ტენიანი ამინდი - არა"
        recommendation="პროფილაქტიკა საჭირო არ არის"
      />
      <DiseaseCard 
        name="Brown Spot (Septoria glycines)"
        risk={1}
        conditions="მაღალი ტენიანობა, ჭარბი წვიმა"
        recommendation="მონიტორინგი გრძელდება"
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
          product="პიკსტრობინი"
          target="Frogeye"
          status="planned"
        />
        <SprayLogItem 
          date="28 მარტი, 2026"
          product="გლიფოსატი"
          target="საწმენდი"
          status="completed"
        />
        <SprayLogItem 
          date="15 მარტი, 2026"
          product="იმიდაკლოპრიდი"
          target="მწერები"
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
