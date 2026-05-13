/**
 * Geodesic measurement utilities (WGS84).
 * No external dependencies — uses spherical Earth formulas.
 */

const R = 6371000 // Earth radius in meters

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Haversine distance between two [lat, lng] points in meters */
export function distanceM(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const sinDLat2 = Math.sin(dLat / 2)
  const sinDLng2 = Math.sin(dLng / 2)
  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinDLat2 * sinDLat2 +
          Math.cos(lat1) * Math.cos(lat2) * sinDLng2 * sinDLng2
      )
    )
  return R * c
}

/** Length of a LineString or MultiLineString in meters */
export function lineLengthM(geometry: GeoJSON.Geometry): number {
  if (geometry.type === 'LineString') {
    return lineStringLength(geometry.coordinates as [number, number][])
  }
  if (geometry.type === 'MultiLineString') {
    return (geometry.coordinates as [number, number][][]).reduce(
      (sum, ring) => sum + lineStringLength(ring),
      0
    )
  }
  return 0
}

function lineStringLength(coords: [number, number][]): number {
  let len = 0
  for (let i = 1; i < coords.length; i++) {
    len += distanceM(
      [coords[i - 1][1], coords[i - 1][0]],
      [coords[i][1], coords[i][0]]
    )
  }
  return len
}

/** Area of a Polygon or MultiPolygon in square meters (spherical excess) */
export function polygonAreaM2(geometry: GeoJSON.Geometry): number {
  if (geometry.type === 'Polygon') {
    return polygonRingsArea(geometry.coordinates as [number, number][][])
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as [number, number][][][]).reduce(
      (sum, polygon) => sum + polygonRingsArea(polygon),
      0
    )
  }
  return 0
}

function polygonRingsArea(rings: [number, number][][]): number {
  let area = 0
  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i]
    // Close ring if not closed
    const coords =
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1]
        ? ring
        : [...ring, ring[0]]
    const ringArea = ringAreaM2(coords)
    area += i === 0 ? ringArea : -ringArea // exterior positive, holes negative
  }
  return Math.abs(area)
}

/** Spherical excess area for a single ring */
function ringAreaM2(coords: [number, number][]): number {
  let area = 0
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i]
    const [lng2, lat2] = coords[i + 1]
    area +=
      toRad(lng2 - lng1) *
      (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)))
  }
  return Math.abs((area * R * R) / 2)
}

/** Format meters → km or m */
export function fmtLength(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} კმ`
  return `${Math.round(m)} მ`
}

/** Format m² → ha or km² */
export function fmtArea(m2: number): string {
  const ha = m2 / 10000
  if (ha >= 100) return `${(ha / 100).toFixed(2)} კმ²`
  return `${ha.toFixed(3)} ჰა`
}

/** Format lat/lng nicely */
export function fmtCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}
