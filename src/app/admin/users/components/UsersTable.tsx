'use client'

import React, { memo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserItem } from '../contexts/UsersContextProvider'
import { UserActions } from './UserActions'
import { usePermissions } from '@/lib/use-permissions'
import { VirtualScroller } from '@/lib/virtual-scroller'

interface UsersTableProps {
  users: UserItem[]
  isLoading?: boolean
  onViewProfile: (user: UserItem) => void
  onRoleChange?: (userId: string, role: UserItem['role']) => Promise<void>
  isUpdating?: boolean
  selectedUserIds?: Set<string>
  onSelectUser?: (userId: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
}

const UserRowSkeleton = memo(function UserRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between p-4 bg-white border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-48" />
        </div>
      </div>
      <div className="hidden sm:block space-y-1">
        <div className="h-3 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-12" />
      </div>
    </div>
  )
})

const formatDate = (iso?: string) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Invalid date'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'TEAM_MEMBER':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'TEAM_LEAD':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'STAFF':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'CLIENT':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const UsersTable = memo(function UsersTable({
  users,
  isLoading = false,
  onViewProfile,
  onRoleChange,
  isUpdating = false,
  selectedUserIds = new Set(),
  onSelectUser,
  onSelectAll
}: UsersTableProps) {
  const perms = usePermissions()

  const handleRoleChange = useCallback(
    (userId: string, newRole: UserItem['role']) => {
      onRoleChange?.(userId, newRole).catch(console.error)
    },
    [onRoleChange]
  )

  const handleSelectUser = useCallback(
    (userId: string, selected: boolean) => {
      onSelectUser?.(userId, selected)
    },
    [onSelectUser]
  )

  const allSelected = users.length > 0 && users.every(u => selectedUserIds.has(u.id))
  const someSelected = users.length > 0 && users.some(u => selectedUserIds.has(u.id)) && !allSelected

  const handleSelectAllChange = useCallback(() => {
    onSelectAll?.(!allSelected)
  }, [allSelected, onSelectAll])

  // ✅ OPTIMIZED: Use VirtualScroller for handling 100+ users efficiently
  // Only renders ~10 visible rows instead of all rows
  const renderUserRow = useCallback(
    (user: UserItem) => (
      <div
        key={user.id}
        className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm w-full"
      >
        <div className="flex items-center gap-4 min-w-0">
          <Checkbox
            checked={selectedUserIds.has(user.id)}
            onCheckedChange={(checked) => handleSelectUser(user.id, checked === true)}
            aria-label={`Select ${user.name || user.email}`}
            className="shrink-0"
          />
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <button
              onClick={() => onViewProfile(user)}
              className="font-medium text-gray-900 hover:text-blue-600 truncate max-w-[220px] sm:max-w-[260px] md:max-w-[320px] text-left"
            >
              {user.name || 'Unnamed User'}
            </button>
            <div className="text-sm text-gray-600 truncate max-w-[220px] sm:max-w-[260px] md:max-w-[320px]">
              {user.email}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-gray-400">Joined {formatDate(user.createdAt)}</div>
              {user.company && <div className="text-xs text-gray-400">• {user.company}</div>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className={getStatusColor(user.status)}>{user.status || 'ACTIVE'}</Badge>
          <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
          {perms.canManageUsers && (
            <Select value={user.role} onValueChange={(val) => handleRoleChange(user.id, val as UserItem['role'])}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLIENT">Client</SelectItem>
                <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
          <UserActions
            user={user}
            onViewProfile={onViewProfile}
            isLoading={isUpdating}
          />
        </div>
      </div>
    ),
    [onViewProfile, perms.canManageUsers, handleRoleChange, isUpdating, selectedUserIds, handleSelectUser]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Directory</CardTitle>
        <CardDescription>Search, filter and manage users</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="max-h-[60vh] space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <UserRowSkeleton key={i} />
            ))}
          </div>
        ) : users.length ? (
          <VirtualScroller
            items={users}
            itemHeight={96}
            maxHeight="60vh"
            renderItem={(user) => renderUserRow(user)}
            overscan={5}
            getKey={(user) => user.id}
            className="pr-1"
          />
        ) : (
          <div className="h-[60vh] flex items-center justify-center text-gray-500 text-sm">
            No users found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  )
})

UsersTable.displayName = 'UsersTable'
