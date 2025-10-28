'use client'

import React, { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  ChevronRight,
  Search,
  AlertCircle,
  Info,
  ZapOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  PermissionEngine,
  ValidationResult,
} from '@/lib/permission-engine'
import {
  Permission,
  PERMISSIONS,
  PERMISSION_METADATA,
  PermissionCategory,
  RiskLevel,
} from '@/lib/permissions'

/**
 * Props for PermissionTreeView component
 */
interface PermissionTreeViewProps {
  selectedPermissions: Permission[]
  onPermissionChange: (permissions: Permission[]) => void
  validation?: ValidationResult
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

/**
 * PermissionTreeView Component
 * 
 * Hierarchical permission selection with:
 * - Collapsible category groups
 * - Search and filtering
 * - Bulk selection per category
 * - Dependency and conflict indicators
 * - Risk level badges
 */
export function PermissionTreeView({
  selectedPermissions,
  onPermissionChange,
  validation,
  searchQuery = '',
  onSearchChange,
}: PermissionTreeViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.values(PermissionCategory))
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, Permission[]> = {}

    Object.values(PERMISSIONS).forEach(permission => {
      const meta = PERMISSION_METADATA[permission]
      const category = meta.category
      
      // Apply search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches = 
          meta.label.toLowerCase().includes(q) ||
          meta.description.toLowerCase().includes(q) ||
          permission.toLowerCase().includes(q) ||
          meta.tags?.some(tag => tag.toLowerCase().includes(q))
        
        if (!matches) return
      }

      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(permission)
    })

    return grouped
  }, [searchQuery])

  /**
   * Toggle category expansion
   */
  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories)
    if (newSet.has(category)) {
      newSet.delete(category)
    } else {
      newSet.add(category)
    }
    setExpandedCategories(newSet)
  }

  /**
   * Handle permission toggle
   */
  const handlePermissionToggle = (permission: Permission, checked: boolean) => {
    if (checked) {
      onPermissionChange([...new Set([...selectedPermissions, permission])])
    } else {
      onPermissionChange(selectedPermissions.filter(p => p !== permission))
    }
  }

  /**
   * Handle category select all/none
   */
  const handleCategoryToggle = (permissions: Permission[]) => {
    const allSelected = permissions.every(p => selectedPermissions.includes(p))
    
    if (allSelected) {
      const newPerms = selectedPermissions.filter(p => !permissions.includes(p))
      onPermissionChange(newPerms)
    } else {
      const newPerms = [...new Set([...selectedPermissions, ...permissions])]
      onPermissionChange(newPerms)
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} Info
        </Button>
      </div>

      {/* Permission Categories */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {Object.entries(groupedPermissions).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ZapOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              No permissions found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          Object.entries(groupedPermissions).map(([category, permissions]) => (
            <PermissionCategory
              key={category}
              category={category as PermissionCategory}
              permissions={permissions}
              selectedPermissions={selectedPermissions}
              isExpanded={expandedCategories.has(category)}
              onToggleExpand={() => toggleCategory(category)}
              onToggleAll={() => handleCategoryToggle(permissions)}
              onPermissionToggle={handlePermissionToggle}
              showAdvanced={showAdvanced}
              validation={validation}
            />
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Permission Category Component
 */
interface PermissionCategoryProps {
  category: PermissionCategory
  permissions: Permission[]
  selectedPermissions: Permission[]
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleAll: () => void
  onPermissionToggle: (permission: Permission, checked: boolean) => void
  showAdvanced: boolean
  validation?: ValidationResult
}

function PermissionCategory({
  category,
  permissions,
  selectedPermissions,
  isExpanded,
  onToggleExpand,
  onToggleAll,
  onPermissionToggle,
  showAdvanced,
  validation,
}: PermissionCategoryProps) {
  const selectedCount = permissions.filter(p => selectedPermissions.includes(p)).length
  const allSelected = selectedCount === permissions.length
  const someSelected = selectedCount > 0 && !allSelected

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Category Header */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
          <span className="font-medium text-sm text-gray-900">{category}</span>
          <Badge variant="secondary" className="text-xs">
            {selectedCount}/{permissions.length}
          </Badge>
        </div>

        {/* Select All Checkbox */}
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={onToggleAll}
          onClick={(e) => e.stopPropagation()}
        />
      </button>

      {/* Permissions List */}
      {isExpanded && (
        <div className="border-t p-2 space-y-1 bg-gray-50">
          {permissions.map(permission => (
            <PermissionItem
              key={permission}
              permission={permission}
              selected={selectedPermissions.includes(permission)}
              onToggle={(checked) => onPermissionToggle(permission, checked)}
              showAdvanced={showAdvanced}
              validation={validation}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Individual Permission Item Component
 */
interface PermissionItemProps {
  permission: Permission
  selected: boolean
  onToggle: (checked: boolean) => void
  showAdvanced: boolean
  validation?: ValidationResult
}

function PermissionItem({
  permission,
  selected,
  onToggle,
  showAdvanced,
  validation,
}: PermissionItemProps) {
  const [showDetails, setShowDetails] = useState(false)
  const meta = PERMISSION_METADATA[permission]

  // Check for validation errors/warnings for this permission
  const hasError = validation?.errors.some(e => e.permission === permission)
  const warning = validation?.warnings.find(w => w.permission === permission)

  const riskColor = {
    [RiskLevel.LOW]: 'text-green-600',
    [RiskLevel.MEDIUM]: 'text-yellow-600',
    [RiskLevel.HIGH]: 'text-orange-600',
    [RiskLevel.CRITICAL]: 'text-red-600',
  }

  return (
    <div className="group">
      <div className={cn(
        'flex items-start gap-3 p-3 rounded-md transition-colors',
        selected 
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-white border border-transparent'
      )}>
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          id={permission}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <label
            htmlFor={permission}
            className="font-medium text-sm cursor-pointer text-gray-900 block"
          >
            {meta.label}
          </label>
          <p className="text-xs text-gray-600 mt-0.5">
            {meta.description}
          </p>

          {/* Dependencies */}
          {meta.dependencies && meta.dependencies.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-700">
                Requires: {meta.dependencies.map(d => 
                  PERMISSION_METADATA[d].label
                ).join(', ')}
              </span>
            </div>
          )}

          {/* Error Badge */}
          {hasError && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-700">
                Validation error
              </span>
            </div>
          )}

          {/* Warning Badge */}
          {warning && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-700">
                {warning.message}
              </span>
            </div>
          )}
        </div>

        {/* Risk Badge */}
        <Badge variant="outline" className={cn('text-xs flex-shrink-0', riskColor[meta.risk])}>
          {meta.risk}
        </Badge>

        {/* Details Button */}
        {showAdvanced && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Info className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Details Panel */}
      {showDetails && showAdvanced && (
        <div className="ml-10 p-3 bg-blue-50 rounded-md text-sm border border-blue-200 mt-1 space-y-2">
          <div>
            <dt className="text-xs font-medium text-gray-600">Permission Key:</dt>
            <dd className="text-xs font-mono text-gray-900">{permission}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-600">Category:</dt>
            <dd className="text-xs text-gray-900">{meta.category}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-600">Risk Level:</dt>
            <dd className={cn('text-xs font-medium', riskColor[meta.risk])}>
              {meta.risk}
            </dd>
          </div>

          {meta.tags && meta.tags.length > 0 && (
            <div>
              <dt className="text-xs font-medium text-gray-600 mb-1">Tags:</dt>
              <dd className="flex flex-wrap gap-1">
                {meta.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </dd>
            </div>
          )}

          {meta.dependencies && meta.dependencies.length > 0 && (
            <div>
              <dt className="text-xs font-medium text-gray-600">Dependencies:</dt>
              <dd className="text-xs text-gray-900">
                {meta.dependencies.map(d => PERMISSION_METADATA[d].label).join(', ')}
              </dd>
            </div>
          )}

          {meta.conflicts && meta.conflicts.length > 0 && (
            <div>
              <dt className="text-xs font-medium text-gray-600">Conflicts:</dt>
              <dd className="text-xs text-gray-900">
                {meta.conflicts.map(c => PERMISSION_METADATA[c].label).join(', ')}
              </dd>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
