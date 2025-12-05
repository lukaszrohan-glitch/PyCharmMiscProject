/**
 * Analytics caching hook
 * Prevents redundant API fetches on view changes by storing data with TTL
 */
import { useState, useCallback, useRef } from 'react'
import * as api from '../services/api'

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes cache

/**
 * Simple in-memory cache with TTL support
 */
class AnalyticsCache {
  constructor() {
    this.store = new Map()
  }

  get(key) {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data
  }

  set(key, data, ttlMs = DEFAULT_TTL_MS) {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      cachedAt: Date.now()
    })
  }

  invalidate(key) {
    if (key) {
      this.store.delete(key)
    } else {
      this.store.clear()
    }
  }

  getCacheAge(key) {
    const entry = this.store.get(key)
    if (!entry) return null
    return Date.now() - entry.cachedAt
  }
}

// Singleton cache instance shared across components
const cacheInstance = new AnalyticsCache()

/**
 * Hook for cached analytics summary fetching
 * @param {Object} options - Configuration options
 * @param {number} options.ttl - Cache TTL in milliseconds (default: 5 min)
 * @param {boolean} options.forceRefresh - Skip cache and fetch fresh data
 */
export function useAnalyticsSummary({ ttl = DEFAULT_TTL_MS, forceRefresh = false } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const fetchingRef = useRef(false)

  const fetch = useCallback(async (params = {}, options = {}) => {
    const skipCache = options.forceRefresh || forceRefresh
    const cacheKey = `analytics_summary_${JSON.stringify(params)}`

    // Check cache first
    if (!skipCache) {
      const cached = cacheInstance.get(cacheKey)
      if (cached) {
        setData(cached)
        setFromCache(true)
        setError(null)
        return cached
      }
    }

    // Prevent duplicate parallel fetches
    if (fetchingRef.current) return data
    fetchingRef.current = true
    setLoading(true)
    setFromCache(false)

    try {
      const result = await api.getAnalyticsSummary(params)
      cacheInstance.set(cacheKey, result, ttl)
      setData(result)
      setError(null)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [data, forceRefresh, ttl])

  const invalidate = useCallback((params = {}) => {
    const cacheKey = `analytics_summary_${JSON.stringify(params)}`
    cacheInstance.invalidate(cacheKey)
  }, [])

  const invalidateAll = useCallback(() => {
    cacheInstance.invalidate()
  }, [])

  const getCacheAge = useCallback((params = {}) => {
    const cacheKey = `analytics_summary_${JSON.stringify(params)}`
    return cacheInstance.getCacheAge(cacheKey)
  }, [])

  return {
    data,
    loading,
    error,
    fromCache,
    fetch,
    invalidate,
    invalidateAll,
    getCacheAge
  }
}

/**
 * Hook for cached revenue by month data
 */
export function useRevenueByMonth({ ttl = DEFAULT_TTL_MS } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const fetchingRef = useRef(false)

  const fetch = useCallback(async (options = {}) => {
    const cacheKey = 'revenue_by_month'

    if (!options.forceRefresh) {
      const cached = cacheInstance.get(cacheKey)
      if (cached) {
        setData(cached)
        setFromCache(true)
        setError(null)
        return cached
      }
    }

    if (fetchingRef.current) return data
    fetchingRef.current = true
    setLoading(true)
    setFromCache(false)

    try {
      const result = await api.getRevenueByMonth()
      cacheInstance.set(cacheKey, result, ttl)
      setData(result)
      setError(null)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [data, ttl])

  return { data, loading, error, fromCache, fetch }
}

/**
 * Hook for cached top customers data
 */
export function useTopCustomers({ ttl = DEFAULT_TTL_MS } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const fetchingRef = useRef(false)

  const fetch = useCallback(async (params = {}, options = {}) => {
    const cacheKey = `top_customers_${JSON.stringify(params)}`

    if (!options.forceRefresh) {
      const cached = cacheInstance.get(cacheKey)
      if (cached) {
        setData(cached)
        setFromCache(true)
        setError(null)
        return cached
      }
    }

    if (fetchingRef.current) return data
    fetchingRef.current = true
    setLoading(true)
    setFromCache(false)

    try {
      const result = await api.getTopCustomers(params)
      cacheInstance.set(cacheKey, result, ttl)
      setData(result)
      setError(null)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [data, ttl])

  return { data, loading, error, fromCache, fetch }
}

// Export cache instance for advanced usage (e.g., manual invalidation)
export { cacheInstance as analyticsCache }

