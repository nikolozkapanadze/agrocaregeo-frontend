/**
 * Leaflet GeoJSON renderer for spatial layers (parcel_lines / parcel_points / parcel_polygons).
 * Mounted inside <MapContainer>. Renders each active layer with optional property-based colorization.
 */
import React from 'react'
import L from 'leaflet'
import { GeoJSON } from 'react-leaflet'
import type { ActiveSpatialLayer } from '../hooks/useSpatialLayers'
import { polygonAreaM2, lineLengthM, fmtArea, fmtLength } from '../lib/measure'

// Accessible, distinct palette
export const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6',
  '#f97316', '#84cc16', '#64748b', '#a855f7',
]

export function hashColor(value: string): string {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) & 0xffff
  }
  return COLORS[h % COLORS.length]
}

function baseColor(type: ActiveSpatialLayer['type']): string {
  if (type === 'polygon') return '#3b82f6'
  if (type === 'line')    return '#22c55e'
  return '#f59e0b'
}

function makeStyleFn(layer: ActiveSpatialLayer): (f?: GeoJSON.Feature) => L.PathOptions {
  if (!layer.classifyKey) {
    const color = baseColor(layer.type)
    return () => ({
      color,
      fillColor: color,
      fillOpacity: layer.type === 'polygon' ? 0.30 : 0,
      weight: layer.type === 'line' ? 2.5 : 1.5,
      opacity: 0.9,
    })
  }
  const key = layer.classifyKey
  return (feature?: GeoJSON.Feature) => {
    const val = String(feature?.properties?.[key] ?? '')
    const color = hashColor(val)
    return {
      color,
      fillColor: color,
      fillOpacity: layer.type === 'polygon' ? 0.40 : 0,
      weight: layer.type === 'line' ? 2.5 : 1.5,
      opacity: 1,
    }
  }
}

function bindLabel(
  feature: GeoJSON.Feature,
  mapLayer: L.Layer,
  classifyKey: string | null,
  type: ActiveSpatialLayer['type'],
): void {
  if (!classifyKey) return
  const val = feature.properties?.[classifyKey]
  if (val == null || val === '') return
  const text = String(val)
  ;(mapLayer as L.Path).bindTooltip(
    `<span>${text}</span>`,
    {
      permanent: true,
      direction: type === 'point' ? 'right' : 'center',
      className: 'spatial-layer-label',
      opacity: 1,
    }
  )
}

function buildPopup(feature: GeoJSON.Feature, classifyKey: string | null, layerType?: string): string {
  const props = feature.properties ?? {}
  const parcelNr = props._parcel_nr
    ? `<div style="font-weight:600;color:#58a6ff;margin-bottom:4px">${props._parcel_nr}</div>`
    : ''
  const classifyVal = classifyKey && props[classifyKey] != null
    ? `<div style="margin-bottom:4px"><b>${classifyKey}:</b> ${props[classifyKey]}</div>`
    : ''

  // Measurement: area for polygons, length for lines
  let measureHtml = ''
  const geom = feature.geometry
  if (geom && (layerType === 'polygon' || geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
    const area = polygonAreaM2(geom)
    if (area > 0) {
      measureHtml = `<div style="margin-bottom:4px;color:#22c55e;font-weight:600">📐 ფართობი: ${fmtArea(area)}</div>`
    }
  } else if (geom && (layerType === 'line' || geom.type === 'LineString' || geom.type === 'MultiLineString')) {
    const len = lineLengthM(geom)
    if (len > 0) {
      measureHtml = `<div style="margin-bottom:4px;color:#3b82f6;font-weight:600">📏 სიგრძე: ${fmtLength(len)}</div>`
    }
  }

  const rest = Object.entries(props)
    .filter(([k]) => !k.startsWith('_') && k !== classifyKey)
    .map(([k, v]) => `<div><span style="color:#8b949e">${k}:</span> ${v ?? '—'}</div>`)
    .join('')
  return (
    `<div style="font-size:12px;line-height:1.5;max-width:220px">` +
    parcelNr + measureHtml + classifyVal + (rest || '<span style="color:#6e7681">— no properties —</span>') +
    `</div>`
  )
}

interface Props {
  layers: ActiveSpatialLayer[]
}

export default function SpatialLayersRenderer({ layers }: Props): React.ReactElement | null {
  const visible = layers.filter(l => l.geojson && !l.loading)
  if (visible.length === 0) return null

  return (
    <>
      {visible.map(layer => {
        const stylesFn = makeStyleFn(layer)
        // Key changes when classify key changes so Leaflet re-renders with new colors
        const key = `sl-${layer.type}-${layer.name}-${layer.classifyKey ?? '__none__'}`

        if (layer.type === 'point') {
          return (
            <GeoJSON
              key={key}
              data={layer.geojson as GeoJSON.GeoJsonObject}
              pointToLayer={(feature, latlng) => {
                const color = layer.classifyKey
                  ? hashColor(String(feature.properties?.[layer.classifyKey] ?? ''))
                  : baseColor('point')
                return L.circleMarker(latlng, {
                  radius: 6,
                  fillColor: color,
                  fillOpacity: 0.85,
                  color: '#fff',
                  weight: 1.5,
                  opacity: 1,
                })
              }}
              onEachFeature={(feature, mapLayer) => {
                mapLayer.bindPopup(buildPopup(feature, layer.classifyKey, layer.type))
                bindLabel(feature, mapLayer, layer.classifyKey, 'point')
              }}
            />
          )
        }

        return (
          <GeoJSON
            key={key}
            data={layer.geojson as GeoJSON.GeoJsonObject}
            style={stylesFn}
            onEachFeature={(feature, mapLayer) => {
              mapLayer.bindPopup(buildPopup(feature, layer.classifyKey, layer.type))
              bindLabel(feature, mapLayer, layer.classifyKey, layer.type)
            }}
          />
        )
      })}
    </>
  )
}
