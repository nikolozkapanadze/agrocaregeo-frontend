/** Walnut Dashboard - Walnut specific view */
import { useState } from 'react'
import { 
  Leaf, Droplets, Bug, Calendar, 
  TrendingUp, AlertTriangle, Thermometer
} from 'lucide-react'

export default function WalnutDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'phenology' | 'disease' | 'frost'>('overview')
  const accentColor = '#78350F'

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
            <h1 className="text-2xl font-bold text-text-primary">კაკალი</h1>
            <p className="text-text-muted">Walnut Management • 10 ნაკვეთი</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <ActionButton icon={<Bug className="h-4 w-4" />} label="დაავადებები" />
          <ActionButton icon={<Droplets className="h-4 w-4" />} label="მორწყვა" />
          <ActionButton icon={<Thermometer className="h-4 w-4" />} label="ყინვის მონიტორინგი" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {[
          { key: 'overview', label: 'მიმოხილვა' },
          { key: 'phenology', label: 'ფენოლოგია' },
          { key: 'disease', label: 'Blight რისკი' },
          { key: 'frost', label: 'ყინვის დაცვა' },
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
        {activeTab === 'frost' && <FrostTab />}
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
        title="Blight რისკი"
        value="საშუალო"
        subtitle="Xanthomonas arboricola"
        icon={<AlertTriangle className="h-5 w-5" />}
        color="#f59e0b"
      />
      <StatCard
        title="ყინვის რისკი"
        value="დაბალი"
        subtitle="მინ. ტემპ: +5°C"
        icon={<Thermometer className="h-5 w-5" />}
        color="#10b981"
      />
      <StatCard
        title="GDD"
        value="450"
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
    { code: '00', name: 'Bud dormancy', gdd: 0, completed: true },
    { code: '09', name: 'Bud break', gdd: 180, completed: true },
    { code: '11', name: 'First leaf', gdd: 350, completed: true, current: true },
    { code: '31', name: 'Male flower', gdd: 500, completed: false },
    { code: '61', name: 'Female flower', gdd: 650, completed: false },
    { code: '71', name: 'Fruit set', gdd: 950, completed: false },
    { code: '81', name: 'Nut fill', gdd: 1400, completed: false },
    { code: '89', name: 'Harvest', gdd: 2000, completed: false },
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
        name="კაკლის Blight (Xanthomonas arboricola pv. juglandis)"
        risk={2}
        conditions="წვიმიანი ამინდი, ტემპერატურა 18-25°C"
        recommendation="სპრეი სპილენძის პრეპარატებით"
      />
      <DiseaseCard 
        name="კაკლის ანთრაკნოზი (Gnomonia leptostyla)"
        risk={1}
        conditions="ჭექა-ქუხილი, მაღალი ტენიანობა"
        recommendation="მონიტორინგი გრძელდება"
      />
      <DiseaseCard 
        name="კაკლის ბაქტერიოზი"
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

function FrostTab(): React.ReactElement {
  const forecasts = [
    { date: '4 აპრილი', minTemp: '+5°C', risk: 'არა', action: 'მონიტორინგი' },
    { date: '5 აპრილი', minTemp: '+3°C', risk: 'არა', action: 'მონიტორინგი' },
    { date: '6 აპრილი', minTemp: '+1°C', risk: 'დაბალი', action: 'მზადყოფნა' },
    { date: '7 აპრილი', minTemp: '-2°C', risk: 'მაღალი', action: 'ყინვის დაცვა' },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">ყინვის პროგნოზი</h3>
        <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">
          დაცვის სისტემის ჩართვა
        </button>
      </div>
      
      <div className="space-y-3">
        {forecasts.map((forecast, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-amber-800/20 flex items-center justify-center">
              <Thermometer className="h-5 w-5 text-amber-800" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{forecast.date}</p>
              <p className="text-xs text-text-muted">მინ. ტემპ: {forecast.minTemp}</p>
            </div>
            <div className="text-right">
              <span className={`
                text-xs px-2 py-1 rounded
                ${forecast.risk === 'მაღალი' 
                  ? 'bg-danger/20 text-danger' 
                  : forecast.risk === 'დაბალი'
                    ? 'bg-warning/20 text-warning'
                    : 'bg-success/20 text-success'
                }
              `}>
                {forecast.risk}
              </span>
              <p className="text-xs text-text-muted mt-1">{forecast.action}</p>
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
