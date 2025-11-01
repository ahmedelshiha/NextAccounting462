import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

interface SearchResult {
  id: string
  type: string
  name?: string
  title?: string
  description?: string
  email?: string
}

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId ?? null
    const searchParams = new URL(request.url).searchParams
    const query = (searchParams.get('q') || '').trim()
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results: SearchResult[] = []

    // Search users (if user has permission)
    if (hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) {
      try {
        const users = await prisma.user.findMany({
          where: {
            ...tenantFilter(tenantId),
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            name: true,
            email: true
          },
          take: limit
        })

        results.push(
          ...users.map(user => ({
            id: user.id,
            type: 'user',
            name: user.name || user.email,
            description: user.email,
            email: user.email
          }))
        )
      } catch (error) {
        console.error('Error searching users:', error)
      }
    }

    // Search services (if user has permission)
    if (hasPermission(ctx.role ?? '', PERMISSIONS.SERVICES_VIEW)) {
      try {
        const services = await prisma.service.findMany({
          where: {
            ...(tenantId ? { tenantId } : {}),
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            name: true,
            description: true
          },
          take: limit
        })

        results.push(
          ...services.map(service => ({
            id: service.id,
            type: 'service',
            name: service.name,
            description: service.description
          }))
        )
      } catch (error) {
        console.error('Error searching services:', error)
      }
    }

    // Sort by type priority and return top results
    const priorityMap = { user: 0, service: 1, booking: 2, invoice: 3 }
    const sortedResults = results
      .sort((a, b) => (priorityMap[a.type as keyof typeof priorityMap] || 99) - (priorityMap[b.type as keyof typeof priorityMap] || 99))
      .slice(0, limit)

    return NextResponse.json({ results: sortedResults })
  } catch (error) {
    console.error('Global search error:', error)
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
  }
})
