/** Tea Dashboard - Tea specific view */
import { useState } from 'react'
import { 
  Leaf, Droplets, Bug, Calendar, 
  TrendingUp, AlertTriangle, Sprout
} from 'lucide-react'

export default function TeaDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'flush' | 'disease' | 'spray'>('overview')
  const accentColor = '#15803D'

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
            <h1 className="text-2xl font-bold text-text-primary">ჩაი</h1>
            <p className="text-text-muted">Tea Management • 20 ჰა</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <ActionButton icon={<Bug className="h-4 w-4" />} label="Blister Blight" />
          <ActionButton icon={<Droplets className="h-4 w-4" />} label="მორწყვა" />
          <ActionButton icon={<Sprout className="h-4 w-4" />} label="Flush მონიტორინგი" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {[
          { key: 'overview', label: 'მიმოხილვა' },
          { key: 'flush', label: 'Flush ფენოლოგია' },
          { key: 'disease', label: 'Blister Blight' },
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
        {activeTab === 'flush' && <FlushTab />}
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
  const accentColor = '#15803D'
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Blister Blight რისკი"
        value="მაღალი"
        subtitle="Exobasidium vexans"
        icon={<AlertTriangle className="h-5 w-5" />}
        color="#ef4444"
        alert
      />
      <StatCard
        title="მიმდინარე Flush"
        value="First"
        subtitle="ახალი ფოთლების ზრდა"
        icon={<Sprout className="h-5 w-5" />}
        color={accentColor}
      />
      <StatCard
        title="GDD"
        value="420"
        subtitle="cum °C·day"
        icon={<TrendingUp className="h-5 w-5" />}
        color="#3b82f6"
      />
      <StatCard
        title="სპრეი"
        value="4"
        subtitle="დაგეგმილი"
        icon={<Calendar className="h-5 w-5" />}
        color="#10b981"
      />
    </div>
  )
}

function FlushTab(): React.ReactElement {
  const flushes = [
    { name: 'First Flush', period: 'მარტი-აპრილი', status: 'აქტიური', quality: 'პრემიუმ' },
    { name: 'Second Flush', period: 'მაისი-ივნისი', status: 'მომავალი', quality: 'მაღალი' },
    { name: 'Rainy Flush', period: 'ივლისი-სექტემბერი', status: 'მომავალი', quality: 'სტანდარტი' },
    { name: 'Autumn Flush', period: 'ოქტომბერი-ნოემბერი', status: 'მომავალი', quality: 'მაღალი' },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Flush ფენოლოგია</h3>
      <div className="relative">
        {flushes.map((flush, index) => (
          <div key={flush.name} className="flex items-center gap-4 mb-4">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
              ${flush.status === 'აქტიური'
                ? 'bg-accent text-white' 
                : 'bg-white/5 text-text-muted'
              }
            `}>
              {index + 1}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${flush.status === 'აქტიური' ? 'text-accent' : 'text-text-primary'}`}>
                {flush.name}
              </p>
              <p className="text-xs text-text-muted">{flush.period}</p>
            </div>
            <div className="text-right">
              <span className={`
                text-xs px-2 py-1 rounded
                ${flush.quality === 'პრემიუმ' 
                  ? 'bg-success/20 text-success' 
                  : flush.quality === 'მაღალი'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-white/10 text-text-secondary'
                }
              `}>
                {flush.quality}
              </span>
              <p className="text-xs text-text-muted mt-1">{flush.status}</p>
            </div>
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
        name="Blister Blight (Exobasidium vexans)"
        risk={3}
        conditions="ტენიანობა >90%, ტემპერატურა 18-24°C"
        recommendation="სასწრაფო სპრეი კოპერის ოქსიქლორიდით"
      />
      <DiseaseCard 
        name="ჭკნობა (Phomopsis theae)"
        risk={1}
        conditions="ჭარბი წვიმა, მაღალი ტენიანობა"
        recommendation="მონიტორინგი გრძელდება"
      />
      <DiseaseCard 
        name="ჩაის ჭია (Empoasca vitis)"
        risk={1}
        conditions="მშრალი, ცხელი ამინდი"
        recommendation="ინსექტიციდი საჭიროებისამებრ"
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
          product="კოპერის ოქსიქლორიდი"
          target="Blister Blight"
          status="planned"
        />
        <SprayLogItem 
          date="28 მარტი, 2026"
          product="ბავისტინი"
          target="ჭკნობა"
          status="completed"
        />
        <SprayLogItem 
          date="15 მარტი, 2026"
          product="მალათიონი"
          target="ჭია"
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
