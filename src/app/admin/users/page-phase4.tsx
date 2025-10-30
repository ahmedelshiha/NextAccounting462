'use client'

import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'
import { EnterpriseUsersPage } from './EnterpriseUsersPage'

/**
 * Phase 4: Enterprise Users Page
 * 
 * This is the new tabbed interface implementation for the admin users page.
 * It provides a comprehensive user management system with:
 * 
 * - Dashboard Tab: Operations overview and user directory
 * - Workflows Tab: User lifecycle workflows (coming Phase 4b)
 * - Bulk Operations Tab: Batch user operations (coming Phase 4c)
 * - Audit Tab: Compliance and audit trail (coming Phase 4d)
 * - Admin Tab: System configuration (coming Phase 4e)
 * 
 * Architecture:
 * - Server-side data fetching via layout.tsx
 * - Client-side state management for filters
 * - Dynamic imports for performance
 * - Progressive enhancement approach
 * 
 * Timeline: 9 weeks, 195 developer hours
 * Current Status: Phase 4a foundation complete, integration in progress
 * 
 * To use this page:
 * 1. Update page.tsx to import from this file
 * 2. Or set a feature flag to toggle between page-refactored.tsx and this file
 * 3. Run tests to verify all functionality
 * 4. Proceed with Phase 4b-4e implementation
 */

function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-12 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function AdminUsersPagePhase4() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <EnterpriseUsersPage />
    </Suspense>
  )
}
