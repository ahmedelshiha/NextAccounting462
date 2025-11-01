'use client'

import React, { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExecutiveDashboard } from '../ExecutiveDashboard'
import { AnalyticsCharts } from '../AnalyticsCharts'
import { DashboardTab } from './DashboardTab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardMetrics, useDashboardRecommendations, useDashboardAnalytics } from '../hooks/useDashboardMetrics'
import { UserItem } from '../../contexts/UsersContextProvider'

interface ExecutiveDashboardTabProps {
  users: UserItem[]
  stats: any
  isLoading?: boolean
  onAddUser?: () => void
  onImport?: () => void
  onBulkOperation?: () => void
  onExport?: () => void
  onRefresh?: () => void
}

/**
 * Executive Dashboard Tab
 * 
 * Enhanced dashboard with:
 * - Real-time KPI metrics (Total Users, Active Users, etc.)
 * - AI-powered recommendations
 * - Advanced analytics and insights
 * - Operations management (user directory, filters)
 */
export function ExecutiveDashboardTab({
  users,
  stats,
  isLoading,
  onAddUser,
  onImport,
  onBulkOperation,
  onExport,
  onRefresh
}: ExecutiveDashboardTabProps) {
  const { data: metricsData, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: recommendations, isLoading: recsLoading } = useDashboardRecommendations()
  const { data: analyticsData, isLoading: analyticsLoading } = useDashboardAnalytics()
  const [dashboardView, setDashboardView] = useState<'overview' | 'operations'>('overview')

  const handleRefreshDashboard = () => {
    onRefresh?.()
  }

  return (
    <div className="flex-1 overflow-auto">
      <Tabs defaultValue="overview" className="w-full" onValueChange={(v) => setDashboardView(v as any)}>
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TabsList className="rounded-none border-b bg-transparent">
              <TabsTrigger value="overview" className="border-b-2 border-transparent data-[state=active]:border-blue-500">
                📊 Overview
              </TabsTrigger>
              <TabsTrigger value="operations" className="border-b-2 border-transparent data-[state=active]:border-blue-500">
                👥 Operations
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Executive Dashboard */}
          <Suspense fallback={<DashboardSkeleton />}>
            {metricsLoading ? (
              <DashboardSkeleton />
            ) : (
              <ExecutiveDashboard
                initialMetrics={metricsData?.metrics || {}}
                initialRecommendations={recommendations || []}
                onRefresh={handleRefreshDashboard}
              />
            )}
          </Suspense>

          {/* Analytics Charts */}
          {!analyticsLoading && analyticsData?.analytics && (
            <Suspense fallback={<AnalyticsSkeleton />}>
              <AnalyticsCharts
                userGrowthTrend={analyticsData.analytics.userGrowthTrend}
                departmentDistribution={analyticsData.analytics.departmentDistribution}
                roleDistribution={analyticsData.analytics.roleDistribution}
                workflowEfficiency={analyticsData.analytics.workflowEfficiency}
                complianceScore={analyticsData.analytics.complianceScore}
              />
            </Suspense>
          )}
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="p-4 sm:p-6 lg:p-8">
          <DashboardTab
            users={users}
            stats={stats}
            isLoading={isLoading}
            onAddUser={onAddUser}
            onImport={onImport}
            onBulkOperation={onBulkOperation}
            onExport={onExport}
            onRefresh={onRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Loading Skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Analytics Skeleton
 */
function AnalyticsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
