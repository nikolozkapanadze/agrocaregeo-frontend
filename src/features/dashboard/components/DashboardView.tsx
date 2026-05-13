import React from 'react'
import { 
  RefreshCw, 
  Satellite, 
  Cloud, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  MapPin, 
  Leaf, 
  Droplets, 
  ArrowRight, 
  Activity, 
  Upload 
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ZoneStats, TrendSummary } from '@/shared/lib/api'
import type { SyncStatus, ActionState } from '../services/dashboard.service'
import ZoneStatsCards from './ZoneStatsCards'
import TrendStatsCards from './TrendStatsCards'
import ParcelMap from '@/features/parcels/components/ParcelMap'
import MoonWidget from '@/features/harvest/components/MoonWidget'
import { ParcelUpload } from '@/features/parcels/components/ParcelUpload'
import { SARPanel } from '@/features/ndvi/components/SARPanel'


interface DashboardViewProps {
  // Data
  stats: ZoneStats | null
  trendSummary: TrendSummary | null
  syncStatus: SyncStatus | null
  
  // Loading states
  statsLoading: boolean
  trendLoading: boolean
  pendingRefresh: boolean
  
  // Action states
  analysisState: ActionState
  weatherState: ActionState
  satelliteState: ActionState
  
  // Actions
  onRunAnalysis: () => void
  onRunWeather: () => void
  onRunSatellite: () => void
  onParcelsRefresh: () => void
  
  // Computed
  totalZones: number
  criticalCount: number
  okCount: number
  daysStale: number | null
}

function ActionButton({
  label,
  icon,
  onClick,
  state,
  variant = 'primary',
}: {
  label: string
  icon: React.ReactElement
  onClick: () => void
  state: ActionState
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  const baseClasses = 'relative flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
  
  const variants = {
    primary: `${baseClasses} btn-primary`,
    secondary: `${baseClasses} btn-secondary`,
    ghost: `${baseClasses} text-text-secondary hover:text-accent hover:bg-accent/5 px-3 py-2 rounded-xl`,
  }

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={state.loading}
        className={variants[variant]}
      >
        {state.loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
        )}
        <span className="hidden sm:inline font-medium">{label}</span>
      </button>
      {state.success && (
        <div className="absolute right-0 top-12 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-accent/10 border border-accent/30 px-3 py-2 text-xs text-accent backdrop-blur-xl shadow-elevation-3 animate-slide-down">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {state.success}
        </div>
      )}
      {state.error && (
        <div className="absolute right-0 top-12 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger backdrop-blur-xl shadow-elevation-3 animate-slide-down">
          <AlertCircle className="h-3.5 w-3.5" />
          {state.error}
        </div>
      )}
    </div>
  )
}

function StatPill({ value, label, color, trend }: { value: string | number; label: string; color: string; trend?: 'up' | 'down' | 'stable' }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.10] transition-all duration-200 group">
      <div className="relative">
        <span 
          className="block w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-125" 
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}50` }} 
        />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold font-mono tabular-nums" style={{ color }}>{value}</span>
          {trend && (
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-accent' : trend === 'down' ? 'text-danger' : 'text-text-muted'}`}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
          )}
        </div>
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-display">{label}</span>
      </div>
    </div>
  )
}

