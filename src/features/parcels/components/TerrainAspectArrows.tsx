import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { GeoJSONFeature, GeoJSONCollection } from '../services/parcelMap.service'

interface TerrainAspectArrowsProps {
  geojson: GeoJSONCollection | null
  visible: boolean
}

const SLOPE_COLORS: Record<string, string> = {
  flat: '#4fc3f7',
  gentle: '#8bc34a',
  moderate: '#fbc02d',
  steep: '#f57c00',
  very_steep: '#d32f2f',
}

const ASPECT_ANGLES: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
}

/**
 * Renders aspect-direction arrows on parcel centroids.
 * Arrow direction = downslope (aspect points in direction the slope faces).
 * Arrow color = slope class.
 * Arrow length = proportional to slope (min 8px, max 28px).
 */
export function TerrainAspectArrows({ geojson, visible }: TerrainAspectArrowsProps) {
  const map = useMap()

  useEffect(() => {
    if (!visible || !geojson || !geojson.features) {
      return
    }

    const layerGroup = L.layerGroup()

    geojson.features.forEach((feature: GeoJSONFeature) => {
      const props = feature.properties
      const aspect = props.terrain_aspect as string | null
      const slopeDeg = props.terrain_slope_deg as number | null
      const slopeClass = props.terrain_slope_class as string | null

      if (!aspect || aspect === 'flat' || slopeDeg === null || slopeDeg < 0.5) {
        return
      }

      // Get centroid
      let lat = 0
      let lng = 0
      let count = 0

      const geom = feature.geometry as any
      if (geom.type === 'Polygon') {
        geom.coordinates[0].forEach((coord: number[]) => {
          lng += coord[0]
          lat += coord[1]
          count++
        })
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((poly: number[][][]) => {
          poly[0].forEach((coord: number[]) => {
            lng += coord[0]
            lat += coord[1]
            count++
          })
        })
      }

      if (count === 0) return
      lat /= count
      lng /= count

      // Arrow length based on slope (8px to 28px)
      const arrowLen = Math.min(28, Math.max(8, slopeDeg * 1.5))
      const color = SLOPE_COLORS[slopeClass || 'flat'] || '#58a6ff'
      const angle = ASPECT_ANGLES[aspect] ?? 0

      // Create arrow as a divIcon
      const icon = L.divIcon({
        className: 'terrain-arrow-marker',
        html: `<div style="
          width:0;height:0;
          border-left:3px solid transparent;
          border-right:3px solid transparent;
          border-bottom:${arrowLen}px solid ${color};
          transform:rotate(${angle}deg);
          transform-origin:50% 0%;
          opacity:0.85;
          filter:drop-shadow(0 0 2px rgba(0,0,0,0.5));
        "></div>`,
        iconSize: [6, arrowLen],
        iconAnchor: [3, 0],
      })

      const marker = L.marker([lat, lng], { icon, interactive: false })
      layerGroup.addLayer(marker)
    })

    layerGroup.addTo(map)

    return () => {
      map.removeLayer(layerGroup)
    }
  }, [map, geojson, visible])

  return null
}
