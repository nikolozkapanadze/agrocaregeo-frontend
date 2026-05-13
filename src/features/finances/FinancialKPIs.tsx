import React from 'react'
import {
  AreaChart, Area, ResponsiveContainer,
} from 'recharts'
import {
  Wallet, TrendingUp, TrendingDown, Calendar,
  Layers, Target,
} from 'lucide-react'
import type { OperationSummary } from '@/shared/lib/api'

interface Props {
  summary: OperationSummary | null
  loading: boolean
}

function Sparkline({ data, color }: { data: number[]; color: string }): React.ReactElement {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function KPICard({
  title, value, subtitle, icon, accentColor, trend,
  sparkData,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  accentColor: string
  trend?: { value: number; positive: boolean }
  sparkData?: number[]
}): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 group"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Subtle gradient glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20"
        style={{ background: accentColor }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: `${accentColor}18`, color: accentColor }}
            >
              {icon}
            </div>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</span>
          </div>
          <p className="text-2xl font-bold text-text-primary font-mono tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}%
            </div>
          )}
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="flex-shrink-0 ml-2">
            <Sparkline data={sparkData} color={accentColor} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function FinancialKPIs({ summary, loading }: Props): React.ReactElement {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 bg-white/[0.02] border border-white/5 animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-white/5 mb-3" />
            <div className="h-7 w-24 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const { total_cost_gel, avg_cost_per_ha, total_operations, total_area_ha, by_month, by_category } = summary

  // Generate sparkline data from monthly trend
  const monthSpark = by_month.map((m) => m.total_gel)
  const opsSpark = by_month.map((m) => m.operation_count)

  // Calculate month-over-month change
  const momChange = monthSpark.length >= 2
    ? { value: Math.round(((monthSpark[monthSpark.length - 1] - monthSpark[monthSpark.length - 2]) / (monthSpark[monthSpark.length - 2] || 1)) * 100), positive: monthSpark[monthSpark.length - 1] >= monthSpark[monthSpark.length - 2] }
    : undefined

  // Top category display
  const topCat = by_category[0]
  const topCatLabel = topCat ? {
    labor: 'მუშახელი', fuel: 'საწვავი', equipment_rental: 'ტექნიკის ქირა',
    material_product: 'მასალა', drone_rental: 'დრონი', machinery_depreciation: 'ცვეთა',
    transport: 'ტრანსპორტი', electricity_water: 'ელ/წყალი', certification: 'სერთიფიკაცია', other: 'სხვა',
  }[topCat.cost_category] || topCat.cost_category : '—'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="მთლიანი ხარჯი"
        value={`₾${total_cost_gel.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        subtitle="ყველა ოპერაციის ჯამი"
        icon={<Wallet className="h-4 w-4" />}
        accentColor="#06b6d4"
        trend={momChange}
        sparkData={monthSpark}
      />
      <KPICard
        title="ხარჯი ჰა-ზე"
        value={avg_cost_per_ha ? `₾${avg_cost_per_ha.toFixed(0)}` : '—'}
        subtitle={total_area_ha ? `${total_area_ha.toFixed(1)} ჰა საერთო ფართობი` : 'ფართობი არ არის მითითებული'}
        icon={<Target className="h-4 w-4" />}
        accentColor="#8b5cf6"
        sparkData={monthSpark.length > 1 ? monthSpark.map((v) => (total_area_ha ? v / total_area_ha : v)) : monthSpark}
      />
      <KPICard
        title="ოპერაციები"
        value={`${total_operations}`}
        subtitle={`${by_month.length} თვეში`}
        icon={<Calendar className="h-4 w-4" />}
        accentColor="#10b981"
        sparkData={opsSpark}
      />
      <KPICard
        title="ტოპ კატეგორია"
        value={topCatLabel}
        subtitle={topCat ? `₾${topCat.total_gel.toLocaleString()} (${topCat.percentage}%)` : undefined}
        icon={<Layers className="h-4 w-4" />}
        accentColor="#f59e0b"
        sparkData={by_category.map((c) => c.total_gel)}
      />
    </div>
  )
}
