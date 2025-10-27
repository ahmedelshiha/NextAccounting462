/**
 * Menu Customization Modal
 *
 * Main modal component for managing user menu customization.
 * Provides four tabs for different customization workflows:
 * - Sections: Reorder and toggle visibility of menu sections
 * - Your Practice: Manage practice-specific items
 * - Bookmarks: Search and bookmark pages
 * - Your Books: Financial/accounting items (hidden/future)
 */

'use client'

import React, { useState, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useMenuCustomizationStore } from '@/stores/admin/menuCustomization.store'
import { useMenuCustomizationModalStore } from '@/stores/admin/menuCustomizationModal.store'
import { MenuCustomizationTabs } from './MenuCustomizationTabs'
import { SectionsTab } from './tabs/SectionsTab'
import { YourPracticeTab } from './tabs/YourPracticeTab'
import { BookmarksTab } from './tabs/BookmarksTab'
import { useMenuCustomizationFeature } from '@/hooks/useMenuCustomizationFeature'
import { Button } from '@/components/ui/button'

export interface MenuCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Main menu customization modal component
 */
export function MenuCustomizationModal({ isOpen, onClose }: MenuCustomizationModalProps) {
  // All hooks must be called unconditionally at the top level
  const { isEnabledForCurrentUser } = useMenuCustomizationFeature()

  const [selectedTab, setSelectedTab] = useState<'sections' | 'practice' | 'bookmarks' | 'books'>(
    'sections'
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Global store (source of truth)
  const { customization, isLoading, applyCustomization, resetCustomization } = useMenuCustomizationStore()

  // Modal store (draft state)
  const {
    draftCustomization,
    isDirty,
    initializeDraft,
    clearDraft,
    reset: resetDraft,
  } = useMenuCustomizationModalStore()

  // Initialize draft when modal opens
  React.useEffect(() => {
    if (isOpen && customization) {
      initializeDraft(customization)
      setSaveError(null)
    }
  }, [isOpen, customization, initializeDraft])

  /**
   * Handle save - persist changes to server and update global store
   */
  const handleSave = useCallback(async () => {
    if (!draftCustomization) return

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await applyCustomization(draftCustomization)
      setSaveSuccess(true)
      clearDraft()

      // Show success message briefly before closing
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save menu customization. Please try again.'
      setSaveError(message)
      setIsSaving(false)
    }
  }, [draftCustomization, applyCustomization, clearDraft, onClose])

  /**
   * Handle cancel - discard changes
   */
  const handleCancel = useCallback(() => {
    clearDraft()
    setSaveError(null)
    onClose()
  }, [clearDraft, onClose])

  /**
   * Handle reset to defaults
   */
  const handleReset = useCallback(async () => {
    if (!confirm('Are you sure you want to reset to default menu configuration? This cannot be undone.')) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await resetCustomization()
      clearDraft()
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset customization'
      setSaveError(message)
      setIsSaving(false)
    }
  }, [resetCustomization, clearDraft, onClose])

  // Check feature flag and modal visibility - these are safe after all hooks
  // If the feature is not enabled for the current user, or the modal is not open, return null.
  // The isEnabledForCurrentUser check is crucial here.
  if (!isEnabledForCurrentUser || !isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-labelledby="menu-modal-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 id="menu-modal-title" className="text-xl font-bold text-gray-900">
                Customize Menu
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Reorder, hide, and organize your admin menu to fit your workflow
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close menu customization"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <MenuCustomizationTabs selectedTab={selectedTab} onTabChange={setSelectedTab} />

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              /* Loading Skeleton */
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ) : draftCustomization ? (
              <div className="h-full">
                {selectedTab === 'sections' && (
                  <SectionsTab draftCustomization={draftCustomization} />
                )}

                {selectedTab === 'practice' && (
                  <YourPracticeTab draftCustomization={draftCustomization} />
                )}

                {selectedTab === 'bookmarks' && (
                  <BookmarksTab draftCustomization={draftCustomization} />
                )}

                {selectedTab === 'books' && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-gray-500 text-sm">
                      Your Books feature coming soon
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Error State */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-red-600 text-sm font-medium">
                  Failed to load customization
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Please try refreshing the page
                </p>
              </div>
            )}

            {/* Error message from save */}
            {saveError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4 animate-in">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="font-medium">Error saving changes</p>
                    <p className="text-red-600 text-xs mt-1">{saveError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success message */}
            {saveSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 animate-in">
                <div className="flex items-center gap-3">
                  <span className="text-lg">✓</span>
                  <p className="font-medium">Menu customization saved successfully!</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 gap-3">
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reset to Defaults
            </button>

            <div className="flex gap-3 ml-auto">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
