import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { AuditLogService } from '@/services/audit-log.service'
import { authOptions } from '@/lib/auth'
import RateLimiter, { RATE_LIMITS } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const tenantId = user.tenantId
    const userId = user.id

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    // Rate limiting: Max 5 exports per minute per user
    const clientIp = getClientIp(request as unknown as Request)
    const rateLimitKey = `export:${tenantId}:${userId}`
    const { allowed, remaining, resetTime } = RateLimiter.checkLimit(
      rateLimitKey,
      RATE_LIMITS.EXPORT.limit,
      RATE_LIMITS.EXPORT.windowMs
    )

    if (!allowed) {
      const resetDate = new Date(resetTime)
      return NextResponse.json(
        {
          error: 'Export rate limit exceeded',
          message: `Too many exports. Try again at ${resetDate.toISOString()}`,
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000))
          }
        }
      )
    }

    // Parse and validate request body
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { action, userId: filterUserId, resource, startDate, endDate, search } = body

    // Input validation
    const errors: string[] = []

    // Validate action if provided
    if (action && typeof action !== 'string') {
      errors.push('action must be a string')
    }
    if (action && action.length > 100) {
      errors.push('action must not exceed 100 characters')
    }

    // Validate userId if provided
    if (filterUserId && typeof filterUserId !== 'string') {
      errors.push('userId must be a string')
    }
    if (filterUserId && filterUserId.length > 100) {
      errors.push('userId must not exceed 100 characters')
    }

    // Validate resource if provided
    if (resource && typeof resource !== 'string') {
      errors.push('resource must be a string')
    }
    if (resource && resource.length > 100) {
      errors.push('resource must not exceed 100 characters')
    }

    // Validate search if provided
    if (search && typeof search !== 'string') {
      errors.push('search must be a string')
    }
    if (search && search.length > 500) {
      errors.push('search must not exceed 500 characters')
    }

    // Validate date range
    let parsedStartDate: Date | undefined
    let parsedEndDate: Date | undefined

    if (startDate) {
      const date = new Date(startDate)
      if (isNaN(date.getTime())) {
        errors.push('startDate must be a valid ISO date')
      } else {
        parsedStartDate = date
      }
    }

    if (endDate) {
      const date = new Date(endDate)
      if (isNaN(date.getTime())) {
        errors.push('endDate must be a valid ISO date')
      } else {
        parsedEndDate = date
      }
    }

    // Validate date range logic
    if (parsedStartDate && parsedEndDate) {
      if (parsedStartDate > parsedEndDate) {
        errors.push('startDate must be before endDate')
      }

      // Prevent exporting data older than 90 days without explicit permission
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      if (parsedStartDate < ninetyDaysAgo && !user.isAdmin) {
        errors.push('Cannot export data older than 90 days')
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // Export audit logs to CSV
    const csvContent = await AuditLogService.exportAuditLogs({
      tenantId,
      action: action || undefined,
      userId: filterUserId || undefined,
      resource: resource || undefined,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      search: search || undefined
    })

    // Set security headers for file download
    const response = new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-RateLimit-Remaining': String(remaining)
      }
    })

    return response
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    )
  }
}
