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
 * Implements:
 * - User role-based enablement
 * - Gradual rollout based on user ID hash
 * - Beta tester lists
 *
 * @param userId - The user ID to check
 * @param userRole - The user's role (optional, for role-based targeting)
 * @returns true if enabled for this user
 */
export const isMenuCustomizationEnabledForUser = (userId: string, userRole?: string): boolean => {
  // Base check: is the feature enabled globally?
  if (!isMenuCustomizationEnabled()) {
    return false
  }

  // Get the feature flag configuration
  const config = getMenuCustomizationFeatureFlagConfig()

  // Role-based targeting: only enable for specific roles if configured
  if (config.targetUsers !== 'all' && userRole) {
    const targetRoles = Array.isArray(config.targetUsers) ? config.targetUsers : [config.targetUsers]
    if (!targetRoles.includes(userRole)) {
      return false
    }
  }

  // Gradual rollout: hash the user ID to determine if they should get the feature
  // This ensures consistent rollout (same user always gets same result) while distributing load
  if (config.rolloutPercentage < 100) {
    const hash = hashUserId(userId)
    const percentageThreshold = (config.rolloutPercentage / 100) * 100
    if (hash % 100 >= percentageThreshold) {
      return false
    }
  }

  // Beta tester list: check if user is in the beta list (stored in environment or config)
  if (config.betaTesters && config.betaTesters.length > 0) {
    return config.betaTesters.includes(userId)
  }

  return true
}

/**
 * Simple hash function for consistent user ID distribution
 * @param userId - The user ID to hash
 * @returns A number between 0 and 99
 */
function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) % 100
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
