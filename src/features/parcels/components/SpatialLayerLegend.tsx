/**
 * Legend for active spatial layers that have a classification key selected.
 * Shows color swatches, value names, counts and percentages.
 */
import { useMemo } from 'react'
import type { ActiveSpatialLayer } from '../hooks/useSpatialLayers'
import { hashColor } from './SpatialLayersRenderer'

interface LegendItem {
  value: string
  color: string
  count: number
  pct: number
}

interface LayerLegend {
  type: string
  name: string
  key: string
  total: number
  items: LegendItem[]
}

function buildLegends(layers: ActiveSpatialLayer[]): LayerLegend[] {
  const result: LayerLegend[] = []

  for (const layer of layers) {
    if (!layer.classifyKey || !layer.geojson?.features) continue

    const counts = new Map<string, number>()
    let total = 0

    for (const feat of layer.geojson.features) {
      const val = String(feat.properties?.[layer.classifyKey] ?? '')
      if (!val) continue
      counts.set(val, (counts.get(val) || 0) + 1)
      total++
    }

    if (total === 0) continue

    const items: LegendItem[] = Array.from(counts.entries())
      .map(([value, count]) => ({
        value,
        count,
        pct: Math.round((count / total) * 1000) / 10,
        color: hashColor(value),
      }))
      .sort((a, b) => b.count - a.count)

    result.push({
      type: layer.type,
      name: layer.name,
      key: layer.classifyKey,
      total,
      items,
    })
  }

  return result
}

const TYPE_LABELS: Record<string, string> = {
  polygon: 'პოლიგონი',
  line: 'ხაზი',
  point: 'წერტილი',
}

export function SpatialLayerLegend({ layers }: { layers: ActiveSpatialLayer[] }) {
  const legends = useMemo(() => buildLegends(layers), [layers])

  if (legends.length === 0) return null

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-xl shadow-2xl p-3.5 flex flex-col gap-3" style={{ minWidth: 240, maxWidth: 280 }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
        კლასიფიკაციის ლეგენდა
      </p>

      {legends.map((legend) => (
        <div key={`${legend.type}-${legend.name}`} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40 uppercase">{TYPE_LABELS[legend.type]}</span>
            <span className="text-[11px] text-white/70 font-medium truncate">{legend.name}</span>
            <span className="text-[10px] text-white/30">({legend.key})</span>
          </div>

          <div className="flex flex-col gap-1">
            {legend.items.map((item) => (
              <div key={item.value} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm flex-shrink-0 shadow-sm"
                  style={{ background: item.color }}
                />
                <span className="text-[11px] text-white/60 truncate flex-1 min-w-0" title={item.value}>
                  {item.value}
                </span>
                <span className="text-[10px] text-white/40 tabular-nums">
                  {item.count}
                </span>
                <span className="text-[10px] text-white/30 tabular-nums w-8 text-right">
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-white/20 text-right">
            სულ: {legend.total}
          </div>
        </div>
      ))}
    </div>
  )
}
