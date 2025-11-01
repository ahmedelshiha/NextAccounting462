import { useQuery } from '@tanstack/react-query'
import { DashboardMetrics } from '@/services/dashboard-metrics.service'
import { Recommendation } from '@/services/recommendation-engine.service'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/metrics')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000 // Auto-refetch every 5 minutes
  })
}

export function useDashboardRecommendations() {
  return useQuery({
    queryKey: ['dashboard-recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/recommendations')
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      const data = await response.json()
      return data.recommendations as Recommendation[]
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000 // Auto-refetch every 10 minutes
  })
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/analytics')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000 // Auto-refetch every 10 minutes
  })
}