function QuickLink({ to, icon, title, subtitle, color }: { to: string; icon: React.ReactElement; title: string; subtitle: string; color: string }) {
  return (
    <Link 
      to={to} 
      className="group relative overflow-hidden rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 hover:border-white/[0.12] transition-all duration-300 hover:shadow-elevation-2"
    >
      {/* Hover gradient overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
        style={{ background: `radial-gradient(circle at top left, ${color}12, transparent 60%)` }}
      />
      
      <div className="relative flex items-start gap-3">
        <div 
          className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
          style={{ backgroundColor: `${color}15`, color, boxShadow: `0 0 0 1px ${color}20` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-text-primary text-sm group-hover:text-white transition-colors">{title}</h3>
            <ArrowRight className="h-3.5 w-3.5 text-text-muted opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style={{ color }} />
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>
    </Link>
  )
}

function SectionHeader({ title, icon, action }: { title: string; icon: React.ReactElement; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="text-accent">{icon}</div>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-[0.12em] font-display">{title}</h3>
      </div>
      {action}
    </div>
  )
}

function SyncStatusBadge({ daysStale }: { daysStale: number | null }) {
  if (daysStale === null) {
    return (
      <div className="text-xs text-text-muted bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 backdrop-blur-sm">
        სატელიტი: მონაცემები არ არის
      </div>
    )
  }
  
  if (daysStale > 7) {
    return (
      <div className="text-xs text-warning bg-warning/10 border border-warning/30 rounded-lg px-3 py-1.5 flex items-center gap-2 backdrop-blur-sm shadow-glow-yellow">
        <AlertCircle className="h-3.5 w-3.5" />
        სატელიტი: {daysStale} დღის წინ
      </div>
    )
  }
  
  return (
    <div className="text-xs text-accent bg-accent/10 border border-accent/30 rounded-lg px-3 py-1.5 flex items-center gap-2 backdrop-blur-sm shadow-glow-sm">
      <CheckCircle2 className="h-3.5 w-3.5" />
      სატელიტი: {daysStale === 0 ? 'დღეს' : `${daysStale} დღის წინ`}
    </div>
  )
}

export default function DashboardView({
  stats,
  trendSummary,
  syncStatus,
  statsLoading,
  trendLoading,
  pendingRefresh,
  analysisState,
  weatherState,
  satelliteState,
  onRunAnalysis,
  onRunWeather,
  onRunSatellite,
  onParcelsRefresh,
  totalZones,
  criticalCount,
  okCount,
  daysStale,
}: DashboardViewProps): React.ReactElement {
return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-5 overflow-hidden">
      {/* Top Bar - Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-accent to-sensor shadow-glow">
              <Satellite className="h-5 w-5 text-base-primary" />
              <div className="absolute inset-0 rounded-xl border border-accent/30 animate-pulse-slow" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary font-display tracking-tight">Command Center</h1>
              <p className="text-xs text-text-muted font-medium">სატელიტური მონიტორინგის სისტემა</p>
            </div>
          </div>
          
          {stats && (
            <div className="hidden md:flex items-center gap-2">
              <StatPill value={totalZones} label="ნაკვეთი" color="#0ea5e9" />
              {criticalCount > 0 && <StatPill value={criticalCount} label="კრიტიკული" color="#ef4444" />}
              <StatPill value={okCount} label="ნორმაში" color="#22c55e" trend="up" />
            </div>
          )}
          
          {syncStatus && (
            <div className="hidden lg:block">
              <SyncStatusBadge daysStale={daysStale} />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ActionButton
            label="ანალიზი"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={onRunAnalysis}
            state={analysisState}
            variant="secondary"
          />
          <ActionButton
            label="ამინდი"
            icon={<Cloud className="h-4 w-4" />}
            onClick={onRunWeather}
            state={weatherState}
            variant="secondary"
          />
          <ActionButton
            label="სატელიტი"
            icon={<Satellite className="h-4 w-4" />}
            onClick={onRunSatellite}
            state={satelliteState}
            variant="primary"
          />
        </div>
      </div>

      {/* Pending refresh banner */}
      {pendingRefresh && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/[0.08] px-4 py-3 text-sm text-accent backdrop-blur-sm shrink-0 shadow-glow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <span className="font-medium">ანალიზი მიმდინარეობს — შედეგები განახლდება...</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-5 min-h-0">
        {/* Map - Takes 3/4 on large screens */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-white/[0.06] bg-bg-card/40 shadow-elevation-3">
          {/* Map overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-sensor/[0.03] pointer-events-none z-[1]" />
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-bg-card/60 to-transparent pointer-events-none z-[400]" />
          
          {/* Map Overlay Stats — bottom right, compact single panel */}
          {(stats || trendSummary) && (
            <div className="absolute bottom-6 right-4 z-[500]">
              <div className="rounded-xl border border-white/[0.08] bg-bg-card/90 backdrop-blur-2xl px-4 py-3 shadow-elevation-4 flex flex-col gap-2">
                {!statsLoading && stats && <ZoneStatsCards stats={stats} compact />}
                {!trendLoading && trendSummary && <TrendStatsCards summary={trendSummary} compact />}
              </div>
            </div>
          )}

          {/* Map */}
          <ParcelMap height="100%" fullscreen />

          {/* Map Bottom Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-bg-card/80 via-bg-card/40 to-transparent pointer-events-none z-[400]" />
        </div>

        {/* Sidebar - Takes 1/4 on large screens */}
        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto lg:overflow-visible pr-1">
          {/* Quick Links */}
          <div className="card p-5">
            <SectionHeader title="სწრაფი წვდომა" icon={<Activity className="h-4 w-4" />} />
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
              <QuickLink 
                to="/recommendations" 
                icon={<Leaf className="h-4 w-4" />}
                title="რეკომენდაციები"
                subtitle="სასუქების კალკულაცია"
                color="#f59e0b"
              />
              <QuickLink 
                to="/vra-enhanced" 
                icon={<Satellite className="h-4 w-4" />}
                title="VRA ანალიზი"
                subtitle="ზონების ოპტიმიზაცია"
                color="#22c55e"
              />
              <QuickLink 
                to="/map" 
                icon={<MapPin className="h-4 w-4" />}
                title="რუკა"
                subtitle="დაავადების რისკი"
                color="#ef4444"
              />
              <QuickLink 
                to="/weather" 
                icon={<Droplets className="h-4 w-4" />}
                title="ამინდი"
                subtitle="პროგნოზი და ტრენდები"
                color="#0ea5e9"
              />
            </div>
          </div>

          {/* Moon Widget */}
          <div className="shrink-0">
            <MoonWidget compact />
          </div>

          {/* SAR Panel - Shows when optical data is stale */}
          {(daysStale === null || daysStale > 5) && (
            <SARPanel daysStale={daysStale} />
          )}

          {/* Activity Status */}
          <div className="card p-5">
            <SectionHeader title="სისტემის სტატუსი" icon={<Activity className="h-4 w-4" />} />
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-text-secondary">Satellite მონაცემები</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  <span className="text-xs text-accent font-medium">აქტიური</span>
                </div>
              </div>
              <div className="h-px bg-white/[0.04]" />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-text-secondary">ამინდის პროგნოზი</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  <span className="text-xs text-accent font-medium">აქტიური</span>
                </div>
              </div>
              <div className="h-px bg-white/[0.04]" />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-text-secondary">VRA ზონები</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  <span className="text-xs text-accent font-medium">{stats?.total ?? 0} ნაკვეთი</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Trend Preview */}
          {!trendLoading && trendSummary && (
            <div className="card p-5">
              <Link to="/scientific" className="flex items-center justify-between mb-3 group">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-[0.12em] font-display">NDVI ტრენდი</h3>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </Link>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-text-primary font-mono tabular-nums">
                  {trendSummary.total_parcels}
                </div>
                <div className="text-xs text-text-muted text-right">
                  <div className="text-accent flex items-center gap-1.5 font-medium">
                    <TrendingUp className="h-3 w-3" />
                    {trendSummary.summary.improving} იზრდება
                  </div>
                  <div className="mt-1">ჯამური მონიტორინგი</div>
                </div>
              </div>
            </div>
          )}

          {/* Parcel Upload */}
          <div className="card card-accent p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <Upload className="h-4 w-4 text-accent" />
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-[0.12em] font-display">ნაკვეთების იმპორტი</h3>
            </div>
            <ParcelUpload onUploadComplete={onParcelsRefresh} />
          </div>
        </div>
      </div>
    </div>
  )
}
