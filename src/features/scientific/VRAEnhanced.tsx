import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { parcels } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import { useProfileStore } from '@/shared/stores'
import { Sprout, Satellite, FlaskConical, Cloud, AlertCircle, MapPin, ChevronRight, Download } from 'lucide-react'

interface VRAZone {
  zone_index: number
  zone_label: string
  ndvi_class: string
  ndvi_mean: number | null
  ndre_mean: number | null
  area_ha: number | null
  satellite_vra_factor: number
  soil_factor: number
  weather_factor: {
    N: number
    P: number
    K: number
    Mg: number
  }
  n_dose_kg_ha: number
  p_dose_kg_ha: number
  k_dose_kg_ha: number
  mg_dose_kg_ha: number
  base_n_dose: number
  has_soil_data: boolean
  has_weather_data: boolean
  action: string
}

interface VRAData {
  parcel_id: string
  num_zones: number
  data_fusion_weights: {
    satellite: number
    soil: number
    weather: number
  }
  zones: VRAZone[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isVRAData(d: any): d is VRAData {
  return d && Array.isArray(d.zones)
}

// Parcel selector component shown when no parcel is selected
function ParcelSelector(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const { data: parcelsData, loading, error } = useApi(
    () => parcels.list(1, 50, undefined, profileId),
    [profileId]
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
        <span className="ml-3 text-text-secondary">ნაკვეთების ჩატვირთვა...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-zone-critical/40 bg-zone-critical/10 p-4 text-sm text-zone-critical">
        <AlertCircle className="h-4 w-4 inline mr-2" />
        შეცდომა: {error}
      </div>
    )
  }

  const parcelList = (parcelsData?.items || []) as unknown as Array<{id: string; name: string; crop_type?: string; area_ha?: number}>

  if (parcelList.length === 0) {
    return (
      <div className="card p-8 text-center">
        <MapPin className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-text-primary">ნაკვეთები არ მოიძებნა</h3>
        <p className="text-sm text-text-secondary mt-2">
          დაამატეთ ნაკვეთები რუკაზე ან ნაკვეთების გვერდზე
        </p>
        <Link 
          to="/parcels" 
          className="btn btn-primary mt-4 inline-flex items-center"
        >
          ნაკვეთების დამატება
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {parcelList.map((parcel) => (
        <Link
          key={parcel.id}
          to={`/vra-enhanced?parcel=${parcel.id}`}
          className="card flex items-center justify-between p-4 hover:border-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">{parcel.name}</h3>
              <p className="text-sm text-text-secondary">
                {parcel.crop_type || 'მთავარი კულტურა'} 
                {parcel.area_ha ? ` • ${parcel.area_ha.toFixed(2)} ჰა` : ''}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-text-muted" />
        </Link>
      ))}
    </div>
  )
}

export default function VRAEnhanced(): React.ReactElement {
  const [searchParams] = useSearchParams()
  const parcelId = searchParams.get('parcel')
  const [selectedZone, setSelectedZone] = useState<VRAZone | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportNutrient, setExportNutrient] = useState<'N' | 'P' | 'K' | 'Mg' | 'Total'>('N')

  const handleExport = async () => {
    if (!parcelId) return
    setExporting(true)
    try {
      const res = await parcels.exportVRA(parcelId, exportNutrient)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Export failed' }))
        throw new Error(err.detail || 'Export failed')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vra_${parcelId}_${exportNutrient}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const { data: rawData, loading, error } = useApi(
    () => parcelId ? parcels.getVRAEnhanced(parcelId) : Promise.reject('No parcel ID'),
    [parcelId]
  )
  const data = rawData as VRAData | null

  if (!parcelId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">VRA გაუმჯობესებული ანალიზი</h1>
          <p className="mt-1 text-sm text-text-secondary">
            მრავალწყარო მონაცემების ფუზია: სატელიტი + ნიადაგი + ამინდი
          </p>
        </div>
        
        <div className="card p-6 bg-accent/5 border-accent/20">
          <div className="flex items-start gap-3">
            <Satellite className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <h3 className="font-medium text-text-primary">აირჩიეთ ნაკვეთი ანალიზისთვის</h3>
              <p className="text-sm text-text-secondary mt-1">
                VRA ანალიზი საჭიროებს კონკრეტულ ნაკვეთს. აირჩიეთ ქვემოთ სიიდან ან გადადით 
                <Link to="/map" className="text-accent hover:underline mx-1">რუკაზე</Link>
                და მონიშნეთ ნაკვეთი.
              </p>
            </div>
          </div>
        </div>

        <ParcelSelector />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
        <span className="ml-3 text-text-secondary">VRA მონაცემები იტვირთება...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-zone-critical/40 bg-zone-critical/10 p-4 text-sm text-zone-critical">
        <AlertCircle className="h-4 w-4 inline mr-2" />
        შეცდომა: {error}
      </div>
    )
  }

  if (!data || !isVRAData(data) || data.zones.length === 0) {
    return (
      <div className="card p-8 text-center text-text-secondary">
        VRA ქვეზონები ჯერ არ შექმნილა. გაუშვით ანალიზი.
      </div>
    )
  }

  const totalArea = data.zones.reduce((sum, z) => sum + (z.area_ha || 0), 0)
  const avgNDVI = data.zones.reduce((sum, z) => sum + (z.ndvi_mean || 0), 0) / data.zones.length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">VRA გაუმჯობესებული ანალიზი</h1>
          <p className="mt-1 text-sm text-text-secondary">
            მრავალწყარო მონაცემების ფუზია: სატელიტი + ნიადაგი + ამინდი
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={exportNutrient}
            onChange={(e) => setExportNutrient(e.target.value as typeof exportNutrient)}
            className="text-sm border border-bg-border rounded-lg px-2 py-1.5 bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            title="აირჩიეთ ძირითადი სასუქი Rate სვეტისთვის"
          >
            <option value="N">N რეიტინგი</option>
            <option value="P">P რეიტინგი</option>
            <option value="K">K რეიტინგი</option>
            <option value="Mg">Mg რეიტინგი</option>
            <option value="Total">ჯამური რეიტინგი</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50"
            title="Shapefile (.zip) — DJI Agro იმპორტი"
          >
            {exporting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            DJI-ზე ექსპორტი
          </button>
        </div>
      </div>

      {/* DJI Export Info */}
      <div className="card bg-accent/5 border-accent/20 flex items-start gap-3">
        <Download className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">DJI Agro / SmartFarm იმპორტი</h3>
          <p className="text-xs text-text-secondary mt-1">
            გადმოწერილი ZIP შეიცავს KML-ს (DJI SmartFarm ღრუბლოვანი იმპორტი) და Shapefile-ს (DJI Terra დესკტოპი).
            პირდაპირი ღრუბლოვანი ინტეგრაცია მომავალში დაემატება — ამჟამად შეგიძლიათ ფაილის ატვირთვა 
            <a href="https://smartfarm.dji.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">smartfarm.dji.com</a>-ზე.
          </p>
        </div>
      </div>

      {/* Data Fusion Weights */}
      <div className="card">
        <h2 className="text-sm font-semibold text-text-primary mb-4">მონაცემების წონები</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-text-secondary">
                <Satellite className="h-3.5 w-3.5" /> სატელიტი
              </span>
              <span className="font-semibold">50%</span>
            </div>
            <div className="h-2 bg-bg-border rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: '50%' }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-text-secondary">
                <FlaskConical className="h-3.5 w-3.5" /> ნიადაგი
              </span>
              <span className="font-semibold">30%</span>
            </div>
            <div className="h-2 bg-bg-border rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: '30%' }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-text-secondary">
                <Cloud className="h-3.5 w-3.5" /> ამინდი
              </span>
              <span className="font-semibold">20%</span>
            </div>
            <div className="h-2 bg-bg-border rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500" style={{ width: '20%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center p-3">
          <div className="text-2xl font-bold text-text-primary">{data.num_zones}</div>
          <div className="text-xs text-text-muted">ზონა</div>
        </div>
        <div className="card text-center p-3">
          <div className="text-2xl font-bold text-text-primary">{totalArea.toFixed(2)}</div>
          <div className="text-xs text-text-muted">ჰა სულ</div>
        </div>
        <div className="card text-center p-3">
          <div className="text-2xl font-bold text-accent">{avgNDVI.toFixed(3)}</div>
          <div className="text-xs text-text-muted">საშ. NDVI</div>
        </div>
        <div className="card text-center p-3">
          <div className="text-2xl font-bold text-zone-ok">
            {data.zones.filter(z => z.has_soil_data).length}
          </div>
          <div className="text-xs text-text-muted">ნიადაგის მონაცემით</div>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.zones.map((zone) => (
          <div
            key={zone.zone_index}
            className={`card cursor-pointer transition-all ${
              selectedZone?.zone_index === zone.zone_index
                ? 'border-accent ring-1 ring-accent'
                : 'hover:border-accent/50'
            }`}
            onClick={() => setSelectedZone(zone)}
          >
            {/* Zone Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-text-primary">
                    {zone.zone_label}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: zone.ndvi_class === 'low' ? '#d32f2f22' : zone.ndvi_class === 'high' ? '#388e3c22' : '#fbc02d22',
                      color: zone.ndvi_class === 'low' ? '#d32f2f' : zone.ndvi_class === 'high' ? '#388e3c' : '#fbc02d',
                    }}
                  >
                    {zone.ndvi_class}
                  </span>
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {zone.area_ha?.toFixed(2)} ჰა | NDVI: {zone.ndvi_mean?.toFixed(3)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-accent">
                  ×{zone.satellite_vra_factor.toFixed(2)}
                </div>
                <div className="text-xs text-text-muted">VRA ფაქტორი</div>
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-xs">
                <Satellite className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-text-secondary">სატელიტი:</span>
                <span className="font-medium">×{zone.satellite_vra_factor.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-text-secondary">ნიადაგი:</span>
                <span className="font-medium">×{zone.soil_factor.toFixed(2)}</span>
                {!zone.has_soil_data && (
                  <span className="text-[10px] text-text-muted">(მონაცემი არ არის)</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-text-secondary">ამინდი:</span>
                <span className="font-medium">
                  N:{zone.weather_factor.N.toFixed(2)} P:{zone.weather_factor.P.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Final Doses */}
            <div className="border-t border-bg-border pt-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold text-[#fbc02d]">{zone.n_dose_kg_ha}</div>
                  <div className="text-[10px] text-text-muted">N კგ/ჰა</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#f57c00]">{zone.p_dose_kg_ha}</div>
                  <div className="text-[10px] text-text-muted">P კგ/ჰა</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#d32f2f]">{zone.k_dose_kg_ha}</div>
                  <div className="text-[10px] text-text-muted">K კგ/ჰა</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#388e3c]">{zone.mg_dose_kg_ha}</div>
                  <div className="text-[10px] text-text-muted">Mg კგ/ჰა</div>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="mt-3 text-xs text-accent bg-accent/10 rounded px-2 py-1.5">
              <Sprout className="h-3.5 w-3.5 inline mr-1" />
              {zone.action}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Note */}
      <div className="card bg-accent/5 border border-accent/20">
        <h3 className="text-sm font-semibold text-text-primary mb-2">რატომ გაუმჯობესებული VRA?</h3>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• <strong>ნიადაგის ტექსტურა:</strong> ქვიშნები კარგავს N-ს უფრო სწრაფად → მეტი სასუქი საჭიროა</li>
          <li>• <strong>pH ეფექტი:</strong> pH {'<'} 5.5 ამცირებს P და Mg ხელმისაწვდომობას</li>
          <li>• <strong>სიცხის სტრესი:</strong> ზრდის K-ს მოთხოვნილებას სტომატების რეგულაციისთვის</li>
          <li>• <strong>გვალვა:</strong> ამცირებს K-ის ათვისებას → ფოლიარული შეტანა უკეთესია</li>
        </ul>
      </div>
    </div>
  )
}
