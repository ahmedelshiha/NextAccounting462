'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'

// Types
export interface UserStats {
  total: number
  clients: number
  staff: number
  admins: number
  newThisMonth: number
  newLastMonth: number
  growth: number
  activeUsers: number
  registrationTrends: Array<{ month: string; count: number }>
  topUsers: Array<{
    id: string
    name: string | null
    email: string
    bookingsCount: number
    createdAt: Date | string
  }>
  range?: { range?: string; newUsers?: number; growth?: number }
}

export interface UserItem {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'STAFF' | 'CLIENT'
  createdAt: string
  lastLoginAt?: string
  isActive?: boolean
  phone?: string
  company?: string
  totalBookings?: number
  totalRevenue?: number
  avatar?: string
  location?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  permissions?: string[]
  notes?: string
}

export interface HealthLog {
  id: string
  checkedAt: string
  message?: string | null
}

/**
 * UserDataContext - Manages core user data, stats, and activity
 * Responsibilities:
 * - User list state and management
 * - Statistics and metrics
 * - Activity logs
 * - Data loading states
 * - Data errors
 * - Data refresh operations
 */
interface UserDataContextType {
  // Data State
  users: UserItem[]
  stats: UserStats | null
  selectedUser: UserItem | null
  activity: HealthLog[]

  // Loading State (data-specific)
  isLoading: boolean
  usersLoading: boolean
  activityLoading: boolean
  refreshing: boolean
  exporting: boolean
  updating: boolean

  // Error State
  errorMsg: string | null
  activityError: string | null

  // Data Actions
  setUsers: (users: UserItem[]) => void
  setStats: (stats: UserStats | null) => void
  setSelectedUser: (user: UserItem | null) => void
  setActivity: (activity: HealthLog[]) => void

  // Loading Actions
  setIsLoading: (value: boolean) => void
  setUsersLoading: (value: boolean) => void
  setActivityLoading: (value: boolean) => void
  setRefreshing: (value: boolean) => void
  setExporting: (value: boolean) => void
  setUpdating: (value: boolean) => void

  // Error Actions
  setErrorMsg: (msg: string | null) => void
  setActivityError: (msg: string | null) => void

  // Data Operations
  refreshUsers: () => Promise<void>
}

// Create Context
const UserDataContext = createContext<UserDataContextType | undefined>(undefined)

// Provider Component
interface UserDataContextProviderProps {
  children: ReactNode
  initialUsers?: UserItem[]
  initialStats?: UserStats | null
}

export function UserDataContextProvider({
  children,
  initialUsers = [],
  initialStats = null
}: UserDataContextProviderProps) {
  // Data state
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [stats, setStats] = useState<UserStats | null>(initialStats)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [activity, setActivity] = useState<HealthLog[]>([])

  // Loading state (data-specific)
  const [isLoading, setIsLoading] = useState(!initialUsers.length)
  const [usersLoading, setUsersLoading] = useState(!initialUsers.length)
  const [activityLoading, setActivityLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activityError, setActivityError] = useState<string | null>(null)

  // Data operations
  const refreshUsers = useCallback(async () => {
    setRefreshing(true)
    setErrorMsg(null)
    try {
      const response = await fetch('/api/admin/users?page=1&limit=50', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      if (data.users) {
        setUsers(data.users)
      }
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to refresh users:', error)
      setErrorMsg(error instanceof Error ? error.message : 'Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }, [])

  const value: UserDataContextType = {
    // Data
    users,
    stats,
    selectedUser,
    activity,

    // Loading
    isLoading,
    usersLoading,
    activityLoading,
    refreshing,
    exporting,
    updating,

    // Errors
    errorMsg,
    activityError,

    // Data Actions
    setUsers,
    setStats,
    setSelectedUser,
    setActivity,

    // Loading Actions
    setIsLoading,
    setUsersLoading,
    setActivityLoading,
    setRefreshing,
    setExporting,
    setUpdating,

    // Error Actions
    setErrorMsg,
    setActivityError,

    // Data Operations
    refreshUsers
  }

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>
}

// Hook to use UserDataContext
export function useUserDataContext() {
  const context = useContext(UserDataContext)
  if (!context) {
    throw new Error('useUserDataContext must be used within UserDataContextProvider')
  }
  return context
}
