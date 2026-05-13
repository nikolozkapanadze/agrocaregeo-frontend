import { useEffect, useState } from 'react'
import { MapContainer, GeoJSON } from 'react-leaflet'
import { BasemapTileLayer } from '@/shared/components/map/BasemapTileLayer'
import 'leaflet/dist/leaflet.css'
import { useProfileStore } from '@/shared/stores'
import { BASEMAPS } from '@/shared/lib/map/basemaps'

export default function Map() {
  const { activeProfile } = useProfileStore()
  const profileId = activeProfile?.id
  const [geoData, setGeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debug, setDebug] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        setDebug(`Token: ${token ? token.substring(0, 20) + '...' : 'NOT FOUND'}`)

        const url = profileId
          ? `/api/v1/parcels/geojson?profile_id=${profileId}`
          : '/api/v1/parcels/geojson'
        const res = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        
        if (res.status === 401) {
          setError('401 Unauthorized - Please login again')
          localStorage.removeItem('token')
          setTimeout(() => window.location.href = '/login', 2000)
          return
        }
        
        if (!res.ok) {
          setError(`HTTP ${res.status}: ${res.statusText}`)
          return
        }
        
        const data = await res.json()
        setDebug(prev => `${prev}\nFeatures: ${data?.features?.length || 0}`)
        setGeoData(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [profileId])

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center text-text-muted">
      <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mb-4"/>
      Loading map...
      <pre className="mt-4 text-xs text-text-muted">{debug}</pre>
    </div>
  )
  
  if (error) return (
    <div className="h-full flex flex-col items-center justify-center text-danger">
      <p className="text-lg mb-2">{error}</p>
      <pre className="text-xs text-text-muted mt-4">{debug}</pre>
    </div>
  )

  const features = geoData?.features || []
  if (features.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center text-text-muted">
      <p>No parcels with geometry found</p>
      <pre className="mt-4 text-xs">{debug}</pre>
    </div>
  )

  return (
    <div className="h-full relative" style={{ isolation: 'isolate' }}>
      <div className="absolute top-2 left-2 z-[1000] bg-bg-card/90 px-3 py-2 rounded text-xs">
        Parcels: {features.length}
      </div>
      <MapContainer center={[41.63, 46.12]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <BasemapTileLayer basemap={BASEMAPS.google} />
        <GeoJSON 
          data={geoData}
          style={{ fillColor: '#EAB308', weight: 2, color: '#fff', fillOpacity: 0.6 }}
        />
      </MapContainer>
    </div>
  )
}
