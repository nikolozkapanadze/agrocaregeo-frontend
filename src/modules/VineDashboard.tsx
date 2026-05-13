/** Vine Dashboard - Vineyard specific view with real data */
import { useState, useEffect } from 'react'
import { 
  Leaf, Droplets, Bug, Calendar, 
  TrendingUp, AlertTriangle, Loader, RefreshCw
} from 'lucide-react'
import { getVinePhenology, getVineDiseasePressure, type VinePhenology, type VineDiseasePressure } from '@/shared/api/services/vine.service'
import { parcels } from '@/shared/lib/api'
import type { Parcel } from '@/shared/lib/api'

export default function VineDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'phenology' | 'disease' | 'spray'>('overview')
  const [selectedParcelId, setSelectedParcelId] = useState<string>('')
  
  // Real data states
  const [phenology, setPhenology] = useState<VinePhenology | null>(null)
  const [diseasePressure, setDiseasePressure] = useState<VineDiseasePressure | null>(null)
  const [vineParcels, setVineParcels] = useState<Parcel[]>([])
  
  // Loading states
  const [parcelsLoading, setParcelsLoading] = useState(true)
  const [phenologyLoading, setPhenologyLoading] = useState(false)
  const [diseaseLoading, setDiseaseLoading] = useState(false)
  
  // Error states
  const [parcelsError, setParcelsError] = useState<string | null>(null)
  const [phenologyError, setPhenologyError] = useState<string | null>(null)
  const [diseaseError, setDiseaseError] = useState<string | null>(null)

  // Fetch vine parcels on mount
  useEffect(() => {
    const fetchParcels = async () => {
      setParcelsLoading(true)
      setParcelsError(null)
      try {
        const data = await parcels.list(1, 100)
        const vineOnly = data.items?.filter((p: Parcel) => p.crop_type === 'vine') || []
        setVineParcels(vineOnly)
        // Auto-select first parcel
        if (vineOnly.length > 0 && !selectedParcelId) {
          setSelectedParcelId(vineOnly[0].id)
        }
      } catch (err) {
        console.error('Failed to load parcels:', err)
        setParcelsError('ნაკვეთების ჩატვირთვა ვერ მოხერხდა')
      } finally {
        setParcelsLoading(false)
      }
    }
    
    fetchParcels()
  }, [])

  // Fetch phenology when parcel changes
  useEffect(() => {
    if (!selectedParcelId) return
    
    const fetchPhenology = async () => {
      setPhenologyLoading(true)
      setPhenologyError(null)
      try {
        const data = await getVinePhenology(selectedParcelId)
        setPhenology(data)
      } catch (err) {
        console.error('Failed to load phenology:', err)
        setPhenologyError('ფენოლოგიური მონაცემების ჩატვირთვა ვერ მოხერხდა')
      } finally {
        setPhenologyLoading(false)
      }
    }
    
    fetchPhenology()
  }, [selectedParcelId])

  // Fetch disease pressure when parcel changes
  useEffect(() => {
    if (!selectedParcelId) return
    
    const fetchDisease = async () => {
      setDiseaseLoading(true)
      setDiseaseError(null)
      try {
        const data = await getVineDiseasePressure(selectedParcelId)
        setDiseasePressure(data)
      } catch (err) {
        console.error('Failed to load disease pressure:', err)
        setDiseaseError('დაავადების რისკების ჩატვირთვა ვერ მოხერხდა')
      } finally {
        setDiseaseLoading(false)
      }
    }
    
    fetchDisease()
  }, [selectedParcelId])

  // Stats for overview
  const totalArea = vineParcels.reduce((sum, p) => sum + (p.area_ha || 0), 0)
  const alertCount = diseasePressure ? 
    [diseasePressure.downy_mildew, diseasePressure.powdery_mildew, diseasePressure.botrytis]
      .filter(r => r >= 2).length 
    : 0

  // Refresh handler
  const handleRefresh = () => {
    if (selectedParcelId) {
      // Re-fetch phenology and disease
      const fetchPhenology = async () => {
        setPhenologyLoading(true)
        setPhenologyError(null)
        try {
          const data = await getVinePhenology(selectedParcelId)
          setPhenology(data)
        } catch (err) {
          setPhenologyError('ფენოლოგიური მონაცემების ჩატვირთვა ვერ მოხერხდა')
        } finally {
          setPhenologyLoading(false)
        }
      }
      
      const fetchDisease = async () => {
        setDiseaseLoading(true)
        setDiseaseError(null)
        try {
          const data = await getVineDiseasePressure(selectedParcelId)
          setDiseasePressure(data)
        } catch (err) {
          setDiseaseError('დაავადების რისკების ჩატვირთვა ვერ მოხერხდა')
        } finally {
          setDiseaseLoading(false)
        }
      }
      
      fetchPhenology()
      fetchDisease()
    }
  }

  if (parcelsLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (parcelsError) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">შეცდომა</h2>
        <p className="text-text-muted">{parcelsError}</p>
      </div>
    )
  }

  if (vineParcels.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Leaf className="h-12 w-12 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">ვენახი არ არის</h2>
        <p className="text-text-muted">დაამატეთ ვენახის ნაკვეთები ნაკვეთების გვერდზე</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20">
            <Leaf className="h-7 w-7 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">ვენახი</h1>
            <p className="text-text-muted">
              Vineyard Management • {vineParcels.length} ნაკვეთი • {totalArea.toFixed(1)} ჰა
            </p>
          </div>
        </div>

        {/* Parcel Selector */}
        <div className="flex items-center gap-4">
          <select 
            className="input py-2"
            value={selectedParcelId}
            onChange={(e) => setSelectedParcelId(e.target.value)}
          >
            <option value="">აირჩიეთ ნაკვეთი</option>
            {vineParcels.map(p => (
              <option key={p.id} value={p.id}>#{p.parcel_nr} ({p.area_ha} ჰა)</option>
            ))}
          </select>
          
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted"
            title="განახლება"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          {/* Quick actions */}
          <div className="flex gap-2">
            <ActionButton icon={<Bug className="h-4 w-4" />} label="დაავადებები" />
            <ActionButton icon={<Droplets className="h-4 w-4" />} label="მორწყვა" />
            <ActionButton icon={<Calendar className="h-4 w-4" />} label="სპრეი" />
          </div>
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
        {activeTab === 'overview' && (
          <OverviewTab 
            phenology={phenology} 
            alertCount={alertCount}
            parcelCount={vineParcels.length}
          />
        )}
        {activeTab === 'phenology' && (
          <PhenologyTab 
            phenology={phenology} 
            loading={phenologyLoading} 
            error={phenologyError}
          />
        )}
        {activeTab === 'disease' && (
          <DiseaseTab 
            diseasePressure={diseasePressure}
            loading={diseaseLoading}
            error={diseaseError}
          />
        )}
        {activeTab === 'spray' && <SprayTab parcelId={selectedParcelId} />}
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
  phenology, 
  alertCount,
  parcelCount
}: { 
  phenology: VinePhenology | null
  alertCount: number
  parcelCount: number
}): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="BBCH ფაზა"
        value={phenology?.bbch_code || '-'}
        subtitle={phenology?.growth_stage || 'მიმდინარე ფაზა'}
        icon={<Leaf className="h-5 w-5" />}
        color="#8B5CF6"
      />
      <StatCard
        title="გაფრთხილებები"
        value={String(alertCount)}
        subtitle="აქტიური"
        icon={<AlertTriangle className="h-5 w-5" />}
        color="#ef4444"
        alert={alertCount > 0}
      />
      <StatCard
        title="GDD"
        value={phenology?.cum_gdd ? Math.round(phenology.cum_gdd).toString() : '-'}
        subtitle="cum °C·day"
        icon={<TrendingUp className="h-5 w-5" />}
        color="#3b82f6"
      />
      <StatCard
        title="ნაკვეთები"
        value={String(parcelCount)}
        subtitle="სულ"
        icon={<Leaf className="h-5 w-5" />}
        color="#10b981"
      />
    </div>
  )
}

