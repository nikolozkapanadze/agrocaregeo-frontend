import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis,
  AreaChart, Area, BarChart, Bar, Line, ComposedChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis, Cell, Brush, PieChart, Pie,
} from 'recharts'
import {
  BarChart3, PieChart as PieIcon, TrendingUp, Target, Grid3X3, Activity,
} from 'lucide-react'
import type { OperationSummary, CropOperation } from '@/shared/lib/api'

const CATEGORY_COLORS: Record<string, string> = {
  labor: '#06b6d4',
  fuel: '#f59e0b',
  equipment_rental: '#8b5cf6',
  material_product: '#10b981',
  drone_rental: '#ec4899',
  machinery_depreciation: '#6b7280',
  transport: '#f97316',
  electricity_water: '#3b82f6',
  certification: '#eab308',
  other: '#9ca3af',
}

const CATEGORY_LABELS_KA: Record<string, string> = {
  labor: 'მუშახელი',
  fuel: 'საწვავი',
  equipment_rental: 'ტექნიკის ქირა',
  material_product: 'მასალა/პროდუქტი',
  drone_rental: 'დრონის ქირა',
  machinery_depreciation: 'ტექნიკის ცვეთა',
  transport: 'ტრანსპორტი',
  electricity_water: 'ელექტრო/წყალი',
  certification: 'სერთიფიკაცია',
  other: 'სხვა',
}

const CATEGORIES = Object.keys(CATEGORY_COLORS)

interface Props {
  summary: OperationSummary
  operations: CropOperation[]
}

