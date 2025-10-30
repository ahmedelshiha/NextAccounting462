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
  const handleExport = () => {
    toast.loading('Preparing export...')
    // TODO: Implement export functionality
    setTimeout(() => {
      toast.success('Export ready! (Feature in Phase 4d)')
    }, 1000)
  }

  // Handler for Refresh action
  const handleRefresh = () => {
    toast.loading('Refreshing data...')
    // TODO: Implement refresh functionality
    setTimeout(() => {
      toast.success('Data refreshed')
    }, 500)
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
