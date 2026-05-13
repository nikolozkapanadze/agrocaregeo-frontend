import { useState, useMemo, useEffect } from 'react'
import { API_BASE, parcels as parcelsApi } from '@/shared/lib/api'
import type { Parcel, PaginatedResponse } from '@/shared/lib/api'
import { useApi } from '@/shared/hooks/useApi'
import { useProfileStore } from '@/shared/stores'
import { MapPin, AlertCircle, Activity, Sprout, Filter } from 'lucide-react'
import MineralBadge from '@/shared/components/MineralBadge'

import { MapContainer, GeoJSON } from 'react-leaflet'
import { BasemapTileLayer } from '@/shared/components/map/BasemapTileLayer'
import 'leaflet/dist/leaflet.css'
import { BASEMAPS, type BasemapKey } from '@/shared/lib/map/basemaps'
import { MapToolsPanel } from '@/features/parcels/components/MapToolsPanel'

const CROP_OPTIONS = [
  { value: 'all', label: 'ყველა კულტურა', color: '#58a6ff' },
  { value: 'wheat', label: 'ხორბალი', color: '#EAB308' },
]

// Simple API request
const apiGet = async (path: string) => {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Mini Map
function MiniMap() {
  const [geoData, setGeoData] = useState<any>(null)
  const [baseLayer, setBaseLayer] = useState<BasemapKey>('google')

  useEffect(() => {
    apiGet('/parcels/geojson').then(setGeoData).catch(console.error)
  }, [])

  if (!geoData) return <div className="h-full flex items-center justify-center text-text-muted">Loading map...</div>

  const bm = BASEMAPS[baseLayer]

  return (
    <div style={{ height: '100%', isolation: 'isolate' }} className="relative">
      <div className="absolute top-2 right-2 z-[1000]">
        <select
          value={baseLayer}
          onChange={(e) => setBaseLayer(e.target.value as BasemapKey)}
          className="rounded-lg border border-bg-border/60 bg-bg-card/95 backdrop-blur-xl px-2 py-1 text-xs font-medium text-text-secondary shadow-xl outline-none cursor-pointer hover:border-accent/50 focus:border-accent transition-colors"
        >
          <option value="google">🛰️ Google სატელიტი</option>
          <option value="terrain">🗻 ტოპოგრაფია</option>
          <option value="osm">🗺️ რუკა</option>
        </select>
      </div>
      <MapContainer center={[41.63, 46.12]} zoom={10} style={{ height: '100%', width: '100%' }}>
        {bm.url && <BasemapTileLayer basemap={bm} />}
        <GeoJSON data={geoData} style={{ fillColor: '#EAB308', weight: 1, color: '#fff', fillOpacity: 0.5 }} />
        <MapToolsPanel />
      </MapContainer>
    </div>
  )
}

export default function Dashboard() {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [cropFilter, setCropFilter] = useState('all')

  const { data: parcelsData } = useApi<PaginatedResponse<Parcel>>(
    () => parcelsApi.list(1, 1000, undefined, profileId), [profileId]
  )

  const parcels = parcelsData?.items || []
  const filteredParcels = useMemo(() => {
    if (cropFilter === 'all') return parcels
    return parcels.filter(p => p.crop_type === cropFilter)
  }, [parcels, cropFilter])

  const parcelCount = filteredParcels.length
  const totalArea = filteredParcels.reduce((acc, p) => acc + (p.area_ha || 0), 0)
  const parcelsWithIssues = filteredParcels.filter(p => p.latest_zone && ['critical', 'high'].includes(p.latest_zone)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">მონიტორინგის დაფა</h1>
          <p className="text-text-muted mt-1">ყველა კულტურის მონიტორინგი</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} className="input py-2">
            {CROP_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Mini Map */}
      <div className="card h-80">
        <MiniMap />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <MapPin className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-text-muted text-sm">სულ ნაკვეთი</p>
            <p className="text-2xl font-bold text-text-primary">{parcelCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sprout className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-text-muted text-sm">ფართობი</p>
            <p className="text-2xl font-bold text-text-primary">{totalArea.toFixed(1)} ჰა</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-text-muted text-sm">NDVI</p>
            <p className="text-2xl font-bold text-text-primary">-</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-text-muted text-sm">პრობლემები</p>
            <p className="text-2xl font-bold text-text-primary">{parcelsWithIssues}</p>
          </div>
        </div>
      </div>

      {/* Parcels List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">ნაკვეთები</h3>
        {filteredParcels.length > 0 ? (
          <div className="space-y-2">
            {filteredParcels.slice(0, 10).map((parcel) => (
              <div key={parcel.id} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                <div>
                  <span className="text-text-primary font-medium">#{parcel.parcel_nr}</span>
                  <span className="text-text-muted text-sm ml-2">{parcel.area_ha?.toFixed(2)} ჰა</span>
                </div>
                {parcel.latest_zone && <MineralBadge zone={parcel.latest_zone} />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">ნაკვეთები არ არის</p>
        )}
      </div>
    </div>
  )
}
