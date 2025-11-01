import prisma from '@/lib/prisma'
import { cache } from 'react'

export interface EntityNode {
  id: string
  type: 'USER' | 'TEAM' | 'CLIENT' | 'ROLE' | 'PERMISSION'
  label: string
  metadata?: Record<string, any>
}

export interface EntityRelationship {
  id: string
  fromId: string
  toId: string
  type: string
  metadata?: Record<string, any>
}

export interface EntityRelationshipMap {
  nodes: EntityNode[]
  edges: EntityRelationship[]
  analysis: RelationshipAnalysis
}

export interface RelationshipAnalysis {
  orphanedUsers: string[]
  permissionGaps: PermissionGap[]
  roleConflicts: RoleConflict[]
  hierarchyIssues: HierarchyIssue[]
  densityScore: number
  complexityScore: number
}

export interface PermissionGap {
  userId: string
  requiredPermissions: string[]
  missingPermissions: string[]
}

export interface RoleConflict {
  role1: string
  role2: string
  conflictingPermissions: string[]
  overlapPercentage: number
}

export interface HierarchyIssue {
  id: string
  type: 'circular_dependency' | 'missing_parent' | 'orphaned_node'
  description: string
  severity: 'critical' | 'warning' | 'info'
}

export const entityRelationshipService = {
  /**
   * Build complete entity relationship map
   */
  buildRelationshipMap: cache(async (): Promise<EntityRelationshipMap> => {
    const [users, teams, clients, roles, permissions] = await Promise.all([
      prisma.user.findMany({
        include: { team: true, roles: true }
      }),
      prisma.team.findMany({
        include: { members: true, parent: true }
      }),
      prisma.tenant.findMany({
        include: { users: true }
      }),
      prisma.role.findMany({
        include: { permissions: true }
      }),
      prisma.permission.findMany()
    ])

    const nodes: EntityNode[] = []
    const edges: EntityRelationship[] = []

    // Add user nodes
    users.forEach((user, idx) => {
      nodes.push({
        id: `user-${user.id}`,
        type: 'USER',
        label: user.email,
        metadata: {
          email: user.email,
          isActive: user.isActive,
          teamId: user.teamId
        }
      })
    })

    // Add team nodes
    teams.forEach((team, idx) => {
      nodes.push({
        id: `team-${team.id}`,
        type: 'TEAM',
        label: team.name,
        metadata: {
          memberCount: team.members.length,
          parentId: team.parentId
        }
      })
    })

    // Add role nodes
    roles.forEach((role, idx) => {
      nodes.push({
        id: `role-${role.id}`,
        type: 'ROLE',
        label: role.name,
        metadata: {
          permissionCount: role.permissions.length
        }
      })
    })

    // Add permission nodes (subset for readability)
    permissions.slice(0, 10).forEach((perm, idx) => {
      nodes.push({
        id: `perm-${perm.id}`,
        type: 'PERMISSION',
        label: perm.name,
        metadata: {
          resource: perm.resource,
          action: perm.action
        }
      })
    })

    // Add user-to-team edges
    users.forEach((user) => {
      if (user.teamId) {
        edges.push({
          id: `user-team-${user.id}`,
          fromId: `user-${user.id}`,
          toId: `team-${user.teamId}`,
          type: 'BELONGS_TO'
        })
      }
    })

    // Add user-to-role edges
    users.forEach((user) => {
      user.roles.forEach((role) => {
        edges.push({
          id: `user-role-${user.id}-${role.id}`,
          fromId: `user-${user.id}`,
          toId: `role-${role.id}`,
          type: 'HAS_ROLE'
        })
      })
    })

    // Add role-to-permission edges
    roles.forEach((role) => {
      role.permissions.slice(0, 5).forEach((perm) => {
        edges.push({
          id: `role-perm-${role.id}-${perm.id}`,
          fromId: `role-${role.id}`,
          toId: `perm-${perm.id}`,
          type: 'HAS_PERMISSION'
        })
      })
    })

    // Add team hierarchy edges
    teams.forEach((team) => {
      if (team.parentId) {
        edges.push({
          id: `team-hierarchy-${team.id}`,
          fromId: `team-${team.id}`,
          toId: `team-${team.parentId}`,
          type: 'CHILD_OF'
        })
      }
    })

    // Analyze relationships
    const analysis = await analyzeRelationships(users, roles)

    return {
      nodes,
      edges,
      analysis
    }
  }),

  /**
   * Detect orphaned users (users with no team or role)
   */
  findOrphanedUsers: cache(async (): Promise<string[]> => {
    const orphaned = await prisma.user.findMany({
      where: {
        AND: [
          { teamId: null },
          { roles: { none: {} } }
        ]
      },
      select: { id: true }
    })

    return orphaned.map(u => u.id)
  }),

  /**
   * Detect role conflicts (overlapping permissions)
   */
  detectRoleConflicts: cache(async (): Promise<RoleConflict[]> => {
    const roles = await prisma.role.findMany({
      include: { permissions: { select: { id: true } } }
    })

    const conflicts: RoleConflict[] = []

    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const role1 = roles[i]
        const role2 = roles[j]

        const perms1 = new Set(role1.permissions.map(p => p.id))
        const perms2 = new Set(role2.permissions.map(p => p.id))

        const overlap: string[] = Array.from(perms1).filter((p: string) => perms2.has(p))
        const overlapPercent = Math.round(
          (overlap.length / Math.max(perms1.size, perms2.size)) * 100
        )

        if (overlapPercent > 80) {
          conflicts.push({
            role1: role1.name,
            role2: role2.name,
            conflictingPermissions: overlap,
            overlapPercentage: overlapPercent
          })
        }
      }
    }

    return conflicts
  }),

  /**
   * Find permission gaps for a specific user
   */
  findPermissionGaps: cache(async (userId: string, requiredPermissions: string[]): Promise<PermissionGap> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            permissions: { select: { id: true } }
          }
        }
      }
    })

    if (!user) {
      return { userId, requiredPermissions, missingPermissions: requiredPermissions }
    }

    const userPermissions = new Set(
      user.roles.flatMap(r => r.permissions.map(p => p.id))
    )

    const missing = requiredPermissions.filter(p => !userPermissions.has(p))

    return {
      userId,
      requiredPermissions,
      missingPermissions: missing
    }
  }),

  /**
   * Check for circular dependencies in team hierarchy
   */
  detectCircularDependencies: cache(async (): Promise<HierarchyIssue[]> => {
    const teams = await prisma.team.findMany({
      include: { parent: true }
    })

    const issues: HierarchyIssue[] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    function hasCircle(teamId: string): boolean {
      visited.add(teamId)
      recursionStack.add(teamId)

      const team = teams.find(t => t.id === teamId)
      if (team?.parentId) {
        if (recursionStack.has(team.parentId)) {
          return true
        }

        if (!visited.has(team.parentId) && hasCircle(team.parentId)) {
          return true
        }
      }

      recursionStack.delete(teamId)
      return false
    }

    teams.forEach(team => {
      if (!visited.has(team.id) && hasCircle(team.id)) {
        issues.push({
          id: team.id,
          type: 'circular_dependency',
          description: `Circular dependency detected in team hierarchy: ${team.name}`,
          severity: 'critical'
        })
      }
    })

    return issues
  })
}

/**
 * Helper: Analyze all relationships
 */
async function analyzeRelationships(users: any[], roles: any[]): Promise<RelationshipAnalysis> {
  const orphanedUsers = users
    .filter(u => !u.teamId && u.roles.length === 0)
    .map(u => u.id)

  const circularDeps = await entityRelationshipService.detectCircularDependencies()
  const roleConflicts = await entityRelationshipService.detectRoleConflicts()

  const densityScore = Math.min(100, Math.round((roles.length / Math.max(users.length, 1)) * 100))
  const complexityScore = Math.min(100, Math.round(
    ((orphanedUsers.length + circularDeps.length + roleConflicts.length) / Math.max(users.length, 1)) * 100
  ))

  return {
    orphanedUsers,
    permissionGaps: [],
    roleConflicts,
    hierarchyIssues: circularDeps,
    densityScore,
    complexityScore
  }
}
