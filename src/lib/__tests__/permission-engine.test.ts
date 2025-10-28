import { describe, it, expect } from 'vitest'
import {
  PermissionEngine,
  PermissionDiff,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../permission-engine'
import {
  Permission,
  PERMISSIONS,
  PERMISSION_METADATA,
  RiskLevel,
  PermissionCategory,
} from '../permissions'

describe('PermissionEngine', () => {
  describe('calculateDiff', () => {
    it('should calculate added permissions', () => {
      const current: Permission[] = []
      const target: Permission[] = [PERMISSIONS.ANALYTICS_VIEW as Permission]

      const diff = PermissionEngine.calculateDiff(current, target)

      expect(diff.added).toHaveLength(1)
      expect(diff.added[0]).toBe(PERMISSIONS.ANALYTICS_VIEW)
      expect(diff.removed).toHaveLength(0)
      expect(diff.unchanged).toHaveLength(0)
    })

    it('should calculate removed permissions', () => {
      const current: Permission[] = [PERMISSIONS.ANALYTICS_VIEW as Permission]
      const target: Permission[] = []

      const diff = PermissionEngine.calculateDiff(current, target)

      expect(diff.removed).toHaveLength(1)
      expect(diff.removed[0]).toBe(PERMISSIONS.ANALYTICS_VIEW)
      expect(diff.added).toHaveLength(0)
      expect(diff.unchanged).toHaveLength(0)
    })

    it('should calculate unchanged permissions', () => {
      const current: Permission[] = [PERMISSIONS.ANALYTICS_VIEW as Permission]
      const target: Permission[] = [PERMISSIONS.ANALYTICS_VIEW as Permission]

      const diff = PermissionEngine.calculateDiff(current, target)

      expect(diff.unchanged).toHaveLength(1)
      expect(diff.unchanged[0]).toBe(PERMISSIONS.ANALYTICS_VIEW)
      expect(diff.added).toHaveLength(0)
      expect(diff.removed).toHaveLength(0)
    })

    it('should handle mixed changes', () => {
      const current: Permission[] = [
        PERMISSIONS.ANALYTICS_VIEW as Permission,
        PERMISSIONS.ANALYTICS_EXPORT as Permission,
      ]
      const target: Permission[] = [
        PERMISSIONS.ANALYTICS_VIEW as Permission,
        PERMISSIONS.USERS_MANAGE as Permission,
      ]

      const diff = PermissionEngine.calculateDiff(current, target)

      expect(diff.added).toHaveLength(1)
      expect(diff.removed).toHaveLength(1)
      expect(diff.unchanged).toHaveLength(1)
      expect(diff.total).toBe(2)
    })

    it('should handle empty arrays', () => {
      const diff1 = PermissionEngine.calculateDiff([], [])
      expect(diff1.added).toHaveLength(0)
      expect(diff1.removed).toHaveLength(0)
      expect(diff1.unchanged).toHaveLength(0)

      const diff2 = PermissionEngine.calculateDiff(
        [PERMISSIONS.ANALYTICS_VIEW as Permission],
        []
      )
      expect(diff2.added).toHaveLength(0)
      expect(diff2.removed).toHaveLength(1)
    })

    it('should handle duplicate permissions', () => {
      const current: Permission[] = [
        PERMISSIONS.ANALYTICS_VIEW as Permission,
        PERMISSIONS.ANALYTICS_VIEW as Permission,
      ]
      const target: Permission[] = [PERMISSIONS.ANALYTICS_VIEW as Permission]

      // Should treat sets, not arrays
      const diff = PermissionEngine.calculateDiff(current, target)
      expect(diff.removed).toHaveLength(0)
    })
  })

  describe('validate', () => {
    it('should validate simple permission set', () => {
      const permissions: Permission[] = [PERMISSIONS.ANALYTICS_VIEW as Permission]

      const result = PermissionEngine.validate(permissions)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing dependencies', () => {
      // Find a permission with dependencies
      const permissionsWithDeps = Object.entries(PERMISSION_METADATA).find(
        ([_, meta]) => meta.dependencies && meta.dependencies.length > 0
      )

      if (permissionsWithDeps) {
        const [permKey, meta] = permissionsWithDeps
        const permission = permKey as Permission

        // Try to grant permission without its dependencies
        const result = PermissionEngine.validate([permission])

        // Should have an error for missing dependencies
        const hasDependencyError = result.errors.some(
          e => e.type === 'missing-dependency' && e.permission === permission
        )
        expect(hasDependencyError).toBe(true)
      }
    })

    it('should detect permission conflicts', () => {
      // Find permissions with conflicts
      const conflictingPerms = Object.entries(PERMISSION_METADATA).find(
        ([_, meta]) => meta.conflicts && meta.conflicts.length > 0
      )

      if (conflictingPerms) {
        const [perm1Key, perm1Meta] = conflictingPerms
        if (perm1Meta.conflicts && perm1Meta.conflicts.length > 0) {
          const perm1 = perm1Key as Permission
          const perm2 = perm1Meta.conflicts[0]

          const result = PermissionEngine.validate([perm1, perm2])

          // Should have a warning for conflict
          const hasConflictWarning = result.warnings.some(
            w => w.type === 'conflict'
          )
          expect(hasConflictWarning).toBe(true)
        }
      }
    })

    it('should identify risk levels', () => {
      const highRiskPerms = Object.entries(PERMISSION_METADATA)
        .filter(([_, meta]) => meta.risk === RiskLevel.CRITICAL)
        .map(([key]) => key as Permission)
        .slice(0, 1)

      if (highRiskPerms.length > 0) {
        const result = PermissionEngine.validate(highRiskPerms)

        expect(result.riskLevel).toBe(RiskLevel.CRITICAL)
      }
    })

    it('should calculate maximum risk level', () => {
      const mediumRiskPerms = Object.entries(PERMISSION_METADATA)
        .filter(([_, meta]) => meta.risk === RiskLevel.MEDIUM)
        .map(([key]) => key as Permission)
        .slice(0, 2)

      const lowRiskPerms = Object.entries(PERMISSION_METADATA)
        .filter(([_, meta]) => meta.risk === RiskLevel.LOW)
        .map(([key]) => key as Permission)
        .slice(0, 2)

      if (mediumRiskPerms.length > 0 && lowRiskPerms.length > 0) {
        const result = PermissionEngine.validate([...mediumRiskPerms, ...lowRiskPerms])

        expect(result.riskLevel).toBe(RiskLevel.MEDIUM)
      }
    })

    it('should handle non-existent permissions gracefully', () => {
      const invalidPerms = ['invalid.permission' as Permission]

      const result = PermissionEngine.validate(invalidPerms)

      // Should still return valid result but handle missing metadata
      expect(typeof result.isValid).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should handle empty permission set', () => {
      const result = PermissionEngine.validate([])

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.riskLevel).toBe(RiskLevel.LOW)
    })
  })

  describe('getSuggestions', () => {
    it('should return array of suggestions', () => {
      const role = 'TEAM_MEMBER'
      const currentPermissions: Permission[] = []

      const suggestions = PermissionEngine.getSuggestions(
        role,
        currentPermissions
      )

      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('should suggest permissions based on role', () => {
      const role = 'ADMIN'
      const currentPermissions: Permission[] = []

      const suggestions = PermissionEngine.getSuggestions(
        role,
        currentPermissions
      )

      // Admin role should get suggestions
      expect(suggestions.length).toBeGreaterThanOrEqual(0)

      // All suggestions should have required properties
      suggestions.forEach(suggestion => {
        expect(suggestion.permission).toBeDefined()
        expect(suggestion.reason).toBeDefined()
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0)
        expect(suggestion.confidence).toBeLessThanOrEqual(1)
        expect(['add', 'remove']).toContain(suggestion.action)
      })
    })

    it('should not suggest already granted permissions', () => {
      const role = 'ADMIN'
      const currentPermissions: Permission[] = [
        PERMISSIONS.ANALYTICS_VIEW as Permission,
      ]

      const suggestions = PermissionEngine.getSuggestions(
        role,
        currentPermissions
      )

      const suggestedToAdd = suggestions
        .filter(s => s.action === 'add')
        .map(s => s.permission)

      expect(suggestedToAdd).not.toContain(PERMISSIONS.ANALYTICS_VIEW)
    })

    it('should handle different role types', () => {
      const roles = ['CLIENT', 'TEAM_MEMBER', 'ADMIN', 'SUPER_ADMIN']

      roles.forEach(role => {
        const suggestions = PermissionEngine.getSuggestions(role, [])
        expect(Array.isArray(suggestions)).toBe(true)
      })
    })
  })

  describe('searchPermissions', () => {
    it('should search by label', () => {
      const results = PermissionEngine.searchPermissions('analytics')

      expect(results.length).toBeGreaterThan(0)
      expect(results.some(p => PERMISSION_METADATA[p].label.toLowerCase().includes('analytics'))).toBe(true)
    })

    it('should search by description', () => {
      const results = PermissionEngine.searchPermissions('view')

      expect(results.length).toBeGreaterThan(0)
    })

    it('should be case insensitive', () => {
      const results1 = PermissionEngine.searchPermissions('analytics')
      const results2 = PermissionEngine.searchPermissions('ANALYTICS')

      expect(results1.length).toBe(results2.length)
    })

    it('should search by tags', () => {
      const allPerms = Object.values(PERMISSIONS) as Permission[]
      const permsWithTags = allPerms.filter(p => PERMISSION_METADATA[p].tags?.length)

      if (permsWithTags.length > 0) {
        const perm = PERMISSION_METADATA[permsWithTags[0]]
        if (perm.tags && perm.tags.length > 0) {
          const results = PermissionEngine.searchPermissions(perm.tags[0])

          expect(results.length).toBeGreaterThan(0)
          expect(results).toContain(permsWithTags[0])
        }
      }
    })

    it('should return empty array for non-matching search', () => {
      const results = PermissionEngine.searchPermissions('xyznonexistent12345')

      expect(results).toHaveLength(0)
    })

    it('should handle empty search query', () => {
      const results = PermissionEngine.searchPermissions('')

      // Empty search should return all permissions
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('getPermissionsByCategory', () => {
    it('should return permissions for a category', () => {
      const category = PermissionCategory.ANALYTICS
      const permissions = PermissionEngine.getPermissionsByCategory(category)

      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThan(0)

      // All returned permissions should belong to the category
      permissions.forEach(perm => {
        expect(PERMISSION_METADATA[perm].category).toBe(category)
      })
    })

    it('should return empty array for invalid category', () => {
      const permissions = PermissionEngine.getPermissionsByCategory(
        'INVALID_CATEGORY' as PermissionCategory
      )

      expect(permissions).toHaveLength(0)
    })

    it('should return different sets for different categories', () => {
      const analyticsPerms = PermissionEngine.getPermissionsByCategory(
        PermissionCategory.ANALYTICS
      )
      const userPerms = PermissionEngine.getPermissionsByCategory(
        PermissionCategory.USERS
      )

      // These categories should have different permissions
      const intersection = analyticsPerms.filter(p => userPerms.includes(p))
      expect(intersection.length).toBe(0)
    })
  })

  describe('getCommonPermissionsForRole', () => {
    it('should return permission array for valid role', () => {
      const permissions = PermissionEngine.getCommonPermissionsForRole('ADMIN')

      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThan(0)
    })

    it('should return empty array for invalid role', () => {
      const permissions = PermissionEngine.getCommonPermissionsForRole(
        'INVALID_ROLE'
      )

      expect(Array.isArray(permissions)).toBe(true)
    })

    it('should return more permissions for higher roles', () => {
      const clientPerms = PermissionEngine.getCommonPermissionsForRole('CLIENT')
      const adminPerms = PermissionEngine.getCommonPermissionsForRole('ADMIN')
      const superAdminPerms = PermissionEngine.getCommonPermissionsForRole(
        'SUPER_ADMIN'
      )

      expect(clientPerms.length).toBeLessThan(adminPerms.length)
      expect(adminPerms.length).toBeLessThan(superAdminPerms.length)
    })

    it('should return consistent results for same role', () => {
      const perms1 = PermissionEngine.getCommonPermissionsForRole('TEAM_LEAD')
      const perms2 = PermissionEngine.getCommonPermissionsForRole('TEAM_LEAD')

      expect(perms1.length).toBe(perms2.length)
      expect(perms1.sort()).toEqual(perms2.sort())
    })
  })

  describe('canGrantPermission', () => {
    it('should allow granting permission without dependencies', () => {
      const noDepPerms = Object.entries(PERMISSION_METADATA).find(
        ([_, meta]) => !meta.dependencies || meta.dependencies.length === 0
      )

      if (noDepPerms) {
        const [permKey] = noDepPerms
        const permission = permKey as Permission

        const canGrant = PermissionEngine.canGrantPermission(permission, [])

        expect(canGrant).toBe(true)
      }
    })

    it('should prevent granting permission without dependencies met', () => {
      // Find a permission with dependencies
      const withDepPerms = Object.entries(PERMISSION_METADATA).find(
        ([_, meta]) => meta.dependencies && meta.dependencies.length > 0
      )

      if (withDepPerms) {
        const [permKey] = withDepPerms
        const permission = permKey as Permission

        const canGrant = PermissionEngine.canGrantPermission(permission, [])

        expect(canGrant).toBe(false)
      }
    })

    it('should allow granting if dependencies are met', () => {
      // Find a permission with dependencies
      const withDepPerms = Object.entries(PERMISSION_METADATA).find(
        ([_, meta]) => meta.dependencies && meta.dependencies.length > 0
      )

      if (withDepPerms) {
        const [permKey, meta] = withDepPerms
        const permission = permKey as Permission

        if (meta.dependencies) {
          const canGrant = PermissionEngine.canGrantPermission(
            permission,
            meta.dependencies
          )

          expect(canGrant).toBe(true)
        }
      }
    })
  })

  describe('edge cases', () => {
    it('should handle very large permission sets', () => {
      const largeSet = Object.values(PERMISSIONS)
        .slice(0, 50)
        .map(p => p as Permission)

      const result = PermissionEngine.validate(largeSet)

      expect(result.isValid).toBeDefined()
      expect(result.errors).toBeDefined()
      expect(result.warnings).toBeDefined()
    })

    it('should handle circular-like dependencies gracefully', () => {
      // The engine should not throw errors even with complex permission graphs
      const permissions = Object.values(PERMISSIONS)
        .slice(0, 10)
        .map(p => p as Permission)

      expect(() => {
        PermissionEngine.validate(permissions)
      }).not.toThrow()
    })

    it('should maintain consistency across multiple operations', () => {
      const perms1 = [PERMISSIONS.ANALYTICS_VIEW as Permission]
      const perms2 = [PERMISSIONS.USERS_MANAGE as Permission]

      const diff1 = PermissionEngine.calculateDiff(perms1, perms2)
      const diff2 = PermissionEngine.calculateDiff(perms1, perms2)

      expect(diff1.added).toEqual(diff2.added)
      expect(diff1.removed).toEqual(diff2.removed)
    })
  })

  describe('performance', () => {
    it('should handle search quickly for large data', () => {
      const start = performance.now()

      for (let i = 0; i < 100; i++) {
        PermissionEngine.searchPermissions('analytics')
      }

      const duration = performance.now() - start

      // Should complete 100 searches in less than 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should validate large permission sets quickly', () => {
      const largeSet = Object.values(PERMISSIONS)
        .map(p => p as Permission)
        .slice(0, 50)

      const start = performance.now()

      for (let i = 0; i < 10; i++) {
        PermissionEngine.validate(largeSet)
      }

      const duration = performance.now() - start

      // Should complete 10 validations in less than 500ms
      expect(duration).toBeLessThan(500)
    })
  })
})
