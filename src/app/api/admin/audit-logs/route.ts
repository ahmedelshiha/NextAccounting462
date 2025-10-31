import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { AuditLogService } from '@/services/audit-log.service'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const tenantId = user.tenantId

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || undefined
    const userId = searchParams.get('userId') || undefined
    const resource = searchParams.get('resource') || undefined
    const search = searchParams.get('search') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await AuditLogService.fetchAuditLogs({
      tenantId,
      action,
      userId,
      resource,
      startDate,
      endDate,
      search,
      limit,
      offset
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
