import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const GET = withTenantContext(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetRole = await prisma.customRole.findFirst({
      where: {
        id: params.id,
        tenantId: ctx.tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json(targetRole)
  } catch (err) {
    console.error('GET /api/admin/roles/[id] error', err)
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { name, description, permissions } = body || {}

    const targetRole = await prisma.customRole.findFirst({
      where: {
        id: params.id,
        tenantId: ctx.tenantId,
      },
    })

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if new name is available (if changed)
    if (name && name !== targetRole.name) {
      const existing = await prisma.customRole.findFirst({
        where: {
          name,
          tenantId: ctx.tenantId,
        },
      })
      if (existing) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
      }
    }

    // Validate permissions if provided
    if (permissions && (!Array.isArray(permissions) || permissions.length === 0)) {
      return NextResponse.json({ error: 'At least one permission must be assigned' }, { status: 400 })
    }

    const updated = await prisma.customRole.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(permissions && { permissions }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/admin/roles/[id] error', err)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetRole = await prisma.customRole.findFirst({
      where: {
        id: params.id,
        tenantId: ctx.tenantId,
      },
    })

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    await prisma.customRole.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/roles/[id] error', err)
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
})
