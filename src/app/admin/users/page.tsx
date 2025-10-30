'use client'

import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'
import { isFeatureEnabled } from '@/lib/feature-flags'
import AdminUsersPageRefactored from './page-refactored'

// Dynamic import of Phase 4 implementation
const AdminUsersPagePhase4 = dynamic(
  () => import('./page-phase4').then(m => ({ default: m.default })),
  {
    loading: () => <PageLoadingSkeleton />,
    ssr: true
  }
)

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

/**
 * ✅ Admin Users Page
 *
 * Main entry point for the admin users page.
 * Supports feature flag for Phase 4 enterprise redesign.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_FLAGS='{"enablePhase4Enterprise":true}' - Enable Phase 4
 * - NEXT_PUBLIC_ENABLE_PHASE_4_ENTERPRISE=true - Enable Phase 4
 *
 * Data Flow:
 * - UsersContextProvider initialized in layout.tsx
 * - Initial data fetched server-side and provided via context
 * - Client components receive data through context
 */
export default function AdminUsersPage() {
  // Check if Phase 4 is enabled via feature flag (default to true for active development)
  const isPhase4Enabled = isFeatureEnabled('enablePhase4Enterprise', true)

  if (isPhase4Enabled) {
    return (
      <Suspense fallback={<PageLoadingSkeleton />}>
        <AdminUsersPagePhase4 />
      </Suspense>
    )
  }

  return <AdminUsersPageRefactored />
}
