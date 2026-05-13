/**
 * Map Tools Panel — grouped toolbar for coordinates, share, and measurement.
 * Rendered inside <MapContainer>.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair, Share2, Copy, Check, MapPin, Ruler, AreaChart, Trash2, MousePointer } from 'lucide-react'
import { fmtCoords, distanceM, fmtLength, fmtArea, polygonAreaM2 } from '../lib/measure'

type ToolMode = 'none' | 'point' | 'length' | 'area'

interface MeasureResult {
  mode: ToolMode
  points: [number, number][] // [lat, lng]
  value: string
}

export function MapToolsPanel() {
  const map = useMap()
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [mode, setMode] = useState<ToolMode>('none')
  const [measureResult, setMeasureResult] = useState<MeasureResult | null>(null)
  const [copied, setCopied] = useState(false)
  const drawLayerRef = useRef<L.LayerGroup | null>(null)
  const tempPointsRef = useRef<[number, number][]>([])

  // Ensure draw layer exists
  useEffect(() => {
    if (!drawLayerRef.current) {
      drawLayerRef.current = L.layerGroup().addTo(map)
    }
    return () => {
      drawLayerRef.current?.clearLayers()
    }
  }, [map])

  // Clear draw layer when mode changes or unmounts
  useEffect(() => {
    drawLayerRef.current?.clearLayers()
    tempPointsRef.current = []
    if (mode === 'none') {
      setMeasureResult(null)
    }
  }, [mode])

  const redrawTemp = useCallback(() => {
    drawLayerRef.current?.clearLayers()
    const pts = tempPointsRef.current
    if (pts.length === 0) return

    // Draw points
    pts.forEach((p, idx) => {
      const isLast = idx === pts.length - 1
      L.circleMarker([p[0], p[1]], {
        radius: isLast ? 6 : 4,
        color: '#f59e0b',
        fillColor: isLast ? '#f59e0b' : '#fff',
        fillOpacity: 1,
        weight: 2,
      }).addTo(drawLayerRef.current!)
    })

    // Draw connecting line
    if (pts.length > 1) {
      const latlngs = pts.map(p => [p[0], p[1]] as [number, number])
      L.polyline(latlngs, { color: '#f59e0b', weight: 3, dashArray: '6 4' }).addTo(drawLayerRef.current!)
    }

    // Close polygon preview for area mode
    if (mode === 'area' && pts.length > 2) {
      const closed = [...pts, pts[0]]
      L.polygon(closed.map(p => [p[0], p[1]]), {
        color: '#f59e0b',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.15,
        dashArray: '6 4',
      }).addTo(drawLayerRef.current!)
    }
  }, [mode])

  useMapEvents({
    mousemove(e) {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
    click(e) {
      if (mode === 'none') {
        // Click to pin a point
        const pt: [number, number] = [e.latlng.lat, e.latlng.lng]
        tempPointsRef.current = [pt]
        redrawTemp()
        setMeasureResult({
          mode: 'point',
          points: [pt],
          value: fmtCoords(pt[0], pt[1]),
        })
        return
      }

      if (mode === 'point') {
        const pt: [number, number] = [e.latlng.lat, e.latlng.lng]
        tempPointsRef.current = [pt]
        redrawTemp()
        setMeasureResult({
          mode: 'point',
          points: [pt],
          value: fmtCoords(pt[0], pt[1]),
        })
        return
      }

      if (mode === 'length' || mode === 'area') {
        const pt: [number, number] = [e.latlng.lat, e.latlng.lng]
        tempPointsRef.current = [...tempPointsRef.current, pt]
        redrawTemp()

        const pts = tempPointsRef.current
        if (mode === 'length' && pts.length >= 2) {
          let total = 0
          for (let i = 1; i < pts.length; i++) {
            total += distanceM(pts[i - 1], pts[i])
          }
          setMeasureResult({
            mode: 'length',
            points: pts,
            value: fmtLength(total),
          })
        }

        if (mode === 'area' && pts.length >= 3) {
          const geojsonRing: [number, number][] = [
            ...pts.map(p => [p[1], p[0]] as [number, number]),
            [pts[0][1], pts[0][0]],
          ]
          const area = polygonAreaM2({
            type: 'Polygon',
            coordinates: [geojsonRing],
          } as GeoJSON.Polygon)
          setMeasureResult({
            mode: 'area',
            points: pts,
            value: fmtArea(area),
          })
        }
      }
    },
  })

  const copyCoords = useCallback(async () => {
    if (!coords) return
    const text = fmtCoords(coords.lat, coords.lng)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [coords])

  const shareCoords = useCallback(async () => {
    if (!coords) return
    const text = fmtCoords(coords.lat, coords.lng)
    const url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'კოორდინატები', text: `მდებარეობა: ${text}`, url })
        return
      } catch { /* fall through */ }
    }
    copyCoords()
  }, [coords, copyCoords])

  const clearMeasure = useCallback(() => {
    tempPointsRef.current = []
    drawLayerRef.current?.clearLayers()
    setMeasureResult(null)
    setMode('none')
  }, [])

  const coordText = coords ? fmtCoords(coords.lat, coords.lng) : '—'
  const gmapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : '#'

  return (
    <div className="leaflet-bottom leaflet-left" style={{ marginBottom: 12, marginLeft: 12 }}>
      <div className="leaflet-control flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-black/75 backdrop-blur-xl shadow-2xl p-2.5" style={{ minWidth: 220, maxWidth: 260 }}>

        {/* Header */}
        <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/[0.06]">
          <Crosshair className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">რუკის ხელსაწყოები</span>
        </div>

        {/* Coordinates row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-white/60 tabular-nums select-all truncate">
            {coordText}
          </span>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              title="კოპირება"
              onClick={copyCoords}
              className="rounded p-1 text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            </button>
            <button
              title="გაზიარება"
              onClick={shareCoords}
              className="rounded p-1 text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <Share2 className="h-3 w-3" />
            </button>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Google Maps"
              className="rounded p-1 text-white/30 hover:text-green-400 hover:bg-green-500/10 transition-colors"
            >
              <MapPin className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Tool buttons */}
        <div className="flex items-center gap-1">
          <ToolBtn
            active={mode === 'point'}
            onClick={() => setMode(mode === 'point' ? 'none' : 'point')}
            icon={<MousePointer className="h-3 w-3" />}
            label="წერტილი"
          />
          <ToolBtn
            active={mode === 'length'}
            onClick={() => setMode(mode === 'length' ? 'none' : 'length')}
            icon={<Ruler className="h-3 w-3" />}
            label="სიგრძე"
          />
          <ToolBtn
            active={mode === 'area'}
            onClick={() => setMode(mode === 'area' ? 'none' : 'area')}
            icon={<AreaChart className="h-3 w-3" />}
            label="ფართობი"
          />
          {(mode !== 'none' || measureResult) && (
            <button
              onClick={clearMeasure}
              title="გასუფთავება"
              className="ml-auto rounded p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Mode hint */}
        {mode !== 'none' && !measureResult && (
          <p className="text-[10px] text-amber-300/70 bg-amber-500/10 rounded px-2 py-1">
            {mode === 'point' && 'დააჭირეთ რუკას წერტილის მოსანიშნად'}
            {mode === 'length' && 'დააჭირეთ რუკას მონაკვეთების დასაწყობად (2+) '}
            {mode === 'area' && 'დააჭირეთ რუკას კუთხეების დასაწყობად (3+)'}
          </p>
        )}

        {/* Measurement result */}
        {measureResult && (
          <div className="rounded-lg bg-white/[0.05] border border-white/[0.06] px-2.5 py-2 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {measureResult.mode === 'point' && <MousePointer className="h-3 w-3 text-amber-400" />}
              {measureResult.mode === 'length' && <Ruler className="h-3 w-3 text-blue-400" />}
              {measureResult.mode === 'area' && <AreaChart className="h-3 w-3 text-green-400" />}
              <span className="text-[11px] text-white/70 font-medium">
                {measureResult.mode === 'point' && 'წერტილი'}
                {measureResult.mode === 'length' && 'სიგრძე'}
                {measureResult.mode === 'area' && 'ფართობი'}
              </span>
            </div>
            <span className="text-sm font-bold text-white/90 font-mono">
              {measureResult.value}
            </span>
            {measureResult.points.length > 0 && (
              <span className="text-[10px] text-white/30">
                {measureResult.points.length} მონაკვეთი
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ToolBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors border ${
        active
          ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
          : 'bg-white/5 border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/10'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
