'use client'

import React, { useState, useCallback } from 'react'
import { QuickActionsBar } from '../QuickActionsBar'
import { OperationsOverviewCards, OperationsMetrics } from '../OperationsOverviewCards'
import { PendingOperationsPanel, PendingOperation } from '../PendingOperationsPanel'
import { AdvancedUserFilters, UserFilters } from '../AdvancedUserFilters'
import { UsersTable } from '../UsersTable'
import { UserItem } from '../contexts/UsersContextProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DashboardTabProps {
  users: UserItem[]
  stats: any
  isLoading?: boolean
  onAddUser?: () => void
  onImport?: () => void
  onBulkOperation?: () => void
  onExport?: () => void
  onRefresh?: () => void
}

/**
 * Dashboard Tab Component
 * 
 * Main operations dashboard for Phase 4a:
 * - Quick actions bar (Add, Import, Bulk Ops, Export, Refresh)
 * - Operations overview metrics cards
 * - Pending operations panel (active workflows)
 * - Advanced user filters
 * - User directory table with bulk selection
 * 
 * Features:
 * - Real-time data updates
 * - Comprehensive filtering
 * - Bulk user selection
 * - Action tracking
 * - Responsive layout
 * 
 * This is the default tab when users navigate to /admin/users
 */
export function DashboardTab({
  users,
  stats,
  isLoading,
  onAddUser,
  onImport,
  onBulkOperation,
  onExport,
  onRefresh
}: DashboardTabProps) {
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: undefined,
    status: undefined,
    department: undefined,
    dateRange: 'all'
  })

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [bulkActionType, setBulkActionType] = useState<string>('')
  const [bulkActionValue, setBulkActionValue] = useState<string>('')
  const [isApplyingBulkAction, setIsApplyingBulkAction] = useState(false)

  // Filter users based on active filters
  const filteredUsers = users.filter((user) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.id?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Role filter
    if (filters.role && user.role !== filters.role) {
      return false
    }

    // Status filter
    if (filters.status) {
      const userStatus = user.status || (user.isActive ? 'ACTIVE' : 'INACTIVE')
      if (userStatus !== filters.status) return false
    }

    return true
  })

  // Mock pending operations data (will be replaced with real data)
  const pendingOperations: PendingOperation[] = [
    {
      id: '1',
      title: 'John Doe - Onboarding',
      description: 'New employee setup and role assignment',
      progress: 75,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignee: 'Admin',
      status: 'in-progress',
      actions: [
        { label: 'View', onClick: () => {} },
        { label: 'Resume', onClick: () => {} }
      ]
    }
  ]

  // Mock metrics (will be replaced with real data)
  const metrics: OperationsMetrics = {
    totalUsers: users.length,
    pendingApprovals: 2,
    inProgressWorkflows: 3,
    dueThisWeek: 1
  }

  const handleSelectUser = (userId: string, selected: boolean) => {
    const newSelected = new Set(selectedUserIds)
    if (selected) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUserIds(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)))
    } else {
      setSelectedUserIds(new Set())
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Quick Actions Bar */}
      <QuickActionsBar
        onAddUser={onAddUser}
        onImport={onImport}
        onBulkOperation={onBulkOperation}
        onExport={onExport}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />

      {/* Operations Overview Metrics */}
      <OperationsOverviewCards metrics={metrics} isLoading={isLoading} />

      {/* Pending Operations */}
      <PendingOperationsPanel
        operations={pendingOperations}
        isLoading={isLoading}
        onViewAll={() => {}}
      />

      {/* Filters Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Directory</h2>
        <AdvancedUserFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() =>
            setFilters({
              search: '',
              role: undefined,
              status: undefined,
              department: undefined,
              dateRange: 'all'
            })
          }
        />
      </div>

      {/* Users Table with Bulk Actions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
            {selectedUserIds.size > 0 && (
              <span className="ml-2 font-semibold text-blue-600">
                ({selectedUserIds.size} selected)
              </span>
            )}
          </div>

          {selectedUserIds.size > 0 && (
            <div className="flex gap-2">
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">Bulk Actions</option>
                <option value="role">Change Role</option>
                <option value="status">Change Status</option>
                <option value="department">Change Department</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                Apply
              </button>
            </div>
          )}
        </div>

        <UsersTable
          users={filteredUsers}
          isLoading={isLoading}
          selectedUserIds={selectedUserIds}
          onSelectUser={handleSelectUser}
          onSelectAll={handleSelectAll}
          onViewProfile={() => {}}
        />
      </div>
    </div>
  )
}
