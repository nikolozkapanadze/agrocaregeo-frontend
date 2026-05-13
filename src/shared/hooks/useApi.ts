import { useState, useEffect, useCallback, useRef } from 'react'

interface UseApiOptions {
  enabled?: boolean
  retryCount?: number
  retryDelay?: number
}

export function useApi<T>(
  fetcher: (signal?: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  options: UseApiOptions = {}
): { 
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
  abort: () => void
} {
  const { enabled = true, retryCount = 0, retryDelay = 1000 } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  const doFetch = useCallback(async () => {
    // Abort any pending request
    abort()
    
    setLoading(true)
    setError(null)
    
    try {
      abortControllerRef.current = new AbortController()
      const result = await fetcher(abortControllerRef.current.signal)
      setData(result)
      retryCountRef.current = 0 // Reset retry count on success
    } catch (e) {
      // Don't set error if aborted
      if (e instanceof Error && e.name === 'AbortError') {
        return
      }
      
      const errorMessage = e instanceof Error ? e.message : 'Unknown error'
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current += 1
        console.log(`Retrying... attempt ${retryCountRef.current}/${retryCount}`)
        retryTimeoutRef.current = setTimeout(() => {
          doFetch()
        }, retryDelay * retryCountRef.current) // Exponential backoff
        return
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (!enabled) return
    
    doFetch()
    
    return () => {
      abort()
    }
  }, [doFetch, enabled, abort])

  return { data, loading, error, refetch: doFetch, abort }
}

// Helper for making cancellable requests
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}
