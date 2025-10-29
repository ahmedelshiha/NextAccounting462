'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'

// Types
export interface UserStats {
  total: number
  clients: number
  staff: number
  admins: number
  newThisMonth?: number
  growth?: number
  activeUsers?: number
  topUsers?: Array<{
    id: string
    name: string | null
    email: string
    bookings?: number
    bookingsCount?: number
    createdAt?: string
  }>
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

// Context Type
interface UsersContextType {
  // Data
  users: UserItem[]
  stats: UserStats | null
  selectedUser: UserItem | null
  activity: HealthLog[]

  // UI State
  isLoading: boolean
  usersLoading: boolean
  activityLoading: boolean
  refreshing: boolean
  exporting: boolean
  updating: boolean
  permissionsSaving: boolean

  // Errors
  errorMsg: string | null
  activityError: string | null

  // Filters
  search: string
  roleFilter: 'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT'
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

  // Profile Dialog State
  profileOpen: boolean
  activeTab: TabType
  editMode: boolean
  editForm: Partial<UserItem>

  // Status Change Dialog
  statusDialogOpen: boolean
  statusAction: { action: StatusAction; user: UserItem } | null

  // Permission Modal
  permissionModalOpen: boolean

  // Computed
  filteredUsers: UserItem[]

  // Actions
  setUsers: (users: UserItem[]) => void
  setStats: (stats: UserStats | null) => void
  setSelectedUser: (user: UserItem | null) => void
  setActivity: (activity: HealthLog[]) => void

  setIsLoading: (value: boolean) => void
  setUsersLoading: (value: boolean) => void
  setActivityLoading: (value: boolean) => void
  setRefreshing: (value: boolean) => void
  setExporting: (value: boolean) => void
  setUpdating: (value: boolean) => void
  setPermissionsSaving: (value: boolean) => void

  setErrorMsg: (msg: string | null) => void
  setActivityError: (msg: string | null) => void

  setSearch: (search: string) => void
  setRoleFilter: (filter: 'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT') => void
  setStatusFilter: (filter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => void

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
}

// Create Context
const UsersContext = createContext<UsersContextType | undefined>(undefined)

// Provider Component
interface UsersContextProviderProps {
  children: ReactNode
}

export function UsersContextProvider({ children }: UsersContextProviderProps) {
  // Data state
  const [users, setUsers] = useState<UserItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [activity, setActivity] = useState<HealthLog[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [permissionsSaving, setPermissionsSaving] = useState(false)

  // Errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activityError, setActivityError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<typeof roleFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<typeof statusFilter>('ALL')

  // Profile dialog state
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserItem>>({})

  // Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<{ action: StatusAction; user: UserItem } | null>(null)

  // Permission modal
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)

  // Computed filtered users
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

  const value: UsersContextType = {
    // Data
    users,
    stats,
    selectedUser,
    activity,

    // UI State
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

    // Profile Dialog State
    profileOpen,
    activeTab,
    editMode,
    editForm,

    // Status Change Dialog
    statusDialogOpen,
    statusAction,

    // Permission Modal
    permissionModalOpen,

    // Computed
    filteredUsers,

    // Actions
    setUsers,
    setStats,
    setSelectedUser,
    setActivity,

    setIsLoading,
    setUsersLoading,
    setActivityLoading,
    setRefreshing,
    setExporting,
    setUpdating,
    setPermissionsSaving,

    setErrorMsg,
    setActivityError,

    setSearch,
    setRoleFilter,
    setStatusFilter,

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
