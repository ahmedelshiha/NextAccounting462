'use client'

import React, { useEffect, useCallback } from 'react'
import { useUsersContext } from './contexts/UsersContextProvider'
import { useUsersList, useUserStats, useUserActions } from './hooks'
import { DashboardHeader, StatsSection, UsersTable, UserProfileDialog } from './components'
import { UnifiedPermissionModal } from '@/components/admin/permissions/UnifiedPermissionModal'
import { PermissionChangeSet } from '@/components/admin/permissions/UnifiedPermissionModal'
import { useUserPermissions } from './hooks/useUserPermissions'
import { toast } from 'sonner'

/**
 * Refactored Admin Users Page - Phase 1 Implementation
 * 
 * This component orchestrates the modular user management interface:
 * - Context-based state management (UsersContextProvider)
 * - Custom hooks for data fetching and business logic
 * - Reusable presentational components
 * - Lazy-loaded permission modal (Phase 3)
 * - User profile dialog (Phase 2)
 * 
 * Benefits:
 * - Reduced from 1500+ lines to ~100 lines
 * - Each component testable independently
 * - Better separation of concerns
 * - Easier team collaboration
 */

export default function AdminUsersPage() {
  const context = useUsersContext()

  // Data fetching hooks
  const {
    users,
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useUsersList({
    onError: (error) => {
      context.setErrorMsg(error)
      context.setUsersLoading(false)
    }
  })

  const {
    stats,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useUserStats({
    onError: (error) => {
      context.setErrorMsg(error)
      context.setIsLoading(false)
    }
  })

  // Action handlers
  const {
    updateUserRole,
    exportUsers,
    isLoading: actionLoading
  } = useUserActions({
    onSuccess: (message) => {
      toast.success(message)
      refetchUsers().catch(console.error)
    },
    onError: (error) => {
      toast.error(error)
      context.setErrorMsg(error)
    },
    onRefetchUsers: refetchUsers
  })

  const {
    savePermissions,
    isSaving: permissionsSaving
  } = useUserPermissions({
    onSuccess: (message) => {
      toast.success(message)
      refetchUsers().catch(console.error)
      context.setPermissionModalOpen(false)
    },
    onError: (error) => {
      toast.error(error)
    },
    onRefetchUsers: refetchUsers
  })

  // Update context with fetched data
  useEffect(() => {
    context.setUsers(users)
    context.setUsersLoading(usersLoading)
  }, [users, usersLoading, context])

  useEffect(() => {
    context.setStats(stats)
    context.setIsLoading(statsLoading)
  }, [stats, statsLoading, context])

  useEffect(() => {
    context.setPermissionsSaving(permissionsSaving)
  }, [permissionsSaving, context])

  useEffect(() => {
    context.setUpdating(actionLoading)
  }, [actionLoading, context])

  // Event handlers
  const handleRefresh = useCallback(async () => {
    context.setRefreshing(true)
    try {
      await Promise.allSettled([refetchStats(), refetchUsers()])
    } finally {
      context.setRefreshing(false)
    }
  }, [refetchStats, refetchUsers, context])

  const handleExport = useCallback(async () => {
    context.setExporting(true)
    try {
      await exportUsers()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      context.setExporting(false)
    }
  }, [exportUsers, context])

  const handleRoleChange = useCallback(
    async (userId: string, role: any) => {
      try {
        await updateUserRole(userId, role)
      } catch (error) {
        console.error('Role update failed:', error)
      }
    },
    [updateUserRole]
  )

  const handleSavePermissions = useCallback(
    async (changes: PermissionChangeSet) => {
      try {
        await savePermissions(changes)
      } catch (error) {
        console.error('Permission save failed:', error)
      }
    },
    [savePermissions]
  )

  // Loading state
  if (context.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Error Message */}
        {context.errorMsg && (
          <div className="mb-6 border border-red-200 bg-red-50 text-red-800 rounded-md p-3 text-sm flex items-center justify-between">
            <span>{context.errorMsg}</span>
            <button
              onClick={() => context.setErrorMsg(null)}
              className="ml-2 text-red-600 hover:text-red-800 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Dashboard Header */}
        <DashboardHeader
          onRefresh={handleRefresh}
          onExport={handleExport}
          refreshing={context.refreshing}
          exporting={context.exporting}
        />

        {/* Statistics Section */}
        <StatsSection stats={context.stats} isLoading={context.isLoading} />

        {/* Users Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <UsersTable
            users={context.filteredUsers}
            isLoading={context.usersLoading}
            onViewProfile={context.openUserProfile}
            onRoleChange={handleRoleChange}
            isUpdating={context.updating}
          />
        </div>

        {/* User Profile Dialog (Phase 2) */}
        <UserProfileDialog />

        {/* Permission Modal (Phase 3) */}
        {context.selectedUser && (
          <UnifiedPermissionModal
            isOpen={context.permissionModalOpen}
            onClose={() => context.setPermissionModalOpen(false)}
            mode="user"
            targetId={context.selectedUser.id}
            currentRole={context.selectedUser.role}
            currentPermissions={context.selectedUser.permissions || []}
            onSave={handleSavePermissions}
            isLoading={context.permissionsSaving}
            targetName={context.selectedUser.name || context.selectedUser.email}
          />
        )}
      </div>
    </div>
  )
}
