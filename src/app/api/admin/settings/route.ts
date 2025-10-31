import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { AdminSettingsService } from '@/services/admin-settings.service'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const tenantId = user.tenantId

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    if (type === 'audit') {
      const config = await AdminSettingsService.getAuditConfig(tenantId)
      return NextResponse.json(config)
    } else if (type === 'workflow') {
      const config = await AdminSettingsService.getWorkflowConfig(tenantId)
      return NextResponse.json(config)
    } else if (type === 'features') {
      const flags = await AdminSettingsService.getFeatureFlags(tenantId)
      return NextResponse.json({ featureFlags: flags })
    }

    // Get all settings
    const settings = await AdminSettingsService.getSettings(tenantId)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const tenantId = user.tenantId

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    const body = await request.json()

    // Update settings
    const updatedSettings = await AdminSettingsService.updateSettings(tenantId, body)

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
