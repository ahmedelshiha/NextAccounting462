'use client'

import React, { useState, useCallback } from 'react'
import { QuickActionsBar } from '../QuickActionsBar'
import { OperationsOverviewCards, OperationsMetrics } from '../OperationsOverviewCards'
import { PendingOperationsPanel, PendingOperation } from '../PendingOperationsPanel'
import { AdvancedUserFilters, UserFilters } from '../AdvancedUserFilters'
import { UsersTable } from '../UsersTable'
import { UserItem } from '../../contexts/UsersContextProvider'
import { usePendingOperations } from '../../hooks/usePendingOperations'
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

  // Fetch pending operations
  const { operations: pendingOperations, metrics, isLoading: operationsLoading } = usePendingOperations({
    userCount: users.length,
    enabled: true
  })

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

  // Use fetched metrics or provide defaults
  const displayMetrics: OperationsMetrics = metrics || {
    totalUsers: users.length,
    pendingApprovals: 0,
    inProgressWorkflows: 0,
    dueThisWeek: 0
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

  const handleApplyBulkAction = useCallback(async () => {
    if (!bulkActionType || !bulkActionValue || selectedUserIds.size === 0) {
      toast.error('Please select an action and value')
      return
    }

    setIsApplyingBulkAction(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Show success message
      let actionDescription = ''
      if (bulkActionType === 'role') {
        actionDescription = `Changed role to ${bulkActionValue}`
      } else if (bulkActionType === 'status') {
        actionDescription = `Changed status to ${bulkActionValue}`
      } else if (bulkActionType === 'department') {
        actionDescription = `Changed department to ${bulkActionValue}`
      }

      toast.success(`Applied to ${selectedUserIds.size} users: ${actionDescription}`)

      // Reset selection
      setSelectedUserIds(new Set())
      setBulkActionType('')
      setBulkActionValue('')
    } catch (error) {
      toast.error('Failed to apply bulk action')
      console.error('Bulk action error:', error)
    } finally {
      setIsApplyingBulkAction(false)
    }
  }, [bulkActionType, bulkActionValue, selectedUserIds.size])

  return (
    <div className="min-h-screen bg-gray-50 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Quick Actions Bar */}
      <section role="region" aria-label="Quick actions">
        <QuickActionsBar
          onAddUser={onAddUser}
          onImport={onImport}
          onBulkOperation={onBulkOperation}
          onExport={onExport}
          onRefresh={onRefresh}
          isLoading={isLoading}
        />
      </section>

      {/* Operations Overview Metrics */}
      <section role="region" aria-label="Operations metrics" className="max-w-7xl mx-auto w-full">
        <OperationsOverviewCards metrics={displayMetrics} isLoading={isLoading || operationsLoading} />
      </section>

      {/* Pending Operations */}
      <section role="region" aria-label="Pending operations" className="max-w-7xl mx-auto w-full">
        <PendingOperationsPanel
          operations={pendingOperations}
          isLoading={operationsLoading}
          onViewAll={() => {}}
        />
      </section>

      {/* Filters Section */}
      <section role="region" aria-label="User filters" className="max-w-7xl mx-auto w-full">
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
      </section>

      {/* Users Table with Bulk Actions */}
      <section role="region" aria-label="User table and bulk actions" className="max-w-7xl mx-auto w-full">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
              {selectedUserIds.size > 0 && (
                <span className="ml-2 font-semibold text-blue-600" role="status" aria-live="polite">
                  ({selectedUserIds.size} selected)
                </span>
              )}
            </div>
          </div>

          {selectedUserIds.size > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4" role="region" aria-label="Bulk actions panel">
              <div className="flex flex-col gap-2">
                <label htmlFor="bulk-action-select" className="text-sm font-medium text-gray-700">
                  Select an action to apply to {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''}
                </label>
                <Select value={bulkActionType} onValueChange={setBulkActionType}>
                  <SelectTrigger id="bulk-action-select" className="w-full sm:w-40" aria-label="Bulk action type">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">Change Role</SelectItem>
                    <SelectItem value="status">Change Status</SelectItem>
                    <SelectItem value="department">Change Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bulkActionType === 'role' && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="bulk-value-role" className="text-sm font-medium text-gray-700">
                    Select new role
                  </label>
                  <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
                    <SelectTrigger id="bulk-value-role" className="w-full sm:w-40" aria-label="Role selection">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                      <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {bulkActionType === 'status' && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="bulk-value-status" className="text-sm font-medium text-gray-700">
                    Select new status
                  </label>
                  <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
                    <SelectTrigger id="bulk-value-status" className="w-full sm:w-40" aria-label="Status selection">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {bulkActionType === 'department' && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="bulk-value-department" className="text-sm font-medium text-gray-700">
                    Select new department
                  </label>
                  <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
                    <SelectTrigger id="bulk-value-department" className="w-full sm:w-40" aria-label="Department selection">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleApplyBulkAction}
                disabled={isApplyingBulkAction || !bulkActionType || !bulkActionValue}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                aria-busy={isApplyingBulkAction}
              >
                {isApplyingBulkAction ? 'Applying...' : 'Apply'}
              </Button>
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
      </section>
    </div>
  )
}
