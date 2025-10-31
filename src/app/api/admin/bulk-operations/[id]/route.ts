import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { bulkOperationsService } from '@/services/bulk-operations.service'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/bulk-operations/[id]
 * Get a specific bulk operation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const operation = await bulkOperationsService.getBulkOperation(params.id)
    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 })
    }

    // Verify access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    const membership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId: operation.tenantId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(operation)
  } catch (error) {
    console.error(`GET /api/admin/bulk-operations/${params.id} error:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch operation' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/bulk-operations/[id]
 * Update a bulk operation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    const operation = await bulkOperationsService.getBulkOperation(params.id)
    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 })
    }

    // Verify access
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId: operation.tenantId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let result

    switch (action) {
      case 'preview':
        result = await bulkOperationsService.previewBulkOperation(
          params.id,
          body.userFilter
        )
        break

      case 'execute':
        result = await bulkOperationsService.executeBulkOperation(params.id)
        break

      case 'approve':
        result = await bulkOperationsService.approveBulkOperation(
          params.id,
          session.user.id
        )
        break

      case 'reject':
        result = await bulkOperationsService.rejectBulkOperation(
          params.id,
          session.user.id,
          body.reason
        )
        break

      case 'cancel':
        result = await bulkOperationsService.cancelBulkOperation(
          params.id,
          session.user.id
        )
        break

      case 'rollback':
        await bulkOperationsService.rollbackBulkOperation(
          params.id,
          session.user.id
        )
        result = { success: true }
        break

      case 'progress':
        result = await bulkOperationsService.getProgress(params.id)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`PATCH /api/admin/bulk-operations/${params.id} error:`, error)
    return NextResponse.json(
      { error: (error as Error).message || 'Operation failed' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/bulk-operations/[id]
 * Delete a bulk operation (draft only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const operation = await bulkOperationsService.getBulkOperation(params.id)
    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 })
    }

    // Verify access
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId: operation.tenantId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only allow deletion of draft operations
    if (operation.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete draft operations' },
        { status: 400 }
      )
    }

    // Delete the operation (cascade delete will handle results and history)
    await prisma.bulkOperation.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/admin/bulk-operations/${params.id} error:`, error)
    return NextResponse.json(
      { error: 'Failed to delete operation' },
      { status: 500 }
    )
  }
}
