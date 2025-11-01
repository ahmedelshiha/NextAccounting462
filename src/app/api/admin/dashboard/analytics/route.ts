import { NextRequest, NextResponse } from 'next/server'
import { dashboardMetricsService } from '@/services/dashboard-metrics.service'
import { withAdminAuth } from '@/lib/auth-middleware'

export const revalidate = 600 // Cache for 10 minutes

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const [
      userGrowthTrend,
      departmentDistribution,
      roleDistribution,
      workflowEfficiency,
      complianceScore
    ] = await Promise.all([
      dashboardMetricsService.getUserGrowthTrend(),
      dashboardMetricsService.getDepartmentDistribution(),
      dashboardMetricsService.getRoleDistribution(),
      dashboardMetricsService.getWorkflowEfficiency(),
      dashboardMetricsService.getComplianceScore()
    ])

    return NextResponse.json(
      {
        analytics: {
          userGrowthTrend,
          departmentDistribution,
          roleDistribution,
          workflowEfficiency,
          complianceScore
        },
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600'
        }
      }
    )
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
})
