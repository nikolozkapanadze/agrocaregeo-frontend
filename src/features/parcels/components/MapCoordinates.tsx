/**
 * Mouse cursor coordinates display + share button.
 * Rendered inside <MapContainer> so it tracks map mousemove events.
 */
import { useState, useCallback } from 'react'
import { useMapEvents } from 'react-leaflet'
import { Share2, Copy, Check } from 'lucide-react'
import { fmtCoords } from '../lib/measure'

export function MapCoordinates() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)

  useMapEvents({
    mousemove(e) {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
    mouseout() {
      // keep last coords so the bar doesn't flicker empty
    },
  })

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [])

  const shareCoords = useCallback(async () => {
    if (!coords) return
    const text = fmtCoords(coords.lat, coords.lng)
    const url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'კოორდინატები',
          text: `მდებარეობა: ${text}`,
          url,
        })
        return
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    copyToClipboard(`${text} — ${url}`)
  }, [coords, copyToClipboard])

  if (!coords) return null

  const coordText = fmtCoords(coords.lat, coords.lng)
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`

  return (
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom: 12, marginRight: 12 }}>
      <div
        className="leaflet-control flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/70 backdrop-blur-xl px-3 py-2 shadow-2xl"
        onMouseEnter={() => setShowShare(true)}
        onMouseLeave={() => setShowShare(false)}
      >
        <span className="text-[11px] font-mono text-white/60 tabular-nums select-all">
          {coordText}
        </span>

        {showShare && (
          <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2 ml-0.5">
            <button
              title="კოორდინატების კოპირება"
              onClick={() => copyToClipboard(coordText)}
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
              title="Google Maps-ზე ნახვა"
              className="rounded p-1 text-white/30 hover:text-green-400 hover:bg-green-500/10 transition-colors"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
