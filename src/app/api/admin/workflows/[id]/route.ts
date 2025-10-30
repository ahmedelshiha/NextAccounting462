import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import prisma from '@/lib/prisma'
import { workflowExecutor } from '@/services/workflow-executor.service'

export const runtime = 'nodejs'

// GET /api/admin/workflows/:id - details
export const GET = withTenantContext(async (_request: Request, { params }: { params: { id: string } }) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return respond.unauthorized()
  if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')
  const id = params.id

  try {
    try {
      const wf = await prisma.userWorkflow.findFirst({
        where: { id, tenantId: ctx.tenantId },
        include: { steps: { orderBy: { stepNumber: 'asc' } }, history: true }
      })
      if (!wf) return respond.notFound('Workflow not found')
      return NextResponse.json({ workflow: wf })
    } catch {
      return respond.notFound('Workflow not found')
    }
  } catch {
    return respond.serverError('Failed to fetch workflow')
  }
})

// PATCH /api/admin/workflows/:id - actions: PAUSE|RESUME|CANCEL|EXECUTE|APPROVE_STEP
export const PATCH = withTenantContext(async (request: Request, { params }: { params: { id: string } }) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return respond.unauthorized()
  if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

  const id = params.id
  try {
    const body = await request.json()
    const action = String(body?.action || '')

    switch (action) {
      case 'PAUSE': {
        const status = await workflowExecutor.pauseWorkflow(id)
        return NextResponse.json({ success: status === 'PAUSED', status })
      }
      case 'RESUME': {
        const status = await workflowExecutor.resumeWorkflow(id)
        return NextResponse.json({ success: status === 'IN_PROGRESS', status })
      }
      case 'CANCEL': {
        const status = await workflowExecutor.cancelWorkflow(id)
        return NextResponse.json({ success: status === 'CANCELLED', status })
      }
      case 'EXECUTE': {
        const result = await workflowExecutor.executeWorkflow(id)
        return NextResponse.json({ success: result.status === 'COMPLETED', result })
      }
      case 'APPROVE_STEP': {
        const stepId = String(body?.stepId || '')
        if (!stepId) return respond.badRequest('stepId required')
        const status = await workflowExecutor.approveStep(stepId, ctx.userId!)
        return NextResponse.json({ success: status !== 'FAILED', status })
      }
      default:
        return respond.badRequest('Invalid action')
    }
  } catch {
    return respond.serverError('Failed to update workflow')
  }
})
