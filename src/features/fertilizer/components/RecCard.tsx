import React from 'react'
import { Link } from 'react-router-dom'
import type { Recommendation, FertilizerRec } from '@/shared/lib/api'
import {
  getPriorityConfig,
  getZoneColor,
  getMoonTiming,
  getDataQualityIndicator,
  getAppMode,
  getDefaultMineralReason,
} from '@/domain/recommendations'
import { getCropStatusLabel } from '@/domain/crops'
import { CROP_NAMES, CROP_COLORS } from '@/hooks/useSelectedCrop'
import { MineralStatusBox } from './MineralStatusBox'
import { TreePine, Flower2, Cherry, Leaf } from 'lucide-react'

interface RecCardProps {
  rec: Recommendation
  moonActivity: string
}

export function RecCard({ rec, moonActivity }: RecCardProps): React.ReactElement {
  const priority = getPriorityConfig(rec.priority)
  const borderColor = getZoneColor(
    rec.priority === 1 ? 'critical' : rec.priority === 2 ? 'high' : 'ok'
  )

  // Crop type icon mapping
  const cropType = rec.crop_type || rec.crop_module || 'unknown'
  const cropName = CROP_NAMES[cropType as keyof typeof CROP_NAMES] || cropType
  const cropColor = CROP_COLORS[cropType as keyof typeof CROP_COLORS] || '#8b949e'
  const isTreeCrop = ['vine', 'almond', 'hazelnut', 'walnut', 'olive', 'blueberry', 'citrus', 'tea'].includes(cropType)
  const CropIcon = isTreeCrop ? TreePine : cropType === 'sunflower' ? Flower2 : cropType === 'blueberry' ? Cherry : Leaf

  return (
    <div
      className="rounded-lg border border-bg-border bg-bg-card p-4"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/parcels`}
              className="truncate text-sm font-semibold text-text-primary hover:text-accent"
            >
              {rec.parcel_nr}
            </Link>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${cropColor}20`, color: cropColor, border: `1px solid ${cropColor}40` }}
              title={cropType}
            >
              <CropIcon className="h-3 w-3" />
              {cropName}
            </span>
            <span className="rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] text-text-muted">
              {rec.zone}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span>{rec.area_ha.toFixed(2)} ჰა</span>
            <span>
              NDVI: <strong className={(rec.ndvi ?? 0) < 0.3 ? 'text-zone-critical' : 'text-zone-ok'}>{rec.ndvi?.toFixed(2) ?? '—'}</strong>
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-bg-secondary px-1.5 py-0.5">
              <span className="text-text-muted">ფაზა:</span>
              <strong className="text-text-primary">{getCropStatusLabel(rec.crop_module || cropType, rec.crop_status)}</strong>
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold" style={{ color: borderColor }}>
            {priority.icon} {priority.label}
          </div>
          <div className="mt-0.5 text-[11px] text-text-muted">{rec.timing}</div>
        </div>
      </div>

      {/* Fertilizer recommendations */}
      <div className="mt-3">
        {rec.recommendations.length === 0 ? (
          <NoFertilizerNeeded rec={rec} />
        ) : (
          <FertilizerList recommendations={rec.recommendations} moonActivity={moonActivity} />
        )}
      </div>

      {/* Soil lab notes */}
      {rec.soil_notes && rec.soil_notes.length > 0 && (
        <SoilNotes notes={rec.soil_notes} sampleDate={rec.soil_sample_date} />
      )}

      {/* Footer */}
      <RecFooter rec={rec} />
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function NoFertilizerNeeded({ rec }: { rec: Recommendation }): React.ReactElement {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zone-ok">✅ სასუქი არ სჭირდება — მინერალური ბალანსი ნორმაშია</p>

      {/* VRA Zones panel */}
      {rec.has_vra_zones && rec.vra_zones && rec.vra_zones.length > 0 && (
        <VraZonesPanel zones={rec.vra_zones} />
      )}

      {/* Detailed mineral status panel */}
      <MineralStatusPanel rec={rec} />
    </div>
  )
}

