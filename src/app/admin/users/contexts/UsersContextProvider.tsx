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

type TabType = 'overview' | 'details' | 'activity' | 'settings'
type StatusAction = 'activate' | 'deactivate' | 'suspend'

// ✅ OPTIMIZED: Organized into logical sections
interface UsersContextType {
  // Data State
  users: UserItem[]
  stats: UserStats | null
  selectedUser: UserItem | null
  activity: HealthLog[]

  // Loading State
  isLoading: boolean
  usersLoading: boolean
  activityLoading: boolean
  refreshing: boolean
  exporting: boolean
  updating: boolean
  permissionsSaving: boolean

  // Error State
  errorMsg: string | null
  activityError: string | null

  // Filter State
  search: string
  roleFilter: 'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT'
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

  // Dialog State
  profileOpen: boolean
  activeTab: TabType
  editMode: boolean
  editForm: Partial<UserItem>
  statusDialogOpen: boolean
  statusAction: { action: StatusAction; user: UserItem } | null
  permissionModalOpen: boolean

  // Computed
  filteredUsers: UserItem[]

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
  setPermissionsSaving: (value: boolean) => void

  // Error Actions
  setErrorMsg: (msg: string | null) => void
  setActivityError: (msg: string | null) => void

  // Filter Actions
  setSearch: (search: string) => void
  setRoleFilter: (filter: 'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT') => void
  setStatusFilter: (filter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => void

  // Dialog Actions
  setProfileOpen: (open: boolean) => void
  setActiveTab: (tab: TabType) => void
  setEditMode: (mode: boolean) => void
  setEditForm: (form: Partial<UserItem>) => void
  setStatusDialogOpen: (open: boolean) => void
  setStatusAction: (action: { action: StatusAction; user: UserItem } | null) => void
  setPermissionModalOpen: (open: boolean) => void

  // Helpers
  openUserProfile: (user: UserItem) => void
  closeUserProfile: () => void
  refreshUsers: () => Promise<void>
}

// Create Context
const UsersContext = createContext<UsersContextType | undefined>(undefined)

// Provider Component
interface UsersContextProviderProps {
  children: ReactNode
  initialUsers?: UserItem[]
  initialStats?: UserStats | null
}

export function UsersContextProvider({ children, initialUsers = [], initialStats = null }: UsersContextProviderProps) {
  // Data state
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [stats, setStats] = useState<UserStats | null>(initialStats)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [activity, setActivity] = useState<HealthLog[]>([])

  // Loading state
  const [isLoading, setIsLoading] = useState(!initialUsers.length)
  const [usersLoading, setUsersLoading] = useState(!initialUsers.length)
  const [activityLoading, setActivityLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [permissionsSaving, setPermissionsSaving] = useState(false)

  // Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activityError, setActivityError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ALL')

  // Dialog state
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserItem>>({})
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<{ action: StatusAction; user: UserItem } | null>(null)
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)

  // ✅ OPTIMIZED: Memoized filtering - only recompute when dependencies change
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter((u) => (roleFilter === 'ALL' ? true : u.role === roleFilter))
      .filter((u) => (statusFilter === 'ALL' ? true : (u.status || 'ACTIVE') === statusFilter))
      .filter((u) => !q || (u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.company?.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [users, roleFilter, statusFilter, search])

  // Helper functions
  const openUserProfile = useCallback((user: UserItem) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      company: user.company || '',
      location: user.location || '',
      notes: user.notes || ''
    })
    setEditMode(false)
    setActiveTab('overview')
    setProfileOpen(true)
    setActivity([])
    setActivityError(null)
  }, [])

  const closeUserProfile = useCallback(() => {
    setProfileOpen(false)
    setEditMode(false)
    setActiveTab('overview')
  }, [])

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

  const value: UsersContextType = {
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
    permissionsSaving,

    // Errors
    errorMsg,
    activityError,

    // Filters
    search,
    roleFilter,
    statusFilter,

    // Dialog State
    profileOpen,
    activeTab,
    editMode,
    editForm,
    statusDialogOpen,
    statusAction,
    permissionModalOpen,

    // Computed
    filteredUsers,

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
    setPermissionsSaving,

    // Error Actions
    setErrorMsg,
    setActivityError,

    // Filter Actions
    setSearch,
    setRoleFilter,
    setStatusFilter,

    // Dialog Actions
    setProfileOpen,
    setActiveTab,
    setEditMode,
    setEditForm,
    setStatusDialogOpen,
    setStatusAction,
    setPermissionModalOpen,

    // Helpers
    openUserProfile,
    closeUserProfile
  }

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}

// Hook to use context
export function useUsersContext() {
  const context = useContext(UsersContext)
  if (!context) {
    throw new Error('useUsersContext must be used within UsersContextProvider')
  }
  return context
}
