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

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'actions'
    const days = parseInt(searchParams.get('days') || '30')

    if (type === 'actions') {
      const actions = await AuditLogService.getDistinctActions(tenantId)
      return NextResponse.json({ actions })
    } else if (type === 'stats') {
      const stats = await AuditLogService.getAuditStats(tenantId, days)
      return NextResponse.json(stats)
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching audit metadata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit metadata' },
      { status: 500 }
    )
  }
}
