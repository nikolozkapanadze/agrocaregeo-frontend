/// <reference types="vite/client" />
/**
 * Basemap configuration for all map components.
 *
 * Providers:
 *   • Google Satellite      — frequent updates, high resolution
 *   • Esri World Imagery    — free, reliable, moderate refresh
 *   • Mapbox Satellite      — frequent updates, requires access token
 *   • OpenTopoMap           — free terrain/topography
 *   • OpenStreetMap         — free standard map
 */

export type BasemapKey = 'google' | 'esri' | 'mapbox' | 'terrain' | 'osm'

export interface BasemapConfig {
  key: BasemapKey
  label: string
  labelKa: string
  url: string | null
  attribution: string
  maxZoom: number
  subdomains?: string | string[]
  crossOrigin?: boolean
  requiresToken: boolean
  tokenEnvVar: string
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export const BASEMAPS: Record<BasemapKey, BasemapConfig> = {
  google: {
    key: 'google',
    label: 'Google Satellite',
    labelKa: 'Google სატელიტი',
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&hl=en',
    attribution: 'Imagery &copy; Google',
    maxZoom: 22,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    crossOrigin: false,
    requiresToken: false,
    tokenEnvVar: '',
  },
  esri: {
    key: 'esri',
    label: 'Esri Satellite',
    labelKa: 'Esri სატელიტი',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
    subdomains: undefined,
    requiresToken: false,
    tokenEnvVar: '',
  },
  mapbox: {
    key: 'mapbox',
    label: 'Mapbox Satellite',
    labelKa: 'Mapbox სატელიტი',
    url: MAPBOX_TOKEN
      ? `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${MAPBOX_TOKEN}`
      : null,
    attribution:
      'Imagery &copy; Mapbox &mdash; <a href="https://www.mapbox.com/about/maps/">Terms</a>',
    maxZoom: 22,
    requiresToken: true,
    tokenEnvVar: 'VITE_MAPBOX_TOKEN',
  },
  terrain: {
    key: 'terrain',
    label: 'Terrain',
    labelKa: 'ტოპოგრაფია',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>)',
    maxZoom: 17,
    subdomains: 'abc',
    requiresToken: false,
    tokenEnvVar: '',
  },
  osm: {
    key: 'osm',
    label: 'OpenStreetMap',
    labelKa: 'რუკა',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
    requiresToken: false,
    tokenEnvVar: '',
  },
}

/** Ordered list for dropdowns. */
export const BASEMAP_LIST: BasemapConfig[] = [
  BASEMAPS.google,
  BASEMAPS.mapbox,
  BASEMAPS.esri,
  BASEMAPS.terrain,
  BASEMAPS.osm,
]

/** Default basemap: Google Satellite if available, else Mapbox with token, else Esri. */
export function getDefaultBasemap(): BasemapConfig {
  return BASEMAPS.google
}
