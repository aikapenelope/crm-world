'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type WORow = {
  id: string
  work_order_number: string
  type: string
  status: string
  priority: string
  subscriber_id: string | null
  scheduled_date: string | null
  address: string
}

const TYPE_LABELS: Record<string, string> = {
  installation: 'Instalación', repair: 'Reparación', equipment_swap: 'Cambio equipo',
  uninstall: 'Retiro', verification: 'Verificación',
}
const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'neutral' | 'error'> = {
  pending: 'warning', scheduled: 'info', in_progress: 'info', completed: 'success', cancelled: 'neutral',
}

export default function WorkOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = React.useState<WORow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState('')

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const res = await apiCall<{ items: WORow[] }>(`/api/isp-technicians/work-orders?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setOrders(res.result?.items ?? [])
    setIsLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const columns: ColumnDef<WORow>[] = [
    {
      accessorKey: 'work_order_number', header: 'OT',
      cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.work_order_number}</span>,
    },
    { accessorKey: 'type', header: 'Tipo', cell: ({ row }) => TYPE_LABELS[row.original.type] ?? row.original.type },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {row.original.status}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'scheduled_date', header: 'Fecha',
      cell: ({ row }) => row.original.scheduled_date
        ? new Date(row.original.scheduled_date).toLocaleDateString('es-VE')
        : <span className="text-muted-foreground text-xs">Sin fecha</span>,
    },
    {
      accessorKey: 'address', header: 'Dirección',
      cell: ({ row }) => <span className="text-sm truncate max-w-xs block">{row.original.address}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'open', label: 'Ver detalle', onSelect: () => router.push(`/backend/isp-technicians/work-orders/${row.original.id}`) },
        ]} />
      ),
    },
  ]

  const STATUS_FILTERS = [
    { value: '', label: 'Todas' }, { value: 'pending', label: 'Pendientes' },
    { value: 'scheduled', label: 'Programadas' }, { value: 'completed', label: 'Completadas' },
  ]

  return (
    <Page>
      <PageHeader
        title="Órdenes de Trabajo"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(f.value)}
                >{f.label}</Button>
              ))}
            </div>
            <Button type="button" onClick={() => router.push('/backend/isp-technicians/work-orders/create')}>
              <Plus className="size-4 mr-2" /> Nueva OT
            </Button>
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_technicians.work_order"
          extensionTableId="isp-work-orders-list"
          data={orders}
          columns={columns}
          isLoading={isLoading}
          emptyState={{ title: 'Sin órdenes', description: 'Crea la primera orden de trabajo.' }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
