import prisma from '@/lib/prisma'
import { cache } from 'react'

export interface Recommendation {
  id: string
  type: 'workflow_optimization' | 'security' | 'cost_optimization' | 'compliance' | 'performance'
  title: string
  description: string
  impact: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  estimatedSavings?: {
    time?: string
    cost?: string
    efficiency?: string
  }
  actions: RecommendationAction[]
  metadata?: {
    affectedCount?: number
    implementationTime?: string
  }
}

export interface RecommendationAction {
  label: string
  action: string
  target?: string
  data?: unknown
}

export interface AdminContext {
  tenantId: string
  userId: string
}

export const recommendationEngine = {
  /**
   * Generate contextual recommendations based on admin context
   */
  generateRecommendations: cache(async (context: AdminContext): Promise<Recommendation[]> => {
    const recommendations: Recommendation[] = []

    // Get data for analysis
    const [
      inactiveAdmins,
      workflowMetrics,
      rolesWithOverlap,
      securityAlerts,
      complianceIssues,
      userGrowth
    ] = await Promise.all([
      getInactiveAdmins(),
      getWorkflowMetrics(),
      getRolesWithOverlap(),
      getSecurityAlerts(),
      getComplianceIssues(),
      getUserGrowthMetrics()
    ])

    // Security: Inactive admin accounts
    if (inactiveAdmins.length > 0) {
      recommendations.push({
        id: 'rec-security-inactive-admins',
        type: 'security',
        title: 'Review Inactive Admin Accounts',
        description: `${inactiveAdmins.length} admin accounts have been inactive for >90 days. This is a security risk.`,
        impact: 'critical',
        confidence: 0.95,
        actions: [
          {
            label: 'View Inactive Accounts',
            action: 'filter',
            data: { role: 'ADMIN', inactive: '>90d' }
          },
          {
            label: 'Auto-Disable',
            action: 'bulk_action',
            data: { action: 'disable' }
          }
        ],
        metadata: {
          affectedCount: inactiveAdmins.length
        }
      })
    }

    // Workflow Optimization
    if (workflowMetrics.slowestStep) {
      const timeReduction = workflowMetrics.slowestStepDuration - 24
      recommendations.push({
        id: 'rec-workflow-optimization',
        type: 'workflow_optimization',
        title: 'Optimize Approval Workflow',
        description: `Step "${workflowMetrics.slowestStep}" takes ${workflowMetrics.slowestStepDuration}h on average. Consider parallel approvals.`,
        impact: 'high',
        confidence: 0.89,
        estimatedSavings: {
          time: `${timeReduction}h`,
          cost: '$450'
        },
        actions: [
          {
            label: 'Review Workflow',
            action: 'navigate',
            target: `/admin/workflows/${workflowMetrics.workflowId}`
          },
          {
            label: 'Apply Optimization',
            action: 'apply_optimization',
            data: { workflow: workflowMetrics.workflowId, type: 'parallel-approval' }
          }
        ]
      })
    }

    // Cost Optimization: Role consolidation
    if (rolesWithOverlap.length > 0) {
      const role = rolesWithOverlap[0]
      recommendations.push({
        id: 'rec-cost-role-consolidation',
        type: 'cost_optimization',
        title: 'Consolidate Duplicate Roles',
        description: `"${role.role1}" and "${role.role2}" have ${role.overlapPercentage}% permission overlap.`,
        impact: 'medium',
        confidence: 0.82,
        estimatedSavings: {
          cost: '$1,200/year'
        },
        actions: [
          {
            label: 'Compare Permissions',
            action: 'compare_roles',
            data: { roles: [role.role1, role.role2] }
          },
          {
            label: 'Merge Roles',
            action: 'merge_roles_wizard',
            data: { roles: [role.role1, role.role2] }
          }
        ]
      })
    }

    // Compliance
    if (complianceIssues.length > 0) {
      const issue = complianceIssues[0]
      recommendations.push({
        id: 'rec-compliance-issue',
        type: 'compliance',
        title: `Address Compliance Issue: ${issue.title}`,
        description: issue.description,
        impact: 'high',
        confidence: 0.9,
        actions: [
          {
            label: 'View Details',
            action: 'navigate',
            target: `/admin/compliance`
          },
          {
            label: 'Create Action Item',
            action: 'create_action_item',
            data: { issue: issue.id }
          }
        ]
      })
    }

    // Performance optimization based on user growth
    if (userGrowth.weeklyGrowthRate > 5) {
      recommendations.push({
        id: 'rec-performance-scaling',
        type: 'performance',
        title: 'Prepare for Scaling',
        description: `User growth is ${userGrowth.weeklyGrowthRate}% weekly. Consider performance optimizations.`,
        impact: 'medium',
        confidence: 0.75,
        actions: [
          {
            label: 'View Growth Trends',
            action: 'navigate',
            target: `/admin/analytics`
          },
          {
            label: 'Performance Report',
            action: 'generate_report',
            data: { report: 'performance' }
          }
        ]
      })
    }

    return recommendations.filter(r => r.confidence > 0.7).sort((a, b) => {
      const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return (
        impactOrder[a.impact] - impactOrder[b.impact] ||
        b.confidence - a.confidence
      )
    })
  })
}

/**
 * Helper functions for data analysis
 */

async function getInactiveAdmins() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  
  return prisma.user.findMany({
    where: {
      AND: [
        { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        {
          OR: [
            { lastLogin: { lt: ninetyDaysAgo } },
            { lastLogin: null }
          ]
        }
      ]
    },
    select: { id: true, email: true, lastLogin: true }
  })
}

async function getWorkflowMetrics() {
  // Simplified - would aggregate real workflow execution data
  return {
    workflowId: 'workflow-1',
    slowestStep: 'Manager Approval',
    slowestStepDuration: 48,
    averageDuration: 24
  }
}

async function getRolesWithOverlap() {
  // Simplified - would compare actual role permissions
  const roles = await prisma.role.findMany({
    select: { id: true, name: true }
  })

  if (roles.length < 2) return []

  return [
    {
      role1: roles[0].name,
      role2: roles[1].name,
      overlapPercentage: 98
    }
  ]
}

async function getSecurityAlerts() {
  // Would fetch from security audit logs
  return [
    {
      id: 'alert-1',
      type: 'unusual_activity',
      message: 'Multiple failed login attempts detected'
    }
  ]
}

async function getComplianceIssues() {
  // Would fetch from compliance tracking
  return [
    {
      id: 'comp-1',
      title: 'Missing Data Retention Policy',
      description: 'GDPR requires documented data retention policies.',
      severity: 'high'
    }
  ]
}

async function getUserGrowthMetrics() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [thisWeek, lastWeek] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo
        }
      }
    })
  ])

  const lastWeekTotal = await prisma.user.count()
  const weeklyGrowthRate = lastWeekTotal > 0 ? (thisWeek / lastWeekTotal) * 100 : 0

  return {
    weeklyGrowthRate: Math.round(weeklyGrowthRate),
    thisWeekNewUsers: thisWeek,
    lastWeekNewUsers: lastWeek
  }
}
