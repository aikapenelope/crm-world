'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, LayoutGrid } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type OrderRow = {
  id: string
  order_number: string
  vehicle_id: string
  customer_id: string
  status: string
  received_at: string
  km_at_entry: number
  customer_complaint: string | null
  assigned_technician_id: string | null
  priority: string
  total_amount: string
  currency: string
}

const STATUS_LABELS: Record<string, string> = {
  received: 'Recibido', diagnosis: 'Diagnóstico', estimate_sent: 'Presupuesto Enviado',
  approved: 'Aprobado', in_repair: 'En Reparación', quality_check: 'Control Calidad',
  ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  received: 'outline', diagnosis: 'secondary', estimate_sent: 'secondary', approved: 'default',
  in_repair: 'default', quality_check: 'secondary', ready: 'default', delivered: 'outline', cancelled: 'destructive',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente',
}

export default function AutoServiceOrdersPage() {
  const t = useT()
  const router = useRouter()
  const [orders, setOrders] = React.useState<OrderRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<string>('')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      let url = '/api/auto-service-orders/orders?pageSize=100'
      if (statusFilter) url += `&status=${statusFilter}`
      const call = await apiCall<{ items: OrderRow[] }>(url, undefined, { fallback: { items: [] } })
      if (call.ok) { setOrders(call.result?.items ?? []) }
      setIsLoading(false)
    }
    load()
  }, [statusFilter])

  const summary = React.useMemo(() => {
    const inShop = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length
    const inRepair = orders.filter((o) => o.status === 'in_repair').length
    const ready = orders.filter((o) => o.status === 'ready').length
    const today = orders.filter((o) => {
      const d = new Date(o.received_at)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }).length
    return { inShop, inRepair, ready, today }
  }, [orders])

  const columns: ColumnDef<OrderRow>[] = [
    { accessorKey: 'order_number', header: t('auto_service_orders.list.col.order', 'Orden'), cell: ({ row }) => <span className="font-mono font-bold text-sm">{row.original.order_number}</span> },
    { accessorKey: 'received_at', header: t('auto_service_orders.list.col.entry', 'Ingreso'), cell: ({ row }) => new Date(row.original.received_at).toLocaleDateString('es-VE') },
    { accessorKey: 'status', header: t('auto_service_orders.list.col.status', 'Status'), cell: ({ row }) => <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>{STATUS_LABELS[row.original.status] ?? row.original.status}</Badge> },
    {
      accessorKey: 'priority', header: t('auto_service_orders.list.col.priority', 'Prioridad'),
      cell: ({ row }) => (
        <span className={row.original.priority === 'urgent' ? 'text-destructive font-medium' : row.original.priority === 'high' ? 'font-medium' : 'text-muted-foreground'}>
          {PRIORITY_LABELS[row.original.priority] ?? row.original.priority}
        </span>
      ),
    },
    { accessorKey: 'customer_complaint', header: t('auto_service_orders.list.col.reason', 'Motivo'), cell: ({ row }) => <span className="max-w-[200px] truncate block text-xs">{row.original.customer_complaint ?? '—'}</span> },
    { accessorKey: 'total_amount', header: t('auto_service_orders.list.col.total', 'Total'), cell: ({ row }) => { const total = Number(row.original.total_amount); return total > 0 ? `${row.original.currency} ${total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '—' } },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('auto_service_orders.list.title', 'Órdenes de Servicio')}</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/auto_service_orders/board')}>
              <LayoutGrid className="mr-2 size-4" />
              {t('auto_service_orders.list.board_button', 'Board')}
            </Button>
            <Button type="button" onClick={() => router.push('/backend/auto_service_orders/create')}>
              <Plus className="mr-2 size-4" />
              {t('auto_service_orders.list.new_button', 'Nueva Orden')}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('auto_service_orders.list.stat.in_shop', 'En Taller')}</p>
            <p className="text-lg font-bold">{summary.inShop}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('auto_service_orders.list.stat.in_repair', 'En Reparación')}</p>
            <p className="text-lg font-bold text-primary">{summary.inRepair}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('auto_service_orders.list.stat.ready', 'Listos para Retirar')}</p>
            <p className="text-lg font-bold">{summary.ready}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('auto_service_orders.list.stat.today', 'Ingresados Hoy')}</p>
            <p className="text-lg font-bold">{summary.today}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('auto_service_orders.list.filter.all', 'Todos los status')}</option>
            <option value="received">Recibido</option>
            <option value="diagnosis">Diagnóstico</option>
            <option value="estimate_sent">Presupuesto Enviado</option>
            <option value="approved">Aprobado</option>
            <option value="in_repair">En Reparación</option>
            <option value="quality_check">Control Calidad</option>
            <option value="ready">Listo</option>
            <option value="delivered">Entregado</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          searchPlaceholder={t('auto_service_orders.list.search_placeholder', 'Buscar por número de orden...')}
          onRowClick={(row) => router.push(`/backend/auto_service_orders/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
