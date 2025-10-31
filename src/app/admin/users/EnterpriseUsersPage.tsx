'use client'

import React, { useState, Suspense } from 'react'
import { TabNavigation, TabType } from './components/TabNavigation'
import {
  DashboardTab,
  WorkflowsTab,
  BulkOperationsTab,
  AuditTab,
  AdminTab
} from './components/tabs'
import { useUsersContext } from './contexts/UsersContextProvider'
import { toast } from 'sonner'

/**
 * Enterprise Users Page - Phase 4 Implementation
 * 
 * Main orchestrator component that implements the 5-tab interface:
 * 1. Dashboard (Operations overview) - Phase 4a
 * 2. Workflows (Workflow management) - Phase 4b
 * 3. Bulk Operations (Batch operations) - Phase 4c
 * 4. Audit (Compliance & audit trail) - Phase 4d
 * 5. Admin (System configuration) - Phase 4e
 * 
 * Architecture:
 * - Tab-based navigation with React Context
 * - Server-side data fetching via layout.tsx
 * - Client-side state management for filters and selections
 * - Dynamic imports for heavy modals
 * - Performance optimized with code splitting
 * 
 * Timeline: 9 weeks, 195 developer hours
 * Status: Phase 4a in progress
 */
export function EnterpriseUsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const context = useUsersContext()

  // Handler for Add User action
  const handleAddUser = () => {
    toast.info('Add User feature coming in Phase 4b (Workflows)')
    setActiveTab('workflows')
  }

  // Handler for Import action
  const handleImport = () => {
    toast.info('Import CSV feature coming in Phase 4c (Bulk Operations)')
    setActiveTab('bulk-operations')
  }

  // Handler for Bulk Operation action
  const handleBulkOperation = () => {
    toast.info('Bulk Operations feature coming in Phase 4c')
    setActiveTab('bulk-operations')
  }

  // Handler for Export action
  const handleExport = async () => {
    const toastId = toast.loading('Preparing export...')
    try {
      // Build CSV headers
      const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login']

      // Build CSV rows
      const rows = context.users.map(user => [
        user.id,
        user.name || '',
        user.email,
        user.role,
        user.isActive ? 'ACTIVE' : 'INACTIVE',
        new Date(user.createdAt).toLocaleDateString(),
        user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
      ])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          const value = String(cell || '')
          return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value
        }).join(','))
      ].join('\n')

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.dismiss(toastId)
      toast.success(`Exported ${context.users.length} users successfully`)
    } catch (error) {
      console.error('Export error:', error)
      toast.dismiss(toastId)
      toast.error('Failed to export users')
    }
  }

  // Handler for Refresh action
  const handleRefresh = async () => {
    const toastId = toast.loading('Refreshing data...')
    try {
      // Trigger data refresh through context or API
      if (context.refreshUsers) {
        await context.refreshUsers()
      }

      toast.dismiss(toastId)
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('Refresh error:', error)
      toast.dismiss(toastId)
      toast.error('Failed to refresh data')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="bg-white min-h-[calc(100vh-100px)]">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Suspense fallback={<div className="p-8">Loading dashboard...</div>}>
            <DashboardTab
              users={context.users}
              stats={context.stats}
              isLoading={context.usersLoading || context.isLoading}
              onAddUser={handleAddUser}
              onImport={handleImport}
              onBulkOperation={handleBulkOperation}
              onExport={handleExport}
              onRefresh={handleRefresh}
            />
          </Suspense>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && <WorkflowsTab />}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk-operations' && <BulkOperationsTab />}

        {/* Audit Tab */}
        {activeTab === 'audit' && <AuditTab />}

        {/* Admin Settings Tab */}
        {activeTab === 'admin' && <AdminTab />}
      </div>

      {/* Error message display */}
      {context.errorMsg && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg">
          {context.errorMsg}
        </div>
      )}
    </div>
  )
}
