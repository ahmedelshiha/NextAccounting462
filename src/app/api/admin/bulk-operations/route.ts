import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { bulkOperationsService } from '@/services/bulk-operations.service'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/bulk-operations
 * List bulk operations with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') as any

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    // Verify user has access to this tenant
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await bulkOperationsService.listBulkOperations(tenantId, {
      limit,
      offset,
      status
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/admin/bulk-operations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bulk operations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/bulk-operations
 * Create a new bulk operation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenantId, name, description, type, userFilter, operationConfig, approvalRequired, scheduledFor, notifyUsers } = body

    if (!tenantId || !name || !type || !operationConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access to this tenant
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const operation = await bulkOperationsService.createBulkOperation(
      tenantId,
      session.user.id,
      {
        name,
        description,
        type,
        userFilter,
        operationConfig,
        approvalRequired,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        notifyUsers
      }
    )

    return NextResponse.json(operation, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/bulk-operations error:', error)
    return NextResponse.json(
      { error: 'Failed to create bulk operation' },
      { status: 500 }
    )
  }
}
