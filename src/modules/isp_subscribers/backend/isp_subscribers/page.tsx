'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type SubscriberRow = {
  id: string
  account_number: string
  subscriber_type: string
  service_status: string
  installation_city: string
  monthly_price_usd: string
  last_payment_date: string | null
}

const TYPE_LABELS: Record<string, string> = {
  residential: 'Residencial', pyme: 'PYME', corporate: 'Corporativo', wholesale: 'Mayorista',
}
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  active: 'success', pending_installation: 'info', suspended_overdue: 'error',
  suspended_voluntary: 'warning', pending_change_plan: 'warning', cancelled: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', pending_installation: 'En instalación', suspended_overdue: 'Moroso',
  suspended_voluntary: 'Suspendido', pending_change_plan: 'Cambio plan', cancelled: 'Cancelado',
}

export default function IspSubscribersPage() {
  const router = useRouter()
  const [subscribers, setSubscribers] = React.useState<SubscriberRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [kpis, setKpis] = React.useState<any>(null)
  const [statusFilter, setStatusFilter] = React.useState('')

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('service_status', statusFilter)
    const [subsRes, kpisRes] = await Promise.all([
      apiCall<{ items: SubscriberRow[] }>(`/api/isp-subscribers/subscribers?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<any>('/api/isp-subscribers/dashboard', undefined, { fallback: null }),
    ])
    if (subsRes.ok) setSubscribers(subsRes.result?.items ?? [])
    if (kpisRes.ok) setKpis(kpisRes.result)
    setIsLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const columns: ColumnDef<SubscriberRow>[] = [
    {
      accessorKey: 'account_number', header: 'Cuenta',
      cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.account_number}</span>,
    },
    { accessorKey: 'installation_city', header: 'Ciudad' },
    { accessorKey: 'subscriber_type', header: 'Tipo', cell: ({ row }) => TYPE_LABELS[row.original.subscriber_type] ?? row.original.subscriber_type },
    {
      accessorKey: 'service_status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.service_status] ?? 'neutral'} dot>
          {STATUS_LABEL[row.original.service_status] ?? row.original.service_status}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'monthly_price_usd', header: 'Plan/mes',
      cell: ({ row }) => <span className="font-semibold">USD {row.original.monthly_price_usd}</span>,
    },
    {
      accessorKey: 'last_payment_date', header: 'Último pago',
      cell: ({ row }) => row.original.last_payment_date
        ? new Date(row.original.last_payment_date).toLocaleDateString('es-VE')
        : <span className="text-status-warning-text text-xs">Sin pago</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'open', label: 'Ver detalle', onSelect: () => router.push(`/backend/isp-subscribers/${row.original.id}`) },
        ]} />
      ),
    },
  ]

  const STATUS_FILTERS = [
    { value: '', label: 'Todos' }, { value: 'active', label: 'Activos' },
    { value: 'suspended_overdue', label: 'Morosos' }, { value: 'pending_installation', label: 'En instalación' },
  ]

  const active = kpis?.by_status?.active ?? 0
  const overdue = kpis?.by_status?.suspended_overdue ?? 0
  const newMonth = kpis?.new_this_month ?? 0

  return (
    <Page>
      <PageHeader
        title="Abonados"
        description={kpis ? `${active} activos · ${overdue} morosos · ${newMonth} nuevos este mes` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                  {f.value === 'suspended_overdue' && overdue > 0 && (
                    <Badge variant="destructive" className="ml-1">{overdue}</Badge>
                  )}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={() => router.push('/backend/isp-subscribers/create')}>
              <Plus className="size-4 mr-2" /> Nuevo abonado
            </Button>
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_subscribers.subscriber"
          extensionTableId="isp-subscribers-list"
          data={subscribers}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin abonados'
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
