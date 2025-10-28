'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Props for the UnifiedPermissionModal component
 */
export interface UnifiedPermissionModalProps {
  // What to manage
  mode: 'user' | 'role' | 'bulk-users'
  targetId: string | string[] // User ID(s) or role name
  
  // Current state
  currentRole?: string
  currentPermissions?: Permission[]
  
  // Callbacks
  onSave: (changes: PermissionChangeSet) => Promise<void>
  onClose: () => void
  
  // Optional features
  showTemplates?: boolean
  showHistory?: boolean
  allowCustomPermissions?: boolean
  
  // User/role info
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
 * A comprehensive interface for managing user roles and permissions with:
 * - Role assignment with visual cards
 * - Custom permission management with search
 * - Permission templates for quick assignment
 * - Audit trail visualization
 * - Real-time impact preview
 * - Smart suggestions
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
  const handleRoleChange = (newRole: string) => {
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
  }

  /**
   * Handle permission toggle
   */
  const handlePermissionToggle = (permission: Permission, checked: boolean) => {
    if (checked) {
      // Check if we can grant this permission
      if (!PermissionEngine.canGrantPermission(permission, selectedPermissions)) {
        setSaveError(`Cannot grant ${PERMISSION_METADATA[permission]?.label}: dependencies not met`)
        return
      }
      setSelectedPermissions(prev => [...new Set([...prev, permission])])
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission))
    }
    
    setSaveError(null)
  }

  /**
   * Apply a suggestion
   */
  const applySuggestion = (suggestion: PermissionSuggestion) => {
    if (suggestion.action === 'add') {
      handlePermissionToggle(suggestion.permission, true)
    } else {
      handlePermissionToggle(suggestion.permission, false)
    }
  }

  /**
   * Apply all suggestions
   */
  const applyAllSuggestions = () => {
    suggestions.forEach(applySuggestion)
  }

  /**
   * Undo last change
   */
  const handleUndo = () => {
    if (changeHistory.length > 0) {
      const previousState = changeHistory[changeHistory.length - 2]
      if (previousState) {
        setSelectedRole(previousState.roleChange?.to || currentRole)
        setSelectedPermissions(previousState.permissionChanges?.added || currentPermissions)
      }
      setChangeHistory(prev => prev.slice(0, -1))
    }
  }

  /**
   * Reset to original state
   */
  const handleReset = () => {
    setSelectedRole(currentRole)
    setSelectedPermissions(currentPermissions)
    setChangeHistory([])
    setSaveError(null)
  }

  /**
   * Handle save
   */
  const handleSave = async () => {
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
  }

  // Get role info
  const displayName = targetName || (Array.isArray(targetId) ? `${targetId.length} users` : targetId)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-white">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {mode === 'bulk-users' 
                  ? `Manage Permissions for ${displayName}`
                  : `Manage Permissions: ${displayName}`
                }
              </DialogTitle>
              {targetEmail && (
                <DialogDescription className="text-sm mt-1">
                  {targetEmail} • Current role: {currentRole || 'UNASSIGNED'}
                </DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b px-6 h-auto bg-gray-50">
            <TabsTrigger value="role" className="relative">
              Role
              {selectedRole !== currentRole && (
                <Badge className="ml-2 h-5 rounded px-1.5" variant="secondary">
                  {changeCount}
                </Badge>
              )}
            </TabsTrigger>
            {allowCustomPermissions && (
              <TabsTrigger value="custom" className="relative">
                Permissions
                {changeCount > 0 && selectedRole === currentRole && (
                  <Badge className="ml-2 h-5 rounded px-1.5" variant="secondary">
                    {changeCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {showTemplates && (
              <TabsTrigger value="templates">Templates</TabsTrigger>
            )}
            {showHistory && (
              <TabsTrigger value="history">History</TabsTrigger>
            )}
          </TabsList>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="role" className="h-full p-0 data-[state=inactive]:hidden">
              <RoleSelectionContent
                selectedRole={selectedRole}
                currentRole={currentRole}
                onSelectRole={handleRoleChange}
                changes={changes}
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

        {/* Impact Preview and Actions */}
        <div className="border-t p-6 space-y-4 bg-gray-50">
          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900 text-sm">Validation Errors</h4>
                  <ul className="mt-1 space-y-1">
                    {validation.errors.map((error, i) => (
                      <li key={i} className="text-sm text-red-800">
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
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
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{saveError}</p>
            </div>
          )}

          {/* Change Summary */}
          {changeCount > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                {changeCount} permission{changeCount === 1 ? '' : 's'} will be changed
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2">
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSave}
                disabled={!validation.isValid || changeCount === 0 || isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Role Selection Tab Content
 */
function RoleSelectionContent({
  selectedRole,
  currentRole,
  onSelectRole,
  changes,
}: {
  selectedRole?: string
  currentRole?: string
  onSelectRole: (role: string) => void
  changes: PermissionDiff
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
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Select a role to assign. The user will automatically receive all permissions associated with this role.
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {roles.map(role => (
            <button
              key={role.key}
              onClick={() => onSelectRole(role.key)}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left hover:shadow-md',
                selectedRole === role.key
                  ? `border-${role.color}-500 bg-${role.color}-50`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {selectedRole === role.key && (
                <div className="absolute top-3 right-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              )}
              {currentRole === role.key && selectedRole !== role.key && (
                <Badge className="mb-2" variant="secondary">
                  Current
                </Badge>
              )}
              <div className="text-2xl mb-2">{role.icon}</div>
              <h3 className="font-semibold text-sm">{role.label}</h3>
              <p className="text-xs text-gray-600 mt-1">{role.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">
                  {PermissionEngine.getCommonPermissionsForRole(role.key).length} perms
                </span>
              </div>
            </button>
          ))}
        </div>

        {selectedRole && selectedRole !== currentRole && (
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">Preview Changes</h4>
            <p className="text-sm text-blue-800 mb-2">
              {changes.added.length} permissions will be added
            </p>
            {changes.removed.length > 0 && (
              <p className="text-sm text-blue-800">
                {changes.removed.length} permissions will be removed
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Custom Permissions Tab Content
 */
function CustomPermissionsContent({
  selectedPermissions,
  onPermissionToggle,
  searchQuery,
  onSearchChange,
  validation,
  showAdvanced,
  onToggleAdvanced,
}: {
  selectedPermissions: Permission[]
  onPermissionToggle: (permission: Permission, checked: boolean) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  validation: ValidationResult
  showAdvanced: boolean
  onToggleAdvanced: (show: boolean) => void
}) {
  const filtered = PermissionEngine.searchPermissions(searchQuery)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No permissions found matching "{searchQuery}"
            </p>
          ) : (
            filtered.map(permission => {
              const meta = PERMISSION_METADATA[permission]
              const isChecked = selectedPermissions.includes(permission)

              return (
                <label
                  key={permission}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    isChecked
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onPermissionToggle(permission, e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{meta.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{meta.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
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
}

/**
 * Templates Tab Content
 */
function TemplatesContent() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Permission templates coming soon</p>
      </div>
    </div>
  )
}

/**
 * History Tab Content
 */
function HistoryContent() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Permission history coming soon</p>
      </div>
    </div>
  )
}
