import React from 'react'
import {
  calculateMineralStatus,
  getMineralStatusBoxClass,
  getMineralStatusTextClass,
} from '@/domain/recommendations'

interface MineralStatusBoxProps {
  label: string
  dose?: number
  status?: string
  reason?: string
  confidence?: string
  compact?: boolean
}

export function MineralStatusBox({
  label,
  dose,
  status,
  reason,
  confidence,
  compact = false,
}: MineralStatusBoxProps): React.ReactElement {
  const { hasDeficiency, isUnknown, displayDose } = calculateMineralStatus(label, dose, status)

  if (compact) {
    return (
      <div
        className={`rounded border px-2 py-1 text-xs ${getMineralStatusBoxClass(hasDeficiency, isUnknown)}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-text-secondary">{label}</span>
          <span className={`text-[10px] ${getMineralStatusTextClass(hasDeficiency, isUnknown)}`}>
            {isUnknown ? '?' : hasDeficiency ? `+${displayDose}` : '✓'}
          </span>
        </div>
        {reason && <div className="mt-0.5 text-[10px] text-text-muted truncate">{reason}</div>}
      </div>
    )
  }

  return (
    <div
      className={`rounded border p-2 ${getMineralStatusBoxClass(hasDeficiency, isUnknown)}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-muted">{label}</span>
        <span className={`text-xs font-semibold ${getMineralStatusTextClass(hasDeficiency, isUnknown)}`}>
          {isUnknown ? '—' : hasDeficiency ? `+${displayDose} კგ/ჰა` : 'OK ✓'}
        </span>
      </div>
      {reason && (
        <div className="mt-0.5 text-[10px] leading-tight text-text-secondary">{reason}</div>
      )}
      {confidence && (
        <div className="mt-0.5 text-[10px] text-text-muted">სიზუსტე: {confidence}</div>
      )}
    </div>
  )
}
