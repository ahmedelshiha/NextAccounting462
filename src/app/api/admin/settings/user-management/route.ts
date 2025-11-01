import { NextResponse, NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { UserManagementSettingsService } from '@/services/user-management-settings.service'

/**
 * GET /api/admin/settings/user-management
 * Fetch current user management settings for a tenant
 *
 * Authorization: Requires SYSTEM_ADMIN_SETTINGS_VIEW permission
 *
 * Returns: UserManagementSettings object
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    // Validate authentication
    if (!ctx || !ctx.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'MISSING_TENANT_CONTEXT' },
        { status: 401 }
      )
    }

    // Validate permissions
    if (!ctx.role || !hasPermission(ctx.role, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view settings' },
        { status: 403 }
      )
    }

    // Fetch settings from database
    const settings = await UserManagementSettingsService.getSettings(ctx.tenantId)

    return NextResponse.json(settings, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching user management settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: message },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/admin/settings/user-management
 * Update user management settings for a tenant
 *
 * Authorization: Requires SYSTEM_ADMIN_SETTINGS_EDIT permission
 *
 * Request body: Partial<UserManagementSettings> - Only changed fields required
 * Returns: Updated UserManagementSettings object
 */
export const PUT = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    // Validate authentication
    if (!ctx || !ctx.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'MISSING_TENANT_CONTEXT' },
        { status: 401 }
      )
    }

    // Validate permissions
    if (!ctx.role || !hasPermission(ctx.role, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to edit settings' },
        { status: 403 }
      )
    }

    // Parse request body
    let updates: any
    try {
      updates = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body: Must be valid JSON' },
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body: Must be an object' },
        { status: 400 }
      )
    }

    // Update settings in database
    const updatedSettings = await UserManagementSettingsService.updateSettings(
      ctx.tenantId,
      updates,
      ctx.userId
    )

    return NextResponse.json(updatedSettings, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating user management settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: message },
      { status: 500 }
    )
  }
})
