import L from 'leaflet'
import {
  createElementObject,
  createTileLayerComponent,
  updateGridLayer,
} from '@react-leaflet/core'

/**
 * Custom Google Satellite TileLayer.
 *
 * Google's tile servers block requests based on the HTTP Referer header.
 * This component patches each tile <img> to use referrerPolicy="no-referrer",
 * which allows the tiles to load without exposing the site's URL to Google.
 *
 * Important: this ONLY affects Google tiles. Other providers (OSM, Esri, Mapbox)
 * keep the normal browser referrer behavior.
 */

const GoogleTileLayerClass = L.TileLayer.extend({
  createTile(coords: any, done: any) {
    const tile = (L.TileLayer.prototype as any).createTile.call(this, coords, done)
    if (tile instanceof HTMLImageElement) {
      tile.referrerPolicy = 'no-referrer'
    }
    return tile
  },
})

export const GoogleTileLayer = createTileLayerComponent(
  function createGoogleTileLayer({ url, ...options }: any, context: any) {
    const instance = new (GoogleTileLayerClass as any)(url, options)
    return createElementObject(instance, context)
  },
  updateGridLayer
)
