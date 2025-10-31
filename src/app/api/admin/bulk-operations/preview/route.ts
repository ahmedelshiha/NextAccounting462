import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { bulkOperationsService } from '@/services/bulk-operations.service'
import prisma from '@/lib/prisma'

/**
 * POST /api/admin/bulk-operations/preview
 * Get a preview of what a bulk operation would do (dry-run)
 */
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { selectedUserIds, operationType, operationConfig } = body

    if (!selectedUserIds || !operationType || !operationConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get users for preview
    const users = await prisma.user.findMany({
      where: {
        tenantId: ctx.tenantId,
        id: { in: selectedUserIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    // Build preview for each user
    const preview = users.slice(0, 5).map(user => {
      const changes: Record<string, any> = {}

      switch (operationType) {
        case 'ROLE_CHANGE':
          if (operationConfig.fromRole && operationConfig.toRole) {
            changes.role = {
              from: operationConfig.fromRole,
              to: operationConfig.toRole
            }
          }
          break

        case 'STATUS_UPDATE':
          if (operationConfig.toStatus) {
            changes.status = {
              to: operationConfig.toStatus
            }
          }
          break

        case 'PERMISSION_GRANT':
          if (operationConfig.permissions) {
            changes.permissions = {
              added: operationConfig.permissions
            }
          }
          break

        case 'PERMISSION_REVOKE':
          if (operationConfig.permissions) {
            changes.permissions = {
              removed: operationConfig.permissions
            }
          }
          break

        case 'SEND_EMAIL':
          changes.email = {
            template: operationConfig.emailTemplate,
            recipient: user.email
          }
          break

        case 'IMPORT_CSV':
          changes.imported = {
            fields: Object.keys(operationConfig.customData || {})
          }
          break
      }

      return {
        userId: user.id,
        userName: user.name || user.email,
        email: user.email,
        changes
      }
    })

    // Estimate duration (50ms per user)
    const estimatedDuration = Math.max(1000, users.length * 50)

    return NextResponse.json({
      affectedUserCount: users.length,
      preview,
      estimatedDuration,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('POST /api/admin/bulk-operations/preview error:', error)
    return NextResponse.json(
      { error: 'Failed to preview operation' },
      { status: 500 }
    )
  }
})
