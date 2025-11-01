"use client"
import React, { useEffect, useMemo, useState } from 'react'
import TeamManagement from '@/components/admin/team-management'
import ListPage from '@/components/dashboard/templates/ListPage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, DollarSign, Edit3, Eye, Building, Users } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import type { Column } from '@/types/dashboard'

interface ClientItem {
  id: string
  name: string | null
  email: string
  phone?: string | null
  company?: string | null
  tier?: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE' | null
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null
  totalBookings?: number
  totalRevenue?: number
  lastBooking?: string | null
  createdAt: string
}

type EntitiesSubTab = 'clients' | 'team'

export function EntitiesTab() {
  const [activeSubTab, setActiveSubTab] = useState<EntitiesSubTab>('clients')

  // Initialize sub-tab from URL (?type=clients|team)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('type') as EntitiesSubTab | null
      if (t === 'clients' || t === 'team') setActiveSubTab(t)
    }
  }, [])

  return (
    <div className="min-h-[calc(100vh-100px)] bg-white">
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 px-4 sm:px-6 lg:px-8" role="tablist">
          <button
            role="tab"
            aria-selected={activeSubTab === 'clients'}
            onClick={() => setActiveSubTab('clients')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeSubTab === 'clients' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            title="Manage clients"
          >
            <span className="mr-2">👤</span> Clients
          </button>
          <button
            role="tab"
            aria-selected={activeSubTab === 'team'}
            onClick={() => setActiveSubTab('team')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeSubTab === 'team' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            title="Manage team members"
          >
            <span className="mr-2">🏢</span> Team
          </button>
        </nav>
      </div>

      <div id="entities-panel" className="p-0">
        {activeSubTab === 'clients' ? <ClientsListEmbedded /> : <TeamManagement hideHeader />}
      </div>
    </div>
  )
}

function ClientsListEmbedded() {
  const { rows, loading, error, setRows, setLoading, setError } = useListState<ClientItem>([])
  const { search, setSearch, values, setFilter } = useListFilters({ tier: 'all', status: 'all' })
  const tier = values.tier
  const status = values.status

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      const res = await apiFetch(`/api/admin/users?${params.toString()}&role=CLIENT`)
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      setRows(Array.isArray(data?.users) ? data.users : [])
    } catch (e) {
      setError('Failed to load clients')
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows
      .filter((c) => (!term ? true : (c.name || '').toLowerCase().includes(term) || c.email.toLowerCase().includes(term) || (c.company || '').toLowerCase().includes(term)))
      .filter((c) => (tier === 'all' ? true : (c.tier || '').toLowerCase() === tier))
      .filter((c) => (status === 'all' ? true : (c.status || '').toLowerCase() === status))
  }, [rows, search, tier, status])

  const columns: Column<ClientItem>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, client) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">{(client.name || client.email)?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{client.name || 'Unnamed Client'}</div>
            <div className="text-sm text-gray-500">{client.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Building className="w-4 h-4 text-gray-400" />
          <span>{value || '-'}</span>
        </div>
      )
    },
    {
      key: 'tier',
      label: 'Tier',
      sortable: true,
      render: (value) => {
        const tierColors: Record<string, string> = {
          INDIVIDUAL: 'bg-gray-100 text-gray-800',
          SMB: 'bg-blue-100 text-blue-800',
          ENTERPRISE: 'bg-purple-100 text-purple-800'
        }
        return (
          <Badge className={tierColors[String(value)] || 'bg-gray-100 text-gray-800'}>
            {value || 'Individual'}
          </Badge>
        )
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          ACTIVE: 'bg-green-100 text-green-800',
          INACTIVE: 'bg-gray-100 text-gray-800',
          SUSPENDED: 'bg-red-100 text-red-800'
        }
        return (
          <Badge className={statusColors[String(value)] || 'bg-green-100 text-green-800'}>
            {value || 'Active'}
          </Badge>
        )
      }
    },
    {
      key: 'totalBookings',
      label: 'Bookings',
      sortable: true,
      align: 'center',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{value || 0}</span>
        </div>
      )
    },
    {
      key: 'totalRevenue',
      label: 'Revenue',
      sortable: true,
      align: 'right',
      render: (value) => (
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span>${Number(value || 0).toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'lastBooking',
      label: 'Last Booking',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{value ? new Date(value).toLocaleDateString() : 'Never'}</span>
        </div>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, client) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/clients/${client.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/clients/${client.id}/edit`}>
              <Edit3 className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      )
    }
  ]

  const filterConfigs = [
    {
      key: 'tier',
      label: 'Client Tier',
      options: [
        { value: 'all', label: 'All Tiers' },
        { value: 'individual', label: 'Individual' },
        { value: 'smb', label: 'SMB' },
        { value: 'enterprise', label: 'Enterprise' }
      ],
      value: tier
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' }
      ],
      value: status
    }
  ]

  const onFilterChange = (key: string, value: string) => {
    setFilter(key, value)
  }

  return (
    <div className="p-0">
      <ListPage
        title="Client Management"
        subtitle="Manage your client relationships and data"
        primaryAction={{ label: 'Add Client', onClick: () => (window.location.href = '/admin/clients/new'), icon: Users }}
        secondaryActions={[]}
        onSearch={setSearch}
        searchPlaceholder="Search clients..."
        filters={filterConfigs}
        onFilterChange={onFilterChange}
        columns={columns}
        rows={filtered}
        loading={loading}
        error={error || undefined}
      />
    </div>
  )
}
