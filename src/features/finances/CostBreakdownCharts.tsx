import React from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { TrendingUp, BarChart3, PieChart as PieIcon, MapPin } from 'lucide-react'
import type { OperationSummary } from '@/shared/lib/api'

const CATEGORY_COLORS: Record<string, string> = {
  labor: '#a78bfa',
  fuel: '#f57c00',
  equipment_rental: '#58a6ff',
  material_product: '#8bc34a',
  drone_rental: '#00bcd4',
  machinery_depreciation: '#6e7681',
  transport: '#ff8a65',
  electricity_water: '#4fc3f7',
  certification: '#fbc02d',
  other: '#9e9e9e',
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

interface Props {
  summary: OperationSummary
}

export default function CostBreakdownCharts({ summary }: Props): React.ReactElement {
  const { by_category, by_crop, by_month, by_parcel } = summary

  const catData = by_category.map((c) => ({
    name: CATEGORY_LABELS_KA[c.cost_category] || c.cost_category,
    value: c.total_gel,
    color: CATEGORY_COLORS[c.cost_category] || '#58a6ff',
    percentage: c.percentage,
  }))

  const cropData = by_crop.map((c) => ({
    name: c.crop_type,
    value: c.total_gel,
    costPerHa: c.cost_per_ha,
  }))

  const monthData = by_month.map((m) => ({
    name: m.month,
    value: m.total_gel,
    count: m.operation_count,
  }))

  const parcelData = by_parcel.slice(0, 15).map((p) => ({
    name: p.parcel_nr || p.parcel_id.slice(0, 8),
    value: p.total_gel,
    costPerHa: p.cost_per_ha,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Cost by Category — Donut */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-accent" />
          ხარჯები კატეგორიების მიხედვით
        </h3>
        <div className="h-64 flex items-center">
          <div className="flex-1 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {catData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₾${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-40 space-y-2 overflow-y-auto max-h-64 pr-2">
            {catData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                <span className="text-text-secondary flex-1 truncate">{item.name}</span>
                <span className="text-text-primary font-mono">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Cost Trend — Area */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          თვიური ხარჯების დინამიკა
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthData}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                formatter={(value: number) => `₾${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: '#0d1117',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#58a6ff"
                fill="url(#costGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost by Crop — Horizontal Bar */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          ხარჯები კულტურების მიხედვით
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cropData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} width={80} />
              <Tooltip
                formatter={(value: number) => `₾${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: '#0d1117',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#8bc34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost per Hectare by Parcel — Bar */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" />
          ხარჯი ნაკვეთის მიხედვით (₾)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={parcelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
              <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                formatter={(value: number) => `₾${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: '#0d1117',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#f57c00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
