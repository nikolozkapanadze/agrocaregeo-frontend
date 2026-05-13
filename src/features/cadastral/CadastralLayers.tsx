/**
 * CadastralLayers — NAPR cadastral overlay for the farm map.
 *
 * Must be rendered INSIDE <MapContainer>.
 * Manages three WMS tile layers + click-to-identify + fly-to for search results.
 *
 * Highlight strategy: WMS GetMap with CQL_FILTER + SLD_BODY.
 * GeoServer renders the matched parcel server-side, so this works for ALL Georgian
 * regions — not just Tbilisi where WFS geometry is available.
 *
 * All requests go through /api/v1/cadastral/proxy to avoid browser CORS.
 */
import React, { useEffect, useRef } from 'react'
import { WMSTileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { CadastralSearchResponse } from './useCadastralSearch'

export interface CadastralLayerVisibility {
  parcel: boolean
  block: boolean
  building: boolean
}

export interface CadastralSearchResult {
  geojson: GeoJSON.Feature | null
  attributes: Record<string, unknown>
  code: string
}

interface Props {
  visible: CadastralLayerVisibility
  searchResult: CadastralSearchResult | null
  searchResponse: CadastralSearchResponse | null
  onFeatureInfo: (html: string, latlng: L.LatLng) => void
  cadastralLayerActive: boolean
}

// Proxy base URL — all NAPR OWS requests go through the backend
const PROXY = '/api/v1/cadastral/proxy'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WMS_PARAMS = { format: 'image/png', transparent: true, version: '1.3.0' } as any

/**
 * Build an SLD_BODY string that highlights a single polygon with orange fill/stroke.
 * The layer name must match the WMS layer being filtered.
 *
 * Layer coverage (confirmed via WMS tile analysis):
 *   CP.CadastralBlock   — queryable, CQL_FILTER works, but WMS data is Tbilisi-only (region 01)
 *   CP.CadastralQuarter — queryable, CQL_FILTER works for ALL Georgian regions ✓
 *   CP.CadastralParcel  — queryable=0, CQL_FILTER NOT supported (visual tiles only)
 */
function buildHighlightSLD(layerName: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">' +
    `<NamedLayer><Name>${layerName}</Name><UserStyle><Name>highlight</Name>` +
    '<FeatureTypeStyle><Rule>' +
    '<PolygonSymbolizer>' +
    '<Fill><CssParameter name="fill">#f97316</CssParameter><CssParameter name="fill-opacity">0.35</CssParameter></Fill>' +
    '<Stroke><CssParameter name="stroke">#f97316</CssParameter><CssParameter name="stroke-width">3</CssParameter></Stroke>' +
    '</PolygonSymbolizer>' +
    '</Rule></FeatureTypeStyle></UserStyle></NamedLayer>' +
    '</StyledLayerDescriptor>'
  )
}

/**
 * Determine which WMS layer + CADCODE to use for the CQL_FILTER highlight,
 * based on the cascade level returned by the backend search.
 *
 * Returns null when no server-side highlight is possible (municipality level).
 */
function getHighlightConfig(
  searchResponse: CadastralSearchResponse | null,
): { layers: string; filterCode: string; sld: string } | null {
  if (!searchResponse || searchResponse.level === 'none') return null

  if (searchResponse.level === 'parcel') {
    // Tbilisi (region 01): CP.CadastralBlock has WMS data + CADCODE attribute
    return {
      layers: 'napr_cp:CP.CadastralBlock',
      filterCode: searchResponse.code,
      sld: buildHighlightSLD('napr_cp:CP.CadastralBlock'),
    }
  }

  if (searchResponse.level === 'quarter') {
    // All regions: CP.CadastralQuarter WMS supports CQL_FILTER; use first 3 code segments
    const quarterCode = searchResponse.code.split('.').slice(0, 3).join('.')
    return {
      layers: 'napr_cp:CP.CadastralQuarter',
      filterCode: quarterCode,
      sld: buildHighlightSLD('napr_cp:CP.CadastralQuarter'),
    }
  }

  // municipality level — zoom only, no queryable layer available
  return null
}

