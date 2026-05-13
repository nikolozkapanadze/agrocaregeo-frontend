import React, { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { CropOperation, Parcel } from '@/shared/lib/api'

interface Props {
  operations: CropOperation[]
  loading: boolean
  parcels: Parcel[]
  onEdit: (op: CropOperation) => void
  onDelete: (id: string) => void
}

const OP_TYPE_LABELS: Record<string, string> = {
  plowing: 'ხნულობა',
  planting: 'დარგვა',
  sowing: 'თესვა',
  fertilizing: 'სასუქი',
  pesticide_application: 'პესტიციდი',
  irrigation: 'მორწყვა',
  harvesting: 'მკა',
  cultivation: 'კულტივაცია',
  drone_spraying: 'დრონით შესხურება',
  soil_sampling: 'ნიადაგის ნიმუში',
  pruning: 'ჭრა-ჩეხა',
  other: 'სხვა',
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  planned: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'დაგეგმილი' },
  completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'შესრულებული' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'გაუქმებული' },
}

const COST_CATEGORY_LABELS: Record<string, string> = {
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

export default function OperationsTable({ operations, loading, parcels, onEdit, onDelete }: Props): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const parcelMap = new Map(parcels.map((p) => [p.id, p]))

  if (loading) {
    return (
      <div className="card flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
      </div>
    )
  }

  if (operations.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center h-64 text-center">
        <p className="text-text-secondary">ოპერაციები არ მოიძებნა</p>
        <p className="text-text-muted text-sm mt-1">დაამატეთ პირველი ოპერაცია ღილაკით "+ ოპერაცია"</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-text-primary">ოპერაციების რეესტრი</h3>
        <p className="text-xs text-text-muted">სულ {operations.length} ჩანაწერი</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-text-muted text-xs">
              <th className="text-left py-3 px-4 font-medium">თარიღი</th>
              <th className="text-left py-3 px-4 font-medium">ნაკვეთი</th>
              <th className="text-left py-3 px-4 font-medium">კულტურა</th>
              <th className="text-left py-3 px-4 font-medium">ოპერაცია</th>
              <th className="text-left py-3 px-4 font-medium">სტატუსი</th>
              <th className="text-right py-3 px-4 font-medium">ფართობი</th>
              <th className="text-right py-3 px-4 font-medium">ჯამური ხარჯი</th>
              <th className="text-center py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => {
              const parcel = op.parcel_id ? parcelMap.get(op.parcel_id) : null
              const isExpanded = expandedId === op.id
              const status = STATUS_BADGES[op.status] || STATUS_BADGES.completed

              return (
                <React.Fragment key={op.id}>
                  <tr
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : op.id)}
                  >
                    <td className="py-3 px-4 text-text-primary whitespace-nowrap">
                      {new Date(op.operation_date).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {parcel ? parcel.parcel_nr || parcel.parcel_nr : '—'}
                    </td>
                    <td className="py-3 px-4 text-text-secondary capitalize">
                      {op.crop_type || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-primary font-medium">
                      {OP_TYPE_LABELS[op.operation_type] || op.operation_type}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-text-secondary">
                      {op.area_ha ? `${op.area_ha.toFixed(2)} ჰა` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-accent">
                        ₾{op.total_cost_gel.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(op) }}
                          className="p-1 text-text-muted hover:text-accent transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(op.id) }}
                          className="p-1 text-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-text-muted" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-text-muted" />
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-white/[0.02]">
                      <td colSpan={8} className="py-3 px-4">
                        <div className="space-y-3">
                          {op.notes && (
                            <p className="text-xs text-text-muted">{op.notes}</p>
                          )}
                          {op.performed_by && (
                            <p className="text-xs text-text-muted">შესრულებულია: {op.performed_by}</p>
                          )}
                          {op.cost_breakdowns.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-text-secondary mb-2">ხარჯების დეტალიზაცია:</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {op.cost_breakdowns.map((cb) => (
                                  <div
                                    key={cb.id}
                                    className="bg-white/5 rounded-lg p-2"
                                  >
                                    <p className="text-[10px] text-text-muted uppercase">
                                      {COST_CATEGORY_LABELS[cb.cost_category] || cb.cost_category}
                                    </p>
                                    <p className="text-sm font-bold text-text-primary">
                                      ₾{cb.amount_gel.toFixed(2)}
                                    </p>
                                    {cb.quantity && cb.unit && (
                                      <p className="text-[10px] text-text-muted">
                                        {cb.quantity} {cb.unit}
                                      </p>
                                    )}
                                    {cb.supplier && (
                                      <p className="text-[10px] text-text-muted truncate">{cb.supplier}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
