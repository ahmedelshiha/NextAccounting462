'use client'

import AdminUsersPageRefactored from './page-refactored'

/**
 * ✅ Admin Users Page
 *
 * Note: UsersContextProvider is now in layout.tsx
 * This page receives initial data from server via context
 * No client-side data fetching needed for initial load
 */
export default function AdminUsersPage() {
  return <AdminUsersPageRefactored />
}
