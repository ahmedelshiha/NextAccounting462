import { useCallback, useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { UserItem } from '../contexts/UsersContextProvider'

interface UseUsersListOptions {
  onError?: (error: string) => void
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

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Add timeout to fetch request (30 seconds max)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const res = await apiFetch('/api/admin/users?page=1&limit=50', {
          signal: controller.signal
        } as any)

        clearTimeout(timeoutId)

        if (!res.ok) {
          throw new Error(`Failed to load users (${res.status})`)
        }

        const data = await res.json()
        const list = Array.isArray(data?.users) ? (data.users as UserItem[]) : []
        setUsers(list)
      } catch (fetchErr) {
        clearTimeout(timeoutId)
        throw fetchErr
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to load users'
      console.error('Failed to fetch users:', err)
      setError(errorMsg)
      options?.onError?.(errorMsg)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
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
