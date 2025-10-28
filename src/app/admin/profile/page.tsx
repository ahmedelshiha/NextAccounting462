import ProfileManagementPanel from '@/components/admin/profile/ProfileManagementPanel'

export default async function AdminProfilePage({ searchParams }: { searchParams?: Record<string, any> | Promise<Record<string, any>> }) {
  const resolvedSearchParams = searchParams && typeof (searchParams as any).then === 'function' ? await searchParams : (searchParams || {})
  const tabParam = String(resolvedSearchParams?.tab || '').toLowerCase()
  const allowed = ['profile', 'security', 'booking', 'localization', 'notifications'] as const
  const isAllowed = (allowed as readonly string[]).includes(tabParam)
  const defaultTab = (isAllowed ? (tabParam as typeof allowed[number]) : 'profile')
  return (
    <ProfileManagementPanel isOpen={true} defaultTab={defaultTab} inline fullPage />
  )
}
