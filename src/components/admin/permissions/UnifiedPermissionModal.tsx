'use client'

import React, { useState, useMemo, useCallback, useEffect, memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PermissionEngine,
  PermissionDiff,
  ValidationResult,
  PermissionSuggestion,
} from '@/lib/permission-engine'
import {
  Permission,
  PERMISSIONS,
  PERMISSION_METADATA,
  RiskLevel,
} from '@/lib/permissions'
import {
  X,
  Check,
  AlertCircle,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  FileText,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import PermissionTemplatesTab, { PermissionTemplate } from './PermissionTemplatesTab'
import SmartSuggestionsPanel from './SmartSuggestionsPanel'
import ImpactPreviewPanel from './ImpactPreviewPanel'

/**
 * Props for the UnifiedPermissionModal component
 */
export interface UnifiedPermissionModalProps {
  mode: 'user' | 'role' | 'bulk-users'
  targetId: string | string[]
  currentRole?: string
  currentPermissions?: Permission[]
  onSave: (changes: PermissionChangeSet) => Promise<void>
  onClose: () => void
  showTemplates?: boolean
  showHistory?: boolean
  allowCustomPermissions?: boolean
  targetName?: string
  targetEmail?: string
}

/**
 * Represents a complete set of permission changes
 */
export interface PermissionChangeSet {
  targetIds: string[]
  roleChange?: {
    from: string
    to: string
  }
  permissionChanges?: {
    added: Permission[]
    removed: Permission[]
  }
  reason?: string
}

type TabType = 'role' | 'custom' | 'templates' | 'history'

/**
 * Unified Permission Modal Component
 * 
 * Responsive modal for managing user roles and permissions with:
 * - Mobile-friendly bottom sheet on small screens
 * - Desktop dialog on larger screens
 * - Performance optimizations (debounced search, memoization)
 * - Real-time impact preview
 * - Smart suggestions and validation
 */
export default function UnifiedPermissionModal({
  mode,
  targetId,
  currentRole,
  currentPermissions = [],
  onSave,
  onClose,
  showTemplates = true,
  showHistory = true,
  allowCustomPermissions = true,
  targetName,
  targetEmail,
}: UnifiedPermissionModalProps) {
  // Responsive behavior: use sheet on mobile, dialog on desktop
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  const [activeTab, setActiveTab] = useState<TabType>('role')
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(currentPermissions)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [changeHistory, setChangeHistory] = useState<PermissionChangeSet[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Calculate changes in real-time
  const changes = useMemo(() => {
    return PermissionEngine.calculateDiff(currentPermissions, selectedPermissions)
  }, [currentPermissions, selectedPermissions])

  // Validate changes
  const validation = useMemo(() => {
    return PermissionEngine.validate(selectedPermissions)
  }, [selectedPermissions])

  // Get smart suggestions
  const suggestions = useMemo(() => {
    return PermissionEngine.getSuggestions(selectedRole || currentRole || 'CLIENT', selectedPermissions)
  }, [selectedRole, currentRole, selectedPermissions])

  // Count of pending changes
  const changeCount = changes.added.length + changes.removed.length

  /**
   * Handle role selection with automatic permission update
   */
  const handleRoleChange = useCallback((newRole: string) => {
    setSelectedRole(newRole)
    const rolePermissions = PermissionEngine.getCommonPermissionsForRole(newRole)
    setSelectedPermissions(rolePermissions)
    
    // Add to history
    setChangeHistory(prev => [...prev, {
      targetIds: Array.isArray(targetId) ? targetId : [targetId],
      roleChange: {
        from: currentRole || 'CLIENT',
        to: newRole,
      },
    }])
  }, [targetId, currentRole])

  /**
   * Handle permission toggle
   */
  const handlePermissionToggle = useCallback((permission: Permission, checked: boolean) => {
    if (checked) {
      if (!PermissionEngine.canGrantPermission(permission, selectedPermissions)) {
        setSaveError(`Cannot grant ${PERMISSION_METADATA[permission]?.label}: dependencies not met`)
        return
      }
      setSelectedPermissions(prev => [...new Set([...prev, permission])])
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission))
    }
    
    setSaveError(null)
  }, [selectedPermissions])

  /**
   * Apply a suggestion
   */
  const applySuggestion = useCallback((suggestion: PermissionSuggestion) => {
    if (suggestion.action === 'add') {
      handlePermissionToggle(suggestion.permission, true)
    } else {
      handlePermissionToggle(suggestion.permission, false)
    }
  }, [handlePermissionToggle])

  /**
   * Apply all suggestions
   */
  const applyAllSuggestions = useCallback(() => {
    suggestions.forEach(applySuggestion)
  }, [suggestions, applySuggestion])

  /**
   * Undo last change
   */
  const handleUndo = useCallback(() => {
    if (changeHistory.length > 0) {
      const previousState = changeHistory[changeHistory.length - 2]
      if (previousState) {
        setSelectedRole(previousState.roleChange?.to || currentRole)
        setSelectedPermissions(previousState.permissionChanges?.added || currentPermissions)
      }
      setChangeHistory(prev => prev.slice(0, -1))
    }
  }, [changeHistory, currentRole, currentPermissions])

  /**
   * Reset to original state
   */
  const handleReset = useCallback(() => {
    setSelectedRole(currentRole)
    setSelectedPermissions(currentPermissions)
    setChangeHistory([])
    setSaveError(null)
  }, [currentRole, currentPermissions])

  /**
   * Handle save
   */
  const handleSave = useCallback(async () => {
    if (!validation.isValid) {
      setSaveError('Please resolve validation errors before saving')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const changeSet: PermissionChangeSet = {
        targetIds: Array.isArray(targetId) ? targetId : [targetId],
        roleChange: selectedRole !== currentRole 
          ? { from: currentRole!, to: selectedRole! }
          : undefined,
        permissionChanges: changeCount > 0
          ? {
              added: changes.added,
              removed: changes.removed,
            }
          : undefined,
      }

      await onSave(changeSet)
      onClose()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save permissions')
    } finally {
      setIsSaving(false)
    }
  }, [validation.isValid, targetId, selectedRole, currentRole, changeCount, changes.added, changes.removed, onSave, onClose])

  // Get display name
  const displayName = targetName || (Array.isArray(targetId) ? `${targetId.length} users` : targetId)

  // Modal content shared between Dialog and Sheet
  const headerContent = (
    <>
      <h2 className={cn(
        'font-semibold',
        isMobile ? 'text-lg' : 'text-xl'
      )}>
        {mode === 'bulk-users' 
          ? `Manage Permissions for ${displayName}`
          : `Manage Permissions: ${displayName}`
        }
      </h2>
      {targetEmail && (
        <p className="text-xs text-gray-600 mt-1">
          {targetEmail} • {currentRole || 'UNASSIGNED'}
        </p>
      )}
    </>
  )

  const tabsContent = (
    <Tabs 
      value={activeTab} 
      onValueChange={(value) => setActiveTab(value as TabType)}
      className={cn(
        'flex-1 overflow-hidden flex flex-col',
        isMobile && 'max-h-[calc(100vh-280px)]'
      )}
    >
      <TabsList className={cn(
        'grid rounded-none border-b h-auto bg-gray-50',
        isMobile ? 'grid-cols-2 px-3' : 'grid-cols-4 px-6',
        'w-full'
      )}>
        <TabsTrigger value="role" className="relative text-xs md:text-sm">
          Role
          {selectedRole !== currentRole && (
            <Badge className="ml-1 md:ml-2 h-4 md:h-5 rounded px-1 text-xs" variant="secondary">
              {changeCount}
            </Badge>
          )}
        </TabsTrigger>
        {allowCustomPermissions && (
          <TabsTrigger value="custom" className="relative text-xs md:text-sm">
            Perms
            {changeCount > 0 && selectedRole === currentRole && (
              <Badge className="ml-1 md:ml-2 h-4 md:h-5 rounded px-1 text-xs" variant="secondary">
                {changeCount}
              </Badge>
            )}
          </TabsTrigger>
        )}
        {!isMobile && showTemplates && (
          <TabsTrigger value="templates" className="text-xs md:text-sm">Templates</TabsTrigger>
        )}
        {!isMobile && showHistory && (
          <TabsTrigger value="history" className="text-xs md:text-sm">History</TabsTrigger>
        )}
      </TabsList>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <TabsContent value="role" className="h-full p-0 data-[state=inactive]:hidden">
          <RoleSelectionContent
            selectedRole={selectedRole}
            currentRole={currentRole}
            onSelectRole={handleRoleChange}
            changes={changes}
            isMobile={isMobile}
          />
        </TabsContent>

        {allowCustomPermissions && (
          <TabsContent value="custom" className="h-full p-0 data-[state=inactive]:hidden">
            <CustomPermissionsContent
              selectedPermissions={selectedPermissions}
              onPermissionToggle={handlePermissionToggle}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              validation={validation}
              showAdvanced={showAdvanced}
              onToggleAdvanced={setShowAdvanced}
              isMobile={isMobile}
            />
          </TabsContent>
        )}

        {showTemplates && (
          <TabsContent value="templates" className="h-full p-0 data-[state=inactive]:hidden">
            <TemplatesContent />
          </TabsContent>
        )}

        {showHistory && (
          <TabsContent value="history" className="h-full p-0 data-[state=inactive]:hidden">
            <HistoryContent />
          </TabsContent>
        )}
      </div>
    </Tabs>
  )

  const footerContent = (
    <div className={cn(
      'border-t space-y-3 md:space-y-4 bg-gray-50',
      isMobile ? 'p-3 md:p-4' : 'p-6'
    )}>
      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="p-2 md:p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 text-xs md:text-sm">Validation Errors</h4>
              <ul className="mt-1 space-y-0.5">
                {validation.errors.slice(0, 2).map((error, i) => (
                  <li key={i} className="text-xs md:text-sm text-red-800">
                    {error.message}
                  </li>
                ))}
                {validation.errors.length > 2 && (
                  <li className="text-xs text-red-700">
                    and {validation.errors.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {!isMobile && validation.warnings.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 text-sm">Warnings</h4>
              <ul className="mt-1 space-y-1">
                {validation.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-amber-800">
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {saveError && (
        <div className="p-2 md:p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs md:text-sm text-red-800">{saveError}</p>
        </div>
      )}

      {/* Change Summary */}
      {changeCount > 0 && (
        <div className="p-2 md:p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs md:text-sm font-medium text-blue-900">
            {changeCount} permission{changeCount === 1 ? '' : 's'} will be changed
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className={cn(
        'flex gap-2 pt-2',
        isMobile ? 'flex-col-reverse' : 'items-center justify-between'
      )}>
        {!isMobile && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={changeCount === 0 || isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={changeHistory.length === 0 || isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-1 transform scale-x-[-1]" />
              Undo
            </Button>
          </div>
        )}

        <div className={cn(
          'flex gap-2',
          isMobile ? 'w-full' : ''
        )}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className={isMobile ? 'flex-1' : ''}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={!validation.isValid || changeCount === 0 || isSaving}
            className={cn(
              'gap-2',
              isMobile ? 'flex-1' : ''
            )}
          >
            <Save className="h-4 w-4" />
            {isMobile ? 'Save' : isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )

  // Render based on screen size
  if (isMobile) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent className="h-[90vh] p-0 flex flex-col">
          <SheetHeader className="border-b px-4 py-3">
            {headerContent}
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            {tabsContent}
          </div>
          {footerContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-white flex flex-col">
        <DialogHeader className="border-b px-6 py-4">
          {headerContent}
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {tabsContent}
        </div>
        {footerContent}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Role Selection Tab Content
 */
const RoleSelectionContent = memo(function RoleSelectionContent({
  selectedRole,
  currentRole,
  onSelectRole,
  changes,
  isMobile,
}: {
  selectedRole?: string
  currentRole?: string
  onSelectRole: (role: string) => void
  changes: PermissionDiff
  isMobile: boolean
}) {
  const roles = [
    {
      key: 'CLIENT',
      label: 'Client',
      description: 'View own data only',
      color: 'pink',
      icon: '👤',
    },
    {
      key: 'TEAM_MEMBER',
      label: 'Team Member',
      description: 'Limited access and basic features',
      color: 'gray',
      icon: '👥',
    },
    {
      key: 'TEAM_LEAD',
      label: 'Team Lead',
      description: 'Manage team and team-specific settings',
      color: 'green',
      icon: '🛡️',
    },
    {
      key: 'ADMIN',
      label: 'Admin',
      description: 'Manage organization and settings',
      color: 'blue',
      icon: '⚙️',
    },
    {
      key: 'SUPER_ADMIN',
      label: 'Super Admin',
      description: 'Full system access',
      color: 'purple',
      icon: '👑',
    },
  ]

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="space-y-3 md:space-y-4">
        <p className="text-xs md:text-sm text-gray-600">
          Select a role to assign. The user will automatically receive all permissions associated with this role.
        </p>

        <div className={cn(
          'gap-3 md:gap-4',
          isMobile ? 'grid grid-cols-1' : 'grid grid-cols-2 md:grid-cols-3'
        )}>
          {roles.map(role => (
            <button
              key={role.key}
              onClick={() => onSelectRole(role.key)}
              className={cn(
                'p-3 md:p-4 rounded-lg border-2 transition-all text-left hover:shadow-md relative',
                selectedRole === role.key
                  ? `border-${role.color}-500 bg-${role.color}-50`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {selectedRole === role.key && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
              )}
              {currentRole === role.key && selectedRole !== role.key && (
                <Badge className="mb-2 text-xs" variant="secondary">
                  Current
                </Badge>
              )}
              <div className="text-xl md:text-2xl mb-1 md:mb-2">{role.icon}</div>
              <h3 className="font-semibold text-xs md:text-sm">{role.label}</h3>
              <p className="text-xs text-gray-600 mt-0.5 md:mt-1">{role.description}</p>
              <div className="flex items-center justify-between mt-2 md:mt-3">
                <span className="text-xs text-gray-500">
                  {PermissionEngine.getCommonPermissionsForRole(role.key).length} perms
                </span>
              </div>
            </button>
          ))}
        </div>

        {selectedRole && selectedRole !== currentRole && (
          <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-blue-900 text-xs md:text-sm mb-1 md:mb-2">Preview Changes</h4>
            <p className="text-xs md:text-sm text-blue-800 mb-1">
              {changes.added.length} permissions will be added
            </p>
            {changes.removed.length > 0 && (
              <p className="text-xs md:text-sm text-blue-800">
                {changes.removed.length} permissions will be removed
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

/**
 * Custom Permissions Tab Content
 */
const CustomPermissionsContent = memo(function CustomPermissionsContent({
  selectedPermissions,
  onPermissionToggle,
  searchQuery,
  onSearchChange,
  validation,
  showAdvanced,
  onToggleAdvanced,
  isMobile,
}: {
  selectedPermissions: Permission[]
  onPermissionToggle: (permission: Permission, checked: boolean) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  validation: ValidationResult
  showAdvanced: boolean
  onToggleAdvanced: (show: boolean) => void
  isMobile: boolean
}) {
  const filtered = useMemo(() => {
    return PermissionEngine.searchPermissions(searchQuery)
  }, [searchQuery])

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="space-y-3 md:space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 px-2 md:px-3 py-1.5 md:py-2 border rounded-lg text-xs md:text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <EyeOff className="h-3 w-3 md:h-4 md:w-4" /> : <Eye className="h-3 w-3 md:h-4 md:w-4" />}
          </Button>
        </div>

        <div className="space-y-1.5 md:space-y-2">
          {filtered.length === 0 ? (
            <p className="text-xs md:text-sm text-gray-500 py-6 md:py-8 text-center">
              No permissions found matching &quot;{searchQuery}&quot;
            </p>
          ) : (
            filtered.map(permission => {
              const meta = PERMISSION_METADATA[permission]
              const isChecked = selectedPermissions.includes(permission)

              return (
                <label
                  key={permission}
                  className={cn(
                    'flex items-start gap-2 p-2 md:p-3 rounded-lg border cursor-pointer transition-colors',
                    isChecked
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onPermissionToggle(permission, e.target.checked)}
                    className="mt-0.5 md:mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs md:text-sm">{meta.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{meta.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {meta.risk}
                  </Badge>
                </label>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
})

/**
 * Templates Tab Content
 */
function TemplatesContent() {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="text-center py-8 md:py-12">
        <FileText className="h-8 md:h-12 w-8 md:w-12 text-gray-400 mx-auto mb-2 md:mb-3" />
        <p className="text-gray-600 text-xs md:text-sm">Permission templates coming soon</p>
      </div>
    </div>
  )
}

/**
 * History Tab Content
 */
function HistoryContent() {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="text-center py-8 md:py-12">
        <FileText className="h-8 md:h-12 w-8 md:w-12 text-gray-400 mx-auto mb-2 md:mb-3" />
        <p className="text-gray-600 text-xs md:text-sm">Permission history coming soon</p>
      </div>
    </div>
  )
}
