import React, { ReactNode } from 'react'
import { fetchUsersServerSide, fetchStatsServerSide } from './server'
import { UsersContextProvider } from './contexts/UsersContextProvider'

/**
 * ✅ Server-Side Layout for Admin Users Page
 * 
 * This layout:
 * 1. Fetches data on server (instant availability)
 * 2. Passes initial data to context provider
 * 3. Prevents loading skeletons for initial data
 * 4. Reduces client JavaScript needed
 * 
 * Performance benefits:
 * - No API calls from browser
 * - Data in HTML from first request
 * - Faster Time to First Byte (TTFB)
 * - Better SEO
 * - Smaller initial JavaScript bundle
 */

interface UsersLayoutProps {
  children: ReactNode
}

export default async function UsersLayout({ children }: UsersLayoutProps) {
  // ✅ Fetch data in parallel on server
  // This runs once per page request, not in the browser
  const [usersData, statsData] = await Promise.all([
    fetchUsersServerSide(1, 50),
    fetchStatsServerSide()
  ])

  return (
    <UsersContextProvider
      initialUsers={usersData.users}
      initialStats={statsData}
    >
      {children}
    </UsersContextProvider>
  )
}
