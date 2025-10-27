/**
 * Bookmarks Tab Component
 *
 * Allows users to:
 * - Search for pages to bookmark
 * - Manage bookmarked items
 * - Reorder bookmarks
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { MenuCustomizationData, Bookmark } from '@/types/admin/menuCustomization'
import { useMenuCustomizationModalStore } from '@/stores/admin/menuCustomizationModal.store'
import { getBookmarkableItems } from '@/lib/menu/menuMapping'
import Fuse from 'fuse.js'

export interface BookmarksTabProps {
  draftCustomization: MenuCustomizationData
}

/**
 * Bookmarks tab component for managing bookmarked pages
 */
export function BookmarksTab({ draftCustomization }: BookmarksTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const bookmarkableItems = getBookmarkableItems()

  const {
    addBookmark,
    setBookmarks,
    removeBookmark,
  } = useMenuCustomizationModalStore()

  // Search functionality using Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(bookmarkableItems, {
        keys: ['name'],
        threshold: 0.3,
        minMatchCharLength: 2,
      }),
    [bookmarkableItems]
  )

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return bookmarkableItems
    }

    return fuse.search(searchQuery).map((result) => result.item)
  }, [searchQuery, fuse, bookmarkableItems])

  const filteredResults = useMemo(
    () =>
      searchResults.filter(
        (item) =>
          !draftCustomization.bookmarks.some((b) => b.id === item.id)
      ),
    [searchResults, draftCustomization.bookmarks]
  )

  const bookmarksInOrder = useMemo(
    () => [...draftCustomization.bookmarks].sort((a, b) => a.order - b.order),
    [draftCustomization.bookmarks]
  )

  const handleAddBookmark = (item: any) => {
    const bookmark: Bookmark = {
      id: item.id,
      name: item.name,
      href: item.href || '',
      icon: item.icon || 'Bookmark',
      order: draftCustomization.bookmarks.length,
    }
    addBookmark(bookmark)
    setSearchQuery('')
  }

  const handleMoveBookmark = (fromIndex: number, direction: 'up' | 'down') => {
    const newBookmarks = [...bookmarksInOrder]
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1

    if (toIndex < 0 || toIndex >= newBookmarks.length) return

    [newBookmarks[fromIndex], newBookmarks[toIndex]] = [
      newBookmarks[toIndex],
      newBookmarks[fromIndex],
    ]
    setBookmarks(newBookmarks)
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search pages to bookmark..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Available Items */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-sm text-gray-900">
              Available Pages ({filteredResults.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 bg-white max-h-96 overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                {searchQuery ? 'No matching pages found' : 'All pages are bookmarked'}
              </div>
            ) : (
              filteredResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddBookmark(item)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 group"
                >
                  <span className="text-lg flex-shrink-0">
                    {item.icon || '📄'}
                  </span>
                  <span className="text-sm text-gray-900 group-hover:text-blue-600 flex-1 truncate">
                    {item.name}
                  </span>
                  <span className="text-blue-600 opacity-0 group-hover:opacity-100 text-sm font-medium">
                    +
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Bookmarked Items */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-sm text-gray-900">
              My Bookmarks ({bookmarksInOrder.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 bg-white max-h-96 overflow-y-auto">
            {bookmarksInOrder.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No bookmarks yet. Add one from the left.
              </div>
            ) : (
              bookmarksInOrder.map((bookmark, index) => (
                <div
                  key={bookmark.id}
                  className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">
                      {bookmark.icon || '🔖'}
                    </span>
                    <span className="text-sm text-gray-900 truncate">
                      {bookmark.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleMoveBookmark(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMoveBookmark(index, 'down')}
                      disabled={index === bookmarksInOrder.length - 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className="p-1 rounded hover:bg-red-50 transition-colors text-gray-600 hover:text-red-600"
                      title="Remove bookmark"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>Click on available pages to add them to your bookmarks. Use the arrow buttons to reorder, or trash icon to remove.</p>
      </div>
    </div>
  )
}
