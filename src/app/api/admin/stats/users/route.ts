import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const runtime = 'nodejs'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = ctx.tenantId
    const rangeParam = (searchParams.get('range') || '').toLowerCase()
    const days = rangeParam === '7d' ? 7 : rangeParam === '30d' ? 30 : rangeParam === '90d' ? 90 : rangeParam === '1y' ? 365 : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let timeoutId: NodeJS.Timeout | null = null
    const queryCompleted = { value: false }

    const statsPromise = Promise.all([
      prisma.user.count({ where: tenantFilter(tenantId) }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'CLIENT' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'TEAM_MEMBER' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'TEAM_LEAD' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), role: 'ADMIN' } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.user.count({ where: { ...tenantFilter(tenantId), bookings: { some: { createdAt: { gte: thirtyDaysAgo } } } } }),
      prisma.user.findMany({
        where: { ...tenantFilter(tenantId), role: 'CLIENT' },
        select: { id: true, name: true, email: true, createdAt: true, _count: { select: { bookings: true } } },
        orderBy: { bookings: { _count: 'desc' } },
        take: 5
      })
    ]).then(([total, clients, teamMembers, teamLeads, admins, newThisMonth, newLastMonth, activeUsers, topUsers]) => {
      queryCompleted.value = true
      if (timeoutId) clearTimeout(timeoutId)
      return { total, clients, teamMembers, teamLeads, admins, newThisMonth, newLastMonth, activeUsers, topUsers }
    }).catch(err => {
      queryCompleted.value = true
      if (timeoutId) clearTimeout(timeoutId)
      throw err
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        if (!queryCompleted.value) {
          reject(new Error('Stats query timeout after 5 seconds'))
        }
      }, 5000)
    })

    const { total, clients, teamMembers, teamLeads, admins, newThisMonth, newLastMonth, activeUsers, topUsers } =
      await Promise.race([statsPromise, timeoutPromise])

    const staff = teamMembers + teamLeads
    const growth = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0

    const registrationTrends: Array<{ month: string; count: number }> = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const count = await prisma.user.count({
        where: { ...tenantFilter(tenantId), createdAt: { gte: monthStart, lte: monthEnd } }
      })

      registrationTrends.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        count
      })
    }

    let ranged: { range?: string; newUsers?: number; growth?: number } = {}
    if (days > 0) {
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const prevStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)
      const [inRange, prevRange] = await Promise.all([
        prisma.user.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: start } } }),
        prisma.user.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: prevStart, lt: start } } })
      ])
      const growthRange = prevRange > 0 ? ((inRange - prevRange) / prevRange) * 100 : 0
      ranged = { range: rangeParam, newUsers: inRange, growth: Math.round(growthRange * 100) / 100 }
    }

    return NextResponse.json({
      total,
      clients,
      staff,
      admins,
      newThisMonth,
      newLastMonth,
      growth: Math.round(growth * 100) / 100,
      activeUsers,
      registrationTrends,
      topUsers: (topUsers as any[]).map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        bookingsCount: user._count?.bookings ?? 0,
        createdAt: user.createdAt
      })),
      range: ranged
    }, {
      headers: { 'Cache-Control': 'private, max-age=120' }
    })
  } catch (error) {
    console.error('Error fetching user statistics:', error)
    return NextResponse.json({
      total: 0,
      clients: 0,
      staff: 0,
      admins: 0,
      newThisMonth: 0,
      newLastMonth: 0,
      growth: 0,
      activeUsers: 0,
      registrationTrends: [],
      topUsers: [],
      range: {}
    })
  }
})
