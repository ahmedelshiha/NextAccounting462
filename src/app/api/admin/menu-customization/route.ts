import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import prisma from '@/lib/prisma'
import { MenuCustomizationData } from '@/types/admin/menuCustomization'
import { validateMenuCustomization } from '@/lib/menu/menuValidator'

/**
 * Default menu structure - returned when user has no customization
 */
const getDefaultMenuCustomization = (): MenuCustomizationData => ({
  sectionOrder: ['dashboard', 'business', 'financial', 'operations', 'system'],
  hiddenItems: [],
  practiceItems: [],
  bookmarks: [],
})

/**
 * GET /api/admin/menu-customization
 * Retrieves the user's menu customization configuration
 *
 * Returns:
 * - User's custom menu configuration if it exists
 * - Default menu configuration if no customization record found
 *
 * Authorization: Requires authenticated user (requireAuth: true)
 */
const _api_GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const ctx = tenantContext.getContext()
    const userId = String(ctx.userId ?? '')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in context' },
        { status: 401 }
      )
    }

    // Fetch user's customization from database
    const customization = await prisma.menuCustomization.findUnique({
      where: { userId },
    })

    // If no customization found, return default
    if (!customization) {
      return NextResponse.json(getDefaultMenuCustomization(), { status: 200 })
    }

    // Parse JSON fields and return customization data
    const data: MenuCustomizationData = {
      sectionOrder: customization.sectionOrder as string[],
      hiddenItems: customization.hiddenItems as string[],
      practiceItems: customization.practiceItems as any[],
      bookmarks: customization.bookmarks as any[],
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[menu-customization:GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu customization' },
      { status: 500 }
    )
  }
}

export const GET = withTenantContext(_api_GET, { requireAuth: true })
