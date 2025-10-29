'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Users, Workflow, AlertCircle, Zap, Clock, Mail, Save } from 'lucide-react'
import { useUserManagementSettings } from './hooks/useUserManagementSettings'
import {
  RoleManagement,
  PermissionTemplates,
  OnboardingWorkflows,
  UserPolicies,
  RateLimiting,
  SessionManagement,
  InvitationSettings
} from './components'

/**
 * User Management Settings Page
 *
 * Comprehensive configuration interface for system administrators to manage:
 * - User roles and hierarchies
 * - Permission templates
 * - Onboarding workflows
 * - User lifecycle policies
 * - API rate limiting
 * - Session management
 * - Invitation and signup settings
 */

export default function UserManagementSettingsPage() {
  const [activeTab, setActiveTab] = useState('roles')
  const { settings, isLoading, isSaving, error, fetchSettings, updateSettings } = useUserManagementSettings()

  if (error && !settings) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Error Loading Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 mb-4">{error}</p>
              <Button onClick={fetchSettings}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            User Management Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Configure user roles, permissions, policies, and system behavior
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 gap-2 mb-6 h-auto">
            <TabsTrigger value="roles" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="flex items-center gap-1">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Onboarding</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Policies</span>
            </TabsTrigger>
            <TabsTrigger value="rate-limits" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Limits</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Invites</span>
            </TabsTrigger>
          </TabsList>

          {/* Role Management Tab */}
          <TabsContent value="roles">
            {settings && (
              <RoleManagement
                roleConfig={settings.roles}
                isLoading={isLoading}
                isSaving={isSaving}
                onUpdate={async (updates: Partial<RoleConfig>) => {
                  await updateSettings({ roles: updates as RoleConfig })
                }}
              />
            )}
          </TabsContent>

          {/* Permission Templates Tab */}
          <TabsContent value="permissions">
            {settings && (
              <PermissionTemplates
                templates={settings.permissions}
                isLoading={isLoading}
                isSaving={isSaving}
                onUpdate={async (templates) => {
                  await updateSettings({ permissions: templates })
                }}
              />
            )}
          </TabsContent>

          {/* Onboarding Workflows Tab */}
          <TabsContent value="onboarding">
            {settings && (
              <OnboardingWorkflows
                config={settings.onboarding}
                isLoading={isLoading}
                isSaving={isSaving}
                onUpdate={async (config) => {
                  await updateSettings({ onboarding: config })
                }}
              />
            )}
          </TabsContent>

          {/* User Policies Tab */}
          <TabsContent value="policies">
            {settings && (
              <UserPolicies
                policies={settings.policies}
                isLoading={isLoading}
                isSaving={isSaving}
                onUpdate={async (policies) => {
                  await updateSettings({ policies })
                }}
              />
            )}
          </TabsContent>

          {/* Rate Limiting Tab */}
          <TabsContent value="rate-limits">
            {settings && (
              <RateLimiting
                config={settings.rateLimits}
                isLoading={isLoading}
                isSaving={isSaving}
                onUpdate={async (config) => {
                  await updateSettings({ rateLimits: config })
                }}
              />
            )}
          </TabsContent>

          {/* Session Management Tab */}
          <TabsContent value="sessions">
            {settings && (
              <SessionManagement
                config={settings.sessions}
                isLoading={isLoading}
                isSaving={isSaving}
                onUpdate={async (config) => {
                  await updateSettings({ sessions: config })
                }}
              />
            )}
          </TabsContent>

          {/* Invitation Settings Tab */}
          <TabsContent value="invitations">
            {settings && (
              <InvitationSettings
                config={settings.invitations}
                isLoading={isLoading}
                isSaving={isSaving}
                onUpdate={async (config) => {
                  await updateSettings({ invitations: config })
                }}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Test policy changes with a small group before rolling out organization-wide</li>
            <li>Use permission templates to speed up user onboarding</li>
            <li>Monitor activity logs to ensure security policies are working</li>
            <li>Review and update rate limits based on actual usage patterns</li>
          </ul>
        </div>

        {/* Save Status */}
        {isSaving && (
          <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            <span>Saving changes...</span>
          </div>
        )}
      </div>
    </div>
  )
}
