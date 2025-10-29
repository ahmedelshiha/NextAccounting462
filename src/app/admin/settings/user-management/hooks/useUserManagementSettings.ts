'use client'

import { useState, useCallback, useEffect } from 'react'
import { UserManagementSettings } from '../types'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

interface UseUserManagementSettingsReturn {
  settings: UserManagementSettings | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<UserManagementSettings>) => Promise<void>
  saveSettings: (field: keyof UserManagementSettings, value: unknown) => Promise<void>
}

export function useUserManagementSettings(): UseUserManagementSettingsReturn {
  const [settings, setSettings] = useState<UserManagementSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiFetch(
        '/api/admin/settings/user-management',
        { method: 'GET' }
      )
      if (response.ok) {
        const data = await response.json() as UserManagementSettings
        setSettings(data)
      } else {
        throw new Error(`Failed to load settings: ${response.statusText}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load settings'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (updates: Partial<UserManagementSettings>) => {
    try {
      setIsSaving(true)
      setError(null)
      const response = await apiFetch(
        '/api/admin/settings/user-management',
        {
          method: 'PUT',
          body: JSON.stringify(updates)
        }
      )
      if (response.ok) {
        const data = await response.json() as UserManagementSettings
        setSettings(data)
        toast.success('Settings updated successfully')
      } else {
        throw new Error(`Failed to update settings: ${response.statusText}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update settings'
      setError(errorMsg)
      toast.error(errorMsg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [])

  const saveSettings = useCallback(
    async (field: keyof UserManagementSettings, value: unknown) => {
      if (!settings) return
      await updateSettings({ ...settings, [field]: value })
    },
    [settings, updateSettings]
  )

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    isLoading,
    isSaving,
    error,
    fetchSettings,
    updateSettings,
    saveSettings
  }
}
