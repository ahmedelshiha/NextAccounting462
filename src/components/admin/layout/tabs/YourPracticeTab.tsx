/**
 * Your Practice Tab Component
 *
 * Manages practice-specific menu items with:
 * - Reordering via buttons
 * - Visibility toggles
 * - Item management
 */

'use client'

import React from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, Trash2 } from 'lucide-react'
import { MenuCustomizationData, PracticeItem } from '@/types/admin/menuCustomization'
import { useMenuCustomizationModalStore } from '@/stores/admin/menuCustomizationModal.store'
import { getPracticeItems } from '@/lib/menu/menuMapping'

export interface YourPracticeTabProps {
  draftCustomization: MenuCustomizationData
}

/**
 * Your Practice tab component for managing practice-specific items
 */
export function YourPracticeTab({ draftCustomization }: YourPracticeTabProps) {
  const practiceItems = getPracticeItems()

  const {
    setPracticeItems,
    togglePracticeItemVisibility,
    removePracticeItem,
  } = useMenuCustomizationModalStore()

  // Get practice items in custom order
  const itemsInOrder = React.useMemo(() => {
    const customItems = draftCustomization.practiceItems

    if (customItems && customItems.length > 0) {
      return [...customItems].sort((a, b) => a.order - b.order)
    }

    return practiceItems
  }, [draftCustomization.practiceItems, practiceItems])

  const handleMoveItem = (fromIndex: number, direction: 'up' | 'down') => {
    const newItems = [...itemsInOrder]
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1

    if (toIndex < 0 || toIndex >= newItems.length) return

    [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]]
    setPracticeItems(newItems)
  }

  if (itemsInOrder.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500 text-sm">
          No practice items available to customize
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="divide-y divide-gray-200">
          {itemsInOrder.map((item, index) => {
            const isVisible = item.visible !== false

            return (
              <div
                key={item.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                    {item.icon ? (
                      <span className="text-lg">{item.icon}</span>
                    ) : (
                      <span>⚙️</span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${isVisible ? 'text-gray-900' : 'text-gray-400 line-through'}`}
                  >
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Move buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move item up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === itemsInOrder.length - 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move item down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => togglePracticeItemVisibility(item.id)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
                    title={isVisible ? 'Hide item' : 'Show item'}
                  >
                    {isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={() => removePracticeItem(item.id)}
                    className="p-1 rounded hover:bg-red-50 transition-colors text-gray-600 hover:text-red-600"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>Use the up/down arrows to reorder items, eye icon to toggle visibility, and trash icon to remove items from your practice menu.</p>
      </div>
    </div>
  )
}
