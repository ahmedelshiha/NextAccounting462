/**
 * Menu Customization Feature Hook
 *
 * Hook to check if menu customization feature is enabled
 * for the current user/session
 */

import { useSession } from 'next-auth/react'
import {
  isMenuCustomizationEnabled,
  isMenuCustomizationEnabledForUser,
} from '@/lib/menu/featureFlag'

export const useMenuCustomizationFeature = () => {
  const { data: session } = useSession()

  const isEnabled = isMenuCustomizationEnabled()
  const userId = (session?.user as any)?.id

  const isEnabledForCurrentUser = userId
    ? isMenuCustomizationEnabledForUser(userId)
    : false

  return {
    isEnabled,
    isEnabledForCurrentUser,
    userId,
  }
}
