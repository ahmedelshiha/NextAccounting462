'use client'

import { UsersContextProvider } from './contexts/UsersContextProvider'
import AdminUsersPageRefactored from './page-refactored'

export default function AdminUsersPage() {
  return (
    <UsersContextProvider>
      <AdminUsersPageRefactored />
    </UsersContextProvider>
  )
}