function VraZonesPanel({ zones }: { zones: NonNullable<Recommendation['vra_zones']> }): React.ReactElement {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
      <h4 className="mb-2 text-xs font-semibold text-accent">📍 VRA ოპტიმიზაცია — ზონების მიხედვით შეტანა</h4>
      <div className="space-y-2">
        {zones.map((zone, idx) => (
          <div key={idx} className="rounded border border-bg-border bg-bg-primary/50 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-text-primary">
                {zone.zone_label} — <span className="text-text-secondary">{zone.ndvi_class}</span>
              </span>
              <span className="text-[10px] text-text-muted">{zone.area_ha.toFixed(2)} ჰა</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              <MineralDose label="N" value={zone.n_dose_kg_ha} color="#fbc02d" />
              <MineralDose label="P" value={zone.p_dose_kg_ha} color="#f57c00" />
              <MineralDose label="K" value={zone.k_dose_kg_ha} color="#d32f2f" />
              <MineralDose label="Mg" value={zone.mg_dose_kg_ha} color="#388e3c" />
            </div>
            <div className="mt-1 text-[10px] text-text-muted">{zone.action}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-text-muted">
        💡 VRA ზონები გამოთვლილია სატელიტის NDVI მონაცემების საფუძველზე. ნიადაგი საკმარისია, მაგრამ ზონების
        მიხედვით ოპტიმიზაცია რეკომენდებულია.
      </p>
    </div>
  )
}

function MineralDose({ label, value, color }: { label: string; value: number; color: string }): React.ReactElement {
  return (
    <div className="text-center">
      <span className="text-text-muted">{label}:</span>
      <span className="ml-1 font-medium" style={{ color }}>
        {value.toFixed(0)}
      </span>
    </div>
  )
}

function MineralStatusPanel({ rec }: { rec: Recommendation }): React.ReactElement {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-secondary p-3">
      <h4 className="mb-2 text-xs font-semibold text-text-secondary">🧪 მინერალური ანალიზის შედეგები</h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MineralStatusBox
          label="აზოტი (N)"
          dose={rec.n_remaining}
          status={rec.n_status || (rec.n_remaining > 0 ? 'low' : 'ok')}
          reason={rec.n_reason || (rec.n_remaining > 0 ? 'საჭიროებს შეტანას' : 'საკმარისი')}
          confidence={rec.confidence}
        />
        <MineralStatusBox
          label="ფოსფორი (P)"
          dose={rec.p_dose_kg_ha}
          status={rec.p_status}
          reason={rec.p_reason || getDefaultMineralReason(rec.p_status, 'P')}
          confidence={rec.confidence}
        />
        <MineralStatusBox
          label="კალიუმი (K)"
          dose={rec.k_dose_kg_ha}
          status={rec.k_status}
          reason={rec.k_reason || getDefaultMineralReason(rec.k_status, 'K')}
          confidence={rec.confidence}
        />
        <MineralStatusBox
          label="მაგნეზიუმი (Mg)"
          dose={rec.mg_dose_kg_ha}
          status={rec.mg_status}
          reason={rec.mg_reason || getDefaultMineralReason(rec.mg_status, 'Mg')}
          confidence={rec.confidence}
        />
      </div>
      <p className="mt-2 text-[10px] text-text-muted">
        💡 მინერალური ანალიზი ეფუძნება სატელიტის მონაცემებს, ამინდის პროგნოზს და ნიადაგის ლაბორატორიულ ანალიზს
        (თუ არის)
      </p>
    </div>
  )
}

function FertilizerList({
  recommendations,
  moonActivity,
}: {
  recommendations: FertilizerRec[]
  moonActivity: string
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      {recommendations.map((fr, idx) => {
        const moonTiming = getMoonTiming(moonActivity, getAppMode(fr.type))
        return (
          <div key={idx} className="rounded border border-bg-border bg-bg-primary px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-semibold text-text-primary">
                <span className="mr-1 text-[10px] uppercase text-text-muted">[{fr.type}]</span>
                {fr.fertilizer_name}
              </span>
              <div className="flex items-center gap-2">
                <span
                  title={moonTiming.tip}
                  className={`cursor-help text-[10px] font-medium ${moonTiming.color}`}
                >
                  {moonTiming.label}
                </span>
                <span className="font-medium text-accent">{fr.price_gel.toFixed(0)} ₾</span>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-text-secondary">
              <span>{fr.kg_ha.toFixed(0)} კგ/ჰა</span>
              <span>{fr.kg_total.toFixed(0)} კგ სულ</span>
            </div>
            <div className="mt-0.5 text-text-muted">{fr.reason}</div>
          </div>
        )
      })}
    </div>
  )
}

function SoilNotes({ notes, sampleDate }: { notes: string[]; sampleDate?: string }): React.ReactElement {
  return (
    <div className="mt-3 rounded border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-[11px]">
      <div className="mb-1 font-semibold text-yellow-400">
        🧪 ნიადაგის ანალიზი
        {sampleDate && sampleDate !== '—' && (
          <span className="ml-1 font-normal text-text-muted">({sampleDate})</span>
        )}
      </div>
      <ul className="flex flex-col gap-0.5 text-text-secondary">
        {notes.map((note, i) => (
          <li key={i}>• {note}</li>
        ))}
      </ul>
    </div>
  )
}

function RecFooter({ rec }: { rec: Recommendation }): React.ReactElement {
  const satIndicator = getDataQualityIndicator(rec.data_quality?.satellite_age_days)

  return (
    <div className="mt-3 flex flex-wrap gap-4 border-t border-bg-border pt-2 text-[11px] text-text-muted">
      <span>
        🌧 წვიმა 3დ: <strong className="text-text-secondary">{rec.rain_3d.toFixed(0)}mm</strong>
      </span>
      <span>
        🌡 T°max: <strong className="text-text-secondary">{rec.tmax.toFixed(0)}°C</strong>
      </span>
      <span>
        N შეტანილი 30დ: <strong className="text-text-secondary">{rec.last_n_applied.toFixed(0)} კგ/ჰა</strong>
      </span>
      <span>
        📡 სატელიტი: <strong className="text-text-secondary">{rec.sat_date}</strong>
        {rec.data_quality?.satellite_age_days !== undefined && (
          <span className={satIndicator.warningClass}>
            ({rec.data_quality.satellite_age_days} დღის წინ{satIndicator.warningText})
          </span>
        )}
      </span>
      {rec.confidence && (
        <span>
          🎯 სიზუსტე:{" "}
          <strong
            className={
              rec.confidence === 'high'
                ? 'text-green-400'
                : rec.confidence === 'medium'
                  ? 'text-yellow-400'
                  : 'text-orange-400'
            }
          >
            {rec.confidence === 'high' ? 'მაღალი' : rec.confidence === 'medium' ? 'საშუალო' : 'დაბალი'}
          </strong>
        </span>
      )}
    </div>
  )
}
