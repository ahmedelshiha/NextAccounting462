import { useCallback, useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { UserStats } from '../contexts/UsersContextProvider'

const STATS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

interface UseUserStatsOptions {
  onError?: (error: string) => void
}

interface UseUserStatsReturn {
  stats: UserStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

let cachedStats: UserStats | null = null
let cacheTimestamp: number = 0

export function useUserStats(options?: UseUserStatsOptions): UseUserStatsReturn {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if cache is still valid
      const now = Date.now()
      if (cachedStats && now - cacheTimestamp < STATS_CACHE_TTL) {
        setStats(cachedStats)
        setIsLoading(false)
        return
      }

      const res = await apiFetch('/api/admin/stats/users')
      if (!res.ok) {
        throw new Error(`Failed to load stats (${res.status})`)
      }

      const data = (await res.json()) as UserStats
      cachedStats = data
      cacheTimestamp = now
      setStats(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to load user statistics'
      console.error('Failed to fetch stats:', err)
      setError(errorMsg)
      options?.onError?.(errorMsg)
      setStats({ total: 0, clients: 0, staff: 0, admins: 0 })
    } finally {
      setIsLoading(false)
    }
  }, [options])

  // Auto-fetch on mount
  useEffect(() => {
    refetch().catch(console.error)
  }, [refetch])

  return {
    stats,
    isLoading,
    error,
    refetch
  }
}

// Utility to invalidate stats cache
export function invalidateStatsCache() {
  cachedStats = null
  cacheTimestamp = 0
}
