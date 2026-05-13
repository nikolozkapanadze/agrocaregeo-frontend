import React from 'react'

interface Props {
  zone: string
  size?: 'sm' | 'md'
}

const zoneConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-950',
    text: 'text-red-400',
    border: 'border-red-800',
  },
  high: {
    label: 'High',
    bg: 'bg-orange-950',
    text: 'text-orange-400',
    border: 'border-orange-800',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-yellow-950',
    text: 'text-yellow-400',
    border: 'border-yellow-800',
  },
  ok: {
    label: 'OK',
    bg: 'bg-green-950',
    text: 'text-green-400',
    border: 'border-green-800',
  },
}

export default function MineralBadge({ zone, size = 'sm' }: Props): React.ReactElement {
  const normalized = zone?.toLowerCase() || 'ok'
  const config = zoneConfig[normalized] ?? {
    label: zone || 'Unknown',
    bg: 'bg-gray-900',
    text: 'text-gray-400',
    border: 'border-gray-700',
  }

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor:
            normalized === 'critical'
              ? '#d32f2f'
              : normalized === 'high'
                ? '#f57c00'
                : normalized === 'medium'
                  ? '#fbc02d'
                  : '#388e3c',
        }}
      />
      {config.label}
    </span>
  )
}
