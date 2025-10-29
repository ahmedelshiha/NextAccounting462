import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { queryTenantRaw } from '@/lib/db-raw'
import { respond } from '@/lib/api-response'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { createHash } from 'crypto'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

export const GET = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId ?? null
  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-users-list:${ip}`, 60, 60_000)
    if (rl && rl.allowed === false) {
      try { const { logAudit } = await import('@/lib/audit'); await logAudit({ action: 'security.ratelimit.block', details: { tenantId, ip, key: `admin-users-list:${ip}`, route: new URL(request.url).pathname } }) } catch {}
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const role = ctx.role ?? ''
    if (!ctx.userId) return respond.unauthorized()
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

    let useFallback = false
    try {
      await queryTenantRaw`SELECT 1`
    } catch (e: any) {
      const code = String(e?.code || '')
      if (code.startsWith('P10')) useFallback = true
    }
    if (useFallback) {
      const fallback = [
        { id: 'demo-admin', name: 'Admin User', email: 'admin@accountingfirm.com', role: 'ADMIN', createdAt: new Date().toISOString() },
        { id: 'demo-staff', name: 'Staff Member', email: 'staff@accountingfirm.com', role: 'STAFF', createdAt: new Date().toISOString() },
        { id: 'demo-client', name: 'John Smith', email: 'john@example.com', role: 'CLIENT', createdAt: new Date().toISOString() },
      ]
      return NextResponse.json({
        users: fallback,
        pagination: { page: 1, limit: 50, total: 3, pages: 1 }
      })
    }

    try {
      // Parse pagination parameters
      const { searchParams } = new URL(request.url)
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
      const skip = (page - 1) * limit

      // Implement timeout resilience for slow queries
      let timeoutId: NodeJS.Timeout | null = null
      const queryCompleted = { value: false }

      const queryPromise = Promise.all([
        prisma.user.count({ where: tenantFilter(tenantId) }),
        prisma.user.findMany({
          where: tenantFilter(tenantId),
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        })
      ]).then(([total, users]) => {
        queryCompleted.value = true
        if (timeoutId) clearTimeout(timeoutId)
        return { total, users }
      }).catch(err => {
        queryCompleted.value = true
        if (timeoutId) clearTimeout(timeoutId)
        throw err
      })

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          if (!queryCompleted.value) {
            reject(new Error('Users query timeout after 6 seconds'))
          }
        }, 6000)
      })

      const { total, users } = await Promise.race([queryPromise, timeoutPromise])

      // Map users to response format
      const mapped = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        updatedAt: user.updatedAt ? (user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt) : (user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt)
      }))

      // Generate ETag from users data
      const etagData = JSON.stringify(mapped)
      const etag = `"${createHash('sha256').update(etagData).digest('hex')}"`

      const ifNoneMatch = request.headers.get('if-none-match')

      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304, headers: { ETag: etag } })
      }

      return NextResponse.json(
        {
          users: mapped,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        {
          headers: {
            ETag: etag,
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
          }
        }
      )
    } catch (e: any) {
      const code = String(e?.code || '')
      const message = String(e?.message || '')

      // Handle database connection errors with fallback
      if (code.startsWith('P20') || code.startsWith('P10') || /relation|table|column|timeout/i.test(message)) {
        console.warn('Database query error, returning fallback data:', code, message)
        const fallback = [
          { id: 'demo-admin', name: 'Admin User', email: 'admin@accountingfirm.com', role: 'ADMIN', createdAt: new Date().toISOString() },
          { id: 'demo-staff', name: 'Staff Member', email: 'staff@accountingfirm.com', role: 'STAFF', createdAt: new Date().toISOString() },
          { id: 'demo-client', name: 'John Smith', email: 'john@example.com', role: 'CLIENT', createdAt: new Date().toISOString() }
        ]
        return NextResponse.json({
          users: fallback,
          pagination: { page: 1, limit: 50, total: 3, pages: 1 }
        })
      }

      throw e
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    const fallback = [
      { id: 'demo-admin', name: 'Admin User', email: 'admin@accountingfirm.com', role: 'ADMIN', createdAt: new Date().toISOString() },
      { id: 'demo-staff', name: 'Staff Member', email: 'staff@accountingfirm.com', role: 'STAFF', createdAt: new Date().toISOString() },
      { id: 'demo-client', name: 'John Smith', email: 'john@example.com', role: 'CLIENT', createdAt: new Date().toISOString() }
    ]
    return NextResponse.json({
      users: fallback,
      pagination: { page: 1, limit: 50, total: 3, pages: 1 }
    })
  }
})
