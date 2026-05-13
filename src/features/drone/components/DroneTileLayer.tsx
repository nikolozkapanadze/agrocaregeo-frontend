import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

interface DroneTileLayerProps {
  flightId: string
  index: string
  apiBase: string
  token: string
}

/**
 * Custom Leaflet tile layer for drone spectral index tiles.
 * Uses fetch with Bearer auth since Leaflet's native TileLayer
 * cannot send custom headers via <img> tags.
 */
export function DroneTileLayer({ flightId, index, apiBase, token }: DroneTileLayerProps) {
  const map = useMap()

  useEffect(() => {
    const TileLayerClass = L.GridLayer.extend({
      createTile: function (coords: L.Coords) {
        const tile = document.createElement('canvas')
        const tileSize = this.getTileSize()
        tile.setAttribute('width', String(tileSize.x))
        tile.setAttribute('height', String(tileSize.y))

        const ctx = tile.getContext('2d')
        if (!ctx) return tile

        const url = `${apiBase}/drone/tiles/${flightId}/${index}/${coords.z}/${coords.x}/${coords.y}.png`

        fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.blob()
          })
          .then((blob) => {
            const img = new Image()
            const objectUrl = URL.createObjectURL(blob)
            img.onload = () => {
              ctx.drawImage(img, 0, 0)
              URL.revokeObjectURL(objectUrl)
            }
            img.onerror = () => {
              URL.revokeObjectURL(objectUrl)
            }
            img.src = objectUrl
          })
          .catch(() => {
            // Leave tile blank on error
          })

        return tile
      },
    })

    const instance = new TileLayerClass()
    map.addLayer(instance)

    return () => {
      map.removeLayer(instance)
    }
  }, [map, flightId, index, apiBase, token])

  return null
}
