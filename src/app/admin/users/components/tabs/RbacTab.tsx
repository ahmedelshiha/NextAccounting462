import React from 'react'
import RolePermissionsViewer from '@/components/admin/permissions/RolePermissionsViewer'
import UserPermissionsInspector from '@/components/admin/permissions/UserPermissionsInspector'

export function RbacTab() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RolePermissionsViewer />
        <UserPermissionsInspector />
      </div>
    </div>
  )
}
