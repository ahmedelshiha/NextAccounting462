/**
 * Menu Customization Feature Flag
 *
 * Controls rollout of the menu customization feature.
 * Can be enabled/disabled via environment variables or feature flag service.
 */

/**
 * Check if menu customization feature is enabled
 *
 * Checks in order:
 * 1. Environment variable: NEXT_PUBLIC_MENU_CUSTOMIZATION_ENABLED
 * 2. Default: false (disabled by default for safe rollout)
 *
 * Can be extended to support:
 * - User-level feature flags
 * - Tenant-level rollout percentages
 * - Gradual rollout via feature flag service
 */
export const isMenuCustomizationEnabled = (): boolean => {
  // Check environment variable first
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MENU_CUSTOMIZATION_ENABLED) {
    return process.env.NEXT_PUBLIC_MENU_CUSTOMIZATION_ENABLED === 'true'
  }

  // Client-side check
  if (typeof window !== 'undefined') {
    const envEnabled = (window as any).__ENV__?.NEXT_PUBLIC_MENU_CUSTOMIZATION_ENABLED
    if (envEnabled !== undefined) {
      return envEnabled === 'true'
    }
  }

  // Default: disabled
  return false
}

/**
 * Check if menu customization is enabled for a specific user
 *
 * Can be extended to implement:
 * - User role-based enablement
 * - Gradual rollout based on user ID
 * - Beta tester lists
 *
 * @param userId - The user ID to check
 * @returns true if enabled for this user
 */
export const isMenuCustomizationEnabledForUser = (userId: string): boolean => {
  // Base check: is the feature enabled globally?
  if (!isMenuCustomizationEnabled()) {
    return false
  }

  // TODO: Add user-specific logic here:
  // - Check user role
  // - Check beta tester list
  // - Implement gradual rollout percentage

  return true
}

/**
 * Get feature flag configuration for menu customization
 *
 * Returns metadata about the feature flag status
 */
export const getMenuCustomizationFeatureFlagConfig = () => {
  return {
    enabled: isMenuCustomizationEnabled(),
    rolloutPercentage: 100, // TODO: Make configurable
    targetUsers: 'all', // TODO: Support 'beta', 'admins', etc.
    description: 'User menu customization feature for admin dashboard',
  }
}
