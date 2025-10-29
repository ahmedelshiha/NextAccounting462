'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Workflow, AlertCircle, Zap, Clock, Mail } from 'lucide-react'

/**
 * User Management Settings Page
 * 
 * Allows Super Admins to configure:
 * - User roles and hierarchies
 * - Permission templates
 * - Onboarding workflows
 * - User lifecycle policies
 * - API rate limits
 * - Session management
 * - Invitation settings
 */

export default function UserManagementSettingsPage() {
  const [activeTab, setActiveTab] = useState('roles')

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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 gap-2 mb-6">
            <TabsTrigger value="roles" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissions</span>
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
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
                <CardDescription>
                  Define and customize user roles, hierarchy, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Role management functionality coming soon. You will be able to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Define custom roles based on system roles</li>
                    <li>Set role hierarchies and permissions</li>
                    <li>Configure default roles for signup/invite</li>
                    <li>View role usage statistics</li>
                    <li>Manage permission inheritance</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permission Templates Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Permission Templates</CardTitle>
                <CardDescription>
                  Create and manage pre-configured permission sets for quick assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Permission templates functionality coming soon. You will be able to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Create templates from scratch</li>
                    <li>Copy and customize system templates</li>
                    <li>Use templates for bulk user assignment</li>
                    <li>Track template usage and adoption</li>
                    <li>Version and track changes to templates</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onboarding Workflows Tab */}
          <TabsContent value="onboarding">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Workflows</CardTitle>
                <CardDescription>
                  Configure automated onboarding processes for new users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Onboarding workflows functionality coming soon. You will be able to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Design visual workflows with conditional logic</li>
                    <li>Customize welcome emails and templates</li>
                    <li>Create onboarding checklists</li>
                    <li>Set up auto-assignment rules</li>
                    <li>Define role-specific workflows</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Policies Tab */}
          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle>User Policies</CardTitle>
                <CardDescription>
                  Configure user lifecycle and data management policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    User policies functionality coming soon. You will be able to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Set inactivity thresholds and archival</li>
                    <li>Configure data retention policies</li>
                    <li>Enable activity monitoring</li>
                    <li>Set access control rules (MFA, IP restrictions)</li>
                    <li>Configure automatic user deletion</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rate Limiting Tab */}
          <TabsContent value="rate-limits">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
                <CardDescription>
                  Configure API rate limits and resource quotas per role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Rate limiting functionality coming soon. You will be able to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Set per-role API call limits</li>
                    <li>Configure bulk operation limits</li>
                    <li>Manage export size quotas</li>
                    <li>Set concurrent session limits</li>
                    <li>Enable adaptive throttling</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Session Management Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>
                  Configure session timeouts, security, and device management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Session management functionality coming soon. You will be able to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Set inactivity timeouts per role</li>
                    <li>Configure absolute max session duration</li>
                    <li>Limit concurrent sessions per user</li>
                    <li>Manage device tracking and approval</li>
                    <li>Set up location-based warnings</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitation Settings Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Invitation Settings</CardTitle>
                <CardDescription>
                  Configure user invitations and sign-up behaviors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Invitation settings functionality coming soon. You will be able to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Configure invitation expiry and resend limits</li>
                    <li>Enable/disable public sign-up</li>
                    <li>Set domain-based auto-assignment rules</li>
                    <li>Customize sign-up form and required fields</li>
                    <li>Track and manage pending invitations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-800">
            For detailed documentation on user management settings, please refer to the{' '}
            <a href="/docs" className="underline font-medium hover:text-blue-700">
              documentation
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