function PhenologyTab({ 
  phenology, 
  loading,
  error
}: { 
  phenology: VinePhenology | null
  loading: boolean
  error: string | null
}): React.ReactElement {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center text-danger">
        <AlertTriangle className="h-6 w-6 mr-2" />
        {error}
      </div>
    )
  }

  if (!phenology) {
    return (
      <div className="h-64 flex items-center justify-center text-text-muted">
        ფენოლოგიური მონაცემები არ არის
      </div>
    )
  }

  // Progress percentage (max 1500 GDD)
  const progressPct = Math.min(100, Math.round((phenology.cum_gdd / 1500) * 100))

  // BBCH stages for visualization
  const stages = [
    { code: '00', name: 'Bud dormancy', gdd: 0 },
    { code: '01', name: 'Bud swell', gdd: 100 },
    { code: '09', name: 'Green tip', gdd: 150 },
    { code: '19', name: 'First leaf unfolded', gdd: 250 },
    { code: '31', name: 'Beginning of flowering', gdd: 500 },
    { code: '35', name: 'Full flowering', gdd: 600 },
    { code: '71', name: 'Fruit set', gdd: 800 },
    { code: '79', name: 'Berries touch', gdd: 1000 },
    { code: '85', name: 'Veraison', gdd: 1200 },
    { code: '89', name: 'Harvest ready', gdd: 1500 },
  ]

  // const currentStageNum = parseInt(phenology.bbch_code) || 0  // Used for future logic

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">BBCH ფენოლოგია</h3>
        <div className="text-sm text-text-muted">
          GDD: <span className="text-accent font-medium">{Math.round(phenology.cum_gdd)}</span>
          <span className="ml-2">/ 1500</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-text-muted mb-2">
          <span>0 GDD</span>
          <span>მიმდინარე: {phenology.growth_stage}</span>
          <span>1500 GDD</span>
        </div>
        <div className="h-4 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-center text-sm text-text-muted mt-2">
          {progressPct}% დასრულებული
        </div>
      </div>
      
      {/* Stages List */}
      <div className="space-y-2">
        {stages.map((stage) => {
          const isCompleted = phenology.cum_gdd >= stage.gdd
          const isCurrent = phenology.bbch_code === stage.code
          
          return (
            <div key={stage.code} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                ${isCurrent 
                  ? 'bg-accent text-white ring-2 ring-accent/50' 
                  : isCompleted
                    ? 'bg-success/20 text-success'
                    : 'bg-white/5 text-text-muted'
                }
              `}>
                {stage.code}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isCurrent ? 'text-accent' : 'text-text-primary'}`}>
                  {stage.name}
                </p>
                <p className="text-xs text-text-muted">GDD: {stage.gdd}</p>
              </div>
              {isCurrent && (
                <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full font-medium">
                  მიმდინარე
                </span>
              )}
              {isCompleted && !isCurrent && (
                <span className="text-xs text-success">✓ დასრულებული</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DiseaseTab({ 
  diseasePressure,
  loading,
  error
}: { 
  diseasePressure: VineDiseasePressure | null
  loading: boolean
  error: string | null
}): React.ReactElement {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center text-danger">
        <AlertTriangle className="h-6 w-6 mr-2" />
        {error}
      </div>
    )
  }

  if (!diseasePressure) {
    return (
      <div className="bg-bg-card rounded-2xl border border-white/5 p-8 text-center">
        <p className="text-text-muted">დაავადებების მონაცემები არ არის</p>
      </div>
    )
  }

  const diseases = [
    { key: 'downy_mildew', name: 'ჭკნობა (Plasmopara)', level: diseasePressure.downy_mildew },
    { key: 'powdery_mildew', name: 'ნაცრისფერი მაცვარის (Erysiphe)', level: diseasePressure.powdery_mildew },
    { key: 'botrytis', name: 'ბოტრიტისი (Botrytis)', level: diseasePressure.botrytis },
  ]

  return (
    <div className="space-y-4">
      {diseasePressure.spray_recommended && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-danger" />
          <div>
            <p className="text-danger font-medium">სპრეი რეკომენდირებულია</p>
            <p className="text-sm text-text-muted">მაღალი რისკის დონეები აღმოჩენილია</p>
          </div>
        </div>
      )}
      
      {diseases.map((disease) => (
        <DiseaseCard 
          key={disease.key}
          name={disease.name}
          risk={disease.level}
        />
      ))}
    </div>
  )
}

function DiseaseCard({ 
  name,
  risk
}: { 
  name: string
  risk: number
}): React.ReactElement {
  // Risk colors: 0=green, 1=yellow, 2=orange, 3=red
  const riskConfig = {
    0: { label: 'არ არის', color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/30' },
    1: { label: 'დაბალი', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30' },
    2: { label: 'საშუალო', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
    3: { label: 'მაღალი', color: 'text-danger', bgColor: 'bg-danger/10', borderColor: 'border-danger/30' },
  }
  
  const config = riskConfig[risk as keyof typeof riskConfig] || riskConfig[0]

  return (
    <div className={`rounded-2xl border p-5 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-text-primary">{name}</h4>
          <p className="text-sm text-text-muted mt-1">
            რისკის დონე: <span className={`font-medium ${config.color}`}>{config.label}</span>
          </p>
        </div>
        <div className={`
          px-4 py-2 rounded-xl text-sm font-bold
          ${risk === 0 ? 'bg-success text-white' : ''}
          ${risk === 1 ? 'bg-warning text-black' : ''}
          ${risk === 2 ? 'bg-orange-500 text-white' : ''}
          ${risk === 3 ? 'bg-danger text-white' : ''}
        `}>
          {risk}/3
        </div>
      </div>
    </div>
  )
}

function SprayTab({ parcelId }: { parcelId: string }): React.ReactElement {
  const [sprayLog, setSprayLog] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!parcelId) return
    
    const fetchSprayLog = async () => {
      setLoading(true)
      try {
        // Import dynamically to avoid circular dependency
        const { vineService } = await import('@/shared/api/services/vine.service')
        const data = await vineService.getSprayLog(parcelId, 10)
        setSprayLog(data || [])
      } catch (err) {
        console.error('Failed to load spray log:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSprayLog()
  }, [parcelId])

  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">სპრეის გრაფიკი</h3>
        <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">
          + ახალი სპრეი
        </button>
      </div>
      
      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : sprayLog.length === 0 ? (
        <p className="text-text-muted text-center py-8">სპრეის ჩანაწერები არ არის</p>
      ) : (
        <div className="space-y-3">
          {sprayLog.map((entry: any, idx: number) => (
            <SprayLogItem 
              key={idx}
              date={new Date(entry.spray_date).toLocaleDateString('ka-GE')}
              product={entry.product_name}
              target={entry.disease_key || 'პროფილაქტიკა'}
              status="completed"
            />
          ))}
        </div>
      )}
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