export default function CadastralLayers({
  visible,
  searchResult,
  searchResponse,
  onFeatureInfo,
  cadastralLayerActive,
}: Props): React.ReactElement {
  const map = useMap()
  const popupRef = useRef<L.Popup | null>(null)

  // --- Handle search response: fly to bbox + optional popup ---
  useEffect(() => {
    if (popupRef.current) {
      map.closePopup(popupRef.current)
      popupRef.current = null
    }

    if (!searchResponse || searchResponse.level === 'none') return

    const { level, geojson, bbox, code, message } = searchResponse

    // Fly to the result bbox
    if (bbox) {
      const [west, south, east, north] = bbox
      const padding: [number, number] = level === 'parcel' ? [60, 60] : level === 'quarter' ? [40, 40] : [20, 20]
      map.flyToBounds([[south, west], [north, east]], {
        padding,
        // quarter → zoom 17 so individual parcel boundaries are visible in WMS tiles
        maxZoom: level === 'parcel' ? 17 : level === 'quarter' ? 17 : 13,
        duration: 0.8,
      })
    }

    // Compute popup anchor — prefer geometry centroid, fall back to bbox centre
    const bboxCenter = bbox
      ? L.latLng((bbox[1] + bbox[3]) / 2, (bbox[0] + bbox[2]) / 2)
      : map.getCenter()

    const popupAnchor = (() => {
      if (geojson) {
        try {
          return L.geoJSON(geojson as GeoJSON.GeoJsonObject).getBounds().getCenter()
        } catch { /* fall through */ }
      }
      return bboxCenter
    })()

    if (level === 'parcel' && geojson) {
      // WFS geometry available (Tbilisi region) — show attribute popup
      const attrs = (geojson.properties || {}) as Record<string, unknown>
      const popup = L.popup({ maxWidth: 280 })
        .setLatLng(popupAnchor)
        .setContent(buildAttributePopup(code, attrs))
        .openOn(map)
      popupRef.current = popup
    } else if (message) {
      // Quarter / municipality fallback — show info message after fly animation
      setTimeout(() => {
        const popup = L.popup({ maxWidth: 280 })
          .setLatLng(popupAnchor)
          .setContent(
            `<div style="font-family:inherit;font-size:12px;color:#e6edf3;max-width:240px">${message}</div>`,
          )
          .openOn(map)
        popupRef.current = popup
      }, 900)
    }
  }, [searchResponse, map])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useEffect(() => {}, [searchResult])

  // --- Click-to-identify (GetFeatureInfo on CP.CadastralParcel) ---
  useMapEvents({
    click: async (e) => {
      if (!cadastralLayerActive || !visible.parcel) return

      const size = map.getSize()
      const bounds = map.getBounds()
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      const point = map.latLngToContainerPoint(e.latlng)

      const params = new URLSearchParams({
        service: 'WMS',
        version: '1.3.0',
        request: 'GetFeatureInfo',
        layers: 'napr_cp:CP.CadastralParcel',
        query_layers: 'napr_cp:CP.CadastralParcel',
        styles: '',
        info_format: 'application/json',
        feature_count: '1',
        i: Math.round(point.x).toString(),
        j: Math.round(point.y).toString(),
        width: size.x.toString(),
        height: size.y.toString(),
        crs: 'EPSG:4326',
        bbox: `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`,
      })

      try {
        const res = await fetch(`${PROXY}?${params}`)
        if (!res.ok) return
        const text = await res.text()
        if (text.startsWith('<html') || text.startsWith('<!DOCTYPE')) return
        const data = JSON.parse(text)
        const features = data?.features
        if (!features || features.length === 0) return
        const props = features[0].properties || {}
        const code = (props.nationalCadastralReference || props.CADCODE || props.label || '') as string
        onFeatureInfo(buildAttributePopup(code, props), e.latlng)
      } catch { /* ignore */ }
    },
  })

  const highlightConfig = getHighlightConfig(searchResponse)

  return (
    <>
      {visible.parcel && (
        <WMSTileLayer
          url={PROXY}
          layers="napr_cp:CP.CadastralParcel"
          {...WMS_PARAMS}
          opacity={0.75}
          zIndex={400}
          attribution="&copy; NAPR Georgia"
        />
      )}
      {visible.block && (
        <WMSTileLayer
          url={PROXY}
          layers="napr_cp:CP.CadastralBlock"
          {...WMS_PARAMS}
          opacity={0.65}
          zIndex={401}
        />
      )}
      {visible.building && (
        <WMSTileLayer
          url={PROXY}
          layers="napr_cp:CP.CadastralBuilding"
          {...WMS_PARAMS}
          opacity={0.70}
          zIndex={402}
        />
      )}

      {/*
       * Search highlight layer — WMS GetMap with CQL_FILTER + SLD_BODY.
       *
       * Layer selection (confirmed by WMS tile pixel analysis):
       *   parcel level  → CP.CadastralBlock   CADCODE='XX.XX.XX.XXX'  (Tbilisi only)
       *   quarter level → CP.CadastralQuarter CADCODE='XX.XX.XX'      (all regions ✓)
       *   municipality  → no filterable layer; just zoom
       *
       * SLD_BODY paints the matched geometry orange; the tile is transparent elsewhere.
       * key forces react-leaflet to recreate the layer on each new search.
       */}
      {highlightConfig && (
        <WMSTileLayer
          key={`hl-${highlightConfig.filterCode}`}
          url={PROXY}
          layers={highlightConfig.layers}
          {...({
            ...WMS_PARAMS,
            CQL_FILTER: `CADCODE='${highlightConfig.filterCode}'`,
            SLD_BODY: highlightConfig.sld,
          } as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          opacity={1.0}
          zIndex={450}
        />
      )}
    </>
  )
}

function buildAttributePopup(code: string, attrs: Record<string, unknown>): string {
  const rows = [
    ['საკადასტრო კოდი', code || attrs.CADCODE || attrs.label || '—'],
    ['ფართობი', attrs.areaValue ? `${attrs.areaValue} м²` : (attrs.area ? `${attrs.area} м²` : null)],
    ['სახელი', attrs.name || attrs.localId || null],
    ['სტატუსი', attrs.validFrom ? `მოქმედია (${attrs.validFrom})` : null],
  ].filter(([, v]) => v != null)

  const rowsHtml = rows.map(
    ([k, v]) => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#8b949e;margin-bottom:2px">
      <span>${k}:</span><b style="color:#e6edf3;text-align:right">${v}</b>
    </div>`,
  ).join('')

  return `<div style="min-width:200px;font-family:inherit">
    <div style="font-weight:600;font-size:13px;color:#f97316;margin-bottom:6px">
      კადასტრი: ${code || '—'}
    </div>
    ${rowsHtml || '<div style="font-size:11px;color:#6e7681">ატრიბუტები არ არის</div>'}
  </div>`
}
