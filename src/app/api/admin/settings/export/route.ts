import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { AdminSettingsService } from '@/services/admin-settings.service'

const _api_GET = async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    // Get actual settings from the service
    const settings = await AdminSettingsService.getSettings(tenantId)

    const payload = {
      exportedAt: new Date().toISOString(),
      tenantId: tenantId,
      auditRetentionDays: settings.auditRetentionDays,
      emailNotificationsEnabled: settings.emailNotificationsEnabled,
      detailedLoggingEnabled: settings.detailedLoggingEnabled,
      batchSize: settings.batchSize,
      cacheDurationMinutes: settings.cacheDurationMinutes,
      webhookUrl: settings.webhookUrl,
      webhookEnabled: settings.webhookEnabled,
      featureFlags: settings.featureFlags,
    }

    const body = JSON.stringify(payload, null, 2)
    const timestamp = new Date().toISOString().split('T')[0]

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="settings-${timestamp}.json"`,
      },
    })
  } catch (error) {
    console.error('Settings export error:', error)
    return NextResponse.json(
      { error: 'Failed to export settings' },
      { status: 500 }
    )
  }
}

export const GET = withTenantContext(_api_GET, { requireAuth: true })
