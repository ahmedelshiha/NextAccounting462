import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { UserManagementSettings } from '@/app/admin/settings/user-management/types'

/**
 * Default User Management Settings
 * Used when no custom settings exist in the database
 */
const DEFAULT_SETTINGS: UserManagementSettings = {
  roles: {
    systemRoles: {
      SUPER_ADMIN: {
        name: 'SUPER_ADMIN',
        displayName: 'Super Administrator',
        description: 'Full system access',
        permissions: [],
        canDelegate: true,
        maxInstances: 1,
        isEditable: false
      },
      ADMIN: {
        name: 'ADMIN',
        displayName: 'Administrator',
        description: 'Administrative access',
        permissions: [],
        canDelegate: true,
        maxInstances: null,
        isEditable: false
      },
      TEAM_LEAD: {
        name: 'TEAM_LEAD',
        displayName: 'Team Lead',
        description: 'Team management and oversight',
        permissions: [],
        canDelegate: false,
        maxInstances: null,
        isEditable: false
      },
      TEAM_MEMBER: {
        name: 'TEAM_MEMBER',
        displayName: 'Team Member',
        description: 'Regular team member access',
        permissions: [],
        canDelegate: false,
        maxInstances: null,
        isEditable: false
      },
      STAFF: {
        name: 'STAFF',
        displayName: 'Staff',
        description: 'Limited staff access',
        permissions: [],
        canDelegate: false,
        maxInstances: null,
        isEditable: false
      },
      CLIENT: {
        name: 'CLIENT',
        displayName: 'Client',
        description: 'Client portal access',
        permissions: [],
        canDelegate: false,
        maxInstances: null,
        isEditable: false
      }
    },
    customRoles: [],
    hierarchy: {
      canDelegate: {
        SUPER_ADMIN: ['ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER', 'STAFF', 'CLIENT'],
        ADMIN: ['TEAM_LEAD', 'TEAM_MEMBER', 'STAFF', 'CLIENT'],
        TEAM_LEAD: ['TEAM_MEMBER', 'STAFF'],
        TEAM_MEMBER: [],
        STAFF: [],
        CLIENT: []
      },
      inheritPermissions: {
        SUPER_ADMIN: true,
        ADMIN: true,
        TEAM_LEAD: true,
        TEAM_MEMBER: true,
        STAFF: true,
        CLIENT: true
      }
    },
    defaultRoleOnSignup: 'CLIENT',
    defaultRoleOnInvite: 'TEAM_MEMBER'
  },
  permissions: [],
  onboarding: {
    workflows: [],
    defaultWorkflow: null,
    welcomeEmail: {
      enabled: true,
      subject: 'Welcome to {{company_name}}!',
      templateId: 'default-welcome'
    },
    autoAssignment: {
      enabled: false,
      assignToManager: false,
      permissionTemplate: '',
      departmentFromInviter: false
    },
    firstLogin: {
      forcePasswordChange: false,
      passwordExpiryDays: 90,
      requireProfileCompletion: false,
      requiredProfileFields: [],
      showTutorial: false,
      tutorialModules: []
    },
    checklist: {
      enabled: false,
      items: []
    },
    notificationOnInvite: {
      toAdmin: true,
      toManager: false,
      toNewUser: true
    }
  },
  policies: {
    dataRetention: {
      inactiveUserDays: 60,
      archiveInactiveAfterDays: 180,
      deleteArchivedAfterDays: 365,
      archiveNotificationDays: 30,
      keepAuditLogs: true,
      auditLogRetentionYears: 3
    },
    activityMonitoring: {
      trackLoginAttempts: true,
      trackDataAccess: true,
      trackPermissionChanges: true,
      trackBulkActions: true,
      retentionDays: 90,
      alertOnSuspiciousActivity: true
    },
    accessControl: {
      requireMFAForRole: {
        SUPER_ADMIN: true,
        ADMIN: true,
        TEAM_LEAD: false,
        TEAM_MEMBER: false,
        STAFF: false,
        CLIENT: false
      },
      minPasswordAgeDays: 0,
      maxPasswordAgeDays: 90,
      preventPreviousPasswords: 5,
      lockoutAfterFailedAttempts: 5,
      lockoutDurationMinutes: 15
    },
    ipLocation: {
      restrictByIP: false,
      allowedIPRanges: [],
      warnOnNewLocation: false,
      requireMFAOnNewLocation: false,
      geofenceCountries: null
    },
    deviceManagement: {
      trackDevices: false,
      requireDeviceApproval: false,
      maxDevicesPerUser: 5,
      warnBeforeNewDevice: false
    }
  },
  rateLimits: {
    roles: {
      SUPER_ADMIN: {
        apiCallsPerMinute: 10000,
        apiCallsPerDay: 1000000,
        bulkOperationLimit: 100000,
        reportGenerationPerDay: 50,
        exportSizeGB: 100,
        concurrentSessions: 10,
        fileUploadSizeMB: 1000
      },
      ADMIN: {
        apiCallsPerMinute: 5000,
        apiCallsPerDay: 1000000,
        bulkOperationLimit: 50000,
        reportGenerationPerDay: 20,
        exportSizeGB: 50,
        concurrentSessions: 10,
        fileUploadSizeMB: 500
      },
      TEAM_LEAD: {
        apiCallsPerMinute: 1000,
        apiCallsPerDay: 100000,
        bulkOperationLimit: 10000,
        reportGenerationPerDay: 10,
        exportSizeGB: 20,
        concurrentSessions: 5,
        fileUploadSizeMB: 250
      },
      TEAM_MEMBER: {
        apiCallsPerMinute: 500,
        apiCallsPerDay: 50000,
        bulkOperationLimit: 5000,
        reportGenerationPerDay: 5,
        exportSizeGB: 10,
        concurrentSessions: 3,
        fileUploadSizeMB: 100
      },
      STAFF: {
        apiCallsPerMinute: 300,
        apiCallsPerDay: 25000,
        bulkOperationLimit: 1000,
        reportGenerationPerDay: 3,
        exportSizeGB: 5,
        concurrentSessions: 2,
        fileUploadSizeMB: 50
      },
      CLIENT: {
        apiCallsPerMinute: 100,
        apiCallsPerDay: 10000,
        bulkOperationLimit: 500,
        reportGenerationPerDay: 1,
        exportSizeGB: 1,
        concurrentSessions: 2,
        fileUploadSizeMB: 25
      }
    },
    global: {
      tenantApiCallsPerMinute: 50000,
      tenantApiCallsPerDay: 10000000,
      tenantConcurrentUsers: 1000
    },
    throttling: {
      enableAdaptiveThrottling: false,
      gracefulDegradation: true
    }
  },
  sessions: {
    sessionTimeout: {
      byRole: {
        SUPER_ADMIN: {
          absoluteMaxMinutes: 720,
          inactivityMinutes: 60,
          warningBeforeLogoutMinutes: 15,
          allowExtend: true,
          maxExtensions: 10
        },
        ADMIN: {
          absoluteMaxMinutes: 480,
          inactivityMinutes: 60,
          warningBeforeLogoutMinutes: 15,
          allowExtend: true,
          maxExtensions: 5
        },
        TEAM_LEAD: {
          absoluteMaxMinutes: 480,
          inactivityMinutes: 30,
          warningBeforeLogoutMinutes: 10,
          allowExtend: true,
          maxExtensions: 3
        },
        TEAM_MEMBER: {
          absoluteMaxMinutes: 480,
          inactivityMinutes: 30,
          warningBeforeLogoutMinutes: 10,
          allowExtend: true,
          maxExtensions: 3
        },
        STAFF: {
          absoluteMaxMinutes: 240,
          inactivityMinutes: 20,
          warningBeforeLogoutMinutes: 5,
          allowExtend: false,
          maxExtensions: 0
        },
        CLIENT: {
          absoluteMaxMinutes: 1440,
          inactivityMinutes: 60,
          warningBeforeLogoutMinutes: 10,
          allowExtend: false,
          maxExtensions: 0
        }
      },
      global: {
        absoluteMaxDays: 7,
        forceLogoutTime: null
      }
    },
    concurrentSessions: {
      byRole: {
        SUPER_ADMIN: 10,
        ADMIN: 10,
        TEAM_LEAD: 5,
        TEAM_MEMBER: 3,
        STAFF: 2,
        CLIENT: 2
      },
      allowMultipleDevices: true,
      requireMFAForMultipleSessions: false,
      kickOldestSession: false
    },
    security: {
      requireSSL: true,
      httpOnlyTokens: true,
      sameSiteCookies: 'Lax',
      resetTokensOnPasswordChange: true,
      invalidateOnPermissionChange: true,
      regenerateSessionIdOnLogin: true
    },
    devices: {
      requireDeviceId: false,
      trackUserAgent: true,
      warnOnBrowserChange: false,
      warnOnIPChange: false
    }
  },
  invitations: {
    invitations: {
      defaultRole: 'TEAM_MEMBER',
      expiryDays: 7,
      resendLimit: 3,
      requireEmail: true,
      allowMultipleInvites: false,
      notificationEmail: true
    },
    signUp: {
      enabled: false,
      defaultRole: 'CLIENT',
      requireApproval: false,
      approvalNotification: {
        toAdmins: true,
        toManager: false
      },
      requiredFields: ['email', 'name'],
      prohibitedDomains: [],
      allowedDomains: null
    },
    verification: {
      required: true,
      expiryHours: 24,
      resendLimit: 3
    },
    domainAutoAssign: {
      enabled: false,
      rules: []
    }
  },
  lastUpdatedAt: new Date(),
  lastUpdatedBy: 'system'
}

function jsonResponse(payload: any, status = 200) {
  return NextResponse.json(payload, { status })
}

/**
 * GET /api/admin/settings/user-management
 * Fetch current user management settings
 */
export const GET = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW)) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    // For now, return default settings
    // In a production implementation, these would be stored in the database
    return jsonResponse(DEFAULT_SETTINGS)
  } catch (error: any) {
    return jsonResponse({ error: String(error?.message ?? 'Unknown error') }, 500)
  }
})

/**
 * PUT /api/admin/settings/user-management
 * Update user management settings
 */
export const PUT = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT)) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const updates = await request.json()
    
    // Merge with default settings
    const updated: UserManagementSettings = {
      ...DEFAULT_SETTINGS,
      ...updates,
      lastUpdatedAt: new Date(),
      lastUpdatedBy: ctx.userId || 'system'
    }

    // In a production implementation, save to database
    // await prisma.settings.update({ ... })

    return jsonResponse(updated)
  } catch (error: any) {
    return jsonResponse({ error: String(error?.message ?? 'Unknown error') }, 500)
  }
})
