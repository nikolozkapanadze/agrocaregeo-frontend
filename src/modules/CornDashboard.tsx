/** Corn Dashboard - Corn specific view */
import { useState } from 'react'
import { 
  Leaf, Droplets, Bug, Calendar, 
  TrendingUp, AlertTriangle, Thermometer
} from 'lucide-react'

export default function CornDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'phenology' | 'disease' | 'fao'>('overview')
  const accentColor = '#FDE047'

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
            <h1 className="text-2xl font-bold text-text-primary">სიმინდი</h1>
            <p className="text-text-muted">Corn Management • 200 ჰა</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <ActionButton icon={<Bug className="h-4 w-4" />} label="Fusarium" />
          <ActionButton icon={<Droplets className="h-4 w-4" />} label="სარწყავი" />
          <ActionButton icon={<Thermometer className="h-4 w-4" />} label="FAO Heat Units" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {[
          { key: 'overview', label: 'მიმოხილვა' },
          { key: 'phenology', label: 'ფენოლოგია' },
          { key: 'disease', label: 'Fusarium' },
          { key: 'fao', label: 'FAO Heat Units' },
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
        {activeTab === 'fao' && <FaoTab />}
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
        title="FAO Heat Units"
        value="420"
        subtitle="°C·day (base 10°C)"
        icon={<Thermometer className="h-5 w-5" />}
        color="#f59e0b"
      />
      <StatCard
        title="Fusarium რისკი"
        value="დაბალი"
        subtitle="F. graminearum"
        icon={<AlertTriangle className="h-5 w-5" />}
        color="#10b981"
      />
      <StatCard
        title="GDD"
        value="485"
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

function PhenologyTab(): React.ReactElement {
  const stages = [
    { code: 'VE', name: 'Emergence', gdd: 100, completed: true },
    { code: 'V2', name: '2 leaves', gdd: 200, completed: true },
    { code: 'V4', name: '4 leaves', gdd: 300, completed: true },
    { code: 'V6', name: '6 leaves', gdd: 400, completed: true, current: true },
    { code: 'V8', name: '8 leaves', gdd: 500, completed: false },
    { code: 'VT', name: 'Tasseling', gdd: 700, completed: false },
    { code: 'R1', name: 'Silking', gdd: 850, completed: false },
    { code: 'R2', name: 'Blister', gdd: 1100, completed: false },
    { code: 'R5', name: 'Dent', gdd: 1600, completed: false },
    { code: 'R6', name: 'Physiological maturity', gdd: 1900, completed: false },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Corn Growth Stages</h3>
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
        name="Fusarium Head Blight (F. graminearum)"
        risk={1}
        conditions="წვიმიანი ამინდი ყვავილობისას"
        recommendation="მონიტორინგი გრძელდება"
      />
      <DiseaseCard 
        name="ჩრჩილის დამწვრობა (Helminthosporium)"
        risk={0}
        conditions="მშრალი ამინდი - რისკი დაბალია"
        recommendation="პროფილაქტიკა საჭირო არ არის"
      />
      <DiseaseCard 
        name="ბაქტერიული ჭინჭარი (Pseudomonas)"
        risk={0}
        conditions="ცივი, ტენიანი ამინდი - არა"
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

function FaoTab(): React.ReactElement {
  const units = [
    { date: '4 აპრილი', temp: '18°C', hu: '8 HU', cumulative: '420 HU' },
    { date: '3 აპრილი', temp: '19°C', hu: '9 HU', cumulative: '412 HU' },
    { date: '2 აპრილი', temp: '17°C', hu: '7 HU', cumulative: '403 HU' },
    { date: '1 აპრილი', temp: '20°C', hu: '10 HU', cumulative: '396 HU' },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">FAO Heat Units</h3>
        <div className="text-right">
          <p className="text-sm text-text-muted">ბაზის ტემპ: 10°C</p>
          <p className="text-sm font-medium text-accent">მიზანი: 1900 HU</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {units.map((day, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-yellow-300/20 flex items-center justify-center">
              <Thermometer className="h-5 w-5 text-yellow-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{day.date}</p>
              <p className="text-xs text-text-muted">ტემპ: {day.temp}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">+{day.hu}</p>
              <p className="text-xs text-text-muted">სულ: {day.cumulative}</p>
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
