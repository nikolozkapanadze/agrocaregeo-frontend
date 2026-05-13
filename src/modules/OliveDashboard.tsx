/** Olive Dashboard - Olive specific view */
import { useState } from 'react'
import { 
  Leaf, Droplets, Bug, Calendar, 
  TrendingUp, FlaskConical
} from 'lucide-react'

export default function OliveDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'phenology' | 'disease' | 'oil'>('overview')
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
            <h1 className="text-2xl font-bold text-text-primary">ზეთისხილი</h1>
            <p className="text-text-muted">Olive Management • 15 ნაკვეთი</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <ActionButton icon={<Bug className="h-4 w-4" />} label="მწერების ხაფანგი" />
          <ActionButton icon={<Droplets className="h-4 w-4" />} label="მორწყვა" />
          <ActionButton icon={<FlaskConical className="h-4 w-4" />} label="ზეთის შემცველობა" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {[
          { key: 'overview', label: 'მიმოხილვა' },
          { key: 'phenology', label: 'ფენოლოგია' },
          { key: 'disease', label: 'მწერები' },
          { key: 'oil', label: 'ზეთის ანალიზი' },
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
        {activeTab === 'oil' && <OilTab />}
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
        title="ზეთის შემცველობა"
        value="18.5%"
        subtitle="მოსალოდნელი მოსავალზე"
        icon={<FlaskConical className="h-5 w-5" />}
        color={accentColor}
      />
      <StatCard
        title="მწერების ხაფანგი"
        value="3"
        subtitle="აქტიური მონიტორინგი"
        icon={<Bug className="h-5 w-5" />}
        color="#f59e0b"
      />
      <StatCard
        title="GDD"
        value="520"
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

function PhenologyTab(): React.ReactElement {
  const stages = [
    { code: '51', name: 'Inflorescence emergence', gdd: 400, completed: true },
    { code: '55', name: 'Flower buds visible', gdd: 550, completed: true },
    { code: '60', name: 'First flowers open', gdd: 700, completed: true, current: true },
    { code: '65', name: 'Full flowering', gdd: 850, completed: false },
    { code: '71', name: 'Fruit set', gdd: 1000, completed: false },
    { code: '75', name: 'Fruit growth', gdd: 1300, completed: false },
    { code: '81', name: 'Fruit ripening', gdd: 1800, completed: false },
    { code: '89', name: 'Harvest', gdd: 2200, completed: false },
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
        name="ზეთისხილის მწერი (Bactrocera oleae)"
        risk={2}
        conditions="ტემპერატურა 20-30°C, მაღალი ტენიანობა"
        recommendation="მწერების ხაფანგების შემოწმება"
      />
      <DiseaseCard 
        name="ზეთისხილის კალია (Prays oleae)"
        risk={1}
        conditions="ყვავილობის პერიოდი - მონიტორინგი"
        recommendation="ფერომონის ხაფანგები დამატებულია"
      />
      <DiseaseCard 
        name="ფილოსტიქტა (Phloeotribus scarabaeoides)"
        risk={0}
        conditions="დაბალი რისკი - ცივი ამინდი"
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

function OilTab(): React.ReactElement {
  const samples = [
    { date: '28 მარტი, 2026', oilContent: '16.2%', acidity: '0.4%', quality: 'ექსტრა ვირჯინი' },
    { date: '15 მარტი, 2026', oilContent: '15.8%', acidity: '0.5%', quality: 'ექსტრა ვირჯინი' },
    { date: '1 მარტი, 2026', oilContent: '14.5%', acidity: '0.6%', quality: 'ვირჯინი' },
  ]

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">ზეთის ანალიზი</h3>
        <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">
          + ახალი ანალიზი
        </button>
      </div>
      
      <div className="space-y-3">
        {samples.map((sample, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-lime-600/20 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-lime-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{sample.date}</p>
              <p className="text-xs text-text-muted">მჟავიანობა: {sample.acidity}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">{sample.oilContent}</p>
              <span className="text-xs px-2 py-1 rounded bg-success/20 text-success">
                {sample.quality}
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
