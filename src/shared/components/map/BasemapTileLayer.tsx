import { TileLayer } from 'react-leaflet'
import { GoogleTileLayer } from './GoogleTileLayer'
import type { BasemapConfig } from '@/shared/lib/map/basemaps'

interface BasemapTileLayerProps {
  basemap: BasemapConfig
}

export function BasemapTileLayer({ basemap }: BasemapTileLayerProps) {
  if (!basemap.url) return null

  const props = {
    attribution: basemap.attribution,
    url: basemap.url,
    maxZoom: basemap.maxZoom,
    subdomains: basemap.subdomains,
  }

  if (basemap.key === 'google') {
    return <GoogleTileLayer {...props} />
  }

  return <TileLayer {...props} crossOrigin={basemap.crossOrigin} />
}
