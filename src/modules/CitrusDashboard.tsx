/** Citrus Dashboard - Citrus specific view */
import { useState } from 'react'
import { 
  Leaf, Droplets, Calendar, 
  TrendingUp, Gauge
} from 'lucide-react'

export default function CitrusDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'phenology' | 'brix' | 'harvest'>('overview')
  const accentColor = '#EAB308'

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
            <h1 className="text-2xl font-bold text-text-primary">ციტრუსი</h1>
            <p className="text-text-muted">Citrus Management • 25 ჰა</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <ActionButton icon={<Gauge className="h-4 w-4" />} label="Brix ანალიზი" />
          <ActionButton icon={<Droplets className="h-4 w-4" />} label="მორწყვა" />
          <ActionButton icon={<Calendar className="h-4 w-4" />} label="მოსავალი" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {[
          { key: 'overview', label: 'მიმოხილვა' },
          { key: 'phenology', label: 'ფენოლოგია' },
          { key: 'brix', label: 'Brix აკუმულაცია' },
          { key: 'harvest', label: 'მოსავლის ინდექსი' },
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
        {activeTab === 'brix' && <BrixTab />}
        {activeTab === 'harvest' && <HarvestTab />}
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
  const accentColor = '#EAB308'
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Brix აკუმულაცია"
        value="10.2%"
        subtitle="მიზანი: 12%+"
        icon={<Gauge className="h-5 w-5" />}
        color={accentColor}
      />
      <StatCard
        title="მოსავლის ინდექსი"
        value="78%"
        subtitle="მზადყოფნის დონე"
        icon={<TrendingUp className="h-5 w-5" />}
        color="#3b82f6"
      />
      <StatCard
        title="GDD"
        value="680"
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
    { code: '51', name: 'Inflorescence emergence', gdd: 400, completed: true },
    { code: '61', name: 'First flower open', gdd: 550, completed: true },
    { code: '65', name: 'Full flowering', gdd: 700, completed: true },
    { code: '71', name: 'Fruit set', gdd: 900, completed: true },
    { code: '75', name: 'Fruit growth', gdd: 1200, completed: true, current: true },
    { code: '81', name: 'Color break', gdd: 1800, completed: false },
    { code: '85', name: 'Ripening', gdd: 2200, completed: false },
    { code: '89', name: 'Harvest', gdd: 2500, completed: false },
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

function BrixTab(): React.ReactElement {
  const samples = [
    { date: '28 მარტი, 2026', brix: '10.2%', acid: '1.8%', ratio: '5.7' },
    { date: '21 მარტი, 2026', brix: '9.5%', acid: '2.0%', ratio: '4.8' },
    { date: '14 მარტი, 2026', brix: '8.8%', acid: '2.2%', ratio: '4.0' },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Brix აკუმულაცია</h3>
        <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">
          + ახალი ანალიზი
        </button>
      </div>
      
      <div className="space-y-3">
        {samples.map((sample, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Gauge className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{sample.date}</p>
              <p className="text-xs text-text-muted">მჟავიანობა: {sample.acid}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">{sample.brix}</p>
              <p className="text-xs text-text-muted">Ratio: {sample.ratio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HarvestTab(): React.ReactElement {
  const blocks = [
    { name: 'ბლოკი A', variety: 'ფორთოხალი', readiness: 85, status: 'მზად' },
    { name: 'ბლოკი B', variety: 'მანდარინი', readiness: 72, status: 'მომავალი' },
    { name: 'ბლოკი C', variety: 'ლიმონი', readiness: 65, status: 'მომავალი' },
    { name: 'ბლოკი D', variety: 'გრეიფრუტი', readiness: 58, status: 'მომავალი' },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">მოსავლის ინდექსი</h3>
        <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">
          ყველას განახლება
        </button>
      </div>
      
      <div className="space-y-3">
        {blocks.map((block) => (
          <div key={block.name} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{block.name}</p>
              <p className="text-xs text-text-muted">{block.variety}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${block.readiness}%` }}
                />
              </div>
              <span className="text-sm text-text-primary">{block.readiness}%</span>
              <span className={`
                text-xs px-2 py-1 rounded
                ${block.status === 'მზად' 
                  ? 'bg-success/20 text-success' 
                  : 'bg-white/10 text-text-secondary'
                }
              `}>
                {block.status}
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
