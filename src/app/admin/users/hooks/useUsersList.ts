import { useCallback, useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import { UserItem } from '../contexts/UsersContextProvider'

interface UseUsersListOptions {
  onError?: (error: string) => void
  debounceMs?: number
}

interface UseUsersListReturn {
  users: UserItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUsersList(options?: UseUsersListOptions): UseUsersListReturn {
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pendingRequestRef = useRef<Promise<void> | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const refetch = useCallback(async () => {
    if (pendingRequestRef.current) {
      return pendingRequestRef.current
    }

    const doFetch = async () => {
      setIsLoading(true)
      setError(null)

      const maxRetries = 3
      let lastErr: Error | null = null

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          try {
            const res = await apiFetch('/api/admin/users?page=1&limit=50', {
              signal: controller.signal
            } as any)

            clearTimeout(timeoutId)

            if (res.status === 429) {
              const waitMs = Math.min(1000 * Math.pow(2, attempt), 10000)
              console.warn(`Rate limited on users list fetch, retrying after ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`)
              lastErr = new Error('Rate limit exceeded')
              if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, waitMs))
                continue
              }
              throw lastErr
            }

            if (!res.ok) {
              throw new Error(`Failed to load users (${res.status})`)
            }

            const data = await res.json()
            const list = Array.isArray(data?.users) ? (data.users as UserItem[]) : []
            setUsers(list)
            setError(null)
            break
          } catch (fetchErr) {
            clearTimeout(timeoutId)
            throw fetchErr
          }
        } catch (err) {
          lastErr = err instanceof Error ? err : new Error('Unable to load users')
          if (attempt === maxRetries - 1) {
            const errorMsg = lastErr.message
            console.error('Failed to fetch users after retries:', err)
            setError(errorMsg)
            options?.onError?.(errorMsg)
            setUsers([])
          }
        }
      }

      setIsLoading(false)
      pendingRequestRef.current = null
    }

    pendingRequestRef.current = doFetch()
    return pendingRequestRef.current
  }, [options])

  // Auto-fetch on mount
  useEffect(() => {
    refetch().catch(console.error)
  }, [refetch])

  return {
    users,
    isLoading,
    error,
    refetch
  }
}
