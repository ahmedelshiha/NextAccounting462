"use client"

import { redirect } from 'next/navigation'

export default function AdminPermissionsPage() {
  redirect('/admin/users?tab=rbac')
}