/* ── Reusable tooltip ── */
const tooltipStyle = {
  backgroundColor: 'rgba(13,17,23,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

function CustomTooltip({ active, payload, label }: any): React.ReactElement | null {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0)
  return (
    <div className="px-4 py-3" style={tooltipStyle as any}>
      <p className="text-xs font-semibold text-text-primary mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-text-secondary">{p.name}</span>
            </div>
            <span className="font-mono text-text-primary">₾{(p.value || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-xs">
          <span className="text-text-muted">ჯამი</span>
          <span className="font-mono font-bold text-accent">₾{total.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

/* ── Chart 1: Monthly Stacked Area by Category ── */
function MonthlyStackedArea({ operations }: { operations: CropOperation[] }): React.ReactElement {
  const data = useMemo(() => {
    const map = new Map<string, Record<string, number>>()
    operations.forEach((op) => {
      const month = op.operation_date.slice(0, 7)
      if (!map.has(month)) map.set(month, {})
      const m = map.get(month)!
      op.cost_breakdowns.forEach((cb) => {
        m[cb.cost_category] = (m[cb.cost_category] || 0) + cb.amount_gel
      })
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({ month, ...vals }))
  }, [operations])

  if (data.length === 0) {
    return <EmptyChart message="მონაცემები არ არის" />
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            {CATEGORIES.map((cat) => (
              <linearGradient key={cat} id={`grad-${cat}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CATEGORY_COLORS[cat]} stopOpacity={0.5} />
                <stop offset="95%" stopColor={CATEGORY_COLORS[cat]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="month" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
          <YAxis stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          {CATEGORIES.map((cat) => (
            <Area
              key={cat}
              type="monotone"
              dataKey={cat}
              stackId="1"
              stroke={CATEGORY_COLORS[cat]}
              fill={`url(#grad-${cat})`}
              strokeWidth={1.5}
              name={CATEGORY_LABELS_KA[cat] || cat}
            />
          ))}
          <Brush dataKey="month" height={24} stroke="#06b6d4" fill="rgba(255,255,255,0.02)" travellerWidth={8} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Chart 2: Combo — Cost bars + Cumulative line + Op count ── */
function ComboTrendChart({ operations }: { operations: CropOperation[] }): React.ReactElement {
  const data = useMemo(() => {
    const sorted = [...operations].sort((a, b) => a.operation_date.localeCompare(b.operation_date))
    const map = new Map<string, { cost: number; ops: number }>()
    sorted.forEach((op) => {
      const month = op.operation_date.slice(0, 7)
      const cur = map.get(month) || { cost: 0, ops: 0 }
      cur.cost += op.total_cost_gel
      cur.ops += 1
      map.set(month, cur)
    })
    let cum = 0
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => {
        cum += vals.cost
        return { month, cost: Math.round(vals.cost), cumulative: Math.round(cum), ops: vals.ops }
      })
  }, [operations])

  if (data.length === 0) return <EmptyChart message="მონაცემები არ არის" />

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="month" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
          <YAxis yAxisId="left" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar yAxisId="left" dataKey="cost" fill="#06b6d4" radius={[4, 4, 0, 0]} name="თვიური ხარჯი" barSize={28}>
            {data.map((_, i) => (
              <Cell key={i} fill={`rgba(6,182,212,${0.5 + (i % 2) * 0.2})`} />
            ))}
          </Bar>
          <Area yAxisId="right" type="monotone" dataKey="cumulative" stroke="#8b5cf6" fill="rgba(139,92,246,0.08)" strokeWidth={2} name="კუმულაციური" />
          <Line yAxisId="right" type="monotone" dataKey="ops" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 4" name="ოპერაციები" />
          <Brush dataKey="month" height={24} stroke="#8b5cf6" fill="rgba(255,255,255,0.02)" travellerWidth={8} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Chart 3: Radar — Cost Distribution ── */
function RadarDistribution({ by_category }: { by_category: OperationSummary['by_category'] }): React.ReactElement {
  const data = useMemo(() => {
    const maxVal = Math.max(...by_category.map((c) => c.total_gel), 1)
    return by_category.map((c) => ({
      subject: CATEGORY_LABELS_KA[c.cost_category] || c.cost_category,
      A: c.total_gel,
      fullMark: maxVal,
      pct: c.percentage,
    }))
  }, [by_category])

  if (data.length === 0) return <EmptyChart message="მონაცემები არ არის" />

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <PolarRadiusAxis stroke="#334155" tick={{ fill: '#475569', fontSize: 9 }} />
          <Radar
            name="ხარჯები"
            dataKey="A"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="#06b6d4"
            fillOpacity={0.15}
          />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.[0]) return null
              const p = payload[0].payload
              return (
                <div className="px-3 py-2" style={tooltipStyle as any}>
                  <p className="text-xs font-semibold text-text-primary">{p.subject}</p>
                  <p className="text-xs text-accent font-mono mt-1">₾{p.A.toLocaleString()} ({p.pct}%)</p>
                </div>
              )
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Chart 4: Crop × Category Stacked Bar ── */
function CropCategoryStack({ operations }: { operations: CropOperation[] }): React.ReactElement {
  const data = useMemo(() => {
    const map = new Map<string, Record<string, number>>()
    operations.forEach((op) => {
      const crop = op.crop_type || 'უცნობი'
      if (!map.has(crop)) map.set(crop, {})
      const m = map.get(crop)!
      op.cost_breakdowns.forEach((cb) => {
        m[cb.cost_category] = (m[cb.cost_category] || 0) + cb.amount_gel
      })
    })
    return Array.from(map.entries())
      .map(([crop, vals]) => ({ crop, ...vals }))
      .sort((a, b) => {
        const sumA = Object.values(a).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
        const sumB = Object.values(b).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
        return sumB - sumA
      })
      .slice(0, 10)
  }, [operations])

  if (data.length === 0) return <EmptyChart message="მონაცემები არ არის" />

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
          <XAxis type="number" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
          <YAxis dataKey="crop" type="category" stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          {CATEGORIES.map((cat) => (
            <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat]} name={CATEGORY_LABELS_KA[cat] || cat} radius={[0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Chart 5: Parcel Efficiency Scatter ── */
function ParcelEfficiencyScatter({ by_parcel }: { by_parcel: OperationSummary['by_parcel'] }): React.ReactElement {
  const data = useMemo(() => {
    return by_parcel
      .filter((p) => p.cost_per_ha != null && p.area_ha != null)
      .map((p) => ({
        x: p.area_ha!,
        y: p.cost_per_ha!,
        z: p.total_gel,
        name: p.parcel_nr || p.parcel_id.slice(0, 8),
      }))
  }, [by_parcel])

  if (data.length === 0) return <EmptyChart message="მონაცემები არ არის" />

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis type="number" dataKey="x" name="ფართობი (ჰა)" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
          <YAxis type="number" dataKey="y" name="₾/ჰა" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.[0]) return null
              const p = payload[0].payload
              return (
                <div className="px-3 py-2" style={tooltipStyle as any}>
                  <p className="text-xs font-semibold text-text-primary">ნაკვეთი {p.name}</p>
                  <div className="mt-1 space-y-0.5 text-xs text-text-secondary">
                    <p>ფართობი: <span className="text-text-primary font-mono">{p.x.toFixed(2)} ჰა</span></p>
                    <p>₾/ჰა: <span className="text-accent font-mono">₾{p.y.toFixed(0)}</span></p>
                    <p>ჯამი: <span className="text-text-primary font-mono">₾{p.z.toLocaleString()}</span></p>
                  </div>
                </div>
              )
            }}
          />
          <Scatter data={data} fill="rgba(6,182,212,0.6)" stroke="#06b6d4" strokeWidth={1.5}>
            {data.map((_, i) => (
              <Cell key={i} fill={`rgba(6,182,212,${0.4 + (i % 3) * 0.15})`} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Chart 6: Category Donut with center label ── */
function CategoryDonut({ by_category }: { by_category: OperationSummary['by_category'] }): React.ReactElement {
  const data = by_category.map((c) => ({
    name: CATEGORY_LABELS_KA[c.cost_category] || c.cost_category,
    value: c.total_gel,
    color: CATEGORY_COLORS[c.cost_category] || '#9ca3af',
    pct: c.percentage,
  }))

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="h-80 flex items-center">
      <div className="flex-1 h-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.[0]) return null
                const p = payload[0]
                return (
                  <div className="px-3 py-2" style={tooltipStyle as any}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.payload.color }} />
                      <span className="text-xs font-semibold text-text-primary">{p.name}</span>
                    </div>
                    <p className="text-xs text-accent font-mono mt-1">₾{p.value.toLocaleString()} ({p.payload.pct}%)</p>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">ჯამი</span>
          <span className="text-lg font-bold text-text-primary font-mono">₾{(total / 1000).toFixed(0)}K</span>
        </div>
      </div>
      <div className="w-44 space-y-2 overflow-y-auto max-h-72 pr-2">
        {data.map((item) => (
          <div key={item.name} className="group cursor-default">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-transform group-hover:scale-125" style={{ background: item.color }} />
              <span className="text-text-secondary flex-1 truncate">{item.name}</span>
              <span className="text-text-primary font-mono font-semibold">{item.pct}%</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.pct}%`, background: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Empty state ── */
function EmptyChart({ message }: { message: string }): React.ReactElement {
  return (
    <div className="h-80 flex flex-col items-center justify-center text-text-muted">
      <Activity className="h-8 w-8 mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

/* ── Chart Card wrapper ── */
function ChartCard({
  title, icon, children, className = '',
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}): React.ReactElement {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="px-2 pb-2">{children}</div>
    </div>
  )
}

/* ── Main export ── */
export default function FinancialCharts({ summary, operations }: Props): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview')

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit">
        {[
          { key: 'overview' as const, label: 'მიმოხილვა' },
          { key: 'detailed' as const, label: 'დეტალური' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'bg-accent/15 text-accent shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="თვიური ხარჯების სტრუქტურა" icon={<Grid3X3 className="h-4 w-4" />}>
            <MonthlyStackedArea operations={operations} />
          </ChartCard>

          <ChartCard title="კატეგორიების განაწილება" icon={<PieIcon className="h-4 w-4" />}>
            <CategoryDonut by_category={summary.by_category} />
          </ChartCard>

          <ChartCard title="კუმულაციური დინამიკა" icon={<TrendingUp className="h-4 w-4" />}>
            <ComboTrendChart operations={operations} />
          </ChartCard>

          <ChartCard title="ხარჯების რადარი" icon={<Target className="h-4 w-4" />}>
            <RadarDistribution by_category={summary.by_category} />
          </ChartCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="კულტურა × კატეგორია" icon={<BarChart3 className="h-4 w-4" />}>
            <CropCategoryStack operations={operations} />
          </ChartCard>

          <ChartCard title="ნაკვეთის ეფექტურობა" icon={<Activity className="h-4 w-4" />}>
            <ParcelEfficiencyScatter by_parcel={summary.by_parcel} />
          </ChartCard>
        </div>
      )}
    </div>
  )
}
