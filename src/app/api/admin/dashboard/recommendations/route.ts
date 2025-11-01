import { NextRequest, NextResponse } from 'next/server'
import { recommendationEngine } from '@/services/recommendation-engine.service'
import { withAdminAuth } from '@/lib/auth-middleware'
import { withTenantContext, requireTenantContext } from '@/lib/auth-middleware'

export const revalidate = 600 // Cache for 10 minutes

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    // Use tenant context instead of getServerSession
    const tenantId = await requireTenantContext(req)

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const recommendations = await recommendationEngine.generateRecommendations({
      tenantId,
      userId: session.user.id
    })

    return NextResponse.json(
      {
        recommendations,
        count: recommendations.length,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600'
        }
      }
    )
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
})
