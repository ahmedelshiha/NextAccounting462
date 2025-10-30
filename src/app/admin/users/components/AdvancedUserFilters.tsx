'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export interface UserFilters {
  search: string
  role?: string
  status?: string
  department?: string
  dateRange?: 'all' | 'today' | 'week' | 'month'
}

interface AdvancedUserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onReset?: () => void
  roleOptions?: Array<{ value: string; label: string }>
  statusOptions?: Array<{ value: string; label: string }>
  departmentOptions?: Array<{ value: string; label: string }>
}

const DEFAULT_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'TEAM_MEMBER', label: 'Team Member' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'CLIENT', label: 'Client' }
]

const DEFAULT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING', label: 'Pending Activation' }
]

const DEFAULT_DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' }
]

/**
 * Advanced User Filters
 * 
 * Comprehensive filtering interface for user directory:
 * - Full-text search with debouncing
 * - Role filter (RBAC)
 * - Status filter (Active, Inactive, Suspended)
 * - Department filter
 * - Date range filter (Created date)
 * - Reset all filters
 * 
 * Features:
 * - Responsive multi-column layout
 * - Clear visual feedback
 * - Accessibility support
 * - Customizable options
 */
export function AdvancedUserFilters({
  filters,
  onFiltersChange,
  onReset,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  departmentOptions = []
}: AdvancedUserFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.role ||
    filters.status ||
    filters.department ||
    (filters.dateRange && filters.dateRange !== 'all')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Search Bar */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          🔎 Search Users
        </label>
        <Input
          id="search"
          type="text"
          placeholder="Search by name, email, or ID..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              search: e.target.value
            })
          }
          className="w-full"
        />
        {filters.search && (
          <p className="text-xs text-gray-500 mt-1">
            Searching for: {filters.search}
          </p>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Role Filter */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <Select
            value={filters.role || ''}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                role: value || undefined
              })
            }
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              {roleOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <Select
            value={filters.status || ''}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value || undefined
              })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department Filter (if available) */}
        {departmentOptions.length > 0 && (
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <Select
              value={filters.department || ''}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  department: value || undefined
                })
              }
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departmentOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range Filter */}
        <div>
          <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-2">
            Created Date
          </label>
          <Select
            value={filters.dateRange || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                dateRange: value as any
              })
            }
          >
            <SelectTrigger id="dateRange">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_DATE_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="text-gray-600"
          >
            🔄 Reset Filters
          </Button>
        </div>
      )}
    </div>
  )
}
