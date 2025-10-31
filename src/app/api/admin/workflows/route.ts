import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import prisma from '@/lib/prisma'
import { workflowBuilder } from '@/services/workflow-builder.service'

export const runtime = 'nodejs'

// GET /api/admin/workflows - list workflows
export const GET = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return respond.unauthorized()
  if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const type = searchParams.get('type') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const where: any = { tenantId: ctx.tenantId }
    if (status) where.status = status
    if (type) where.type = type

    let workflows: any[] = []
    let total = 0
    try {
      [workflows, total] = await Promise.all([
        prisma.userWorkflow.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.userWorkflow.count({ where })
      ])
    } catch {
      workflows = []
      total = 0
    }

    return NextResponse.json({ workflows, pagination: { page, limit, total } })
  } catch (e) {
    return respond.serverError('Failed to fetch workflows')
  }
})

// POST /api/admin/workflows - create workflow from template or default
export const POST = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return respond.unauthorized()
  if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

  try {
    const body = await request.json()
    const { userId, templateId, type, scheduledFor } = body || {}
    if (!userId) return respond.badRequest('userId is required')

    const wf = await workflowBuilder.createWorkflowFromTemplate({
      tenantId: ctx.tenantId!,
      userId,
      templateId,
      type,
      scheduledFor
    })

    return NextResponse.json({ workflow: wf }, { status: 201 })
  } catch (e) {
    return respond.serverError('Failed to create workflow')
  }
})
