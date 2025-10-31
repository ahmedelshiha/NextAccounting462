"use client"

import { redirect } from 'next/navigation'

export default function AdminRolesPage() {
  redirect('/admin/users?tab=rbac')
}
