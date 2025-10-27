/**
 * Sections Tab Component
 *
 * Allows users to:
 * - Reorder menu sections
 * - Toggle visibility of items within sections
 * - Preview section customization
 */

'use client'

import React from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { MenuCustomizationData, MenuSection, MenuItem } from '@/types/admin/menuCustomization'
import { useMenuCustomizationModalStore } from '@/stores/admin/menuCustomizationModal.store'
import { DEFAULT_MENU_SECTIONS } from '@/lib/menu/defaultMenu'

export interface SectionsTabProps {
  draftCustomization: MenuCustomizationData
}

/**
 * Sections tab component for managing section order and item visibility
 */
export function SectionsTab({ draftCustomization }: SectionsTabProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['dashboard', 'business'])
  )

  const {
    setSectionOrder,
    addHiddenItem,
    removeHiddenItem,
  } = useMenuCustomizationModalStore()

  // Get sections in custom order
  const sectionsInOrder = React.useMemo(() => {
    const orderMap = new Map(
      draftCustomization.sectionOrder.map((id, index) => [id, index])
    )

    return [...DEFAULT_MENU_SECTIONS].sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? Infinity
      const orderB = orderMap.get(b.id) ?? Infinity
      return orderA - orderB
    })
  }, [draftCustomization.sectionOrder])

  const toggleSectionExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleMoveSection = (fromIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...draftCustomization.sectionOrder]
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1

    if (toIndex < 0 || toIndex >= newOrder.length) return

    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]]
    setSectionOrder(newOrder)
  }

  const toggleItemVisibility = (itemPath: string) => {
    const isHidden = draftCustomization.hiddenItems.includes(itemPath)
    if (isHidden) {
      removeHiddenItem(itemPath)
    } else {
      addHiddenItem(itemPath)
    }
  }

  return (
    <div className="space-y-4">
      {sectionsInOrder.map((section, index) => {
        const isExpanded = expandedSections.has(section.id)
        const visibleItems = section.items.filter(
          (item) => !draftCustomization.hiddenItems.includes(item.href || '')
        )
        const hiddenCount = section.items.length - visibleItems.length

        return (
          <div
            key={section.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSectionExpanded(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="font-medium text-gray-900">{section.name}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {visibleItems.length} visible
                </span>
                {hiddenCount > 0 && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    {hiddenCount} hidden
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Move buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveSection(index, 'up')
                    }}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move section up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveSection(index, 'down')
                    }}
                    disabled={index === sectionsInOrder.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move section down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Expand/collapse */}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </button>

            {/* Section Items */}
            {isExpanded && (
              <div className="divide-y divide-gray-200 bg-white">
                {section.items.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No items in this section
                  </div>
                ) : (
                  section.items.map((item) => {
                    const isHidden = draftCustomization.hiddenItems.includes(
                      item.href || ''
                    )

                    return (
                      <div
                        key={item.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {item.icon && (
                            <div className="text-gray-500 flex-shrink-0">
                              {item.icon}
                            </div>
                          )}
                          <span
                            className={`text-sm ${isHidden ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                          >
                            {item.name}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleItemVisibility(item.href || '')}
                          className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
                          title={isHidden ? 'Show item' : 'Hide item'}
                        >
                          {isHidden ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>Use the up/down arrows to reorder sections, and click the eye icon to hide/show items within each section.</p>
      </div>
    </div>
  )
}
