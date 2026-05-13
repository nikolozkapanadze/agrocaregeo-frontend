import React from 'react'
import { useMapEvents, Polyline, CircleMarker } from 'react-leaflet'
import type L from 'leaflet'

interface Props {
  isActive: boolean
  points: L.LatLng[]
  onAddPoint: (latlng: L.LatLng) => void
}

/** Renders inside MapContainer — captures map clicks and shows a polygon preview. */
export function PolygonDrawTool({ isActive, points, onAddPoint }: Props): React.ReactElement | null {
  const map = useMapEvents({
    click(e) {
      if (!isActive) return
      onAddPoint(e.latlng)
    },
  })

  React.useEffect(() => {
    const container = map.getContainer()
    container.style.cursor = isActive ? 'crosshair' : ''
    return () => {
      container.style.cursor = ''
    }
  }, [isActive, map])

  if (points.length === 0) return null

  const positions = points.map(p => [p.lat, p.lng] as [number, number])
  const linePositions = points.length >= 3 ? [...positions, positions[0]] : positions

  return (
    <>
      <Polyline
        positions={linePositions}
        pathOptions={{ color: '#58a6ff', weight: 2, dashArray: '6 4', opacity: 0.9 }}
      />
      {points.map((pt, i) => (
        <CircleMarker
          key={i}
          center={[pt.lat, pt.lng]}
          radius={i === 0 ? 8 : 5}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: i === 0 ? '#58a6ff' : '#1f6feb',
            fillOpacity: 1,
          }}
        />
      ))}
    </>
  )
}
