/**
 * useCadastralSearch — search a Georgian cadastral code via the backend /search endpoint.
 *
 * The backend cascades through three levels:
 *   1. Exact parcel  (CP.CadastralBlock WFS)           → full highlight
 *   2. Quarter       (CP.CadastralQuarter WFS)         → dim quarter highlight + message
 *   3. Municipality  (static bbox table)               → region zoom + message
 */
import { useState, useCallback } from 'react'
import type { CadastralSearchResult } from './CadastralLayers'

export type SearchLevel = 'parcel' | 'quarter' | 'municipality' | 'none'

export interface CadastralSearchResponse {
  level: SearchLevel
  geojson: GeoJSON.Feature | null
  bbox: [number, number, number, number] | null
  code: string
  message: string | null
}

interface UseCadastralSearchReturn {
  query: string
  setQuery: (q: string) => void
  searching: boolean
  result: CadastralSearchResult | null
  searchResponse: CadastralSearchResponse | null
  notFound: boolean
  error: string | null
  search: () => void
  clear: () => void
}

export function useCadastralSearch(): UseCadastralSearchReturn {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<CadastralSearchResult | null>(null)
  const [searchResponse, setSearchResponse] = useState<CadastralSearchResponse | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async () => {
    const code = query.trim()
    if (!code) return

    setSearching(true)
    setNotFound(false)
    setError(null)
    setResult(null)
    setSearchResponse(null)

    try {
      const res = await fetch(`/api/v1/cadastral/search?code=${encodeURIComponent(code)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: CadastralSearchResponse = await res.json()

      setSearchResponse(data)

      if (data.level === 'none') {
        setNotFound(true)
        setTimeout(() => setNotFound(false), 4000)
        return
      }

      if (data.level === 'parcel' && data.geojson) {
        setResult({
          geojson: data.geojson,
          attributes: (data.geojson.properties || {}) as Record<string, unknown>,
          code: data.code,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'search error')
    } finally {
      setSearching(false)
    }
  }, [query])

  const clear = useCallback(() => {
    setQuery('')
    setResult(null)
    setSearchResponse(null)
    setNotFound(false)
    setError(null)
  }, [])

  return { query, setQuery, searching, result, searchResponse, notFound, error, search, clear }
}
