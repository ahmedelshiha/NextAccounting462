'use client'

import React, { useState, useCallback, useEffect, memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AlertCircle, Loader2, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoleFormData {
  name: string
  description: string
  permissions: string[]
}

interface Permission {
  id: string
  name: string
  description?: string
  category: string
}

interface RoleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (roleId: string) => void
  mode?: 'create' | 'edit'
  initialData?: Partial<RoleFormData & { id: string }>
  title?: string
  description?: string
}

export const RoleFormModal = React.forwardRef<HTMLDivElement, RoleFormModalProps>(
  function RoleFormModal({
    isOpen,
    onClose,
    onSuccess,
    mode = 'create',
    initialData,
    title,
    description,
  }, ref) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loadingPermissions, setLoadingPermissions] = useState(true)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Users', 'Roles', 'Permissions']))
    const [formData, setFormData] = useState<RoleFormData>({
      name: initialData?.name || '',
      description: initialData?.description || '',
      permissions: initialData?.permissions || [],
    })

    const defaultTitle = mode === 'create' ? 'Create New Role' : 'Edit Role'
    const defaultDescription = mode === 'create'
      ? 'Create a new role with specific permissions'
      : 'Update role information and permissions'

    // Load available permissions
    useEffect(() => {
      if (!isOpen) return

      const loadPermissions = async () => {
        try {
          setLoadingPermissions(true)
          const response = await fetch('/api/admin/permissions')
          if (!response.ok) throw new Error('Failed to load permissions')
          const data = await response.json()
          setPermissions(Array.isArray(data) ? data : data.permissions || [])
        } catch (err) {
          console.error('Failed to load permissions:', err)
          // Provide default permissions if API fails
          setPermissions([
            { id: 'users.view', name: 'View Users', category: 'Users' },
            { id: 'users.create', name: 'Create Users', category: 'Users' },
            { id: 'users.edit', name: 'Edit Users', category: 'Users' },
            { id: 'users.delete', name: 'Delete Users', category: 'Users' },
            { id: 'roles.view', name: 'View Roles', category: 'Roles' },
            { id: 'roles.create', name: 'Create Roles', category: 'Roles' },
            { id: 'roles.edit', name: 'Edit Roles', category: 'Roles' },
            { id: 'roles.delete', name: 'Delete Roles', category: 'Roles' },
            { id: 'permissions.manage', name: 'Manage Permissions', category: 'Permissions' },
          ])
        } finally {
          setLoadingPermissions(false)
        }
      }

      loadPermissions()
    }, [isOpen])

    const handleChange = useCallback((field: keyof RoleFormData, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }))
      setError(null)
    }, [])

    const togglePermission = useCallback((permissionId: string) => {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(p => p !== permissionId)
          : [...prev.permissions, permissionId]
      }))
    }, [])

    const toggleCategory = useCallback((category: string) => {
      setExpandedCategories(prev => {
        const next = new Set(prev)
        if (next.has(category)) {
          next.delete(category)
        } else {
          next.add(category)
        }
        return next
      })
    }, [])

    const validateForm = (): boolean => {
      if (!formData.name.trim()) {
        setError('Role name is required')
        return false
      }
      if (!formData.description.trim()) {
        setError('Role description is required')
        return false
      }
      if (formData.permissions.length === 0) {
        setError('At least one permission must be assigned')
        return false
      }
      return true
    }

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!validateForm()) return

      setIsSubmitting(true)
      try {
        const endpoint = mode === 'create'
          ? '/api/admin/roles'
          : `/api/admin/roles/${initialData?.id}`
        const method = mode === 'create' ? 'POST' : 'PATCH'

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Failed to ${mode === 'create' ? 'create' : 'update'} role`)
        }

        const result = await response.json()
        toast.success(
          mode === 'create'
            ? 'Role created successfully'
            : 'Role updated successfully'
        )
        onSuccess?.(result.id)
        onClose()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    }, [formData, mode, initialData?.id, onClose, onSuccess])

    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc, perm) => {
      const category = perm.category || 'Other'
      if (!acc[category]) acc[category] = []
      acc[category].push(perm)
      return acc
    }, {} as Record<string, Permission[]>)

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent ref={ref} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title || defaultTitle}</DialogTitle>
            <DialogDescription>{description || defaultDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Senior Accountant"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and responsibilities of this role"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions *</Label>
              {loadingPermissions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="flex items-center w-full p-2 rounded hover:bg-gray-100 font-medium text-sm text-gray-700"
                      >
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        {category}
                      </button>

                      {expandedCategories.has(category) && (
                        <div className="ml-4 space-y-2">
                          {perms.map((perm) => (
                            <div key={perm.id} className="flex items-start gap-2">
                              <Checkbox
                                id={perm.id}
                                checked={formData.permissions.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                                disabled={isSubmitting}
                              />
                              <label
                                htmlFor={perm.id}
                                className="text-sm cursor-pointer flex-1 pt-0.5"
                              >
                                <div className="font-medium">{perm.name}</div>
                                {perm.description && (
                                  <div className="text-xs text-gray-500">{perm.description}</div>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loadingPermissions}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'create' ? 'Create Role' : 'Update Role'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
)

RoleFormModal.displayName = 'RoleFormModal'
